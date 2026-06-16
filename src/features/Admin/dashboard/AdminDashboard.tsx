import { useState, useMemo, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardServiceInstance } from "@/services/admin/dashboardService"
import StatisticsCard from "./StatisticsCard"
import StatisticsSkeleton from "./statisticsSkeleton"
import { Loader, Loader2 } from "lucide-react"

interface StatItem {
  id: string;
  label: string;
  value: string | number;
  percentage: number;
  icon: string;
}

const chartConfig = {
  scans: {
    label: "Scans",
    color: "var(--chart-1)",
  },
  facades: {
    label: "Façades",
    color: "var(--chart-2)",
  },
  devis: {
    label: "Devis",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

const AdminDashboard = () => {

  const [adminStats, setAdminStats] = useState<StatItem[] | null>(null)
  const [chartData, setChartData] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
    const [periodType, setPeriodType] = useState("monthly")

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const statsData = await DashboardServiceInstance.getStats(periodType);
        console.log(statsData)

        setAdminStats(statsData.adminStats);
        setChartData(statsData.chartData);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false)
      }
    };
    fetchStats();
  }, [periodType]);


  return (
    <div className="min-h-screen bg-background relative overflow-hidden p-5">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
        <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
      </div>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground/70">Tableau de bord</h1>
        </div>
      </header>

      <div className="relative mx-auto   px-6 py-8 bg-card rounded-sm shadow-sm ring-1 ring-border/5">
        {/* Stats Overview Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Vue d'ensemble</h2>
            <Select
              value={periodType}
              onValueChange={(value) => setPeriodType(value)}
            >
              <SelectTrigger className="ml-2 h-8!">
                <SelectValue placeholder="Select a time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Jour</SelectItem>
                <SelectItem value="monthly">Mois</SelectItem>
                <SelectItem value="weekly">Semaine</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {loading ? (
              <StatisticsSkeleton />
            ) : (
              adminStats?.map((stat) => (
                <StatisticsCard key={stat.id} stat={stat} />
              ))
            )}
          </div>
        </section>


        {/* Interactive Area Chart Section */}
        <section>
          <Card className="border border-border/30 p-0 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 pb-4">
              <div>
                <h3 className="text-lg font-semibold">Graphique d'activité - Interactif</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Affichage du nombre de <span className="font-medium text-primary">Scans/Devis/Facades</span> par {periodType === "daily" ? "jour" : periodType === "weekly" ? "semaine" : "mois"}
                </p>
              </div>
            </div>

            <div className="px-6 pb-6 h-[400px] relative">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px] z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Chargement des données...</p>
                  </div>
                </div>
              ) : chartData?.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/5 rounded-lg border border-dashed border-border m-6">
                  <p className="text-sm text-muted-foreground">Aucune donnée disponible pour cette période</p>
                </div>
              ) : (
                <>
                  <ChartContainer config={chartConfig} className="h-full w-full p-0">
                    <AreaChart
                      accessibilityLayer
                      data={chartData}
                      margin={{
                        left: 0,
                        right: 0,
                        top: 10,
                      }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        minTickGap={32}
                        tickFormatter={(value) => {
                          if (!value) return ""
                          const date = new Date(value)
                          return isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR", {
                            month: "short",
                            day: "numeric",
                          })
                        }}
                      />
                      <ChartTooltip
                        cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                        content={
                          <ChartTooltipContent
                            labelFormatter={(value) => {
                              if (!value) return ""
                              const date = new Date(value)
                              return isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })
                            }}
                            indicator="dot"
                          />
                        }
                      />
                      <defs>
                        <linearGradient id="fillScans" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="var(--chart-1)"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--chart-1)"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                        <linearGradient id="fillFacades" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="var(--chart-2)"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--chart-2)"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                        <linearGradient id="fillDevis" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="var(--chart-3)"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--chart-3)"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        dataKey="scans"
                        type="monotone"
                        fill="url(#fillScans)"
                        fillOpacity={0.4}
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        connectNulls
                      />
                      <Area
                        dataKey="facades"
                        type="monotone"
                        fill="url(#fillFacades)"
                        fillOpacity={0.4}
                        stroke="var(--chart-2)"
                        strokeWidth={2}
                        connectNulls
                      />
                      <Area
                        dataKey="devis"
                        type="monotone"
                        fill="url(#fillDevis)"
                        fillOpacity={0.4}
                        stroke="var(--chart-3)"
                        strokeWidth={2}
                        connectNulls
                      />
                    </AreaChart>
                  </ChartContainer>

                  <div className="flex items-center justify-center gap-6 my-5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--chart-1)" }} />
                      <span className="text-sm text-muted-foreground">Scans</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--chart-2)" }} />
                      <span className="text-sm text-muted-foreground">Façades</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--chart-3)" }} />
                      <span className="text-sm text-muted-foreground">Devis</span>
                    </div>
                  </div>
                </>
              )}


            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}

export default AdminDashboard