import { useState, useCallback } from "react"
import { ScanCostCalculator, type ScanCostEstimate, type ScanLaunchCostEstimate } from "@/services/scanCostCalculator"
import { CreditLedger } from "@/services/creditLedgerService"
import { useAuth } from "@/context/AuthContext"

// Minimum facades for credit check (max possible from Google Places API)
const MIN_FACADES_FOR_CREDIT_CHECK = 60

interface UseScanCostEstimateReturn {
    estimate: ScanCostEstimate | null
    scanLaunchCost: ScanLaunchCostEstimate | null
    isLoading: boolean
    error: string | null
    estimateCost: (radius: number) => Promise<ScanCostEstimate | null>
    calculateScanLaunchCost: (totalFacades: number) => Promise<ScanLaunchCostEstimate | null>
    chargeForDetection: (facadesFound: number, paginationCalls: number) => Promise<{
        chargedCredits: number
        newBalance: number
    } | null>
    chargeForScanLaunch: (totalFacades: number, scanId: string) => Promise<{
        chargedCredits: number
        newBalance: number
    } | null>
    calculateActualCost: (facadesFound: number, paginationCalls: number) => Promise<ScanCostEstimate | null>
    getMinimumCreditsRequired: () => Promise<number>
    refresh: () => void
}

export function useScanCostEstimate(): UseScanCostEstimateReturn {
    const { user } = useAuth()
    const [estimate, setEstimate] = useState<ScanCostEstimate | null>(null)
    const [scanLaunchCost, setScanLaunchCost] = useState<ScanLaunchCostEstimate | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const userCredits = user?.credit_balance ?? 0
    const userId = user?.id

    const estimateCost = useCallback(async (radius: number): Promise<ScanCostEstimate | null> => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await ScanCostCalculator.estimateScanCost(
                radius,
                userCredits,
                userId
            )
            setEstimate(result)
            return result
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erreur lors du calcul du coût"
            setError(message)
            return null
        } finally {
            setIsLoading(false)
        }
    }, [userCredits, userId])

    /**
     * Get minimum credits required for max 60 facades (pre-detection check)
     */
    const getMinimumCreditsRequired = useCallback(async (): Promise<number> => {
        if (!userId) return 0

        try {
            // Calculate cost for max 60 facades (3 pagination calls)
            const maxCost = await ScanCostCalculator.calculateActualCost(
                MIN_FACADES_FOR_CREDIT_CHECK,
                3, // Max pagination calls
                userCredits,
                userId
            )
            return maxCost.creditsRequired
        } catch (err) {
            console.error("Failed to calculate minimum credits:", err)
            return 0
        }
    }, [userId, userCredits])

    /**
     * Calculate scan launch cost based on facades found
     * Formula: (streetViewAPI cost * 15 + gemini cost * 3) per facade
     */
    const calculateScanLaunchCost = useCallback(async (
        totalFacades: number
    ): Promise<ScanLaunchCostEstimate | null> => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await ScanCostCalculator.calculateScanLaunchCost(
                totalFacades,
                userCredits
            )
            setScanLaunchCost(result)
            return result
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erreur lors du calcul du coût de scan"
            setError(message)
            return null
        } finally {
            setIsLoading(false)
        }
    }, [userCredits])

    /**
     * Charge user when launching scan (based on actual facades)
     */
    const chargeForScanLaunch = useCallback(async (
        totalFacades: number,
        scanId: string
    ): Promise<{
        chargedCredits: number
        newBalance: number
    } | null> => {
        if (!userId) {
            setError("Utilisateur non connecté")
            return null
        }

        setIsLoading(true)
        setError(null)

        try {
            // Calculate scan launch cost
            const launchCost = await ScanCostCalculator.calculateScanLaunchCost(
                totalFacades,
                userCredits
            )

            if (!launchCost.hasEnoughCredits) {
                setError("Crédits insuffisants pour lancer le scan")
                return null
            }

            // Charge for scan launch
            const { newBalance } = await CreditLedger.createEntry({
                profileId: userId,
                type: "scan_charge",
                amount: -Math.abs(launchCost.totalCreditsRequired),
                referenceId: scanId,
                referenceType: "scan_launch",
                idempotencyKey: `scan_launch_${scanId}`,
                metadata: {
                    total_facades: totalFacades,
                    cost_per_facade: launchCost.totalCostPerFacade,
                    street_view_cost: launchCost.streetViewCostPerFacade,
                    gemini_cost: launchCost.geminiCostPerFacade,
                    charged_at: new Date().toISOString()
                }
            })

            // Update scan launch cost with new balance
            setScanLaunchCost(prev => prev ? { ...prev, userCredits: newBalance } : null)

            return {
                chargedCredits: launchCost.totalCreditsRequired,
                newBalance
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erreur lors du débit des crédits"
            setError(message)
            return null
        } finally {
            setIsLoading(false)
        }
    }, [userId, userCredits])

    /**
     * Charge user for detection (Places API cost) after facades are found
     */
    const chargeForDetection = useCallback(async (
        facadesFound: number,
        paginationCalls: number
    ): Promise<{
        chargedCredits: number
        newBalance: number
    } | null> => {
        if (!userId) {
            setError("Utilisateur non connecté")
            return null
        }

        setIsLoading(true)
        setError(null)

        try {
            // Calculate detection cost based on actual facades found
            const detectionCost = await ScanCostCalculator.calculateActualCost(
                facadesFound,
                paginationCalls,
                userCredits,
                userId
            )

            if (!detectionCost.hasEnoughCredits) {
                setError("Crédits insuffisants")
                return null
            }

            // Generate unique detection ID
            const detectionId = crypto.randomUUID()

            // Charge for detection (Places API calls)
            const { newBalance } = await CreditLedger.createEntry({
                profileId: userId,
                type: "detection",
                amount: -Math.abs(detectionCost.creditsRequired),
                referenceId: detectionId,
                referenceType: "facade_detection",
                idempotencyKey: `detection_${detectionId}`,
                metadata: {
                    facades_found: facadesFound,
                    pagination_calls: paginationCalls,
                    nearby_search_cost: detectionCost.nearbySearchCost,
                    place_details_cost: detectionCost.placeDetailsCost,
                    total_api_cost: detectionCost.totalApiCost,
                    charged_at: new Date().toISOString()
                }
            })

            // Update estimate with new balance
            setEstimate(prev => prev ? { ...prev, userCredits: newBalance } : null)

            return {
                chargedCredits: detectionCost.creditsRequired,
                newBalance
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erreur lors du débit des crédits"
            setError(message)
            return null
        } finally {
            setIsLoading(false)
        }
    }, [userId, userCredits])

    const calculateActualCost = useCallback(async (
        facadesFound: number,
        paginationCalls: number
    ): Promise<ScanCostEstimate | null> => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await ScanCostCalculator.calculateActualCost(
                facadesFound,
                paginationCalls,
                userCredits,
                userId
            )
            setEstimate(result)
            return result
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erreur lors du calcul du coût"
            setError(message)
            return null
        } finally {
            setIsLoading(false)
        }
    }, [userCredits, userId])

    const refresh = useCallback(() => {
        ScanCostCalculator.clearCache()
        setEstimate(null)
        setScanLaunchCost(null)
        setError(null)
    }, [])

    return {
        estimate,
        scanLaunchCost,
        isLoading,
        error,
        estimateCost,
        calculateScanLaunchCost,
        chargeForDetection,
        chargeForScanLaunch,
        calculateActualCost,
        getMinimumCreditsRequired,
        refresh
    }
}
