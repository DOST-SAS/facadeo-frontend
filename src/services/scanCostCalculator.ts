import { SettingsServiceInstance } from "@/services/admin/settingsServices"
import { AbonnementServiceInstance } from "@/services/artisan/Abonemmentsservices"
import type { Settings } from "@/types/adminSettingsTypes"
import type { Plan } from "@/types/PlansTypes"

export interface ScanCostEstimate {
    // API costs in dollars
    nearbySearchCost: number
    placeDetailsCost: number
    totalApiCost: number
    
    // Credit calculation
    creditsRequired: number
    userCredits: number
    hasEnoughCredits: boolean
    
    // Breakdown info
    estimatedFacades: number
    nearbySearchCalls: number
    placeDetailsCalls: number
    
    // Plan info
    planName: string | null
    pricePerCredit: number // How much $ each credit is worth
}

export interface ScanLaunchCostEstimate {
    // Per facade cost breakdown
    streetViewCostPerFacade: number // in tokens
    geminiCostPerFacade: number // in tokens
    totalCostPerFacade: number // in tokens
    
    // Total cost
    totalFacades: number
    totalCreditsRequired: number
    
    // User info
    userCredits: number
    hasEnoughCredits: boolean
    
    // Config info
    dollarsPerToken: number
    streetViewApiCost: number // $ per call
    geminiApiCost: number // $ per call
}

export interface ScanCostConfig {
    googlePlacesTarif: number // Cost per API call in $
    nearbySearchCostPerCall: number
    placeDetailsCostPerCall: number
    streetViewCostPerCall: number // $ per Street View API call
    geminiCostPerCall: number // $ per Gemini API call
    dollarsPerToken: number // How much $ each token is worth (e.g., $20 = 500 tokens -> $0.04/token)
}

// Default Google Places API costs (per call)
const DEFAULT_NEARBY_SEARCH_COST = 0.032 // $32 per 1000 calls
const DEFAULT_PLACE_DETAILS_COST = 0.02  // $20 per 1000 calls (contact fields)
const DEFAULT_STREET_VIEW_COST = 0.007   // $7 per 1000 calls
const DEFAULT_GEMINI_COST = 0.00025      // ~$0.25 per 1000 calls (Gemini Flash)
const DEFAULT_DOLLARS_PER_TOKEN = 0.04   // $20 = 500 tokens -> $0.04/token

// Multipliers for scan cost calculation
const STREET_VIEW_MULTIPLIER = 15 // streetViewAPI cost * 15
const GEMINI_MULTIPLIER = 3       // gemini cost * 3

class ScanCostCalculatorService {
    private config: ScanCostConfig | null = null
    private userPlan: { plan: Plan; pricePerCredit: number } | null = null

    /**
     * Load configuration from backend settings
     */
    async loadConfig(): Promise<ScanCostConfig> {
        if (this.config) return this.config

        try {
            const response = await SettingsServiceInstance.getSettings()

            const rawData = response?.data
            const settings: Settings | null = Array.isArray(rawData)
                ? rawData[0]
                : rawData

            if (settings) {
                const googlePlacesTarif =
                    settings.googlePlacesKey?.tarif || DEFAULT_NEARBY_SEARCH_COST
                const streetViewTarif =
                    settings.streetViewKey?.tarif || DEFAULT_STREET_VIEW_COST
                const geminiTarif =
                    settings.geminiNanoKey?.tarif || DEFAULT_GEMINI_COST

                this.config = {
                    googlePlacesTarif,
                    nearbySearchCostPerCall: googlePlacesTarif,
                    placeDetailsCostPerCall: DEFAULT_PLACE_DETAILS_COST,
                    streetViewCostPerCall: streetViewTarif,
                    geminiCostPerCall: geminiTarif,
                    dollarsPerToken: DEFAULT_DOLLARS_PER_TOKEN,
                }
            } else {
                throw new Error("No settings found")
            }

            return this.config
        } catch (error) {
            console.error("Failed to load scan cost config:", error)

            return {
                googlePlacesTarif: DEFAULT_NEARBY_SEARCH_COST,
                nearbySearchCostPerCall: DEFAULT_NEARBY_SEARCH_COST,
                placeDetailsCostPerCall: DEFAULT_PLACE_DETAILS_COST,
                streetViewCostPerCall: DEFAULT_STREET_VIEW_COST,
                geminiCostPerCall: DEFAULT_GEMINI_COST,
                dollarsPerToken: DEFAULT_DOLLARS_PER_TOKEN,
            }
        }
    }

    /**
     * Load user's subscription plan to calculate credit value
     */
    async loadUserPlan(userId: string): Promise<{ plan: Plan; pricePerCredit: number } | null> {
        try {
            const response = await AbonnementServiceInstance.getCurrentSubscription(userId)
            
            if (response.data && response.data.plans) {
                const plan = response.data.plans as Plan
                // Calculate price per credit: plan price / monthly credits
                // price_cents is in cents, convert to dollars
                const planPriceDollars = plan.price_cents / 100
                const pricePerCredit = plan.monthly_credit > 0 
                    ? planPriceDollars / plan.monthly_credit 
                    : 0.5 // Default fallback
                
                this.userPlan = { plan, pricePerCredit }
                return this.userPlan
            }
            
            return null
        } catch (error) {
            console.error("Failed to load user plan:", error)
            return null
        }
    }

    /**
     * Estimate the number of API calls based on radius
     * ALWAYS returns MAX possible to charge upfront, refund later if less
     */
    estimateApiCalls(radius: number): { nearbySearchCalls: number; maxFacades: number } {
        // Google Places returns max 20 results per page, up to 60 total (3 pages)
        // Always estimate MAX for the given radius tier to charge upfront
        
        if (radius <= 500) {
            return { nearbySearchCalls: 1, maxFacades: 20 }
        } else if (radius <= 1000) {
            return { nearbySearchCalls: 2, maxFacades: 40 }
        } else {
            // For radius > 1000m, always charge for max (60 facades)
            return { nearbySearchCalls: 3, maxFacades: 60 }
        }
    }

    /**
     * Get max facades for a given radius (used for charging)
     */
    getMaxFacadesForRadius(radius: number): number {
        const { maxFacades } = this.estimateApiCalls(radius)
        return maxFacades
    }

    /**
     * Calculate estimated cost before performing the scan
     */
    async estimateScanCost(
        radius: number,
        userCredits: number,
        userId?: string
    ): Promise<ScanCostEstimate> {
        const config = await this.loadConfig()
        
        // Load user plan if userId provided
        let pricePerCredit = 0.5 // Default: $50 = 100 credits
        let planName: string | null = null
        
        if (userId) {
            const userPlanData = await this.loadUserPlan(userId)
            if (userPlanData) {
                pricePerCredit = userPlanData.pricePerCredit
                planName = userPlanData.plan.name
            }
        }

        const { nearbySearchCalls, maxFacades } = this.estimateApiCalls(radius)
        
        // Calculate API costs
        const nearbySearchCost = nearbySearchCalls * config.nearbySearchCostPerCall
        const placeDetailsCost = maxFacades * config.placeDetailsCostPerCall
        const totalApiCost = nearbySearchCost + placeDetailsCost
        
        // Convert API cost to credits
        // Formula: credits = totalApiCost / pricePerCredit
        const creditsRequired = Math.ceil(totalApiCost / pricePerCredit)
        
        return {
            nearbySearchCost,
            placeDetailsCost,
            totalApiCost,
            creditsRequired,
            userCredits,
            hasEnoughCredits: userCredits >= creditsRequired,
            estimatedFacades: maxFacades,
            nearbySearchCalls,
            placeDetailsCalls: maxFacades,
            planName,
            pricePerCredit
        }
    }

    /**
     * Calculate actual cost after scan is performed
     */
    async calculateActualCost(
        facadesFound: number,
        paginationCalls: number,
        userCredits: number,
        userId?: string
    ): Promise<ScanCostEstimate> {
        const config = await this.loadConfig()
        
        let pricePerCredit = 0.5
        let planName: string | null = null
        
        if (userId) {
            const userPlanData = await this.loadUserPlan(userId)
            if (userPlanData) {
                pricePerCredit = userPlanData.pricePerCredit
                planName = userPlanData.plan.name
            }
        }

        const nearbySearchCost = paginationCalls * config.nearbySearchCostPerCall
        const placeDetailsCost = facadesFound * config.placeDetailsCostPerCall
        const totalApiCost = nearbySearchCost + placeDetailsCost
        
        const creditsRequired = Math.ceil(totalApiCost / pricePerCredit)
        
        return {
            nearbySearchCost,
            placeDetailsCost,
            totalApiCost,
            creditsRequired,
            userCredits,
            hasEnoughCredits: userCredits >= creditsRequired,
            estimatedFacades: facadesFound,
            nearbySearchCalls: paginationCalls,
            placeDetailsCalls: facadesFound,
            planName,
            pricePerCredit
        }
    }

    /**
     * Calculate scan launch cost based on:
     * Per facade: (streetViewAPI cost in tokens * 15) + (gemini cost in tokens * 3)
     * Total: cost per facade * total facades
     */
    async calculateScanLaunchCost(
        totalFacades: number,
        userCredits: number
    ): Promise<ScanLaunchCostEstimate> {
        const config = await this.loadConfig()
        
        // Convert API costs to tokens
        // streetViewCostPerCall is in $, dollarsPerToken tells us how much $ per token
        // tokens = $ / dollarsPerToken
        const streetViewTokensPerCall = config.streetViewCostPerCall / config.dollarsPerToken
        const geminiTokensPerCall = config.geminiCostPerCall / config.dollarsPerToken
        
        // Apply multipliers: (streetView * 15) + (gemini * 3) per facade
        const streetViewCostPerFacade = streetViewTokensPerCall * STREET_VIEW_MULTIPLIER
        const geminiCostPerFacade = geminiTokensPerCall * GEMINI_MULTIPLIER
        const totalCostPerFacadeRaw = streetViewCostPerFacade + geminiCostPerFacade
        
        // Round cost per facade first (< 0.5 floors, >= 0.5 ceils)
        const totalCostPerFacade = Math.round(totalCostPerFacadeRaw)
        
        // Total cost = rounded cost per facade * number of facades
        const totalCreditsRequired = totalCostPerFacade * totalFacades
        
        return {
            streetViewCostPerFacade,
            geminiCostPerFacade,
            totalCostPerFacade,
            totalFacades,
            totalCreditsRequired,
            userCredits,
            hasEnoughCredits: userCredits >= totalCreditsRequired,
            dollarsPerToken: config.dollarsPerToken,
            streetViewApiCost: config.streetViewCostPerCall,
            geminiApiCost: config.geminiCostPerCall
        }
    }

    /**
     * Clear cached config (useful when settings are updated)
     */
    clearCache(): void {
        this.config = null
        this.userPlan = null
    }
}

export const ScanCostCalculator = new ScanCostCalculatorService()
