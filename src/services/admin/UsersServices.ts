
import { ANON_KEY, apiRequest, type PaginatedResponse } from "@/api/api";
import type { User } from "@/types/usersTypes";


class UsersService {
    async getUsers(
        page = 1,
        limit = 10,
        filters: { searchterm: string, status: string }
    ): Promise<PaginatedResponse<User>> {

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

        const endpoint = `/functions/v1/admin-fetch-users?${params.toString()}`;
        const result = await apiRequest<User>(endpoint);
        // console.log(result)
        if ("pagination" in result) {
            return result as PaginatedResponse<User>;
        }

        return {
            data: Array.isArray(result.data) ? result.data : [result.data],
            pagination: { page, limit, total: 0, totalPages: 0 },
        };
    }
    async UpdateUser(userId: string, updates: Partial<User>): Promise<User> {
        const endpoint = `/functions/v1/admin-update-user`;
        const result = await apiRequest<User>(endpoint, {
            method: "POST",
            body: JSON.stringify({ userId, updates }),
        });
        return result.data as User;
    }
    async deleteUser(userId: string): Promise<User> {
        const endpoint = `/functions/v1/admin-delete-profile`;
        const result = await apiRequest<User>(endpoint, {
            method: "POST",
            body: JSON.stringify({ user_id: userId }),
        });
        return result.data as User;
    }
}
export const UsersServiceInstance = new UsersService();