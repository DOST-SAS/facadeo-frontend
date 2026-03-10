import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Plus,
  Settings,
  ArrowUpRight, FileText, ScanLine,
  ArrowDownRight
} from "lucide-react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { cn, iconMap, statusBadgeConfig } from "@/lib/utils"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { OnboardingModal } from "../onboarding/OnboardingPage"
import { DashboardServiceInstance, type DashboardStat } from "@/services/artisan/dashbordService"
import { Skeleton } from "@/components/ui/skeleton"

import { PlansModel } from "@/components/PlansModel"

export function ArtisanDashboard() {
  const navigate = useNavigate()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showPlans, setShowPlans] = useState(false)
  const [dashboardStats, setDashboardStats] = useState<DashboardStat[]>([])
  const [periodType, setPeriodType] = useState("monthly")
  const [latestScans, setLatestScans] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const { user } = useAuth()
  useEffect(() => {
    const getDashboard = async () => {
      if (!user?.id) return
      // Only show loading for the initial load to prevent flickering on background refreshes
      if (dashboardStats.length === 0) setLoading(true)
      try {
        const dashboard = await DashboardServiceInstance.getDashboard(user.id, periodType)
        setDashboardStats(dashboard.stats)
        setLatestScans(dashboard.latestScans)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    getDashboard()

  }, [user?.id, periodType])




  useEffect(() => {
    if (user && !user?.onboarding_completed) {
      setShowOnboarding(true)
    }
  }, [user, showOnboarding])


  return (
    <>
      <OnboardingModal
        open={showOnboarding}
        onOpenChange={(open) => {
          setShowOnboarding(open);
          if (!open) {
            setShowPlans(true);
          }
        }}
      />
      <PlansModel
        open={showPlans}
        onOpenChange={(open) => {
          setShowPlans(open);
          if (!open) {
            navigate('/scans')
          }
        }}
      />
      <div className="min-h-screen bg-background relative overflow-hidden p-5 ">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
          <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
          <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
        </div>
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground/70">Tableau de bord</h1>
          </div>
        </header>
        <div className="relative mx-auto   px-6 py-8 bg-card rounded-sm">

          <section className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Aperçu succinct  de :</h2>
              <Select
                value={periodType}
                onValueChange={setPeriodType}
              >
                <SelectTrigger className="h-8!">
                  <SelectValue placeholder="Select a period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Cette semaine</SelectItem>
                  <SelectItem value="monthly">Ce mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Card
                    key={i}
                    className="relative overflow-hidden border border-border/30 p-3 md:p-5 h-[140px] flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </Card>
                ))
              ) : dashboardStats.map((stat) => {
                const Icon = iconMap[stat.icon] || FileText
                if (!Icon) return null
                return (
                  <Card
                    key={stat.label}
                    className="group relative overflow-hidden border border-border/30 p-3 md:p-5 "
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                      <div className="absolute top-0 right-0 w-px h-8 bg-linear-to-b from-primary/40 to-transparent" />
                      <div className="absolute top-0 right-0 w-8 h-px bg-linear-to-l from-primary/40 to-transparent" />
                    </div>

                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary border border-border group-hover:border-primary/20 transition-colors">
                          <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <span className={cn(
                          "flex items-center gap-1 text-xs font-medium ",
                          Number(stat?.trend) >= 0 ? "text-success" : "text-destructive "
                        )}>
                          {Number(stat?.trend) >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Number(stat?.trend)}%
                        </span>
                      </div>
                      <span className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</span>
                      <p className="text-xs text-muted-foreground mt-1.5 tracking-wide">{stat.label}</p>
                    </div>
                  </Card>
                )
              })}
            </div>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Accès rapides</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/scans/create" >
                <Button
                  variant="outline"
                  className="h-11 px-5 gap-2 rounded-xl font-medium bg-card border-border hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-300"
                >
                  <Plus className="h-4 w-4" />
                  Nouveau scan
                </Button>
              </Link>
              <Link to="/scans" >
                <Button
                  variant="outline"
                  className="h-11 px-5 gap-2 rounded-xl font-medium bg-card border-border hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-300"
                >
                  <ScanLine className="h-4 w-4" />
                  Scans récents
                </Button>
              </Link>
              <Link to="/parametres" >
                <Button
                  variant="outline"
                  className="h-11 px-5 gap-2 rounded-xl font-medium bg-card border-border hover:border-primary/40  hover:text-primary hover:bg-primary/5 transition-all duration-300"
                >
                  <Settings className="h-4 w-4" />
                  Paramètres
                </Button>
              </Link>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Activités récentes</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 mb-6">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border border-border shadow-sm rounded-sm py-4 px-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                      <div className="hidden md:flex gap-6 items-center">
                        <Skeleton className="h-8 w-24 rounded-lg" />
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <Skeleton className="h-9 w-20" />
                      </div>
                      <div className="md:hidden flex flex-col gap-3 mt-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    </div>
                  </Card>
                ))
              ) : latestScans?.length > 0 ? (
                latestScans.map((scan) => {
                  const StatusIcon = statusBadgeConfig[scan.status].icon

                  // Determine color based on score
                  const getScoreColor = (score: number) => {
                    if (score < 40) return "var(--destructive)"
                    if (score >= 40 && score <= 75) return "var(--warning)"
                    return "var(--success)"
                  }

                  const scoreColor = getScoreColor(scan.score)

                  const chartData = [
                    { name: "score", value: scan.score, fill: scoreColor }
                  ]

                  const chartConfig = {
                    score: {
                      label: "Score",
                      color: scoreColor,
                    },
                  } satisfies ChartConfig

                  return (
                    <Card key={scan.id} className="border border-border shadow-sm rounded-sm py-1! md:py-0 px-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:h-20">
                        {/* Left Section: Project Info */}
                        <div className="flex-1 min-w-0 md:max-w-[250px] lg:max-w-[300px]">
                          <Link to={`/scans/${scan.slug}`}>
                            <h3 className="font-semibold underline text-foreground/80 text-base mb-1 truncate">
                              {scan.name}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground truncate">
                            {scan.address_text}
                          </p>
                        </div>

                        {/* Mobile: Status + Facades + Chart Row */}
                        <div className="flex md:hidden items-center justify-between gap-3">
                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-lg border ${statusBadgeConfig[scan.status].className}`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1.5" />
                            {statusBadgeConfig[scan.status].label}
                          </span>

                          {/* Facades Count */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground font-medium">Façades: </span>
                            <span className="text-xl font-bold text-foreground/80">
                              {scan.facadesCount}
                            </span>
                          </div>

                          {/* Radial Chart */}
                          <ChartContainer
                            config={chartConfig}
                            className="w-[50px] h-[50px]"
                          >
                            <RadialBarChart
                              data={chartData}
                              startAngle={90}
                              endAngle={90 - (scan.score / 100) * 360}
                              innerRadius="70%"
                              outerRadius="100%"
                            >
                              <PolarGrid
                                gridType="circle"
                                radialLines={false}
                                stroke="none"
                                className="first:fill-muted last:fill-background"
                                polarRadius={[22, 16]}
                              />
                              <RadialBar dataKey="value" background cornerRadius={10} />
                              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                                <Label
                                  content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                      return (
                                        <text
                                          x={viewBox.cx}
                                          y={viewBox.cy}
                                          textAnchor="middle"
                                          dominantBaseline="middle"
                                        >
                                          <tspan
                                            x={viewBox.cx}
                                            y={viewBox.cy}
                                            className="text-[10px] font-black"
                                            style={{ fill: scoreColor }}
                                          >
                                            {scan.score.toFixed(0)}
                                          </tspan>
                                        </text>
                                      )
                                    }
                                  }}
                                />
                              </PolarRadiusAxis>
                            </RadialBarChart>
                          </ChartContainer>
                        </div>

                        {/* Desktop: Status Badge */}
                        <div className="hidden md:flex flex-col items-center gap-1">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg border ${statusBadgeConfig[scan.status].className}`}
                          >
                            <StatusIcon className="h-4 w-4 mr-2" />
                            {statusBadgeConfig[scan.status].label}
                          </span>
                        </div>

                        {/* Desktop: Facades Count */}
                        <div className="hidden md:flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-medium">Façades détectées : </span>
                          <span className="text-2xl font-bold text-foreground/80">
                            {scan.facadesCount}
                          </span>
                        </div>

                        {/* Desktop: Radial Chart */}
                        <div className="hidden md:flex flex-col items-center">
                          <ChartContainer
                            config={chartConfig}
                            className="mx-auto aspect-square w-[100px] h-[100px]"
                          >
                            <RadialBarChart
                              data={chartData}
                              startAngle={270}
                              endAngle={270 + (scan.score / 100) * 360}
                              innerRadius={30}
                              outerRadius={50}
                              style={{
                                fill: "var(--primary)",
                              }}
                            >
                              <PolarGrid
                                gridType="circle"
                                radialLines={false}
                                stroke="none"
                                className="first:fill-muted last:fill-background"
                                polarRadius={[33, 27]}
                              />
                              <RadialBar dataKey="value" background cornerRadius={10} />
                              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                                <Label
                                  content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                      return (
                                        <text
                                          x={viewBox.cx}
                                          y={viewBox.cy}
                                          textAnchor="middle"
                                          dominantBaseline="middle"
                                        >
                                          <tspan
                                            x={viewBox.cx}
                                            y={viewBox.cy}
                                            className="text-xl font-bold"
                                            style={{ fill: scoreColor }}
                                          >
                                            {scan.score.toFixed(0)}
                                          </tspan>
                                        </text>
                                      )
                                    }
                                  }}
                                />
                              </PolarRadiusAxis>
                            </RadialBarChart>
                          </ChartContainer>
                        </div>

                        {/* Action Button */}
                        <Link to={`/scans/${scan.slug}`}>
                          <Button variant="default" size="sm" className="text-xs w-full md:w-auto">
                            Voir
                            <ArrowUpRight className="h-3 w-3" />
                          </Button>
                        </Link>

                      </div>
                    </Card>
                  )
                })
              ) : (
                <Card className="flex flex-col items-center justify-center p-4! border-dashed border-2 border-border/50 bg-accent/5">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <ScanLine className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground ">Aucun scan récent</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm ">
                    Commencez par créer votre premier scan de façade pour voir apparaître vos activités ici.
                  </p>
                  <Link to="/scans/create">
                    <Button>
                      <Plus className="h-4 w-4" />
                      Nouveau scan
                    </Button>
                  </Link>
                </Card>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

