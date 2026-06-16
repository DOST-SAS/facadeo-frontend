import React, { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Label,
    PolarRadiusAxis,
    RadialBar,
    RadialBarChart,
} from 'recharts';
import {
    Coins,
    Search,
    ScanLine,
    Zap,
    TrendingDown,
    Activity,
    ChevronRight,
    MousePointer2,
    Database,
    ShieldCheck,
    TrendingUp,
    Calendar as CalendarIcon,
    RefreshCcw,
    Sparkles
} from 'lucide-react';
import { CreditLedgerServiceInstance } from "@/services/admin/creditsStatisticsService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { toast } from "react-hot-toast";
import { format, startOfMonth, endOfMonth, subMonths, isSameMonth } from 'date-fns';
import type { DateRange } from "react-day-picker";
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";

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

const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6'];
const GRADIENTS = [
    'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
];

const chartConfig = {
    value: {
        label: "Crédits",
        color: "hsl(var(--primary))",
    },
    detection: {
        label: "Détection AI",
        color: COLORS[0],
    },
    email_search: {
        label: "Email Search",
        color: COLORS[1],
    },
    simulation: {
        label: "Simulations",
        color: COLORS[2],
    },
    scan_charge: {
        label: "Scan Charge",
        color: COLORS[3],
    },
} satisfies ChartConfig;

const CreditLedgerSkeleton = () => (
    <div className="p-6 space-y-8 animate-pulse bg-background/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-4">
                <div className="h-12 w-80 bg-muted/60 rounded-2xl" />
                <div className="h-4 w-56 bg-muted/40 rounded-lg" />
            </div>
            <div className="h-14 w-72 bg-muted/60 rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-muted/50 rounded-4xl" />
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-[500px] bg-muted/40 rounded-[2.5rem]" />
            <div className="h-[500px] bg-muted/40 rounded-[2.5rem]" />
        </div>
    </div>
);

const EmptyCreditStats = ({ period }: { period: string }) => (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-6 bg-muted/10 rounded-[3rem] border-2 border-dashed border-muted/50 backdrop-blur-sm">
        <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
            <div className="relative p-8 rounded-full bg-background/80 shadow-2xl text-muted-foreground/30 border border-muted/30">
                <Coins size={80} strokeWidth={1} />
            </div>
        </div>
        <div className="space-y-2 max-w-sm">
            <h3 className="text-2xl font-black tracking-tight text-foreground/80">Aucune activité détectée</h3>
            <p className="text-muted-foreground text-base leading-relaxed">
                Les flux de crédits sont actuellement à l'arrêt pour la période du <span className="text-foreground font-semibold font-mono">{period}</span>.
            </p>
        </div>
        <Button
            className="rounded-2xl px-8 h-12 font-bold shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-95"
            onClick={() => window.location.reload()}
        >
            Forcer la synchronisation
        </Button>
    </div>
);

const StatCard = ({ title, value, subValue, icon: Icon, colorClass }: any) => (
    <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 ">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {title}
            </CardTitle>
            <div className={cn("p-2 rounded-lg bg-opacity-10", colorClass.bg)}>
                <Icon className={cn("h-4 w-4 text-white!", colorClass.text)} />
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
                x{subValue}
            </p>
        </CardContent>
    </Card>
);

const CreditLedger = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<CreditLedgerStats | null>(null);
    const [date, setDate] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    const fetchStats = async () => {
        if (!date?.from || !date?.to) return;

        setLoading(true);
        try {
            const data = await CreditLedgerServiceInstance.getCreditLedgerStats(
                format(date?.from, 'yyyy-MM-dd'),
                format(date?.to, 'yyyy-MM-dd')
            );
            setStats(data);
        } catch (error) {
            console.error("Error fetching credit stats:", error);
            toast.error("Erreur de synchronisation");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (date?.from && date?.to) {
            fetchStats();
        }
    }, [date]);

    const chartData = stats ? [
        { name: 'detection', value: stats.breakdown?.detection?.consumed || 0, fill: COLORS[0] },
        { name: 'email_search', value: stats.breakdown?.email_search?.consumed || 0, fill: COLORS[1] },
        { name: 'simulation', value: stats.breakdown?.simulation?.consumed || 0, fill: COLORS[2] },
        { name: 'scan_charge', value: stats.breakdown?.scan_charge?.consumed || 0, fill: COLORS[3] },
    ] : [];

    // Transformation des données pour le RadialBarChart empilé
    const radialChartData = stats ? [{
        detection: stats.breakdown?.detection?.consumed || 0,
        email_search: stats.breakdown?.email_search?.consumed || 0,
        simulation: stats.breakdown?.simulation?.consumed || 0,
        scan_charge: stats.breakdown?.scan_charge?.consumed || 0,
    }] : [];

    if (loading && !stats) {
        return <CreditLedgerSkeleton />;
    }

    const formattedPeriod = (date?.from && date?.to)
        ? `${format(date.from, 'dd MMM', { locale: fr })} - ${format(date.to, 'dd MMM yyyy', { locale: fr })}`
        : 'Période invalid';

    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500 min-h-screen bg-muted/5">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        Flux de Crédits
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Suivi de la consommation des services en temps réel.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-[260px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "dd MMM yyyy", { locale: fr })} -{" "}
                                            {format(date.to, "dd MMM yyyy", { locale: fr })}
                                        </>
                                    ) : (
                                        format(date.from, "dd MMM yyyy", { locale: fr })
                                    )
                                ) : (
                                    <span>Sélectionner une période</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                locale={fr}
                                disabled={(date) => date > new Date()}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {stats && (
                stats.total_consumed === 0 ? (
                    <EmptyCreditStats period={formattedPeriod} />
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                            <Card className="lg:col-span-1 border-primary/20 bg-primary/5 shadow-sm">
                                <CardHeader className="">
                                    <CardDescription className="text-xs font-semibold uppercase text-primary/80">Total Consommé</CardDescription>
                                    <CardTitle className="text-3xl font-bold tracking-tight text-primary tabular-nums mt-1">
                                        {stats.total_consumed.toLocaleString()}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 text-primary/70 text-xs font-semibold">
                                        <span>Période: {formattedPeriod}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <StatCard
                                title="Détection AI"
                                value={stats.breakdown?.detection?.consumed ?? 0}
                                subValue={`${stats.breakdown?.detection?.operations ?? 0} détections`}
                                icon={Zap}
                                colorClass={{ bg: 'bg-sky-500', text: 'text-sky-600' }}
                            />

                            <StatCard
                                title="Scan E-mails"
                                value={stats.breakdown?.email_search?.consumed ?? 0}
                                subValue={`${stats.breakdown?.email_search?.operations ?? 0} emails`}
                                icon={Search}
                                colorClass={{ bg: 'bg-amber-500', text: 'text-amber-600' }}
                            />

                            <StatCard
                                title="Simulations"
                                value={stats.breakdown?.simulation?.consumed ?? 0}
                                subValue={`${stats.breakdown?.simulation?.operations ?? 0} générées`}
                                icon={Sparkles}
                                colorClass={{ bg: 'bg-emerald-500', text: 'text-emerald-600' }}
                            />

                            <StatCard
                                title="Rendus Scan"
                                value={stats.breakdown?.scan_charge?.consumed ?? 0}
                                subValue={`${stats.breakdown?.scan_charge?.operations ?? 0} scans`}
                                icon={ScanLine}
                                colorClass={{ bg: 'bg-violet-500', text: 'text-violet-600' }}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Chart Card */}
                            <Card className="lg:col-span-2 border shadow-sm flex flex-col">
                                <CardHeader>
                                    <CardTitle>Détail de la consommation</CardTitle>
                                    <CardDescription>Répartition par type de service sur la période</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 pb-0">
                                    <ChartContainer config={chartConfig} className="mx-auto max-h-[350px] w-full">
                                        <BarChart accessibilityLayer data={chartData}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                tickLine={false}
                                                tickMargin={10}
                                                axisLine={false}
                                                tickFormatter={(value) => value.length > 15 ? `${value.slice(0, 15)}...` : value}
                                            />
                                            <ChartTooltip
                                                cursor={false}
                                                content={<ChartTooltipContent hideLabel />}
                                            />
                                            <Bar dataKey="value" radius={8}>
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                                <CardFooter className="flex-col items-start gap-2 text-sm">
                                    <div className="flex gap-2 leading-none font-medium">
                                        Total: {stats?.total_consumed} crédits <TrendingUp className="h-4 w-4" />
                                    </div>
                                    <div className="text-muted-foreground leading-none">
                                        Affichage des données sur la période sélectionnée
                                    </div>
                                </CardFooter>
                            </Card>

                            {/* Circular Breakdown */}
                            <div className="flex flex-col gap-6">
                                <Card className="flex flex-col border shadow-sm flex-1">
                                    <CardHeader className="items-center pb-0">
                                        <CardTitle className="text-lg font-semibold text-foreground">Répartition</CardTitle>
                                        <CardDescription>Consommation par service</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 pb-0">
                                        <ChartContainer
                                            config={chartConfig}
                                            className="mx-auto aspect-square max-h-[250px]"
                                        >
                                            <RadialBarChart
                                                data={radialChartData}
                                                endAngle={180}
                                                innerRadius={80}
                                                outerRadius={130}
                                            >
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={<ChartTooltipContent hideLabel />}
                                                />
                                                <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                                                    <Label
                                                        content={({ viewBox }) => {
                                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                                return (
                                                                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                                                                        <tspan
                                                                            x={viewBox.cx}
                                                                            y={(viewBox.cy || 0) - 16}
                                                                            className="fill-foreground text-2xl font-bold"
                                                                        >
                                                                            {stats.total_consumed.toLocaleString()}
                                                                        </tspan>
                                                                        <tspan
                                                                            x={viewBox.cx}
                                                                            y={(viewBox.cy || 0) + 4}
                                                                            className="fill-muted-foreground"
                                                                        >
                                                                            Crédits
                                                                        </tspan>
                                                                    </text>
                                                                )
                                                            }
                                                        }}
                                                    />
                                                </PolarRadiusAxis>
                                                <RadialBar
                                                    dataKey="detection"
                                                    stackId="a"
                                                    cornerRadius={5}
                                                    fill={chartConfig.detection.color}
                                                    className="stroke-transparent stroke-2"
                                                />
                                                <RadialBar
                                                    dataKey="email_search"
                                                    fill={chartConfig.email_search.color}
                                                    stackId="a"
                                                    cornerRadius={5}
                                                    className="stroke-transparent stroke-2"
                                                />
                                                <RadialBar
                                                    dataKey="simulation"
                                                    fill={chartConfig.simulation.color}
                                                    stackId="a"
                                                    cornerRadius={5}
                                                    className="stroke-transparent stroke-2"
                                                />
                                                <RadialBar
                                                    dataKey="scan_charge"
                                                    fill={chartConfig.scan_charge.color}
                                                    stackId="a"
                                                    cornerRadius={5}
                                                    className="stroke-transparent stroke-2"
                                                />
                                            </RadialBarChart>
                                        </ChartContainer>
                                    </CardContent>
                                    <CardFooter className="flex-col gap-2 text-sm">
                                        <div className="flex items-center gap-2 font-medium leading-none">
                                            Répartition totale <TrendingUp className="h-4 w-4" />
                                        </div>
                                        <div className="leading-none text-muted-foreground">
                                            Affichage de la distribution des crédits
                                        </div>
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>
                    </>
                )
            )}
        </div>
    );
};

export default CreditLedger;