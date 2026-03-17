import { ANON_KEY, apiRequest } from "@/api/api";


class EmailFinderService {
    async getEmails(website: string): Promise<string[]> {
        const endpoint = `/functions/v1/email-finder-apify`;
        const result = await apiRequest<{ emails: string[] }>(endpoint, {
            method: "POST",
            body: JSON.stringify({ website })
        });

        const responseData = result.data as { emails: string[] };
        return responseData?.emails || [];
    }
}

export const EmailFinderServiceInstance = new EmailFinderService();