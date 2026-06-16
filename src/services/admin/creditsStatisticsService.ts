import { ANON_KEY, apiRequest } from "@/api/api";

interface CreditLedgerStats {
    scope: string;
    period: {
        start_date: string;
        end_date: string;
    };
    total_consumed: number;
    breakdown: {
        detection: {
            consumed: number;
            operations: number;
        };
        email_search: {
            consumed: number;
            operations: number;
        };
        simulation: {
            consumed: number;
            operations: number;
        };
        scan_charge: {
            consumed: number;
            operations: number;
        }
    }
}



class CreditLedgerService {
    async getCreditLedgerStats(startDate: string, endDate: string): Promise<CreditLedgerStats> {
        const endpoint = `/functions/v1/credits-consumption-total`;
        const result = await apiRequest<CreditLedgerStats>(endpoint, {
            method: "POST",
            headers: { Authorization: `Bearer ${ANON_KEY}` },
            body: JSON.stringify({ start_date: startDate, end_date: endDate })
        });
        return result.data as CreditLedgerStats;
    }
}

export const CreditLedgerServiceInstance = new CreditLedgerService();