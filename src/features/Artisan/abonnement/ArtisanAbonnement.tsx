
import { Card, CardContent } from "@/components/ui/card"

import { Check, Wallet, Plus, Coins } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useMemo, useState } from "react"
import { ScanSearch } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "react-router-dom"

import { TableSkeleton } from "@/components/TableSkeleton"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import type { Plan, Transaction, CreditPack, Subscription } from "../../../types/PlansTypes"
import { TRANSACTION_TYPE_LABELS, TransactionType } from "../../../types/PlansTypes"
import { AbonnementServiceInstance } from "../../../services/artisan/Abonemmentsservices"
import stripeServices from "@/services/stripeServices"
import { useAuth } from "@/context/AuthContext"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-hot-toast"

const plantypes = {
    "free": "gratuit",
    "starter": "débutant",
    "professional": "professionnel",
    "enterprise": "entreprise",
}


export function ArtisanAbonnement() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [loadingPack, setLoadingPack] = useState(false)
    const [processingPlanId, setProcessingPlanId] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [totalTransactions, setTotalTransactions] = useState(0)
    const [abonnements, setAbonnements] = useState<Plan[]>([])
    const [creditPacks, setCreditPacks] = useState<CreditPack[]>([])
    const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
    const totalPages = Math.ceil(totalTransactions / pageSize)
    const [period, setPeriod] = useState("30days")

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) return
            try {
                setLoading(true)
                const [plansRes, packsRes, subRes] = await Promise.all([
                    AbonnementServiceInstance.getAbonnement(),
                    AbonnementServiceInstance.getCreditPacks(),
                    AbonnementServiceInstance.getCurrentSubscription(user.id)
                ])

                if (plansRes.data) {
                    const sortedPlans = [...plansRes.data].sort((a, b) => {
                        const typeA = a.type?.toLowerCase();
                        const typeB = b.type?.toLowerCase();
                        if (typeA === 'free') return -1;
                        if (typeB === 'free') return 1;
                        return 0;
                    });
                    setAbonnements(sortedPlans)
                }

                if (packsRes.data) {
                    setCreditPacks(packsRes.data)
                }

                if (subRes.data) {
                    setCurrentSubscription(subRes.data)
                }
            } catch (error) {
                console.error("Error fetching data:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [user?.id])

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!user?.id) return
            try {
                const { data, count } = await AbonnementServiceInstance.getCreditLedger(user.id, page, pageSize, period)
                if (data) {
                    // Map backend data to Transaction type expected by columns
                    const mappedData = data.map((item: Record<string, unknown>) => ({
                        id: item.id as string,
                        type: item.type as TransactionType | undefined,
                        metadata: item.metadata as { note?: string } | undefined,
                        date: new Date(item.created_at as string).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        amount: (item.amount as number) > 0 ? `+${item.amount}` : `${item.amount}`
                    }))
                    setTransactions(mappedData)
                    if (count) setTotalTransactions(count)
                }
            } catch (error) {
                console.error("Error fetching transactions:", error)
            }
        }
        fetchTransactions()
    }, [user?.id, page, pageSize, period])


    const columns = useMemo<ColumnDef<Transaction>[]>(
        () => [
            {
                id: "index",
                header: "N°",
                cell: ({ row }) => (
                    <div className="text-sm font-semibold text-foreground/80">
                        {row.index + 1}
                    </div>
                )
            },
            {
                accessorKey: "date",
                header: "Date",
                cell: ({ row }) => (
                    <span className="font-semibold text-sm text-foreground/80 truncate block max-w-[170px]">{row.original.date}</span>
                ),
            },
            {
                accessorKey: "description",
                header: "Description",
                cell: ({ row }) => {
                    const typeLabel = row.original.type
                        ? TRANSACTION_TYPE_LABELS[row.original.type]
                        : row.original.metadata?.note || 'Transaction';

                    return (
                        <span className="font-semibold text-sm text-foreground/80 truncate block max-w-[240px]">
                            {typeLabel}
                        </span>
                    );
                },
            },
            {
                accessorKey: "amount",
                header: "Montant",
                cell: ({ row }) => (
                    <div className="flex justify-center">
                        {Number(row.original.amount) > 0 ? (
                            <span className="font-semibold text-sm text-emerald-500">
                                {row.original.amount}
                            </span>
                        ) : (
                            <span className="font-semibold text-sm text-red-500">
                                {row.original.amount}
                            </span>
                        )}
                    </div>
                ),
            }
        ],
        []
    )


    const [processingSubscriptionId, setProcessingSubscriptionId] = useState<string | null>(null)

    // ... inside component ...

    const handleSubscription = async (plan: Plan) => {
        if (processingSubscriptionId || !plan.stripe_price_id) {
            return;
        }

        try {
            setProcessingSubscriptionId(plan.id);
            const response = await stripeServices.CreateCheckoutSession_subscription({
                profileId: user?.id || '',
                type: 'subscription',
                priceId: plan.stripe_price_id,
                plan_id: plan.id,
            });

            // Narrow the type to access url
            const data = response.data;
            if (data && !Array.isArray(data) && 'url' in data) {
                window.location.href = data.url;
            } else {
                throw new Error("No URL returned from checkout session creation");
            }
        } catch (error) {
            console.error("Error creating checkout session:", error);
        } finally {
            setProcessingSubscriptionId(null);
        }
    };

    const handlePurchasePack = async (pack: CreditPack) => {
        if (loadingPack) {
            return;
        }

        // Logic: Cannot buy a pack if no active paid subscription
        const hasActiveSub = currentSubscription
            && currentSubscription.plans?.type !== 'free'
            && currentSubscription.status === 'active';
        if (!hasActiveSub) {
            toast.error("Vous devez avoir un abonnement actif pour acheter des packs de crédits.");
            return;
        }

        try {
            setLoadingPack(true);
            setProcessingPlanId(pack.id);
            const response = await stripeServices.CreateCheckoutSession_one_time({
                profileId: user?.id || '',
                type: 'payment',
                amount: pack.price_cents,
                packId: pack.id,
            });

            const data = response.data;
            if (data && !Array.isArray(data) && 'url' in data) {
                window.location.href = data.url;
            } else {
                throw new Error("No URL returned from checkout session creation");
            }
        } catch (error) {
            console.error("Error creating pack checkout session:", error);
        } finally {
            setLoadingPack(false);
            setProcessingPlanId(null);
        }
    }


    return (
        <div className="relative min-h-screen bg-card md:bg-background overflow-hidden">
            <div className="absolute inset-0 pointer-events-none h-full">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
            </div>
            <div className="relative mx-auto   px-4 md:px-6 py-4 md:py-8 rounded-sm space-y-3">
                {/* Current Credits Card */}
                <Card className="border-none rounded-sm p-3 shadow-sm">
                    <CardContent className="flex items-center gap-6">
                        <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center border shadow-sm">
                            <Wallet className="h-6 w-6 text-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground/80">
                                Solde de crédits actuel
                            </p>
                            <p className="text-4xl font-bold text-foreground">
                                {user?.credit_balance}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Plans Section */}
                <div className="space-y-6 bg-card p-6 rounded-sm">
                    <h2 className="text-xl font-bold text-foreground/80">
                        Plans d'abonnement
                    </h2>
                    <div className="grid  grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {abonnements.map((plan) => {
                            const isFree = plan.type?.toLowerCase() === 'free';
                            // Check if this plan is the current active subscription
                            const isCurrentlySubscribed = currentSubscription?.plans?.id === plan.id
                                && currentSubscription?.status === 'active'
                                || (!currentSubscription && isFree);

                            return (
                                <Card
                                    key={plan.id}
                                    className={cn(
                                        "relative p-2! overflow-visible transition-all hover:shadow-md border",
                                        isFree
                                            ? "border-muted bg-muted/5 shadow-sm"
                                            : "border-primary/50 shadow-lg scale-105 z-10"
                                    )}
                                >

                                    <CardContent className="p-2 flex flex-col h-full">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-lg border bg-background",
                                                    isFree ? "text-muted-foreground" : "text-primary"
                                                )}>
                                                    <Coins className="h-4 w-4" />
                                                </div>
                                                <div className={cn(
                                                    "font-bold text-base leading-tight uppercase",
                                                    isFree ? "text-foreground/60" : "text-foreground"
                                                )}>
                                                    {plan.name}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-bold text-foreground">
                                                    {(plan.price_cents / 100).toFixed(0)}€
                                                </span>
                                                <span className="text-muted-foreground text-sm font-medium">
                                                    /{plan.type === 'free' ? '7 jours' : 'mois'}
                                                </span>
                                            </div>
                                        </div>

                                        <ul className="space-y-2 mb-6 flex-1">
                                            <li className={cn(
                                                "flex items-center gap-2 text-sm p-2 rounded-lg mb-3 border",
                                                isFree
                                                    ? "bg-muted/50 border-border/50 text-muted-foreground"
                                                    : "bg-primary/5 border-primary/20 text-foreground"
                                            )}>
                                                <div className={cn(
                                                    "p-1 rounded-md shrink-0",
                                                    isFree ? "bg-muted" : "bg-primary/10"
                                                )}>
                                                    <Coins className={cn(
                                                        "h-3.5 w-3.5",
                                                        isFree ? "text-muted-foreground" : "text-primary"
                                                    )} />
                                                </div>
                                                <span className="flex-1 font-medium">Crédits</span>
                                                <span className={cn(
                                                    "font-bold px-2 py-0.5 rounded-md text-xs",
                                                    isFree
                                                        ? "bg-muted text-muted-foreground"
                                                        : "bg-primary text-primary-foreground"
                                                )}>
                                                    +{plan.monthly_credit}
                                                </span>
                                            </li>
                                            {plan.features?.map((feature, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-sm text-foreground/70">
                                                    <Check className={cn(
                                                        "h-3.5 w-3.5 shrink-0",
                                                        isFree ? "text-muted-foreground" : "text-primary"
                                                    )} />
                                                    <span className="flex-1">{feature.label}</span>
                                                    <span className="font-semibold">{feature.value}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <Button
                                            className={cn(
                                                "w-full h-10 font-bold rounded-xl transition-all",
                                                isCurrentlySubscribed
                                                    ? "bg-muted text-muted-foreground cursor-default"
                                                    : isFree
                                                        ? "bg-secondary text-secondary-foreground/60 hover:bg-secondary/80"
                                                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                                            )}
                                            disabled={isCurrentlySubscribed || (!!processingSubscriptionId && processingSubscriptionId === plan.id)}
                                            onClick={() => handleSubscription(plan)}
                                        >
                                            {processingSubscriptionId === plan.id ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <span>Chargement...</span>
                                                </div>
                                            ) : (
                                                <span>
                                                    {isCurrentlySubscribed ? "Plan actuel" : "Choisir ce plan"}
                                                </span>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>

                {/* Credit Packs Section */}
                {currentSubscription && currentSubscription.plans?.type !== 'free' && currentSubscription.status === 'active' && (
                    <div className="space-y-6 bg-card p-6 rounded-sm">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-foreground/80">
                                Acheter des packs de crédits
                            </h2>
                            <Badge variant="secondary" className="gap-1.5 px-3 py-1 bg-primary/5 text-primary border-primary/10">
                                <Plus className="h-3.5 w-3.5" />
                                Crédits valables à vie
                            </Badge>
                        </div>
                        <div className="grid max-w-[95%] mx-auto grid-cols-1 md:grid-cols-3 gap-4 items-center justify-center">
                            {creditPacks.map((pack) => (
                                <Card key={pack.id} className="p-4 border hover:border-primary/50 transition-all hover:shadow-md">
                                    <CardContent className="p-0 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                <Wallet className="h-4 w-4" />
                                            </div>
                                            <span className="text-lg font-bold">{(pack.price_cents / 100).toFixed(0)}€</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base">{pack.name}</h3>
                                            <p className="text-2xl font-black text-primary">+{pack.credit_amount} <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Credits</span></p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full font-bold border-primary text-primary hover:bg-primary hover:text-white transition-all rounded-xl"
                                            disabled={loadingPack && processingPlanId === pack.id}
                                            onClick={() => handlePurchasePack(pack)}
                                        >
                                            {loadingPack && processingPlanId === pack.id ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                                    <span>Chargement...</span>
                                                </div>
                                            ) : (
                                                "Acheter"
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Transaction History */}
                <section className='space-y-2'>
                    <div className="space-y-6 bg-card p-3 pb-6 -mb-2 rounded-t-sm ">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-xl font-bold text-foreground">
                                Historique des mouvements de crédits
                            </h2>
                            <div className="flex items-center gap-3">
                                <Select value={period} onValueChange={(val) => {
                                    setPeriod(val)
                                    setPage(1)
                                }}>
                                    <SelectTrigger className="w-[200px] h-9!">
                                        <SelectValue placeholder="Période" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="30days">30 derniers jours</SelectItem>
                                        <SelectItem value="90days">3 derniers mois</SelectItem>
                                        <SelectItem value="year">Cette année</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                    </div>
                    {loading ? (
                        <TableSkeleton />
                    ) : transactions.length === 0 ? (
                        <Empty className="bg-card shadow-sm border">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <ScanSearch />
                                </EmptyMedia>
                                <EmptyTitle>Abonnement</EmptyTitle>
                                <EmptyDescription>
                                    Veuillez choisir un abonnement pour commencer.
                                </EmptyDescription>
                            </EmptyHeader>

                            <EmptyContent>
                                <Link to="/abonnement">
                                    <Button>
                                        <Plus className="h-4 w-4" />
                                        Choisir un abonnement
                                    </Button>
                                </Link>
                            </EmptyContent>

                        </Empty>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={transactions}
                            manualPagination={true}
                            pageIndex={page - 1}
                            pageCount={totalPages}
                            onPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
                            pageSize={pageSize}
                        />
                    )}
                </section>
            </div>
        </div>
    )
}
