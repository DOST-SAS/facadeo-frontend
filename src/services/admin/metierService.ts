
import { ANON_KEY, apiRequest, type PaginatedResponse } from "@/api/api";
import type { Metier } from "@/types/artisanSettinstypes";


class MetierService {
    async getMetiers(
        page = 1,
        limit = 10,
        filters: { searchterm: string, status: string }
    ): Promise<PaginatedResponse<Metier>> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        // Add filter parameters if provided
        if (filters) {
            if (filters.searchterm) {
                params.append("searchterm", filters.searchterm);
            }
            if (filters.status) {
                params.append("status", filters.status);
            }
        }

        const endpoint = `/functions/v1/admin-fetch-metiers?${params.toString()}`;
        const result = await apiRequest<Metier>(endpoint);

        return result as PaginatedResponse<Metier>;
    }

    async createMetier(metier: Partial<Metier>): Promise<Metier> {
        try {
            const endpoint = `/functions/v1/admin-create-metier`;
            const result = await apiRequest<Metier>(endpoint, {
                method: "POST",
                body: JSON.stringify(metier),
            });


            if (result.error) throw result.error;
            return result.data as Metier;
        } catch (error) {
            console.error("Error creating metier:", error);
            throw error;
        }
    }
    async UpdateMetier(m_id: string, metier: Partial<Metier>): Promise<Metier> {
        try {
            const endpoint = `/functions/v1/admin-update-metier`;
            const result = await apiRequest<Metier>(endpoint, {
                method: "PUT",
                body: JSON.stringify({ m_id, metier }),
            });

            if (result.error) throw result.error;
            return result.data as Metier;
        } catch (error) {
            console.error("Error updating metier:", error);
            throw error;
        }
    }

    async deleteMetier(id: string): Promise<void> {
        try {
            const endpoint = `/functions/v1/admin-delete-metier`;
            const result = await apiRequest<void>(endpoint, {
                method: "DELETE",
                body: JSON.stringify({ id }),
            });

            if (result.error) throw result.error;
        } catch (error) {
            console.error("Error deleting metier:", error);
            throw error;
        }
    }
}
export const MetierServiceInstance = new MetierService();
