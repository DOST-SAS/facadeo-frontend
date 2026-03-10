
import { ANON_KEY, apiRequest, type PaginatedResponse } from "@/api/api";
import type { Plan } from "@/types/PlansTypes";

class PlansService {
    async getPlans(): Promise<PaginatedResponse<Plan>> {
        const endpoint = `/functions/v1/admin-fetch-plans`;
        const result = await apiRequest<Plan>(endpoint, {
            headers: { Authorization: `Bearer ${ANON_KEY}` },
        });

        if ("pagination" in result) {
            return result as PaginatedResponse<Plan>;
        }

        return {
            data: Array.isArray(result.data) ? result.data : [result.data],
            // Default pagination structure if the API returns a flat array
            pagination: { page: 1, limit: 100, total: Array.isArray(result.data) ? result.data.length : 1, totalPages: 1 },
        };
    }
    async createPlan(plan: Plan): Promise<Plan> {
        const endpoint = `/functions/v1/admin-create-plan`;
        const result = await apiRequest<Plan>(endpoint, {
            method: "POST",
            headers: { Authorization: `Bearer ${ANON_KEY}` },
            body: JSON.stringify(plan),
        });
        return result.data as Plan;
    }
    async updatePlan(planId: string, plan: Plan): Promise<Plan> {
        const endpoint = `/functions/v1/admin-update-plan`;
        const result = await apiRequest<Plan>(endpoint, {
            method: "PUT",
            headers: { Authorization: `Bearer ${ANON_KEY}` },
            body: JSON.stringify({ planId, plan }),
        });
        return result.data as Plan;
    }
    async deletePlan(planId: string): Promise<void> {
        const endpoint = `/functions/v1/admin-delete-plan/${planId}`;
        await apiRequest<void>(endpoint, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${ANON_KEY}` },
        });
    }

}

export const PlansServiceInstance = new PlansService();
