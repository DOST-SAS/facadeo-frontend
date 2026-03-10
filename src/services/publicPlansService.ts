import { supabase } from "@/api/api";

class PublicPlansService {
    /**
     * Get all active public plans for the landing page
     */
    async getPublicPlans() {
        try {
            const { data, error } = await supabase.rpc("get_public_plans");
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error getting public plans:", error);
            throw error;
        }
    }
}

export const PublicPlansServiceInstance = new PublicPlansService();
