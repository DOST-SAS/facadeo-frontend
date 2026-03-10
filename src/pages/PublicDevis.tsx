import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Devis } from '@/types/devisTypes';
import { PublicDevisServiceInstance } from '@/services/publicdevis';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    Download,
    Mail,
    Phone,
    Building2,
    Calendar,
    ArrowRight,
    MapPin,
    ShieldCheck,
    CheckCircle2,
    Printer,
    Sparkles,
    Eye,
    User
} from "lucide-react";
import AOS from 'aos';
import 'aos/dist/aos.css';
import { generateDevisPdf } from "@/utils/generateDevisPdf";
import { toast } from 'react-hot-toast';
import { statusBadgeConfig, cn } from "@/lib/utils";

const PublicDevis = () => {
    const { id } = useParams();
    const [devis, setDevis] = useState<Devis | null>(null);
    const [quoteItems, setQuoteItems] = useState<any[]>([]);
    const [artisan, setArtisan] = useState<any>(null);
    const [facades, setFacades] = useState<any>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    useEffect(() => {
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 50
        });
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            console.log('id : ', id)
            try {
                setLoading(true);
                const devisData = await PublicDevisServiceInstance.getDevis(id);

                if (!devisData) {
                    setError("Devis introuvable.");
                    return;
                }
                setDevis(devisData.quote);
                setQuoteItems(devisData.quote_items || []);
                setFacades(devisData.facades || []);
                const artisanData: any = devisData.quote.artisan || {};
                const metiersData = devisData.metiers || [];
                setArtisan({ ...artisanData, metiers: metiersData });
            } catch (err: any) {
                console.error("Error fetching public devis:", err);
                setError("Impossible de charger le devis.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleDownload = async () => {
        if (!devis) return;
        try {
            if (devis.pdf_url) {
                // Try to download instead of just opening in tab if possible
                const link = document.createElement('a');
                link.href = devis.pdf_url;
                link.download = `Devis_${devis.quote_number}.pdf`;
                link.target = "_blank";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                toast.loading("Génération du PDF...");
                const devisData = {
                    ref: devis.quote_number || 'DEVIS',
                    client: devis.client_name || 'Client',
                    clientAddress: devis.client_address?.address || devis.address,
                    clientEmail: devis.client_email,
                    clientPhone: devis.client_phone,
                    date: new Date(devis.created_at || Date.now()).toLocaleDateString('fr-FR'),
                    validUntil: devis.valid_until,
                    items: quoteItems.map((p: any) => ({
                        label: p.description,
                        quantity: Number(p.quantity),
                        price: Number(p.unit_price_cents) / 100,
                        unit: p.unit
                    })),
                    subtotal: (devis.subtotal_cents || 0) / 100,
                    tvaRate: devis.tax_rate ? devis.tax_rate * 100 : 0,
                    tvaAmount: (devis.tax_cents || 0) / 100,
                    totalTTC: (devis.total_cents || 0) / 100,
                    includeBeforeAfter: true,
                    imageBefore: facades[0]?.streetview_url ? JSON.parse(facades[0].streetview_url)[0] : null,
                    artisan: artisan
                };
                await generateDevisPdf(devisData);
                toast.dismiss();
                toast.success("PDF téléchargé !");
            }
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error("Erreur lors du téléchargement");
        }
    };

    const handleAccept = async () => {
        if (!devis || !id) return;
        try {
            setIsAccepting(true);
            await PublicDevisServiceInstance.updateDevisStatus(id, 'accepted');
            setDevis({ ...devis, status: 'accepted' });
            toast.success("Devis accepté ! Nous allons contacter l'artisan.");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de l'acceptation");
        } finally {
            setIsAccepting(false);
        }
    };

    const openInGrand = (imageUrl: string) => {
        setLightboxImage(imageUrl);
        setIsLightboxOpen(true);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-[#020617]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (error || !devis) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-[#020617] p-4">
                <Card className="max-w-md w-full p-8 text-center rounded-3xl">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Devis Introuvable</h2>
                    <p className="text-slate-500 mb-6">{error || "Ce document n'existe pas ou a été supprimé."}</p>
                    <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                        Recharger la page
                    </Button>
                </Card>
            </div>
        );
    }

    const statusConfig = statusBadgeConfig[devis.status] || statusBadgeConfig.draft;

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-[#020617] text-slate-900 dark:text-slate-50 font-sans selection:bg-primary/20">
            {/* Simple Clean Navbar */}
            <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 py-4">
                <div className="container px-4 md:px-8 mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/whiteLogo.png" alt="FAÇADEO" className="w-8 h-8" />
                        <span className="font-bold text-lg tracking-tight">FAÇADEO</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button size="sm" onClick={handleDownload} className="gap-2 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90">
                            <Download className="w-4 h-4" /> Télécharger
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container px-4 pt-28 pb-20 mx-auto max-w-7xl">
                <div className="grid lg:grid-cols-3 gap-3">

                    {/* Left Column: Content */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* 1. Header Card */}
                        <div className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-slate-200/60 dark:border-white/5 shadow-sm space-y-6" data-aos="fade-up">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="rounded-lg px-3 py-1 border-slate-200 text-slate-500 font-medium">
                                            Devis #{devis.quote_number}
                                        </Badge>
                                        <Badge className={cn("rounded-lg px-3 py-1 border-0", statusConfig.className)}>
                                            {statusConfig.label}
                                        </Badge>
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                                        Rénovation de Façade
                                    </h1>
                                    <p className="text-slate-500 text-lg">
                                        Pour {devis.client_name}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-6 pt-4 border-t border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                                    <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-lg">
                                        <Calendar className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Date d'émission</p>
                                        <p className="font-medium">{new Date(devis.created_at || '').toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                                    <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-lg">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Validité</p>
                                        <p className="font-medium">Jusqu'au {new Date(devis.valid_until || '').toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Prestations Table (Moved Up, p-0) */}
                        <Card className="rounded-3xl p-0 border-slate-200/60 dark:border-white/5 shadow-sm overflow-hidden bg-white dark:bg-white/5" data-aos="fade-up" data-aos-delay="100">
                            <CardHeader className="p-0 px-8 pt-6 pb-0 border-b border-transparent">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    Détail des Prestations
                                </CardTitle>
                            </CardHeader>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                                            <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-500">Description</th>
                                            <th className="px-4 py-5 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Qté</th>
                                            <th className="px-4 py-5 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">P.U HT</th>
                                            <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Total HT</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {quoteItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/[0.01]">
                                                <td className="px-8 py-4">
                                                    <div className="font-bold text-slate-900 dark:text-slate-200">{item.description}</div>
                                                </td>
                                                <td className="px-4 py-4 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                                                    {item.quantity} {item.unit}
                                                </td>
                                                <td className="px-4 py-4 text-right text-sm text-slate-600 dark:text-slate-400">
                                                    {(item.unit_price_cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                                                </td>
                                                <td className="px-8 py-4 text-right font-bold text-slate-900 dark:text-white">
                                                    {(item.total_cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>


                        {/* 3. Facades Section (Before/After + p-0) */}
                        {facades && devis?.metadata?.includeBeforeAfter && (
                            <Card className="rounded-3xl p-0 border-slate-200/60 dark:border-white/5 shadow-sm overflow-hidden bg-white dark:bg-white/5" data-aos="fade-up" data-aos-delay="200">
                                <CardHeader className="px-8 pt-6 pb-6">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <Building2 className="w-5 h-5 text-primary" />
                                            </div>
                                            Façade détectée
                                        </CardTitle>
                                        <Badge variant="secondary" className="font-medium bg-slate-100 text-slate-600 border-0">
                                            {facades.address?.name}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <div className="grid md:grid-cols-2 gap-px bg-slate-100 dark:bg-white/5">
                                    {/* Before Image */}
                                    <div className="relative aspect-video bg-white dark:bg-[#0A0F1E] group overflow-hidden">
                                        {facades.streetview_url ? (
                                            <img
                                                src={JSON.parse(facades.streetview_url)[0]}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                alt="Façade actuelle"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-slate-400">
                                                <Building2 className="w-12 h-12" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <Badge className="bg-black/70 backdrop-blur text-white border-0 font-bold px-3 py-1">
                                                ÉTAT INITIAL
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* After/Simulation Image */}
                                    <div className="relative aspect-video bg-white dark:bg-[#0A0F1E] group overflow-hidden">
                                        {facades.facades_sim ? (
                                            <img
                                                src={facades.facades_sim}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                alt="Simulation Après"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-slate-400">
                                                <Sparkles className="w-12 h-12 mb-2" />
                                                <span className="text-sm font-medium">Simulation non disponible</span>
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <Badge className="bg-primary/90 backdrop-blur text-white border-0 font-bold px-3 py-1 flex items-center gap-1.5">
                                                <Sparkles className="w-3 h-3" />
                                                SIMULATION PROJETÉE
                                            </Badge>
                                        </div>
                                        {(facades.facades_sim) && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="w-full gap-2 font-bold"
                                                    onClick={() => openInGrand(facades.facades_sim)}
                                                >
                                                    <Eye className="w-4 h-4" /> Voir en grand
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Summary & Artisan */}
                    <div className="space-y-6">

                        {/* Financial Summary */}
                        <Card className="rounded-[2rem] p-0 border border-slate-200/60 dark:border-white/5 shadow-2xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-white/5 overflow-hidden group" data-aos="fade-left">
                            {/* Accent Header */}
                            <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />

                            <div className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 font-semibold uppercase tracking-wider">Montant HT</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{(devis.subtotal_cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                                    </div>
                                    {devis.tax_cents > 0 && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500 font-semibold uppercase tracking-wider">TVA ({(devis.tax_rate * 100).toFixed(1)}%)</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{(devis.tax_cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                                        </div>
                                    )}

                                    <div className="pt-6 mt-6 border-t border-slate-100 dark:border-white/10">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">Total TTC</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                                                    {(devis.total_cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-xl font-bold text-slate-400">€</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {devis.status === 'ready' || devis.status === 'sent' || devis.status === 'viewed' ? (
                                    <div className="space-y-4">
                                        <Button
                                            onClick={handleAccept}
                                            disabled={isAccepting}
                                            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-base shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group/btn"
                                        >
                                            {isAccepting ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    Accepter le devis
                                                    <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                                                </>
                                            )}
                                        </Button>
                                        <p className="text-[10px] text-center text-slate-400 font-medium px-4">
                                            En acceptant ce devis, vous validez les prestations décrites et l'artisan sera notifié.
                                        </p>
                                    </div>
                                ) : devis.status === 'accepted' ? (
                                    <div className="relative overflow-hidden p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
                                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-green-500/10 rounded-full blur-2xl" />
                                        <div className="flex flex-col items-center gap-2 relative z-10">
                                            <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/30 mb-2">
                                                <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                            <span className="font-black text-green-600 dark:text-green-400 uppercase tracking-wider text-sm">Devis Accepté</span>
                                            <p className="text-xs text-green-600/70 font-medium">L'artisan a été informé de votre décision.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-center">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{statusConfig.label}</span>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Artisan Profile */}
                        <Card className="rounded-[2rem] p-0 border-slate-200/60 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-white/5 overflow-hidden group hover:shadow-2xl transition-all duration-500" data-aos="fade-left" data-aos-delay="100">
                            {/* Decorative Header Background */}
                            <div className="h-12 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative overflow-hidden">
                                <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                                <div className="absolute bottom-[-20%] left-[-10%] w-24 h-24 bg-blue-400/10 rounded-full blur-2xl" />
                            </div>

                            <CardHeader className="text-center pt-0 pb-4 -mt-12 relative z-10">
                                <div className="relative inline-block mx-auto group">
                                    <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-xl group-hover:bg-primary/30 transition-all duration-500 -z-10" />
                                    <div className="w-32 h-24 mx-auto p-0! bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-xl border border-slate-100 dark:border-white/10  flex items-center justify-center overflow-hidden ring-4 ring-white dark:ring-slate-900 transition-transform duration-500 group-hover:scale-105">
                                        {artisan?.is_entreprise ? (
                                            artisan?.logo_url ? (
                                                <img src={artisan.logo_url} className="w-full h-full object-contain" alt="Logo" />
                                            ) : (
                                                <Building2 className="w-10 h-10 text-slate-300" />
                                            )
                                        ) : (
                                            artisan?.avatar ? (
                                                <img src={artisan.avatar} className="w-full h-full object-cover rounded-xl" alt="Avatar" />
                                            ) : (
                                                <User className="w-10 h-10 text-slate-300" />
                                            )
                                        )}
                                    </div>

                                </div>

                                <div className="mt-4 space-y-1">
                                    <CardTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                                        {artisan?.is_entreprise ? (artisan?.company_name || "Entreprise") : artisan?.display_name}
                                    </CardTitle>
                                    <div className="flex items-center justify-center gap-2">
                                        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest py-0.5 px-3 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border-0 rounded-full">
                                            {artisan?.is_entreprise ? "Compagnie" : "Artisan"}
                                        </Badge>
                                    </div>
                                    {artisan?.is_entreprise && (
                                        <div className="flex flex-col items-center gap-0.5 mt-2">
                                            {artisan?.siren && <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">SIREN: {artisan.siren}</p>}
                                            {artisan?.siret && <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase text-opacity-70">SIRET: {artisan.siret}</p>}
                                        </div>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3 px-6 pb-8">
                                <div className="grid gap-2">
                                    <a
                                        href={`mailto:${artisan?.pro_email || artisan?.email}`}
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/[0.08] hover:shadow-md hover:border-primary/20 transition-all duration-300 group/link"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm border border-slate-100 dark:border-white/10 group-hover/link:scale-110 transition-transform">
                                            <Mail className="w-4.5 h-4.5" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Email</span>
                                            <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                {artisan?.pro_email || artisan?.email}
                                            </span>
                                        </div>
                                    </a>

                                    <a
                                        href={`tel:${artisan?.pro_phone || artisan?.phone}`}
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/[0.08] hover:shadow-md hover:border-primary/20 transition-all duration-300 group/link"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm border border-slate-100 dark:border-white/10 group-hover/link:scale-110 transition-transform">
                                            <Phone className="w-4.5 h-4.5" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Téléphone</span>
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                {artisan?.pro_phone || artisan?.phone}
                                            </span>
                                        </div>
                                    </a>

                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 transition-all duration-300">
                                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm border border-slate-100 dark:border-white/10">
                                            <MapPin className="w-4.5 h-4.5" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Localisation</span>
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">
                                                {artisan?.adresse || artisan?.address}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </main>

            <footer className="py-8 border-t border-slate-200 dark:border-white/5 mt-auto">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-xs text-slate-400 font-medium">
                        © {new Date().getFullYear()} FAÇADEO. Plateforme de gestion pour les professionnels de la rénovation.
                    </p>
                </div>
            </footer>

            {/* Simple Lightbox for images */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center">
                        <img
                            src={lightboxImage || ''}
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            alt="Agrandissement"
                        />
                        <Button
                            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 h-10 w-10 border-0"
                            onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
                        >
                            ✕
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicDevis;