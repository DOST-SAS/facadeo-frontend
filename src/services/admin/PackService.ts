
import { ANON_KEY, apiRequest, type PaginatedResponse } from "@/api/api";
import type { CreditPack } from "@/types/packstypes";


class PackService {
    async getPacks(): Promise<PaginatedResponse<CreditPack>> {
        const endpoint = `/functions/v1/admin-fetch-packs`;
        const result = await apiRequest<CreditPack>(endpoint);
        return result as PaginatedResponse<CreditPack>;
    }

    async createPack(pack: Partial<CreditPack>): Promise<CreditPack> {
        try {
            const endpoint = `/functions/v1/admin-create-packs`;
            const result = await apiRequest<CreditPack>(endpoint, {
                method: "POST",
                body: JSON.stringify(pack),
            });


            if (result.error) throw result.error;
            return result.data as CreditPack;
        } catch (error) {
            console.error("Error creating pack:", error);
            throw error;
        }
    }
    async UpdatePack(p_id: string, pack: Partial<CreditPack>): Promise<CreditPack> {
        try {
            const endpoint = `/functions/v1/admin-update-packs`;
            const result = await apiRequest<CreditPack>(endpoint, {
                method: "POST",
                body: JSON.stringify({ p_id, pack }),
            });

            if (result.error) throw result.error;
            return result.data as CreditPack;
        } catch (error) {
            console.error("Error updating pack:", error);
            throw error;
        }
    }

    async deletePack(id: string): Promise<void> {
        try {
            const endpoint = `/functions/v1/admin-delete-pack`;
            const result = await apiRequest<void>(endpoint, {
                method: "POST",
                body: JSON.stringify({ id }),
            });

            if (result.error) throw result.error;
        } catch (error) {
            console.error("Error deleting pack:", error);
            throw error;
        }
    }
}
export const PackServiceInstance = new PackService();
