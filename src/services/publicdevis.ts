import { ANON_KEY, apiRequest } from "@/api/api";
import type { Devis } from "@/types/devisTypes";


class PublicDevisService {
    async getDevis(id: string) {
        const endpoint = `/functions/v1/public_get_devis`;
        console.log('id : ', JSON.stringify({ quote_id: id }))
        const result = await apiRequest<{ quote: Devis; quote_items: any[]; metiers: any[]; facades: any[] }>(endpoint, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ANON_KEY}`
            },
            body: JSON.stringify({ quote_id: id }),
        });
        console.log('result data service : ', result.data)
        return result.data as { quote: Devis; quote_items: any[]; metiers: any[]; facades: any[] };
    }
    async updateDevisStatus(id: string, status: Devis['status']) {
        const endpoint = `/functions/v1/public_set_status`;
        const result = await apiRequest<any>(endpoint, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ANON_KEY}`
            },
            body: JSON.stringify({
                quote_id: id,
                status: status
            })
        });
        return result.data;
    }
}

export const PublicDevisServiceInstance = new PublicDevisService();