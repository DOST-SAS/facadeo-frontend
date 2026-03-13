import { apiRequest } from "@/api/api";

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
    return await apiRequest<StripeSessionResponse>(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async CreateCheckoutSession_one_time(payload: Payload) {
    const endpoint = `/functions/v1/stripe-create-session`;
    return await apiRequest<StripeSessionResponse>(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}

export default new StripeService();