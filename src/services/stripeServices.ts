import { ANON_KEY, apiRequest } from "@/api/api";

interface Payload {
    profileId: string;
    type: string;
    priceId?: string;
    plan_id?: string;
    packId?: string;
    amount?: number;
}

interface StripeSessionResponse {
    url: string;
}

class StripeService {
    async CreateCheckoutSession_subscription(payload: Payload) {
        const endpoint = `/functions/v1/stripe-create-session`;
        const result = await apiRequest<StripeSessionResponse>(endpoint, {
            method: 'POST',
            headers: { Authorization: `Bearer ${ANON_KEY}` },
            body: JSON.stringify(payload),
        });
        console.log("result from stripe", result)
        return result;
    }

    async CreateCheckoutSession_one_time(payload: Payload) {
        const endpoint = `/functions/v1/stripe-create-session`;
        const result = await apiRequest<StripeSessionResponse>(endpoint, {
            method: 'POST',
            headers: { Authorization: `Bearer ${ANON_KEY}` },
            body: JSON.stringify(payload),
        });
        console.log("result from stripe one-time", result)
        return result;
    }

}

export default new StripeService()