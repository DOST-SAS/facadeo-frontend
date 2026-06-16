export interface DashboardStats {
    adminStats: StatItem[];
    chartData: any[];
}

export interface StatItem {
    id: string;
    label: string;
    value: string | number;
    percentage: number;
    icon: string;
  }