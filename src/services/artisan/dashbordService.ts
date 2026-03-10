import { supabase } from "@/api/api"

export interface DashboardStat {
    icon: string
    label: string
    value: number | string
    trend: string
}

export interface DashboardData {
    stats: DashboardStat[]
    latestScans: any[]
}

type RpcResponse = {
    scansCount: number
    facadesCount: number
    quotesCount: number
    conversionRate: number
    revenue: number
    latestScans: any[]
    stats: DashboardStat[]
}

export class DashboardService {
    async getDashboard(userId: string, periodType = "monthly"): Promise<DashboardData> {
        try {
            const { data, error } = await supabase.rpc(
                "get_user_dashboard",
                {
                    p_user_id: userId,
                    p_period_type: periodType
                }
            )

            if (error) throw error

            const rpcData = data as RpcResponse
            console.log(rpcData)
            return {
                stats: rpcData.stats,
                latestScans: rpcData.latestScans || []
            }
        } catch (error) {
            console.error("Error getting dashboard stats:", error)
            throw error
        }
    }
}

export const DashboardServiceInstance = new DashboardService()
