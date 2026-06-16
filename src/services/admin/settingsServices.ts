
import { ANON_KEY, apiRequest, type ApiResponse } from "@/api/api";
import type { Settings } from "@/types/adminSettingsTypes";

class SettingsService {
    async getSettings(): Promise<ApiResponse<Settings[]>> {
        const endpoint = `/functions/v1/admin-get-app-settings`;
        const result = await apiRequest<Settings[]>(endpoint, {
            headers: { Authorization: `Bearer ${ANON_KEY}` },
        });

        return result as ApiResponse<Settings[]>;
    }

    async updateSettings(settings: Partial<Settings>): Promise<ApiResponse<Settings>> {
        const endpoint = `/functions/v1/admin-update-settings`;
        const result = await apiRequest<Settings>(endpoint, {
            method: "POST",
            headers: { Authorization: `Bearer ${ANON_KEY}` },
            body: JSON.stringify(settings),
        });
        return result as ApiResponse<Settings>;
    }
}

export const SettingsServiceInstance = new SettingsService();
