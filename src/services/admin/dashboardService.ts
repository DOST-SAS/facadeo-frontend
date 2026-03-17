import { ANON_KEY, apiRequest } from "@/api/api";
import type { DashboardStats } from "@/types/adminDashboardTypes";




class DashboardService {
    async getStats(periodType: string): Promise<DashboardStats> {
        const endpoint = `/functions/v1/admin-dashboard`;
        const result = await apiRequest<DashboardStats>(endpoint, {
            method: "POST",
            body: JSON.stringify({ periodType })
        });
        // console.log(result.data)
        return result.data as DashboardStats;
    }
}

export const DashboardServiceInstance = new DashboardService();