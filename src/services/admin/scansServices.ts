
import { ANON_KEY, apiRequest, type PaginatedResponse } from "@/api/api";
import type { Scan } from "@/types/scansTypes";


class ScansService {
    async getScans(
        page = 1,
        limit = 10,
        filters: { searchterm: string, status: string }
    ): Promise<PaginatedResponse<Scan>> {

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

        const endpoint = `/functions/v1/admin-fetch-scans?${params.toString()}`;
        const result = await apiRequest<Scan>(endpoint);

        if ("pagination" in result) {
            return result as PaginatedResponse<Scan>;
        }

        return {
            data: Array.isArray(result.data) ? result.data : [result.data],
            pagination: { page, limit, total: 0, totalPages: 0 },
        };
    }
    async deleteScan(scanId: string) {
        const endpoint = `/functions/v1/admin-delete-scan`;
        await apiRequest(endpoint, {
            method: "POST",
            body: JSON.stringify({ scanId }),
        });
    }
}
export const ScansServiceInstance = new ScansService();