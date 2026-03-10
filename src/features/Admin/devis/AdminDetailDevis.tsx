import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Building2, Calendar, CheckCircle2, Download, FileText, Mail, Phone, Send, Sparkles, User, Printer, Trash2, Edit, MessageCircle, Loader2 } from "lucide-react"
import { downloadPdf } from "@/utils/downloadpdf"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn, statusBadgeConfig } from "@/lib/utils"
import type { Devis } from "@/types/devisTypes"
import { useEffect, useState } from "react"
import { DevisServiceInstance } from "@/services/admin/devisServices"
import { LeadServiceInstance } from "@/services/artisan/leadsServices"
import { FacadesServiceInstance } from "@/services/admin/facadesSevices"
import { toast } from "react-hot-toast"
import { generateDevisPdf } from "@/utils/generateDevisPdf"
import { uploadDocument } from "@/utils/UploadAvatars"
import {  getBusinessTypeLabel } from "@/utils/quoteNumberGenerator"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DeleteModal } from "@/components/DeleteModel"
import { Skeleton } from "@/components/ui/skeleton"

// Interface for Devis with joined Profile info
interface DevisWithProfile extends Devis {
    profile?: {
        id: string;
        display_name: string;
        company_name: string;
        email: string;
        phone: string;
        metier_id?: string;
        logo_url?: string;
        avatar?: string;
        signature_url?: string;
        adresse?: string;
        is_entreprise?: boolean;
    }
}

const AdminDetailDevis = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [devis, setDevis] = useState<DevisWithProfile | null>(null)
    const [loading, setLoading] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [targetStatus, setTargetStatus] = useState<Devis['status'] | null>(null)
    const [isDownloading, setIsDownloading] = useState(false)
    const [facade, setFacade] = useState<any>(null)


    useEffect(() => {
        console.log(devis)
    }, [devis])


    useEffect(() => {
        const fetchDevis = async () => {
            if (!id) return
            try {
                setLoading(true)
                const response = await DevisServiceInstance.getDevisById(String(id))
                const devisData = response.data as DevisWithProfile
                setDevis(devisData)

                // Fetch facade data if facade_id exists in metadata
                const facadeId = devisData?.metadata?.facade_id || (devisData as any)?.items?.[0]?.facade_id
                if (facadeId) {
                    try {
                        const facadeData = await FacadesServiceInstance.getFacadeById(facadeId)
                        setFacade(facadeData)
                    } catch (error) {
                        console.error("Error fetching facade:", error)
                    }
                }
            } catch (error) {
                console.error("Error fetching devis:", error)
                toast.error("Erreur lors du chargement du devis")
            } finally {
                setLoading(false)
                
            }
        }
        fetchDevis()
    }, [id])

    const devisDetails = devis ? {
        ...devis,
        projectName: (devis as any).projectName || "Projet Façade",
        phone: devis.client_phone || "",
        prestations: (devis as any).quote_items || [],
        includeBeforeAfter: (devis.metadata as any)?.includeBeforeAfter || false,
        hasBeforeImage: !!facade?.streetview_url,
        hasAfterImage: !!(facade?.scan_facades?.[0]?.simulated_facade_image || facade?.simulation_url)
    } : null

    const statusConfig = devis ? (statusBadgeConfig[devis.status as keyof typeof statusBadgeConfig] || statusBadgeConfig.draft) : statusBadgeConfig.draft
    const StatusIcon = statusConfig.icon

    const handleDeleteClick = () => {
        setDeleteModalOpen(true)
    }

    const confirmDelete = async () => {
        if (!devis) return
        try {
            setDeleteLoading(true)

            toast.success("Devis supprimé")
            navigate("/admin/devis")
        } catch (error) {
            console.error(error)
            toast.error("Erreur lors de la suppression")
        } finally {
            setDeleteLoading(false)
            setDeleteModalOpen(false)
        }
    }

    const getEmailTemplateByStatus = (_currentStatus: Devis['status'], newStatus: Devis['status']): string => {
        // When devis is viewed
        if (newStatus === 'viewed') {
            return 'quote_viewed';
        }
        // When devis is accepted
        if (newStatus === 'accepted') {
            return 'quote_accepted';
        }

        // Default to quote_sent for all sent status transitions
        return 'quote_sent';
    };


    const handleConfirmWhatsapp = async () => {
        if (!devis || !targetStatus) return
        try {
            setLoading(true)
            await LeadServiceInstance.SendDevisByWhatsapp(devis, targetStatus)
            setDevis({ ...devis, status: targetStatus })
            toast.success(`Statut mis à jour (${targetStatus}) et WhatsApp ouvert (Simulation)`)
        } catch (error) {
            console.error(error)
            toast.error("Erreur lors de l'envoi WhatsApp")
        } finally {
            setWhatsappModalOpen(false)
            setTargetStatus(null)
            setLoading(false)
        }
    }

    const handleDownloadPdf = async () => {
        if (!devis) return
        await downloadPdf(devis.pdf_url, `devis_${devis.quote_number || 'brouillon'}.pdf`, setIsDownloading)
    }

    if (loading || !devis) {
        return (
            <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
                <div className="max-w-7xl mx-auto px-4 py-8 md:px-8 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-48 rounded" />
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-xl" />
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-8 w-40 rounded" />
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </div>
                                    <Skeleton className="h-4 w-32 rounded" />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-11 w-28 rounded-2xl" />
                            <Skeleton className="h-11 w-40 rounded-2xl" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <Card className="rounded-3xl border-0 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                                <CardHeader className="px-8 pt-8 pb-4">
                                    <Skeleton className="h-7 w-48 rounded" />
                                </CardHeader>
                                <CardContent className="px-8 pb-8 space-y-6">
                                    {[1, 2, 3].map((i) => <div key={i} className="flex justify-between py-4 border-b border-slate-50 last:border-0">
                                        <Skeleton className="h-5 w-40" />
                                        <Skeleton className="h-5 w-20" />
                                    </div>)}
                                </CardContent>
                            </Card>
                        </div>
                        <div className="space-y-8">
                            <Card className="rounded-3xl border-0 shadow-lg bg-white dark:bg-slate-900 p-8 space-y-6">
                                <Skeleton className="h-32 w-full" />
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 py-8 md:px-8 space-y-8">
                {/* Navigation & Actions */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <Breadcrumb>
                            <BreadcrumbList className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin" className="hover:text-primary">Admin</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin/devis" className="hover:text-primary dark:text-slate-400">Devis</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-slate-900 dark:text-slate-50 font-semibold">{devis?.reference}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => navigate("/admin/devis")}
                                className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800"
                            >
                                <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                                        {devis?.reference}
                                    </h1>
                                    <Badge className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border-0 shadow-sm flex items-center gap-1", statusConfig.className)}>
                                        <StatusIcon className="w-3 h-3" />
                                        {statusConfig.label}
                                    </Badge>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                    Émis le {new Date(devis?.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {devis.pdf_url && (
                            <Button
                                variant="outline"
                                onClick={handleDownloadPdf}
                                disabled={isDownloading}
                                className="h-11 px-5 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                {isDownloading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary" />
                                ) : (
                                    <Download className="h-4 w-4 text-primary" />
                                )}
                                {isDownloading ? "Téléchargement..." : "PDF"}
                            </Button>
                        )}

                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Prestations Table */}
                        <Card className="rounded-3xl p-0 border-slate-200/70 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900 transition-all duration-300">
                            <CardHeader className="px-8 pt-8 pb-4">
                                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-primary/10">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    Prestations & Services
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-0 pt-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
                                                <th className="px-8 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</th>
                                                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Qté</th>
                                                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Unité</th>
                                                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Prix unitaire</th>
                                                <th className="px-8 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Total HT</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                            {devisDetails?.prestations && devisDetails.prestations.length > 0 ? (
                                                devisDetails.prestations.map((prestation: any, i: number) => (
                                                    <tr key={prestation.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-8 py-5">
                                                            <div className="font-semibold text-slate-900 dark:text-slate-50">{prestation.description}</div>
                                                        </td>
                                                        <td className="px-4 py-5 text-center text-slate-600 dark:text-slate-400 font-medium">
                                                            {prestation.quantity}
                                                        </td>
                                                        <td className="px-4 py-5 text-right text-slate-600 dark:text-slate-400 font-medium">
                                                            {prestation.unit == 'unite' ? "unités" : prestation.unit}
                                                        </td>
                                                        <td className="px-4 py-5 text-right text-slate-600 dark:text-slate-400 font-medium">
                                                            {Number(prestation.unit_price_cents / 100 || prestation.unitPrice || 0).toFixed(2)}€
                                                        </td>
                                                        <td className="px-8 py-5 text-right font-bold text-slate-900 dark:text-slate-50">
                                                            {Number(prestation.total_cents / 100 || (prestation.quantity * prestation.unitPrice) || 0).toFixed(2)} €
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-8 py-12 text-center text-slate-400 dark:text-slate-500 italic">Aucune prestation définie</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Visuals */}
                        {devisDetails?.includeBeforeAfter && (
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-4">État Initial</p>
                                    <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shadow-sm transition-transform hover:scale-[1.01] duration-300">
                                        {devisDetails.hasBeforeImage && facade?.streetview_url ? (
                                            <img
                                                src={JSON.parse(facade.streetview_url)[0]}
                                                alt="Avant"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">Pas d'image</div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-xs font-bold uppercase tracking-widest text-primary ml-4 flex items-center gap-1.5">
                                        <Sparkles className="h-3 w-3" /> Simulation AI
                                    </p>
                                    <div className="relative aspect-video rounded-3xl overflow-hidden border border-primary/20 bg-slate-100 dark:bg-slate-800 shadow-sm transition-transform hover:scale-[1.01] duration-300">
                                        {devisDetails.hasAfterImage && (facade?.scan_facades?.[0]?.simulated_facade_image || facade?.simulation_url) ? (
                                            <img
                                                src={facade.scan_facades?.[0]?.simulated_facade_image || facade.simulation_url}
                                                alt="Après"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">Simulation indisponible</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Financials & Entities */}
                    <div className="space-y-6">
                        {/* Summary Card */}
                        <Card className="rounded-3xl border-0 p-0 shadow-lg bg-white dark:bg-slate-900 overflow-hidden transition-all duration-300">
                            <div className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Récapitulatif Financier</p>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Sous-total HT</span>
                                            <span className="text-slate-900 dark:text-slate-50 font-semibold">{(devis.subtotal_cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                                        </div>
                                        {devis.tax_rate > 0 && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500 font-medium">TVA ({(devis.tax_rate * 100).toFixed(1)}%)</span>
                                                <span className="text-slate-900 dark:text-white font-semibold">{(devis.tax_cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-bold text-slate-900 dark:text-slate-50">Total TTC</span>
                                        <span className="text-3xl font-black text-primary tracking-tighter">
                                            {(devis.total_cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Artisan Identity (Unique to Admin View) */}
                        <Card className="rounded-3xl p-0 border-slate-200/70 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden transition-all duration-300">
                            <CardHeader className="px-8 pt-8 pb-3">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Artisan</CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                        {devis.profile?.display_name?.charAt(0) || 'A'}
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-slate-900 dark:text-slate-50 leading-none">{devis.profile?.display_name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{devis.profile?.company_name}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <span>{devis.profile?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        <span>{devis.profile?.phone}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Client Identity */}
                        <Card className="rounded-3xl p-0 border-slate-200/70 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden transition-all duration-300">
                            <CardHeader className="px-8 pt-8 pb-3">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Informations Client</CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-lg transition-colors">
                                        {devisDetails?.client_name?.charAt(0) || 'C'}
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-slate-900 dark:text-slate-50 leading-none">{devisDetails?.client_name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{(devis as any).client_address?.address || devis.address}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                            <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                        </div>
                                        <p className="text-sm font-medium truncate dark:text-slate-300">{devisDetails?.client_email || 'Non renseigné'}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                            <Phone className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                        </div>
                                        <p className="text-sm font-medium tabular-nums dark:text-slate-300">{devisDetails?.phone}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Modals Simulation */}
            <AlertDialog open={whatsappModalOpen} onOpenChange={setWhatsappModalOpen}>
                <AlertDialogContent className="rounded-3xl border-0 shadow-lg max-w-sm bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="p-8">
                        <AlertDialogHeader className="items-center text-center space-y-4">
                            <MessageCircle className="h-12 w-12 text-emerald-600" />
                            <AlertDialogTitle className="text-xl font-bold">WhatsApp (Simulé)</AlertDialogTitle>
                            <AlertDialogDescription>
                                Simulation d'envoi du devis à <strong>{devis.client_name}</strong>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t">
                        <AlertDialogAction onClick={handleConfirmWhatsapp} className="w-full bg-emerald-600 hover:bg-emerald-700">OK</AlertDialogAction>
                        <AlertDialogCancel className="w-full">Annuler</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                loading={deleteLoading}
                title="Suppression"
                description="Êtes-vous sûr de vouloir supprimer ce devis ? (Simulation)"
            />
        </div>
    )
}

export default AdminDetailDevis