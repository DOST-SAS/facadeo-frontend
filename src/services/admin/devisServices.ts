
import { ANON_KEY, apiRequest, supabase, type PaginatedResponse } from "@/api/api";
import type { Devis } from "@/types/devisTypes";

class DevisService {
    async getDevis(
        page = 1,
        limit = 10,
        filters: { searchterm: string, status: string }
    ): Promise<PaginatedResponse<Devis>> {

        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        // Add filter parameters if provided
        if (filters) {
            if (filters.searchterm) {
                params.append("searchterm", filters.searchterm);
            }
            if (filters.status && filters.status !== "all") {
                params.append("status", filters.status);
            }
        }

        const endpoint = `/functions/v1/admin-fetch-devis?${params.toString()}`;
        const result = await apiRequest<Devis>(endpoint);

        if ("pagination" in result) {
            return result as PaginatedResponse<Devis>;
        }

        return {
            data: Array.isArray(result.data) ? result.data : [result.data],
            pagination: { page, limit, total: 0, totalPages: 0 },
        };
    }
    async getDevisById(id: string) {
        try {
            const { data, error } = await supabase
                .from("quotes")
                .select(`
        *,
        quote_items (*),
        profile:profile_id (
          id,
          display_name,
          company_name,
          email,
          phone,
          role,
          metier_id
        )
      `)
                .eq("id", id)
                .single();

            if (error) throw error;

            return { data };
        } catch (error) {
            console.error("Error getting devis by id:", error);
            throw error;
        }
    }

}
export const DevisServiceInstance = new DevisService();
