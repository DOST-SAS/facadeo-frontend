import { SettingsServiceInstance } from "@/services/admin/settingsServices"
import { AbonnementServiceInstance } from "@/services/artisan/Abonemmentsservices"
import type { Settings } from "@/types/adminSettingsTypes"
import type { Plan } from "@/types/PlansTypes"

export interface ScanCostEstimate {
  nearbySearchCost: number
  placeDetailsCost: number
  totalApiCost: number

  creditsRequired: number
  userCredits: number
  hasEnoughCredits: boolean

  estimatedFacades: number
  nearbySearchCalls: number
  placeDetailsCalls: number

  planName: string | null
  pricePerCredit: number
}

export interface ScanLaunchCostEstimate {
  streetViewCostPerFacade: number
  geminiCostPerFacade: number
  totalCostPerFacade: number

  totalFacades: number
  totalCreditsRequired: number

  userCredits: number
  hasEnoughCredits: boolean

  dollarsPerToken: number
  streetViewApiCost: number
  geminiApiCost: number
}

export interface ScanCostConfig {
  googlePlacesTarif: number
  nearbySearchCostPerCall: number
  placeDetailsCostPerCall: number
  streetViewCostPerCall: number
  geminiCostPerCall: number
  dollarsPerToken: number
}

const DEFAULT_NEARBY_SEARCH_COST = 0.032
const DEFAULT_PLACE_DETAILS_COST = 0.02
const DEFAULT_STREET_VIEW_COST = 0.007
const DEFAULT_GEMINI_COST = 0.00025
const DEFAULT_DOLLARS_PER_TOKEN = 0.04

const STREET_VIEW_MULTIPLIER = 15
const GEMINI_MULTIPLIER = 3

function safeNumber(value: number, fallback = 0) {
  if (!Number.isFinite(value) || Number.isNaN(value)) return fallback
  return value
}

function safeDivide(a: number, b: number, fallback = 0) {
  if (!b || !Number.isFinite(b)) return fallback
  return a / b
}

class ScanCostCalculatorService {
  private config: ScanCostConfig | null = null
  private userPlan: { plan: Plan; pricePerCredit: number } | null = null

  async loadConfig(): Promise<ScanCostConfig> {
    if (this.config) return this.config

    try {
      const response = await SettingsServiceInstance.getSettings()

      if (response.data?.length) {
        const settings = response.data[0] as Settings

        const googlePlacesTarif =
          settings.googlePlacesKey?.tarif ?? DEFAULT_NEARBY_SEARCH_COST

        const streetViewTarif =
          settings.streetViewKey?.tarif ?? DEFAULT_STREET_VIEW_COST

        const geminiTarif =
          settings.geminiNanoKey?.tarif ?? DEFAULT_GEMINI_COST

        this.config = {
          googlePlacesTarif,
          nearbySearchCostPerCall: googlePlacesTarif,
          placeDetailsCostPerCall: DEFAULT_PLACE_DETAILS_COST,
          streetViewCostPerCall: streetViewTarif,
          geminiCostPerCall: geminiTarif,
          dollarsPerToken: DEFAULT_DOLLARS_PER_TOKEN
        }
      } else {
        this.config = {
          googlePlacesTarif: DEFAULT_NEARBY_SEARCH_COST,
          nearbySearchCostPerCall: DEFAULT_NEARBY_SEARCH_COST,
          placeDetailsCostPerCall: DEFAULT_PLACE_DETAILS_COST,
          streetViewCostPerCall: DEFAULT_STREET_VIEW_COST,
          geminiCostPerCall: DEFAULT_GEMINI_COST,
          dollarsPerToken: DEFAULT_DOLLARS_PER_TOKEN
        }
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
        dollarsPerToken: DEFAULT_DOLLARS_PER_TOKEN
      }
    }
  }

  async loadUserPlan(userId: string): Promise<{ plan: Plan; pricePerCredit: number } | null> {
    try {
      const response = await AbonnementServiceInstance.getCurrentSubscription(userId)

      if (!response?.data?.plans) return null

      const plan = response.data.plans as Plan

      const planPriceDollars = safeNumber(plan.price_cents / 100, 0)

      let pricePerCredit =
        plan.monthly_credit > 0
          ? safeDivide(planPriceDollars, plan.monthly_credit, 0.5)
          : 0.5

      if (!pricePerCredit || pricePerCredit <= 0 || !Number.isFinite(pricePerCredit)) {
        pricePerCredit = 0.5
      }

      this.userPlan = { plan, pricePerCredit }
      return this.userPlan
    } catch (error) {
      console.error("Failed to load user plan:", error)
      return null
    }
  }

  estimateApiCalls(radius: number): { nearbySearchCalls: number; maxFacades: number } {
    const safeRadius = safeNumber(radius, 0)

    if (safeRadius <= 500) {
      return { nearbySearchCalls: 1, maxFacades: 20 }
    }

    if (safeRadius <= 1000) {
      return { nearbySearchCalls: 2, maxFacades: 40 }
    }

    return { nearbySearchCalls: 3, maxFacades: 60 }
  }

  getMaxFacadesForRadius(radius: number): number {
    const { maxFacades } = this.estimateApiCalls(radius)
    return maxFacades
  }

  async estimateScanCost(
    radius: number,
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

    const { nearbySearchCalls, maxFacades } = this.estimateApiCalls(radius)

    const nearbySearchCost =
      nearbySearchCalls * config.nearbySearchCostPerCall

    const placeDetailsCost =
      maxFacades * config.placeDetailsCostPerCall

    const totalApiCost = nearbySearchCost + placeDetailsCost

    const creditsRequired = Math.max(
      0,
      Math.ceil(safeDivide(totalApiCost, pricePerCredit, 0))
    )

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

    const safeFacades = Math.max(0, safeNumber(facadesFound, 0))
    const safePagination = Math.max(0, safeNumber(paginationCalls, 0))

    const nearbySearchCost =
      safePagination * config.nearbySearchCostPerCall

    const placeDetailsCost =
      safeFacades * config.placeDetailsCostPerCall

    const totalApiCost = nearbySearchCost + placeDetailsCost

    const creditsRequired = Math.max(
      0,
      Math.ceil(safeDivide(totalApiCost, pricePerCredit, 0))
    )

    return {
      nearbySearchCost,
      placeDetailsCost,
      totalApiCost,
      creditsRequired,
      userCredits,
      hasEnoughCredits: userCredits >= creditsRequired,
      estimatedFacades: safeFacades,
      nearbySearchCalls: safePagination,
      placeDetailsCalls: safeFacades,
      planName,
      pricePerCredit
    }
  }

  async calculateScanLaunchCost(
    totalFacades: number,
    userCredits: number
  ): Promise<ScanLaunchCostEstimate> {
    const config = await this.loadConfig()

    const safeTokenValue =
      config.dollarsPerToken > 0
        ? config.dollarsPerToken
        : DEFAULT_DOLLARS_PER_TOKEN

    const streetViewTokensPerCall =
      safeDivide(config.streetViewCostPerCall, safeTokenValue)

    const geminiTokensPerCall =
      safeDivide(config.geminiCostPerCall, safeTokenValue)

    const streetViewCostPerFacade =
      streetViewTokensPerCall * STREET_VIEW_MULTIPLIER

    const geminiCostPerFacade =
      geminiTokensPerCall * GEMINI_MULTIPLIER

    const totalCostPerFacadeRaw =
      streetViewCostPerFacade + geminiCostPerFacade

    const totalCostPerFacade = Math.max(
      0,
      Math.round(safeNumber(totalCostPerFacadeRaw))
    )

    const safeFacades = Math.max(0, safeNumber(totalFacades, 0))

    const totalCreditsRequired = totalCostPerFacade * safeFacades

    return {
      streetViewCostPerFacade,
      geminiCostPerFacade,
      totalCostPerFacade,
      totalFacades: safeFacades,
      totalCreditsRequired,
      userCredits,
      hasEnoughCredits: userCredits >= totalCreditsRequired,
      dollarsPerToken: safeTokenValue,
      streetViewApiCost: config.streetViewCostPerCall,
      geminiApiCost: config.geminiCostPerCall
    }
  }

  clearCache(): void {
    this.config = null
    this.userPlan = null
  }
}

export const ScanCostCalculator = new ScanCostCalculatorService()