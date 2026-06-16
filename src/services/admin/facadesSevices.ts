
import { ANON_KEY, apiRequest, type PaginatedResponse, supabase } from "@/api/api";
import { GOOGLE_PLACE_TYPES } from "@/constants";
import type { Facade } from "@/types/scansTypes";

type FacadeType = typeof GOOGLE_PLACE_TYPES[number]["value"] | "all";


class FacadesService {
    async getFacades(
        page = 1,
        limit = 10,
        filters: { searchterm: string, type: FacadeType, score: string }
    ): Promise<PaginatedResponse<Facade>> {

        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        // Add filter parameters if provided
        if (filters) {
            if (filters.searchterm) {
                params.append("searchterm", filters.searchterm);
            }
            if (filters.type && filters.type !== "all") {
                params.append("type", filters.type);
            }
            if (filters.score && filters.score !== "all") {
                params.append("score", filters.score);
            }
        }

        const endpoint = `/functions/v1/admin-fetch-facades?${params.toString()}`;
        const result = await apiRequest<Facade>(endpoint, {
            headers: { Authorization: `Bearer ${ANON_KEY}` },
        });

        if ("pagination" in result) {
            return result as PaginatedResponse<Facade>;
        }

        return {
            data: Array.isArray(result.data) ? result.data : [result.data],
            pagination: { page, limit, total: 0, totalPages: 0 },
        };
    }
    async getFacadeById(id: string) {
        try {
            const { data, error } = await supabase
                .from("facades")
                .select(`
        *,
        businesses_cache (*),
        scan_facades:scan_facades (
          id,
          simulated_facade_image,
          scan:scans (*)
        )
      `)
                .eq("id", id)
                .single()

            if (error) throw error

            return {
                ...data,
                scan: data.scan_facades?.[0]?.scan ?? null
            }
        } catch (error) {
            console.error("Error getting facade by id:", error)
            throw error
        }
    }

    async getFacadeTotalDetected(facadeId: string) {
        try {
            const { count, error } = await supabase
                .from("scan_facades")
                .select("*", { count: "exact", head: true })
                .eq("facade_id", facadeId)

            if (error) throw error

            return count ?? 0
        } catch (error) {
            console.error("Error counting facade detections:", error)
            throw error
        }
    }
}
export const FacadesServiceInstance = new FacadesService();
