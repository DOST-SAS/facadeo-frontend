import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscriptionSuccess() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Here you would typically verify the session with your backend
        // For now, we'll just simulate a verification delay
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, [sessionId]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <h2 className="text-xl font-semibold">Confirmation de votre paiement...</h2>
                    <p className="text-muted-foreground text-sm">Veuillez patienter quelques instants.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-card md:bg-background p-4">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-size-[40px_40px]" />
                <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full bg-accent/10 blur-[80px]" />
            </div>

            <Card className="w-full max-w-md p-0 relative border-none shadow-2xl bg-card rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
                <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
                <CardHeader className="pt-10 pb-6 flex">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle2 className="h-12 w-12 text-primary" />
                    </div>
                 <div className="text-left">
                 <CardTitle className="text-2xl font-bold text-foreground">Paiement Réussi !</CardTitle>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Merci pour votre confiance. Votre compte a été mis à jour avec succès.
                    </p>
                 </div>
                </CardHeader>
                <CardContent className="space-y-6 pb-8">
                    <div className="rounded-xl bg-muted/50 p-4 border border-border/50">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Statut</span>
                            <span className="font-medium text-primary">Activé</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Référence</span>
                            <span className="font-mono text-[10px] text-muted-foreground truncate ml-4 max-w-[200px]">
                                {sessionId}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm font-medium text-foreground/80">Qu'est-ce qui change ?</p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                Accès immédiat à toutes vos fonctionnalités premium.
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                Vos crédits mensuels ont été ajoutés.
                            </li>
                        </ul>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pb-8 px-6">
                    <Button asChild className="w-full rounded-xl h-11 font-bold shadow-lg shadow-primary/20">
                        <Link to="/artisan">
                            Aller au tableau de bord
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button variant="secondary" asChild className="w-full rounded-xl border hover:bg-secondary/80 hover:text-primary hover:border-primary/40">
                        <Link to="/scans">Voir mes scans</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
