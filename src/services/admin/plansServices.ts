import { apiRequest, type PaginatedResponse } from "@/api/api";
import type { Plan } from "@/types/PlansTypes";

class PlansService {
  async getPlans(): Promise<PaginatedResponse<Plan>> {
    const endpoint = `/functions/v1/admin-fetch-plans`;
    const result = await apiRequest<Plan>(endpoint);

    if ("pagination" in result) {
      return result as PaginatedResponse<Plan>;
    }

    return {
      data: Array.isArray(result.data) ? result.data : [result.data],
      pagination: {
        page: 1,
        limit: 100,
        total: Array.isArray(result.data) ? result.data.length : 1,
        totalPages: 1,
      },
    };
  }

  async createPlan(plan: Plan): Promise<Plan> {
    const endpoint = `/functions/v1/admin-create-plan`;
    const result = await apiRequest<Plan>(endpoint, {
      method: "POST",
      body: JSON.stringify(plan),
    });
    return result.data as Plan;
  }

  async updatePlan(planId: string, plan: Plan): Promise<Plan> {
    const endpoint = `/functions/v1/admin-update-plan`;
    const result = await apiRequest<Plan>(endpoint, {
      method: "PUT",
      body: JSON.stringify({ planId, plan }),
    });
    return result.data as Plan;
  }

  async deletePlan(planId: string): Promise<void> {
    const endpoint = `/functions/v1/admin-delete-plan/${planId}`;
    await apiRequest<void>(endpoint, {
      method: "DELETE",
    });
  }
}

export const PlansServiceInstance = new PlansService();