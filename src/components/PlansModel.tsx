import { Button } from "@/components/ui/button"
import { AbonnementServiceInstance } from "@/services/artisan/Abonemmentsservices"
import type { Plan } from "@/types/PlansTypes"
import { useEffect, useState } from "react"
import { Check, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import stripeServices from "@/services/stripeServices"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-hot-toast"
import { Coins } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Link } from "react-router-dom"

interface PlansModelProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: React.ReactNode
}

export function PlansModel({ open, onOpenChange, trigger }: PlansModelProps) {
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(false)
    const [processingPlanId, setProcessingPlanId] = useState<string | null>(null)
    const [currentSubscription, setCurrentSubscription] = useState<any>(null)
    const { user } = useAuth()

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) return
            try {
                setLoading(true)
                const [plansRes, subRes] = await Promise.all([
                    AbonnementServiceInstance.getAbonnement(),
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
                    setPlans(sortedPlans)
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

    const handleSubscription = async (plan: Plan) => {
        if (processingPlanId || !plan.stripe_price_id) {
            return;
        }

        try {
            setProcessingPlanId(plan.id);
            const response = await stripeServices.CreateCheckoutSession_subscription({
                profileId: user?.id || '',
                type: 'subscription',
                priceId: plan.stripe_price_id,
                plan_id: plan.id,
            });

            const data = response.data;
            if (data && !Array.isArray(data) && 'url' in data) {
                window.location.href = data.url;
            } else {
                throw new Error("No URL returned from checkout session creation");
            }
        } catch (error) {
            console.error("Error creating checkout session:", error);
            toast.error("Une erreur est survenue lors de la création de la session de paiement.");
        } finally {
            setProcessingPlanId(null);
        }
    };

    const defaultPlan = plans[0]?.id

    // Controlled vs Uncontrolled logic
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = open !== undefined
    const isOpen = isControlled ? open : internalOpen
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="max-w-7xl! w-[80vw] shadow-2xl border-border/50 gap-0 p-0 overflow-hidden sm:rounded-xl">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="text-xl font-bold">Explorer nos offres</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        CHOISISSEZ LE PLAN QUI CORRESPOND À VOS BESOINS ET PROFITEZ DE TOUTES LES FONCTIONNALITÉS DE FAÇADEO.
                    </p>
                </DialogHeader>

                <ScrollArea className="max-h-[85vh] px-6 pb-4">
                    <div className="px-2 py-4">
                        {loading && plans.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 gap-3">
                                <span className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                <p className="text-sm text-muted-foreground">Chargement des offres...</p>
                            </div>
                        ) : plans.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                                {plans.map((plan) => {
                                    const isFree = plan.type?.toLowerCase() === 'free';
                                    const isCurrentlySubscribed = currentSubscription?.plans?.id === plan.id
                                        && currentSubscription?.status === 'active'
                                        || (!currentSubscription && isFree);

                                    return (
                                        <Card
                                            key={plan.id}
                                            className={cn(
                                                "relative p-0 overflow-visible transition-all hover:shadow-md border flex flex-col",
                                                isFree
                                                    ? "border-muted bg-muted/5 shadow-sm"
                                                    : "border-primary/50 shadow-lg z-10 scale-[1.02] lg:scale-105"
                                            )}
                                        >
                                            {plan.type === 'professional' && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap z-50">
                                                    Recommandé
                                                </div>
                                            )}

                                            <CardContent className="p-4 flex flex-col h-full">
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
                                                        "flex items-center gap-2 text-xs p-2 rounded-lg mb-3 border",
                                                        isFree
                                                            ? "bg-muted/50 border-border/50 text-muted-foreground"
                                                            : "bg-primary/5 border-primary/20 text-foreground"
                                                    )}>
                                                        <div className={cn(
                                                            "p-1 rounded-md shrink-0",
                                                            isFree ? "bg-muted" : "bg-primary/10"
                                                        )}>
                                                            <Coins className={cn(
                                                                "h-3 w-3",
                                                                isFree ? "text-muted-foreground" : "text-primary"
                                                            )} />
                                                        </div>
                                                        <span className="flex-1 font-medium">Crédits</span>
                                                        <span className={cn(
                                                            "font-bold px-1.5 py-0.5 rounded-md text-[10px]",
                                                            isFree
                                                                ? "bg-muted text-muted-foreground"
                                                                : "bg-primary text-primary-foreground"
                                                        )}>
                                                            +{plan.monthly_credit}
                                                        </span>
                                                    </li>
                                                    {plan.features?.map((feature, idx) => (
                                                        <li key={idx} className="flex items-center gap-2 text-xs text-foreground/70">
                                                            <Check className={cn(
                                                                "h-3 w-3 shrink-0",
                                                                isFree ? "text-muted-foreground" : "text-primary"
                                                            )} />
                                                            <span className="flex-1 truncate">{feature.label}</span>
                                                            <span className="font-semibold">{feature.value}</span>
                                                        </li>
                                                    ))}
                                                </ul>

                                                <Button
                                                    className={cn(
                                                        "w-full h-9 text-sm font-bold rounded-xl transition-all mt-auto",
                                                        isCurrentlySubscribed
                                                            ? "bg-muted text-muted-foreground cursor-default"
                                                            : isFree
                                                                ? "bg-secondary text-secondary-foreground/60 hover:bg-secondary/80"
                                                                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                                                    )}
                                                    disabled={isCurrentlySubscribed || (!!processingPlanId && processingPlanId === plan.id)}
                                                    onClick={() => handleSubscription(plan)}
                                                >
                                                    {processingPlanId === plan.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            <span>Chargement...</span>
                                                        </div>
                                                    ) : (
                                                        <span>
                                                            {isCurrentlySubscribed ? "Actuel" : isFree ? "Essai" : "Choisir"}
                                                        </span>
                                                    )}
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground text-sm">
                                Aucun plan disponible pour le moment.
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="border-t p-4 bg-muted/20 sm:justify-center">
                    <p className="text-xs text-muted-foreground text-center w-full flex items-center justify-center gap-1">
                        Comparez toutes les options sur notre <span className="underline underline-offset-2 cursor-pointer hover:text-foreground flex items-center gap-0.5"><Link to='/abonnement' onClick={() => setIsOpen(false)} >page d'abonnements <ExternalLink className="h-3 w-3 inline" /></Link></span>.
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
