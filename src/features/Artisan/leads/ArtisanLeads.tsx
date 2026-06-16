import { useEffect, useMemo, useState } from 'react';
import {
    MapPin,
    Loader2,
    BadgeHelp,
    Send,
    RefreshCcw,
    Search,
    MoreVertical,
    Eye,
    Phone,
    Mail,
    FileText,
    RotateCcw,
    AlertTriangle,
    Download,
    LayoutGrid,
    List,
    Plus,
    Pencil,
    Trash2,
    MessageCircle,
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
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
import { DevisServiceInstance } from '@/services/artisan/devisService';
import { LeadServiceInstance } from '@/services/artisan/leadsServices';
import type { Devis } from '@/types/devisTypes';
import { toast } from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { DeleteModal } from '@/components/DeleteModel';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { statusBadgeConfig, cn, formatRelativeDate } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { downloadPdf } from '@/utils/downloadpdf';
import { generateDevisPdf } from "@/utils/generateDevisPdf";
import { uploadDocument } from "@/utils/UploadAvatars";
import { FacadesServiceInstance } from "@/services/admin/facadesSevices";
import { generateArtisanQuoteNumber, getBusinessTypeLabel } from '@/utils/quoteNumberGenerator';

interface Lead {
    id: string;
    name: string;
    phone: string;
    email: string;
    avatar: string;
    status: 'Brouillon' | 'Prêt' | 'Envoyé' | 'viewed' | 'Accepté' | 'Refusé' | 'Expiré';
    date: string;
    actionStatus: string;
    amount: number;
    quote_number: string;
    reference: string;
    items: any[];
    address: string;
    includeBeforeAfter: boolean;
    pdf_url: string;
}

const COLUMN_CONFIG = [
    { key: 'draft', status: 'Brouillon', label: 'Brouillon' },
    { key: 'ready', status: 'Prêt', label: 'Prêt' },
    { key: 'sent', status: 'Envoyé', label: 'Envoyé' },
    { key: 'viewed', status: 'viewed', label: 'En discussion' },
    { key: 'accepted', status: 'Accepté', label: 'Accepté' },
    { key: 'refused', status: 'Refusé', label: 'Refusé' },
    { key: 'expired', status: 'Expiré', label: 'Expiré' },
] as const;

const ActionStatusBadge = ({ status }: { status: string }) => {
    const config = statusBadgeConfig[status] || statusBadgeConfig.draft;
    const Icon = config.icon;

    return (
        <span className={cn(
            "px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5",
            config.className
        )}>
            <Icon className={cn("w-3 h-3", config.className)} />
            {config.label}
        </span>
    );
};

const ArtisanLeads = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [devisList, setDevisList] = useState<Devis[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingLeadId, setSendingLeadId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
    const [pendingDevis, setPendingDevis] = useState<Devis | null>(null);
    const [targetStatus, setTargetStatus] = useState<Devis['status'] | null>(null);
    const [relanceModalOpen, setRelanceModalOpen] = useState(false);
    const [relanceLeadId, setRelanceLeadId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'kanban' | 'table'>("kanban");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [devisToDelete, setDevisToDelete] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

    const mapDevisToLead = (devis: Devis): Lead => {
        let status: Lead['status'] = 'Brouillon';
        let actionStatus: string = devis.status;

        switch (devis.status) {
            case 'draft':
                status = 'Brouillon';
                break;
            case 'ready':
                status = 'Prêt';
                break;
            case 'sent':
                status = 'Envoyé';
                break;
            case 'accepted':
                status = 'Accepté';
                break;
            case 'refused':
                status = 'Refusé';
                break;
            case 'viewed':
                status = 'viewed';
                break;
            case 'expired':
                status = 'Expiré';
                break;
        }

        if (devis.valid_until && new Date(devis.valid_until) < new Date() && status !== 'Accepté' && status !== 'Refusé') {
            status = 'Expiré';
            actionStatus = 'expired';
        }

        return {
            id: devis.id,
            name: devis.client_name || 'Client Inconnu',
            phone: devis.client_phone || '',
            email: devis.client_email || '',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(devis.client_name || 'Client')}&background=e3e3e3`,
            status: status,
            date: formatRelativeDate(devis.created_at),
            actionStatus: actionStatus,
            amount: (devis.total_cents || 0) / 100,
            quote_number: devis.quote_number || '',
            reference: devis.reference || '',
            items: devis.items || [],
            address: devis.client_address?.address || '',
            includeBeforeAfter: devis.metadata?.includeBeforeAfter || false,
            pdf_url: devis.pdf_url || ''
        };
    };

    useEffect(() => {
        const fetchLeads = async () => {
            if (!user?.id) return;
            setLoading(true);
            try {
                const response = await DevisServiceInstance.getDevis(user.id, 1, 50, {
                    status: statusFilter,
                    search: searchQuery
                });
                const data: Devis[] = response.data;
                setDevisList(data);
                setTotalPages(response.totalPages);
                const mappedLeads: Lead[] = data.map(mapDevisToLead);
                setLeads(mappedLeads);
            } catch (error) {
                console.error("Error fetching devis:", error);
                toast.error("Erreur lors du chargement des devis");
            } finally {
                setLoading(false);
            }
        };
        fetchLeads();
    }, [user?.id, statusFilter, searchQuery, page]);

    const handleConfirmWhatsapp = async () => {
        if (!pendingDevis || !targetStatus) return;
        try {
            setSendingLeadId(pendingDevis.id);
            const finalStatus = targetStatus || "sent"

            // Check if we need to generate a quote number
            const needsQuoteNumber = !pendingDevis.quote_number &&
                (pendingDevis.status === 'draft' || pendingDevis.status === 'ready') &&
                (finalStatus === 'sent' || finalStatus === 'viewed' || finalStatus === 'accepted' || finalStatus === 'refused');

            let quoteNumber = pendingDevis.quote_number;

            if (needsQuoteNumber) {
                // Get business type label
                const businessType = user.metier_id ? await getBusinessTypeLabel(user.metier_id) : "Artisan";
                const businessName = user.company_name || user.display_name || "Business";

                // Generate quote number and internal reference
                const result = await generateArtisanQuoteNumber(businessType, businessName, user.id);
                quoteNumber = result.quoteNumber;
                const reference = result.reference;

                // Update the devis with the new quote number and reference
                await DevisServiceInstance.updateDevis(pendingDevis.id, {
                    quote_number: quoteNumber,
                    reference: reference
                });

                // Update local state
                setDevisList(prev => prev.map(d =>
                    d.id === pendingDevis.id ? { ...d, quote_number: quoteNumber, reference: reference } : d
                ));
                setLeads(prev => prev.map(l =>
                    l.id === pendingDevis.id ? { ...l, quote_number: quoteNumber, reference: reference } : l
                ));

                // Update pendingDevis for WhatsApp message
                pendingDevis.quote_number = quoteNumber;
            }

            const updates: Partial<Devis> = { status: finalStatus }
            if (finalStatus === "sent") updates.sent_at = new Date().toISOString()
            if (finalStatus === "accepted") updates.accepted_at = new Date().toISOString()
            if (finalStatus === "refused") updates.refused_at = new Date().toISOString()
            if (finalStatus === "viewed") updates.viewed_at = new Date().toISOString()
            if (finalStatus === "expired") updates.expired_at = new Date().toISOString()

            await DevisServiceInstance.updateDevis(pendingDevis.id, updates)
            await LeadServiceInstance.SendDevisByWhatsapp(pendingDevis, targetStatus);
            updateLocalLeadStatus(pendingDevis.id, targetStatus);
            toast.success(`Statut mis à jour (${targetStatus}) et WhatsApp ouvert`);
        } catch (error) {
            console.error("Error sending via WhatsApp:", error);
            toast.error("Erreur lors de l'envoi WhatsApp");
        } finally {
            setWhatsappModalOpen(false);
            setPendingDevis(null);
            setTargetStatus(null);
            setSendingLeadId(null);
        }
    };

    const updateLocalLeadStatus = (id: string, newStatus: Devis['status']) => {
        setLeads(prevLeads => prevLeads.map(lead => {
            if (lead.id === id) {
                let leadStatus: Lead['status'] = 'Brouillon';

                if (newStatus === 'draft') { leadStatus = 'Brouillon'; }
                else if (newStatus === 'ready') { leadStatus = 'Prêt'; }
                else if (newStatus === 'sent') { leadStatus = 'Envoyé'; }
                else if (newStatus === 'viewed') { leadStatus = 'viewed'; }
                else if (newStatus === 'accepted') { leadStatus = 'Accepté'; }
                else if (newStatus === 'refused') { leadStatus = 'Refusé'; }
                else if (newStatus === 'expired') { leadStatus = 'Expiré'; }

                return { ...lead, status: leadStatus, actionStatus: newStatus };
            }
            return lead;
        }));
    };

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

        // Every transition to "sent" via the status update logic should use the standard 'quote_sent' template.
        // The 'quote_relancer' template is specifically associated with the dedicated "Relancer" (Follow-up) action button.
        return 'quote_sent';
    };

    const handleStatusChange = async (id: string, newStatus: Devis['status']) => {
        const devis = devisList.find(d => d.id === id);
        if (!devis) return;

        try {
            setSendingLeadId(id);

            // Special handling for Draft -> Ready: Generate PDF & Quote Number
            if (devis.status === 'draft' && newStatus === 'ready') {
                let pdfUrl = devis.pdf_url;
                let quoteNumber = devis.quote_number;

                // 1. Generate Quote Number and Internal Reference if missing
                let reference = devis.reference;
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
                let facadeData = null;

                try {
                    // Fetch facade data if available
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
                await DevisServiceInstance.updateDevis(id, updates);

                // Update local state deeply to ensure PDF URL and Quote Number are reflected
                setDevisList(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
                setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'Prêt', actionStatus: 'ready', pdf_url: pdfUrl || l.pdf_url, quote_number: quoteNumber || l.quote_number, reference: reference || l.reference, amount: totalTTC } : l));

                toast.success("Devis validé et PDF généré");
                return; // Stop here as we handled the update
            }

            // Normal flow for other statuses
            // Check if we need to generate a quote number
            const needsQuoteNumber = !devis.quote_number &&
                (devis.status === 'draft' || devis.status === 'ready') &&
                (newStatus === 'sent' || newStatus === 'viewed' || newStatus === 'accepted' || newStatus === 'refused');

            let currentQuoteNumber = devis.quote_number;

            let currentReference: string | undefined;
            if (needsQuoteNumber) {
                const businessType = user.metier_id ? await getBusinessTypeLabel(user.metier_id) : "Artisan";
                const businessName = user.company_name || user.display_name || "Business";
                const result = await generateArtisanQuoteNumber(businessType, businessName, user.id);
                currentQuoteNumber = result.quoteNumber;
                currentReference = result.reference;

                await DevisServiceInstance.updateDevis(id, {
                    quote_number: currentQuoteNumber,
                    reference: currentReference
                });

                setDevisList(prev => prev.map(d =>
                    d.id === id ? { ...d, quote_number: currentQuoteNumber, reference: currentReference } : d
                ));
                setLeads(prev => prev.map(l =>
                    l.id === id ? { ...l, quote_number: currentQuoteNumber, reference: currentReference } : l
                ));
            }

            // If client has email and status is being changed to sent, viewed, or accepted
            if (devis.client_email && (newStatus === 'sent' || newStatus === 'viewed' || newStatus === 'accepted')) {
                const templateName = getEmailTemplateByStatus(devis.status, newStatus);

                const payload = {
                    template_name: templateName,
                    to_email: devis.client_email,
                    profile_id: user.id,
                    from_email: user.email,
                    from_name: user.display_name,
                    variables: {
                        client_name: devis.client_name,
                        artisan_name: user.display_name,
                        artisan_logo: user.logo_url,
                        artisan_metier: `${devis.metadata?.metiers?.map(m => m).join(', ')}`,
                        client_adresse: devis.client_address?.address,
                        artisan_email: user.email,
                        artisan_phone: user.phone,
                        quote_number: currentQuoteNumber || devis.quote_number,
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

                const updates: Partial<Devis> = { status: newStatus };
                if (newStatus === 'sent') updates.sent_at = new Date().toISOString();
                if (newStatus === 'accepted') updates.accepted_at = new Date().toISOString();
                if (newStatus === 'viewed') updates.viewed_at = new Date().toISOString();
                await DevisServiceInstance.updateDevis(id, updates);

                updateLocalLeadStatus(id, newStatus);
                toast.success(`L’envoi de votre email est en cours.`);
            } else if (devis.client_phone && (devis.status === 'draft' || devis.status === 'ready') && newStatus === 'sent') {
                setPendingDevis(devis);
                setTargetStatus(newStatus);
                setWhatsappModalOpen(true);
                return;
            } else {
                const updates: Partial<Devis> = { status: newStatus };
                if (newStatus === 'sent') updates.sent_at = new Date().toISOString();
                if (newStatus === 'accepted') updates.accepted_at = new Date().toISOString();
                if (newStatus === 'refused') updates.refused_at = new Date().toISOString();
                if (newStatus === 'viewed') updates.viewed_at = new Date().toISOString();
                if (newStatus === 'expired') updates.expired_at = new Date().toISOString();
                await DevisServiceInstance.updateDevis(id, updates);
                updateLocalLeadStatus(id, newStatus);
                toast.success("Statut mis à jour");
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Erreur lors de la mise à jour du statut");
        } finally {
            setSendingLeadId(null);
        }
    };

    const handleDownloadPdf = async (lead: Lead) => {
        if (!lead.pdf_url) {
            toast.error("Aucun PDF disponible");
            return;
        }
        await downloadPdf(
            lead.pdf_url,
            `devis_${lead.quote_number || 'brouillon'}.pdf`,
            (loading) => setDownloadingPdfId(loading ? lead.id : null)
        );
    };

    const handleConfirmRelance = async () => {
        if (!relanceLeadId) return;
        const devis = devisList.find(d => d.id === relanceLeadId);
        if (!devis) return;

        try {
            setSendingLeadId(relanceLeadId);
            setRelanceModalOpen(false);

            if (devis.client_email) {
                const payload = {
                    template_name: 'quote_relancer',
                    to_email: devis.client_email,
                    profile_id: user.id,
                    from_email: user.email,
                    from_name: user.display_name,
                    variables: {
                        client_name: devis.client_name || 'Client',
                        artisan_logo: user.logo_url,
                        artisan_name: user.display_name,
                        artisan_metier: devis.metadata?.metiers?.map(m => m).join(', '),
                        client_adresse: devis.client_address?.address,
                        quote_number: devis.quote_number,
                        quote_link: `${window.location.origin}/public/devis/${devis.id}`,
                        total_amount: devis.amount,
                        unsubscribe_link: `https://qceutznwobozxuvblyzo.supabase.co/functions/v1/unsubscribe-email?email=${devis.client_email}`
                    },
                    metadata: {
                        quote_id: devis.id,
                        pdf_url: devis.pdf_url
                    },
                    max_attempts: 3
                };

                await LeadServiceInstance.queueEmail(payload);
                toast.success("L’envoi de votre email est en cours.");
            } else if (devis.client_phone) {
                await LeadServiceInstance.SendDevisByWhatsapp(devis, devis.status);
                toast.success("Fenêtre WhatsApp ouverte");
            } else {
                toast.error("Aucun contact (email ou téléphone) pour ce prospect");
            }
        } catch (error) {
            console.error("Error sending relance:", error);
            toast.error("Erreur lors de l'envoi de la relance");
        } finally {
            setSendingLeadId(null);
            setRelanceLeadId(null);
        }
    };

    const handleDelete = (id: string) => {
        setDevisToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!devisToDelete) return;
        try {
            setDeleteLoading(true);
            await DevisServiceInstance.deleteDevis(devisToDelete);
            setDevisList(prev => prev.filter(d => d.id !== devisToDelete));
            setLeads(prev => prev.filter(l => l.id !== devisToDelete));
            toast.success("Devis supprimé avec succès");
        } catch (error) {
            console.error("Error deleting devis:", error);
            toast.error("Erreur lors de la suppression");
        } finally {
            setDeleteLoading(false);
            setDeleteModalOpen(false);
            setDevisToDelete(null);
        }
    };


    const columns = useMemo<ColumnDef<Lead>[]>(
        () => [
            {
                accessorKey: "n",
                header: "N°",
                cell: ({ row }) => <span>{row.index + 1}</span>
            },
            {
                accessorKey: "quote_number",
                header: "Référence",
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="font-bold">{row.original.quote_number || 'Brouillon'}</span>
                        {row.original.reference && (
                            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                                {row.original.reference}
                            </span>
                        )}
                    </div>
                )
            },
            {
                accessorKey: "name",
                header: "Client",
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={row.original.avatar} />
                            <AvatarFallback>{row.original.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium text-sm">{row.original.name}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-[150px]">{row.original.email || row.original.phone}</div>
                        </div>
                    </div>
                )
            },
            {
                accessorKey: "amount",
                header: "Montant",
                cell: ({ row }) => <span className="font-medium">{row.original.amount}€</span>
            },
            {
                accessorKey: "status",
                header: "Statut",
                cell: ({ row }) => (
                    <div className="flex justify-start">
                        <ActionStatusBadge status={row.original.actionStatus} />
                    </div>
                )
            },
            {
                accessorKey: "date",
                header: "Date",
                cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.date}</span>
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-2">
                        {row.original.actionStatus !== 'draft' && (
                            <div className='bg-muted p-1.5 rounded-full flex items-center justify-center hover:bg-secondary transition-colors transition-all'>
                                <Download
                                    className='cursor-pointer w-4 h-4 text-muted-foreground hover:text-foreground'
                                    onClick={() => handleDownloadPdf(row.original)}
                                />
                            </div>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => navigate(`/devis/${row.original.id}`)}
                                    className='group hover:bg-primary! hover:text-white! focus:bg-primary! focus:text-white! transition-all duration-200'
                                >
                                    <Eye className="h-4 w-4 group-hover:text-background group-focus:text-background transition-colors" /> Voir détails
                                </DropdownMenuItem>
                                {(row.original.actionStatus === 'draft') && (
                                    <DropdownMenuItem onClick={() => navigate(`/devis/edit/${row.original.id}`)}
                                        className='group hover:bg-primary! hover:text-white! focus:bg-primary! focus:text-white! transition-all duration-200'
                                    >
                                        <Pencil className="h-4 w-4 group-hover:text-background group-focus:text-background transition-colors" /> Modifier
                                    </DropdownMenuItem>
                                )}
                                {row.original.actionStatus === 'draft' && (
                                    <DropdownMenuItem onClick={() => handleStatusChange(row.original.id, 'ready')}
                                        className='group hover:bg-teal-600! hover:text-white! focus:bg-teal-600! focus:text-white! transition-all duration-200'
                                    >
                                        <CheckCircle2 className="h-4 w-4 group-hover:text-background group-focus:text-background transition-colors" /> Valider
                                    </DropdownMenuItem>
                                )}
                                {row.original.actionStatus === "ready" && (
                                    <>
                                        {row.original.email ? (
                                            <DropdownMenuItem onClick={() => handleStatusChange(row.original.id, 'sent')}>
                                                <Send className="h-4 w-4 group-hover:text-background" />
                                                Envoyer par email
                                            </DropdownMenuItem>
                                        ) : row.original.phone ? (
                                            <DropdownMenuItem
                                                onClick={() => handleStatusChange(row.original.id, 'sent')}
                                                className="flex items-center gap-2 mt-1 mx-1 cursor-pointer text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-500/10 hover:bg-emerald-600! hover:text-white! transition-colors duration-200 group"
                                            >
                                                <MessageCircle className="h-4 w-4 text-emerald-600 group-hover:text-background dark:text-emerald-400 transition-transform group-hover:scale-110" />
                                                <span className="font-medium">Envoyer par WhatsApp</span>
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem onClick={() => handleDownloadPdf(row.original)}>
                                                <Download className="h-4 w-4 group-hover:text-background" />
                                                Télécharger PDF
                                            </DropdownMenuItem>
                                        )}
                                    </>
                                )}
                                {row.original.actionStatus !== 'draft' && row.original.actionStatus !== 'ready' && (
                                    <DropdownMenuItem onClick={() => handleDownloadPdf(row.original)}>
                                        <Download className="h-4 w-4 group-hover:text-background" />
                                        Télécharger PDF
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSub>
                                    {row.original.actionStatus !== 'draft' && row.original.actionStatus !== 'ready' && (
                                        <DropdownMenuSubTrigger
                                            className='group hover:bg-primary! hover:text-white! focus:bg-primary! focus:text-white! transition-all duration-200'
                                        >
                                            <FileText className="h-4 w-4 group-hover:text-background" /> Changer statut
                                        </DropdownMenuSubTrigger>
                                    )}
                                    <DropdownMenuSubContent className='space-y-2 py-2'>
                                        {['ready', 'sent', 'viewed', 'accepted', 'refused']
                                            .filter((statusKey) => statusKey !== row.original.actionStatus)
                                            .map((statusKey) => {
                                                const config = statusBadgeConfig[statusKey];
                                                const Icon = config.icon;
                                                return (
                                                    <DropdownMenuItem
                                                        key={statusKey}
                                                        onClick={() => handleStatusChange(row.original.id, statusKey as any)}
                                                        className={`${config.className}`}
                                                    >
                                                        <Icon className="h-4 w-4 group-hover:text-background" /> {config.label}
                                                    </DropdownMenuItem>
                                                );
                                            })}
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                {(row.original.actionStatus === 'sent' || row.original.actionStatus === 'viewed') && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => {
                                            setRelanceLeadId(row.original.id);
                                            setRelanceModalOpen(true);
                                        }}>
                                            <RotateCcw className="h-4 w-4 group-hover:text-background" /> Relancer
                                        </DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive hover:bg-destructive! hover:text-white! group focus:bg-destructive! focus:text-white!"
                                    onClick={() => handleDelete(row.original.id)}
                                >
                                    <Trash2 className="h-4 w-4  text-destructive group-hover:text-white! group-hover:bg-destructive!" /> Supprimer
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            }
        ],
        [navigate, devisList]
    );

    const getColumnStats = () => {
        const stats: Record<string, { count: number, total: number }> = {};
        leads.forEach(lead => {
            if (!stats[lead.status]) {
                stats[lead.status] = { count: 0, total: 0 };
            }
            stats[lead.status].count += 1;
            stats[lead.status].total += lead.amount || 0;
        });
        return stats;
    };

    const stats = getColumnStats();

    return (
        <div className="min-h-screen bg-card md:bg-background relative overflow-hidden ">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
            </div>
            <div className="relative mx-auto   px-4 md:px-6 py-4 md:py-8 rounded-sm">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-foreground">Devis & Prospects</h1>
                        <TooltipProvider>
                            <Tooltip delayDuration={200}>
                                <TooltipTrigger asChild>
                                    <BadgeHelp className="w-5 h-5 text-warning cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="p-0 border-none bg-transparent">
                                    <div className="w-72 bg-card border border-border rounded-xl shadow-2xl p-4 space-y-3 animate-in fade-in zoom-in duration-200">
                                        <div className="flex items-center gap-2 border-b border-border pb-2">
                                            <BadgeHelp className="w-4 h-4 text-warning" />
                                            <h4 className="font-bold text-sm text-card-foreground">Guide des statuts</h4>
                                        </div>
                                        <div className="space-y-2 text-xs">
                                            <p className="text-muted-foreground leading-relaxed">
                                                Suivez l'évolution de vos devis et relancez vos prospects efficacement.
                                            </p>
                                            <div className="grid gap-2 pt-1">
                                                {[
                                                    { label: 'Brouillon', desc: 'En cours de préparation.', color: 'bg-warning/20 text-warning' },
                                                    { label: 'Envoyé', desc: 'Attente de réponse client.', color: 'bg-blue-500/20 text-blue-500' },
                                                    { label: 'En discussion', desc: 'discute de la demande.', color: 'bg-orange-500/20 text-orange-500' },
                                                    { label: 'Accepté', desc: 'accepte la demande.', color: 'bg-green-500/20 text-green-500' },
                                                    { label: 'Refusé', desc: 'refuse la demande.', color: 'bg-red-500/20 text-red-500' },
                                                ].map((s) => (
                                                    <div key={s.label} className="flex gap-2">
                                                        <span className={cn("px-1 py-0.5 rounded text-[10px] font-bold h-fit shrink-0", s.color)}>
                                                            {s.label}
                                                        </span>
                                                        <span className="text-muted-foreground">{s.desc}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-border flex items-center gap-1.5 text-[10px] text-muted-foreground italic">
                                            <Loader2 className="w-3 h-3" />
                                            <span>Les mises à jour sont manuelles par artisan.</span>
                                        </div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                </div>
                {/* States Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {loading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-2 md:p-5 backdrop-blur-md">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-2xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-8 w-12" />
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center justify-between">
                                    <Skeleton className="h-9 w-28 rounded-xl" />
                                    <Skeleton className="h-2 w-2 rounded-full" />
                                </div>
                            </div>
                        ))
                    ) : (
                        [
                            { key: 'sent', label: 'Devis Envoyés', statsKey: 'Envoyé' },
                            { key: 'accepted', label: 'Devis Acceptés', statsKey: 'Accepté' },
                            { key: 'viewed', label: 'En discussion', statsKey: 'viewed' },
                            { key: 'refused', label: 'Devis Refusés', statsKey: 'Refusé' },
                        ].map((item) => {
                            const config = statusBadgeConfig[item.key] || statusBadgeConfig.draft;
                            const Icon = config.icon;
                            const count = stats[item.statsKey]?.count || 0;
                            const total = stats[item.statsKey]?.total || 0;

                            return (
                                <div key={item.key} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-2 md:p-5 backdrop-blur-md transition-all duration-500 hover:shadow-2xl shadow-sm hover:shadow-primary/10 hover:-translate-y-1">
                                    {/* Mesh Gradient Background Decorative */}
                                    <div className={cn(
                                        "absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-10 blur-3xl transition-all duration-700 group-hover:opacity-20 group-hover:scale-150",
                                        config.className.split(' ').find(c => c.startsWith('bg-')) || 'bg-primary'
                                    )} />

                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "flex h-10 w-10 items-center justify-center rounded-2xl border-2 shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
                                                config.className
                                            )}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/90">{item.label}</p>
                                                <h3 className="text-3xl font-black tracking-tight text-foreground">{count}</h3>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-center justify-between">
                                            <div className="flex items-center gap-2 rounded-xl bg-secondary/80 px-4 py-2 border border-border/50 shadow-inner">
                                                <span className="text-sm font-bold tracking-tight text-foreground/80">
                                                    {new Intl.NumberFormat('fr-FR', {
                                                        style: 'currency',
                                                        currency: 'EUR',
                                                        maximumFractionDigits: 0
                                                    }).format(total)}
                                                </span>
                                            </div>
                                            <div className={cn(
                                                "h-2 w-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.1)]",
                                                config.className.split(' ').find(c => c.startsWith('bg-')) || 'bg-primary'
                                            )} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between mb-8 gap-4">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Rechercher un client..."
                            className="pl-10 bg-card border-border"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] h-10! bg-card border-border text-foreground">
                            <SelectValue placeholder="Tous les statuts" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            <SelectItem value="draft">Brouillon</SelectItem>
                            <SelectItem value="ready">Prêt à envoyer</SelectItem>
                            <SelectItem value="sent">Envoyé</SelectItem>
                            <SelectItem value="viewed">En discussion</SelectItem>
                            <SelectItem value="accepted">Accepté</SelectItem>
                            <SelectItem value="refused">Refusé</SelectItem>
                            <SelectItem value="expired">Expiré</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border/50">
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300",
                                    viewMode === 'kanban'
                                        ? "bg-card text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <LayoutGrid size={14} />
                                Kanban
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300",
                                    viewMode === 'table'
                                        ? "bg-card text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <List size={14} />
                                Tableau
                            </button>
                        </div>

                    </div>
                </div>

                {/* Content View */}
                {viewMode === 'kanban' ? (
                    <div className="grid grid-cols-[repeat(7,minmax(300px,1fr))] gap-3 pb-4 overflow-x-scroll scrollbar-kanban">
                        {COLUMN_CONFIG.map((col) => {
                            const config = statusBadgeConfig[col.key] || statusBadgeConfig.draft;
                            const Icon = config.icon;
                            return (
                                <div key={col.status} className="flex flex-col gap-4">
                                    {/* Column Header */}
                                    <div className={cn(
                                        "flex items-center justify-between p-3 rounded-xl border",
                                        config.className,
                                        "bg-card text-foreground"
                                    )}>
                                        <div className="flex items-center gap-2">
                                            <Icon className={cn("w-4 h-4 rounded-full", config.className)} />
                                            <span className="font-medium">{col.label}</span>
                                        </div>
                                        <span className="bg-muted text-muted-foreground text-xs font-medium px-1 py-0.5 rounded-md flex items-center gap-2">
                                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats[col.status]?.total || 0)}
                                            <span className="bg-card text-card-foreground text-xs font-medium px-2.5 py-0.5 rounded-md">
                                                {stats[col.status]?.count || 0}
                                            </span>
                                        </span>
                                    </div>

                                    {/* Cards */}
                                    <div className="flex flex-col gap-4">
                                        {loading ? (
                                            <div className="flex items-center justify-center">
                                                <Skeleton className="w-full h-48" />
                                            </div>
                                        ) : (
                                            leads
                                                .filter((lead) => lead.status === col.status)
                                                .map((lead) => {
                                                    const isSending = sendingLeadId === lead.id;
                                                    return (
                                                        <div
                                                            key={lead.id}
                                                            className={cn(
                                                                "bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all group relative",
                                                                isSending && "opacity-60 pointer-events-none scale-[0.98]"
                                                            )}
                                                        >
                                                            {isSending && (
                                                                <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-[2px] rounded-xl overflow-hidden border border-primary/20">
                                                                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                                                    <div className="flex flex-col h-full p-4 space-y-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                                                                            <div className="space-y-2">
                                                                                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                                                                <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                                                                            </div>
                                                                        </div>
                                                                        <div className="h-20 w-full bg-muted/50 animate-pulse rounded-lg" />
                                                                        <div className="h-10 w-full bg-muted/30 animate-pulse rounded-lg" />
                                                                    </div>
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                                                                        <div className="bg-card p-3 rounded-2xl shadow-2xl border border-primary/10 flex items-center gap-2">
                                                                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                                                            <span className="text-xs font-semibold text-primary animate-pulse">Mise à jour...</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {/* Card Header */}
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div className="flex gap-3 max-w-[80%]">
                                                                    <Avatar>
                                                                        <AvatarImage src={lead.avatar} />
                                                                        <AvatarFallback>NA</AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <Link to={`/devis/${lead.id}`} className="font-semibold block hover:text-primary text-foreground text-sm truncate max-w-36">{lead.name}</Link>
                                                                        <p className="text-xs text-muted-foreground">{lead.date}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    {lead.pdf_url && lead.actionStatus !== 'draft' ? (
                                                                        <div className="bg-muted p-1.5 rounded-full flex items-center justify-center hover:bg-secondary transition-colors transition-all">
                                                                            {downloadingPdfId === lead.id ? (
                                                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                                            ) : (
                                                                                <Download
                                                                                    className="cursor-pointer w-4 h-4 text-muted-foreground hover:text-foreground"
                                                                                    onClick={() => handleDownloadPdf(lead)}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <Link to={`/devis/edit/${lead.id}`} className="bg-muted p-1.5 rounded-full flex items-center justify-center hover:bg-primary/10 cursor-pointer">
                                                                            <Pencil className="w-4 h-4 text-primary" />
                                                                        </Link>
                                                                    )}
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary">
                                                                                <MoreVertical size={16} />
                                                                            </button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end" className="w-56">
                                                                            <DropdownMenuItem onClick={() => navigate(`/devis/${lead.id}`)}
                                                                                className="group"
                                                                            >
                                                                                <Eye className="h-4 w-4 group-hover:text-background" /> Voir détails
                                                                            </DropdownMenuItem>
                                                                            {(lead.actionStatus === 'draft') && (
                                                                                <DropdownMenuItem onClick={() => navigate(`/devis/edit/${lead.id}`)}
                                                                                    className="group"
                                                                                >
                                                                                    <Pencil className="h-4 w-4 group-hover:text-background" /> Modifier
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                            {lead.actionStatus === 'draft' && (
                                                                                <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'ready')}
                                                                                    className='group hover:bg-teal-600! hover:text-white! focus:bg-teal-600! focus:text-white! transition-all duration-200'
                                                                                >
                                                                                    <CheckCircle2 className="h-4 w-4 group-hover:text-background group-focus:text-background transition-colors" /> Valider
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                            {lead.actionStatus === "ready" ? (
                                                                                <>
                                                                                    {lead.email ? (
                                                                                        <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'sent')}>
                                                                                            <Send className="h-4 w-4 group-hover:text-background" />
                                                                                            Envoyer par email
                                                                                        </DropdownMenuItem>
                                                                                    ) : lead.phone ? (
                                                                                        <DropdownMenuItem
                                                                                            onClick={() => handleStatusChange(lead.id, 'sent')}
                                                                                            className="flex items-center gap-2 mt-1 mx-1 cursor-pointer text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-500/10 hover:bg-emerald-600! hover:text-white! transition-colors duration-200 group"
                                                                                        >
                                                                                            <MessageCircle className="h-4 w-4 text-emerald-600 group-hover:text-background dark:text-emerald-400 transition-transform group-hover:scale-110" />
                                                                                            <span className="font-medium">Envoyer par WhatsApp</span>
                                                                                        </DropdownMenuItem>
                                                                                    ) : (
                                                                                        <DropdownMenuItem onClick={() => handleDownloadPdf(lead)}>
                                                                                            <Download className="h-4 w-4 group-hover:text-background" />
                                                                                            Télécharger PDF
                                                                                        </DropdownMenuItem>
                                                                                    )}
                                                                                </>
                                                                            ) : (
                                                                                lead.actionStatus !== 'draft' && (
                                                                                    <DropdownMenuItem onClick={() => handleDownloadPdf(lead)}>
                                                                                        <Download className="h-4 w-4 group-hover:text-background" />
                                                                                        Télécharger PDF
                                                                                    </DropdownMenuItem>
                                                                                )
                                                                            )}
                                                                            <DropdownMenuSub>
                                                                                {lead.actionStatus !== 'draft' && (
                                                                                    <DropdownMenuSubTrigger
                                                                                        className="group"
                                                                                    >
                                                                                        <FileText className="h-4 w-4 group-hover:text-background" /> Changer statut
                                                                                    </DropdownMenuSubTrigger>
                                                                                )}
                                                                                <DropdownMenuSubContent className='space-y-2 py-2'>
                                                                                    {['sent', 'viewed', 'accepted', 'refused']
                                                                                        .filter(statusKey => statusKey !== lead.actionStatus)
                                                                                        .map((statusKey) => {
                                                                                            const config = statusBadgeConfig[statusKey];
                                                                                            const Icon = config.icon;
                                                                                            return (
                                                                                                <DropdownMenuItem
                                                                                                    key={statusKey}
                                                                                                    onClick={() => handleStatusChange(lead.id, statusKey as any)}
                                                                                                    className={`${config.className}`}
                                                                                                >
                                                                                                    <Icon className="h-4 w-4 group-hover:text-background" /> {config.label}
                                                                                                </DropdownMenuItem>
                                                                                            );
                                                                                        })}
                                                                                </DropdownMenuSubContent>
                                                                            </DropdownMenuSub>
                                                                            {(lead.actionStatus === 'sent' || lead.actionStatus === 'viewed') && (
                                                                                <>
                                                                                    <DropdownMenuSeparator />
                                                                                    <DropdownMenuItem onClick={() => {
                                                                                        setRelanceLeadId(lead.id);
                                                                                        setRelanceModalOpen(true);
                                                                                    }}>
                                                                                        <RotateCcw className="h-4 w-4 group-hover:text-background" /> Relancer
                                                                                    </DropdownMenuItem>
                                                                                </>
                                                                            )}
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem
                                                                                className="text-destructive hover:bg-destructive! hover:text-white! group focus:bg-destructive! focus:text-white!"
                                                                                onClick={() => handleDelete(lead.id)}
                                                                            >
                                                                                <Trash2 className="h-4 w-4  text-destructive group-hover:text-white! group-hover:bg-destructive!" /> Supprimer
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>
                                                            </div>
                                                            {/* PRESTATIONS */}
                                                            <div className="mt-3 mb-4 py-3 border-y border-border/50">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Prestations</h4>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    {lead.items?.slice(0, 2).map((item: any, idx: number) => (
                                                                        <div key={idx} className="flex justify-between items-center text-[13px]">
                                                                            <span className="text-foreground/80 truncate pr-2 flex-1">{item.description}</span>
                                                                            <span className="text-muted-foreground shrink-0 font-medium bg-secondary/30 px-1.5 py-0.5 rounded text-[11px]">
                                                                                {item.quantity} {item.unit}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                    {lead.items?.length > 2 && (
                                                                        <p className="text-[11px] text-primary/80 font-medium pt-1 italic">
                                                                            + {lead.items.length - 2} autres prestations...
                                                                        </p>
                                                                    )}
                                                                    {(!lead.items || lead.items.length === 0) && (
                                                                        <p className="text-[11px] text-muted-foreground italic">Aucune prestation détaillée</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Contact Info */}
                                                            <div className="space-y-2 mb-4">
                                                                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                                                    <span className="flex items-center justify-center rounded-full  p-1 bg-muted">
                                                                        <MapPin size={15} />
                                                                    </span>
                                                                    <span>{lead.address || '-'}</span>
                                                                </div>
                                                                {lead.phone && lead.phone !== '-' ? (
                                                                    <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs group">
                                                                        <span className="flex items-center justify-center rounded-full p-1 bg-muted group-hover:bg-primary/10 transition-colors">
                                                                            <Phone size={15} />
                                                                        </span>
                                                                        <span className="group-hover:underline">{lead.phone}</span>
                                                                    </a>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 text-muted-foreground/30 text-xs">
                                                                        <span className="flex items-center justify-center rounded-full p-1 bg-muted/50">
                                                                            <Phone size={15} />
                                                                        </span>
                                                                        <span>-</span>
                                                                    </div>
                                                                )}
                                                                {lead.email && lead.email !== '-' ? (
                                                                    <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs group">
                                                                        <span className="flex items-center justify-center rounded-full p-1 bg-muted group-hover:bg-primary/10 transition-colors">
                                                                            <Mail size={15} />
                                                                        </span>
                                                                        <span className="truncate group-hover:underline">{lead.email}</span>
                                                                    </a>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 text-muted-foreground/30 text-xs">
                                                                        <span className="flex items-center justify-center rounded-full p-1 bg-muted/50">
                                                                            <Mail size={15} />
                                                                        </span>
                                                                        <span className="truncate">-</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Footer / Status */}
                                                            <div className="flex justify-between items-center gap-2">
                                                                <ActionStatusBadge status={lead.actionStatus} />
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-base font-black text-foreground tabular-nums">
                                                                        {lead.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">TTC</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                        )}
                                        {!loading && leads.filter((lead) => lead.status === col.status).length === 0 && (
                                            <div className="text-xs text-muted-foreground text-center py-8 bg-muted/20 rounded-lg border-2 border-dashed border-border/50">
                                                Aucun lead
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
                        <DataTable
                            columns={columns}
                            data={leads}
                            manualPagination={true}
                            pageIndex={page - 1}
                            pageCount={totalPages}
                            onPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
                            pageSize={pageSize}
                            loading={loading}
                            updatingRowId={sendingLeadId}
                            getRowId={(row) => row.id}
                        />
                    </div>
                )}
            </div >
            <AlertDialog open={whatsappModalOpen} onOpenChange={setWhatsappModalOpen}>
                <AlertDialogContent className="rounded-3xl border-0 shadow-[0_20px_60px_-10px_rgba(16,185,129,0.15)] max-w-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-0 overflow-hidden">
                    <div className="p-8 pb-0">
                        <AlertDialogHeader className="items-center text-center space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-200/40 rounded-full animate-ping" />
                                <div className="relative h-20 w-20 rounded-full bg-linear-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 flex items-center justify-center border-[6px] border-white dark:border-slate-800 shadow-xl">
                                    <MessageCircle className="h-9 w-9 text-emerald-600 fill-emerald-600/20" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <AlertDialogTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Envoyer sur WhatsApp
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500 text-base leading-relaxed max-w-[280px] mx-auto">
                                    Vous êtes sur le point d'envoyer le devis à <strong className="text-emerald-700">{pendingDevis?.client_name}</strong>.
                                </AlertDialogDescription>
                            </div>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="flex-col sm:flex-col gap-3 p-8 pt-6 bg-slate-50/50 dark:bg-slate-800/50 mt-6 border-t border-emerald-100/50 dark:border-emerald-900/50">
                        <AlertDialogAction
                            onClick={handleConfirmWhatsapp}
                            className="w-full h-12 rounded-xl bg-linear-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Confirmer et Envoyer
                        </AlertDialogAction>
                        <AlertDialogCancel className="w-full h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors mt-0">
                            Annuler
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={relanceModalOpen} onOpenChange={setRelanceModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-primary" />
                            Relancer le devis
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir relancer ce prospect ? Un nouveau message (Email ou WhatsApp selon disponibilité) lui sera envoyé avec les détails du devis.
                            <br /><br />
                            <span className="text-xs text-muted-foreground italic">* Cette action ne modifiera pas le statut actuel du devis.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmRelance} className="bg-primary hover:bg-primary/90 text-white">
                            <RotateCcw className="w-5 h-5 " />
                            Relancer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                loading={deleteLoading}
                title="Supprimer le devis"
                description="Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible."
            />
        </div>
    );
};

export default ArtisanLeads;
