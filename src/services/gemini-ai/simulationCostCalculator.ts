import { SettingsServiceInstance } from "@/services/admin/settingsServices"
import type { Settings } from "@/types/adminSettingsTypes"

export interface SimulationCostEstimate {
    creditsRequired: number
    userCredits: number
    hasEnoughCredits: boolean
    apiCostInDollars: number
    dollarsPerToken: number
}

const DEFAULT_GEMINI_IMAGE_COST = 0.0025 // ~$2.5 per 1000 calls (Gemini 2.5 Flash Image)
const DEFAULT_DOLLARS_PER_TOKEN = 0.04   // $20 = 500 tokens -> $0.04/token

class SimulationCostCalculatorService {
    private geminiImageCost: number | null = null
    private dollarsPerToken: number = DEFAULT_DOLLARS_PER_TOKEN

    /**
     * Load configuration from backend settings (api_call_costs view)
     */
    async loadConfig(): Promise<void> {
        if (this.geminiImageCost !== null) return

        try {
            const response = await SettingsServiceInstance.getSettings()

            if (response.data && response.data.length > 0) {
                const settings = response.data[0] as Settings
                this.geminiImageCost = settings.geminiNanoImageKey?.tarif || DEFAULT_GEMINI_IMAGE_COST
            } else {
                this.geminiImageCost = DEFAULT_GEMINI_IMAGE_COST
            }
        } catch (error) {
            console.error("Failed to load simulation cost config:", error)
            this.geminiImageCost = DEFAULT_GEMINI_IMAGE_COST
        }
    }

    /**
     * Calculate cost for generating one simulation image
     */
    async estimateSimulationCost(userCredits: number, isRegeneration: boolean = false): Promise<SimulationCostEstimate> {
        await this.loadConfig()

        let apiCostInDollars = this.geminiImageCost || DEFAULT_GEMINI_IMAGE_COST

        // If it's a regeneration, we can apply a discount (e.g., 50% cheaper)
        if (isRegeneration) {
            apiCostInDollars = apiCostInDollars / 2
        }

        // Convert API cost to tokens
        // tokens = $ / dollarsPerToken
        let creditsRequired = Math.ceil(apiCostInDollars / this.dollarsPerToken)

        // Ensure at least 1 credit for first time, but could be 0 or 1 for regeneration if already low
        if (!isRegeneration && creditsRequired < 1) creditsRequired = 1

        return {
            creditsRequired,
            userCredits,
            hasEnoughCredits: userCredits >= creditsRequired,
            apiCostInDollars,
            dollarsPerToken: this.dollarsPerToken
        }
    }

    /**
     * Clear cached config
     */
    clearCache(): void {
        this.geminiImageCost = null
    }
}

export const SimulationCostCalculator = new SimulationCostCalculatorService()
