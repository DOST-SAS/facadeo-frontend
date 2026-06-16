import { supabase } from "@/api/api";
import type { Plan } from "../../types/PlansTypes";

class AbonnementService {

    async getAbonnement() {
        try {
            const response = await supabase.from("plans")
                .select("*")
                .eq('active', true)
                .order('price_cents', { ascending: true });
            return response
        } catch (error) {
            console.error("Error getting abonnement:", error)
            throw error
        }
    }

    async getCreditPacks() {
        try {
            const response = await supabase.from("credit_packs").select("*").eq('active', true).eq('is_public', true).order('sort_order', { ascending: true });
            return response
        } catch (error) {
            console.error("Error getting credit packs:", error)
            throw error
        }
    }

    async getCurrentSubscription(userId: string) {
        try {
            const response = await supabase
                .from("subscriptions")
                .select("*, plans(*)")
                .eq("profile_id", userId)
                .eq("status", "active")
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            return response;
        } catch (error) {
            console.error("Error getting current subscription:", error)
            throw error
        }
    }

    async updateAbonnement(abonnement: Plan) {
        try {
            const response = await supabase.from("abonnements").update(abonnement).eq("id", abonnement.id)
            return response
        } catch (error) {
            console.error("Error updating abonnement:", error)
            throw error
        }
    }
    async getCreditLedger(userId: string, page: number = 1, pageSize: number = 10, period: string = '30days') {
        try {
            const from = (page - 1) * pageSize
            const to = from + pageSize - 1

            let query = supabase
                .from("credit_ledger")
                .select("*", { count: "exact" })
                .eq('profile_id', userId)
                .order('created_at', { ascending: false })

            // Apply date filter
            const now = new Date()
            let startDate = new Date()

            if (period === '30days') {
                startDate.setDate(now.getDate() - 30)
            } else if (period === '90days') {
                startDate.setDate(now.getDate() - 90)
            } else if (period === 'year') {
                startDate = new Date(now.getFullYear(), 0, 1) // Start of current year
            }

            if (period === '30days' || period === '90days' || period === 'year') {
                query = query.gte('created_at', startDate.toISOString())
            }

            const response = await query.range(from, to)

            return response
        } catch (error) {
            console.error("Error getting credit ledger:", error)
            throw error
        }
    }
}

export const AbonnementServiceInstance = new AbonnementService();