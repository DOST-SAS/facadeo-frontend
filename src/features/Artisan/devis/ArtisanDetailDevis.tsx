import React from "react"
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
import { DevisServiceInstance } from "@/services/artisan/devisService"
import { LeadServiceInstance } from "@/services/artisan/leadsServices"
import { FacadesServiceInstance } from "@/services/admin/facadesSevices"
import { useAuth } from "@/context/AuthContext"
import { toast } from "react-hot-toast"
import { generateDevisPdf } from "@/utils/generateDevisPdf"
import { uploadDocument } from "@/utils/UploadAvatars"
import { generateArtisanQuoteNumber, getBusinessTypeLabel } from "@/utils/quoteNumberGenerator"

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
import LoaderSpin from "@/components/Loader"
import { Skeleton } from "@/components/ui/skeleton"

const ArtisanDetailDevis = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [devis, setDevis] = useState<Devis | null>(null)
    const [loading, setLoading] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [targetStatus, setTargetStatus] = useState<Devis['status'] | null>(null)
    const [isDownloading, setIsDownloading] = useState(false)
    const [facade, setFacade] = useState<any>(null)

    useEffect(() => {
        const fetchDevis = async () => {
            if (!id) return
            try {
                setLoading(true)
                const response = await DevisServiceInstance.getDevisById(String(id))
                console.log(response)
                setDevis(response.data)

                // Fetch facade data if facade_id exists in metadata
                const facadeId = response.data?.metadata?.facade_id || response.data?.items?.[0]?.facade_id
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


    // Extend devis with mock detailed data (simulating database fetch)
    // In a real app, this should come from the DB/metadata
    const devisDetails = devis ? {
        ...devis,
        projectName: "",
        phone: devis.client_phone || "",
        prestations: (devis.items || []).map((item: any, idx: number) => {
            const prestationsMetadata = (devis.metadata as any)?.prestations_data || []
            const meta = prestationsMetadata[idx] || {}
            return {
                ...item,
                metierLabel: meta.metierLabel || item.metier_label || item.metierLabel || "Divers"
            }
        }),
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
            await DevisServiceInstance.deleteDevis(devis.id)
            toast.success("Devis supprimé")
            navigate("/devis")
        } catch (error) {
            console.error(error)
            toast.error("Erreur lors de la suppression")
        } finally {
            setDeleteLoading(false)
            setDeleteModalOpen(false)
        }
    }

    // Function to automatically select template based on devis status and action
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

    const handleStatusChange = async (newStatus: Devis['status'], forceWhatsapp = false) => {
        if (!devis || !user) return

        try {
            setLoading(true)

            // Special handling for Draft -> Ready: Generate PDF & Quote Number
            if (devis.status === 'draft' && newStatus === 'ready') {
                let pdfUrl = devis.pdf_url;
                let quoteNumber = devis.quote_number;
                let reference = devis.reference;

                // 1. Generate Quote Number and Internal Reference if missing
                if (!quoteNumber) {
                    const businessType = user?.metier_id ? await getBusinessTypeLabel(user.metier_id) : "Artisan";
                    const businessName = user?.company_name || user?.display_name || "Business";
                    const result = await generateArtisanQuoteNumber(businessType, businessName, user?.id);
                    quoteNumber = result.quoteNumber;
                    reference = result.reference;
                }

                let calculatedSubtotal = 0;
                let finalTvaRate = 0;
                let tvaAmount = 0;
                let totalTTC = 0;

                try {
                    // Fetch facade data if available
                    let facadeData = null;
                    if (devis.metadata?.facade_id) {
                        facadeData = await FacadesServiceInstance.getFacadeById(devis.metadata.facade_id);
                    }

                    // Prepare PDF Data
                    calculatedSubtotal = (devis.items || []).reduce((acc: number, item: any) => acc + (Number(item.quantity) * (Number(item.unit_price_cents) / 100 || Number(item.unitPrice || item.price || 0))), 0);

                    // Determine TVA Rate: use devis rate if exists, otherwise check artisan type
                    const isAutoEntrepreneurUser = user?.is_entreprise === false;
                    finalTvaRate = devis.tax_rate !== undefined ? (devis.tax_rate * 100) : (isAutoEntrepreneurUser ? 0 : 20);

                    tvaAmount = (calculatedSubtotal * finalTvaRate) / 100;
                    totalTTC = calculatedSubtotal + tvaAmount;

                    const pdfBlob = await generateDevisPdf({
                        ref: quoteNumber,
                        artisan: {
                            name: user?.display_name || "Artisan",
                            companyName: user?.company_name || "",
                            email: user?.email || "",
                            phone: user?.phone || "",
                            address: user?.adresse || "",
                            logoUrl: user?.logo_url || user?.avatar || "",
                            signatureUrl: user?.signature_url || "",
                        },
                        client: devis.client_name || "Client",
                        clientAddress: devis.client_address?.address || "",
                        clientEmail: devis.client_email || "",
                        clientPhone: devis.client_phone || "",
                        date: new Date().toLocaleDateString('fr-FR'),
                        validUntil: devis.valid_until ? new Date(devis.valid_until).toLocaleDateString('fr-FR') : undefined,
                        items: (devis.items || []).map((p: any) => ({
                            label: p.description || p.label || "Prestation",
                            quantity: Number(p.quantity),
                            unit: p.unit || "u",
                            price: Number(p.unit_price_cents / 100 || p.unitPrice || p.price || 0)
                        })),
                        subtotal: calculatedSubtotal,
                        tvaRate: finalTvaRate,
                        tvaAmount: tvaAmount,
                        totalTTC: totalTTC,
                        includeBeforeAfter: devis.metadata?.includeBeforeAfter,
                        imageBefore: facadeData?.streetview_url ? JSON.parse(facadeData.streetview_url)[0] : "",
                        imageAfter: facadeData?.scan_facades?.[0]?.simulated_facade_image || "",
                        facadeAddress: facadeData?.formatted_address,
                        facadeScore: facadeData?.score,
                        notes: devis.metadata?.notes
                    });

                    const pdfFile = new File([pdfBlob], `${quoteNumber}.pdf`, { type: 'application/pdf' });
                    if (user?.id) {
                        const uploaded = await uploadDocument(pdfFile, user.id);
                        if (uploaded) pdfUrl = uploaded;
                    }
                } catch (err) {
                    console.error("Error generating PDF during status change:", err);
                    toast.error("Erreur lors de la génération du PDF, mais le statut sera mis à jour.");
                }

                const updates: Partial<Devis> = {
                    status: newStatus,
                    pdf_url: pdfUrl,
                    quote_number: quoteNumber,
                    reference: reference,
                    tax_rate: finalTvaRate / 100,
                    subtotal_cents: Math.round(calculatedSubtotal * 100),
                    tax_cents: Math.round(tvaAmount * 100),
                    total_cents: Math.round(totalTTC * 100)
                };
                await DevisServiceInstance.updateDevis(devis.id, updates);

                setDevis({ ...devis, ...updates });
                toast.success("Devis validé et PDF généré");
                return;
            }

            // Normallly handle other statuses
            // If client has email and status is being changed to sent, viewed, or accepted (and not forcing whatsapp)
            if (devis.client_email && (newStatus === 'sent' || newStatus === 'viewed' || newStatus === 'accepted') && !forceWhatsapp) {
                // Automatically select template based on status
                const templateName = getEmailTemplateByStatus(devis.status, newStatus);

                const payload = {
                    template_name: templateName,
                    to_email: devis.client_email,
                    profile_id: user.id,
                    from_email: user.email,
                    from_name: user.display_name,
                    variables: {
                        client_name: devis.client_name,
                        artisan_logo: user.logo_url,
                        artisan_name: user.display_name,
                        artisan_metier: devis.metadata?.metiers?.map(m => m).join(', '),
                        client_adresse: devis.client_address?.address,
                        artisan_email: user.email,
                        artisan_phone: user.phone,
                        quote_number: devis.quote_number,
                        quote_link: `${window.location.origin}/public/devis/${devis.id}`,
                        unsubscribe_link: `https://qceutznwobozxuvblyzo.supabase.co/functions/v1/unsubscribe-email?email=${devis.client_email}`
                    },
                    metadata: {
                        quote_id: devis.id,
                        pdf_url: devis.pdf_url
                    },
                    max_attempts: 3
                };

                await LeadServiceInstance.queueEmail(payload);

                // Update devis status
                const updates: Partial<Devis> = { status: newStatus };
                if (newStatus === 'sent') updates.sent_at = new Date().toISOString() as any;
                if (newStatus === 'accepted') updates.accepted_at = new Date().toISOString() as any;
                if (newStatus === 'viewed') updates.viewed_at = new Date().toISOString() as any;

                await DevisServiceInstance.updateDevis(devis.id, updates);

                setDevis({ ...devis, status: newStatus, sent_at: newStatus === 'sent' ? new Date() : devis.sent_at });
                toast.success(`L’envoi de votre email est en cours.`);

            } else if (devis.client_phone && devis.status === 'ready' && newStatus === 'sent' || forceWhatsapp) {
                // Logic for WhatsApp handling (only if status is ready)
                setTargetStatus(newStatus)
                setWhatsappModalOpen(true)
                return
            } else {
                const updates: Partial<Devis> = { status: newStatus }
                if (newStatus === 'sent') updates.sent_at = new Date().toISOString() as any
                if (newStatus === 'accepted') updates.accepted_at = new Date().toISOString() as any
                if (newStatus === 'refused') updates.refused_at = new Date().toISOString() as any
                if (newStatus === 'viewed') updates.viewed_at = new Date().toISOString() as any
                if (newStatus === 'expired') updates.expired_at = new Date().toISOString() as any

                await DevisServiceInstance.updateDevis(devis.id, updates)
                setDevis({ ...devis, status: newStatus, sent_at: newStatus === 'sent' ? new Date() : devis.sent_at })
                toast.success("Statut mis à jour")
            }
        } catch (error) {
            console.error("Error updating status:", error)
            toast.error("Erreur lors de la mise à jour du statut")
        } finally {
            setLoading(false)
        }
    }

    const handleConfirmWhatsapp = async () => {
        if (!devis || !targetStatus) return
        try {
            setLoading(true)
            const updates: Partial<Devis> = { status: targetStatus }
            if (targetStatus === "sent") updates.sent_at = new Date().toISOString() as any

            await DevisServiceInstance.updateDevis(devis.id, updates)
            await LeadServiceInstance.SendDevisByWhatsapp(devis, targetStatus)

            setDevis({ ...devis, status: targetStatus, sent_at: targetStatus === "sent" ? new Date() : devis.sent_at })
            toast.success(`Statut mis à jour (${targetStatus}) et WhatsApp ouvert`)
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
                <div className="w-full mx-auto px-4 py-8 md:px-8 space-y-8">
                    {/* Navigation & Actions Skeleton */}
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
                            <Skeleton className="h-11 w-28 rounded-2xl" />
                            <Skeleton className="h-11 w-40 rounded-2xl" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content Skeleton */}
                        <div className="lg:col-span-2 space-y-8">
                            <Card className="rounded-3xl border-slate-200/70 dark:border-slate-800 border-0 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                                <CardHeader className="px-8 pt-8 pb-4">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-9 w-9 rounded-xl" />
                                        <Skeleton className="h-7 w-48 rounded" />
                                    </div>
                                </CardHeader>
                                <CardContent className="px-8 pb-8 space-y-6">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="flex justify-between items-center py-4 border-b border-slate-50 last:border-0">
                                            <div className="space-y-2 w-1/3">
                                                <Skeleton className="h-5 w-full" />
                                                <Skeleton className="h-3 w-2/3" />
                                            </div>
                                            <Skeleton className="h-5 w-12" />
                                            <Skeleton className="h-5 w-20" />
                                            <Skeleton className="h-6 w-24" />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-24 ml-4" />
                                    <Skeleton className="aspect-video w-full rounded-3xl" />
                                </div>
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-24 ml-4" />
                                    <Skeleton className="aspect-video w-full rounded-3xl" />
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Skeleton */}
                        <div className="space-y-8">
                            <Card className="rounded-3xl border-0 shadow-lg bg-white dark:bg-slate-900 p-8 space-y-6">
                                <Skeleton className="h-4 w-32" />
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-20" />
                                    </div>
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                </div>
                                <Skeleton className="h-px w-full" />
                                <div className="flex justify-between items-end">
                                    <Skeleton className="h-5 w-20" />
                                    <Skeleton className="h-10 w-32" />
                                </div>
                            </Card>

                            <Card className="rounded-3xl border-slate-200/70 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 p-8 space-y-6">
                                <Skeleton className="h-4 w-40" />
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-2xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                </div>
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-8 w-8 rounded-xl" />
                                        <Skeleton className="h-4 w-40" />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-8 w-8 rounded-xl" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 transition-colors duration-300">
            <div className="w-full mx-auto px-4 py-8 md:px-8 space-y-8">
                {/* Navigation & Actions */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <Breadcrumb>
                            <BreadcrumbList className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/" className="hover:text-primary">Accueil</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/devis" className="hover:text-primary dark:text-slate-400">Devis</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-slate-900 dark:text-slate-50 font-semibold">{devis?.quote_number}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => navigate("/devis")}
                                className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800"
                            >
                                <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                                        {devis?.quote_number}
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
                        {devis.status === 'draft' && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="h-11 px-5 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                                    onClick={() => navigate(`/devis/edit/${devis.id}`)}
                                >
                                    <Edit className="h-4 w-4 text-primary" />
                                    Modifier
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="h-11 px-5 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-red-600 font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-100 dark:hover:border-red-900/50 transition-all shadow-sm"
                                    onClick={handleDeleteClick}
                                >
                                    <Trash2 className="h-4 w-4 " />
                                    Supprimer
                                </Button>
                                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
                            </div>
                        )}

                        {devis.status !== 'draft' && (
                            <div className="flex items-center gap-2">
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
                            </div>
                        )}

                        {(devis.status === 'draft' || devis.status === 'ready') && (
                            <>
                                {devis.status === 'draft' && (
                                    <Button
                                        variant="outline"
                                        className="h-11 px-6 rounded-2xl bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/50 text-teal-700 dark:text-teal-400 font-bold hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
                                        disabled={loading}
                                        onClick={() => handleStatusChange('ready')}
                                    >
                                        <CheckCircle2 className="h-4 w-4 " />
                                        Valider
                                    </Button>
                                )}
                                {devis.status === 'ready' && (
                                    <>
                                        {devis.client_email ? (
                                            <Button
                                                className="h-11 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-md shadow-primary/20 dark:shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                disabled={loading}
                                                onClick={() => handleStatusChange('sent')}
                                            >
                                                <Mail className="h-4 w-4 " />
                                                Envoyer par Email
                                            </Button>
                                        ) : devis.client_phone ? (
                                            <Button
                                                className="h-11 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-200/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                disabled={loading}
                                                onClick={() => handleStatusChange('sent', true)}
                                            >
                                                <MessageCircle className="h-4 w-4 " />
                                                Envoyer via WhatsApp
                                            </Button>
                                        ) : (
                                            <Button
                                                className="h-11 px-6 rounded-2xl bg-slate-200 text-slate-500 font-bold"
                                                disabled
                                            >
                                                <Send className="h-4 w-4 mr-2" />
                                                Aucun Contact
                                            </Button>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                                            {devisDetails && devisDetails.prestations.length > 0 ? (
                                                Object.entries(
                                                    devisDetails.prestations.reduce((acc: any, p: any) => {
                                                        const label = p.metierLabel || "Divers"
                                                        if (!acc[label]) acc[label] = []
                                                        acc[label].push(p)
                                                        return acc
                                                    }, {} as any)
                                                ).map(([metierLabel, items]: [string, any]) => (
                                                    <React.Fragment key={metierLabel}>
                                                        {metierLabel !== "Divers" && (
                                                            <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                                                                <td colSpan={5} className="px-8 py-2 font-bold text-[11px] uppercase tracking-wider text-primary/70">
                                                                    {metierLabel}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {items.map((prestation: any, i: number) => (
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
                                                                    {Number(prestation.unit_price_cents / 100).toFixed(2)}€
                                                                </td>
                                                                <td className="px-8 py-5 text-right font-bold text-slate-900 dark:text-slate-50">
                                                                    {Number(prestation.total_cents / 100).toFixed(2)} €
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </React.Fragment>
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
                        {devisDetails.includeBeforeAfter && (
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

                    {/* Right Column: Financials & Client */}
                    <div className="space-y-8">
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
                                        {devisDetails.tax_rate > 0 && (
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

                        {/* Client Identity */}
                        <Card className="rounded-3xl  p-0 border-slate-200/70 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden transition-all duration-300">
                            <CardHeader className="px-8 pt-8">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Informations Client</CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-3 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-lg transition-colors">
                                        {devisDetails.client_name?.charAt(0) || 'C'}
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-slate-900 dark:text-slate-50 leading-none">{devisDetails.client_name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{devisDetails.client_address.address}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                            <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                        </div>
                                        <p className="text-sm font-medium truncate dark:text-slate-300">{devisDetails.client_email || 'Non renseigné'}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                            <Phone className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                        </div>
                                        <p className="text-sm font-medium tabular-nums dark:text-slate-300">{devisDetails.phone}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AlertDialog open={whatsappModalOpen} onOpenChange={setWhatsappModalOpen}>
                <AlertDialogContent className="rounded-3xl border-0 shadow-[0_20px_60px_-10px_rgba(16,185,129,0.15)] max-w-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-0 overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-emerald-400 to-emerald-600" />
                    <div className="p-8 pb-0">
                        <AlertDialogHeader className="items-center text-center space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-200/40 dark:bg-emerald-500/10 rounded-full animate-ping" />
                                <div className="relative h-20 w-20 rounded-full bg-linear-to-br from-emerald-50 dark:from-emerald-950/20 to-emerald-100 dark:to-emerald-900/40 flex items-center justify-center border-[6px] border-white dark:border-slate-900 shadow-xl">
                                    <MessageCircle className="h-9 w-9 text-emerald-600 dark:text-emerald-400 fill-emerald-600/20" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <AlertDialogTitle className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                                    Envoyer sur WhatsApp
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500 dark:text-slate-400 text-base leading-relaxed max-w-[280px] mx-auto">
                                    Vous êtes sur le point d'envoyer le devis à <strong className="text-emerald-700 dark:text-emerald-400">{devis.client_name}</strong>.
                                </AlertDialogDescription>
                            </div>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="flex-col sm:flex-col gap-3 p-8 pt-6 bg-slate-50/50 dark:bg-slate-900/50 mt-6 border-t border-emerald-100/50 dark:border-emerald-900/50">
                        <AlertDialogAction
                            onClick={handleConfirmWhatsapp}
                            className="w-full h-12 rounded-xl bg-linear-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Confirmer et Envoyer
                        </AlertDialogAction>
                        <AlertDialogCancel className="w-full h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50 transition-colors mt-0">
                            Annuler
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                loading={deleteLoading}
                title="Suppression"
                description="Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible."
            />
        </div>
    )
}

export default ArtisanDetailDevis