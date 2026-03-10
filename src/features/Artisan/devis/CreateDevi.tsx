import React, { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "react-hot-toast"
import { DevisServiceInstance } from "@/services/artisan/devisService"
import { LeadServiceInstance } from "@/services/artisan/leadsServices"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { ArrowLeft, Briefcase, Calculator, CalendarIcon, Check, ChevronDown, Copy, Download, FileText, Images, Info, Loader2, MailSearch, MessageCircle, Plus, Send, Sparkles, Text, Trash2, Upload } from "lucide-react"
import { downloadPdf } from "@/utils/downloadpdf"
import { Switch } from "@/components/ui/switch"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbLink,
} from "@/components/ui/breadcrumb"
import { useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { generateDevisPdf } from "@/utils/generateDevisPdf"
import { uploadDocument } from "@/utils/UploadAvatars"
import { FacadesServiceInstance } from "@/services/admin/facadesSevices"
import { EmailFinderServiceInstance } from "@/services/emailFinderService"
import { GeminiSimulationServiceInstance, SimulationCostCalculator } from "@/services/gemini-ai"
import { PegtopLoader } from "@/components/ui/pegtop-loader"
import { FacadeServiceInstance } from "@/services/artisan/facadeService"
import { CreditLedger } from "@/services/creditLedgerService"
import { generateArtisanQuoteNumber, getBusinessTypeLabel } from "@/utils/quoteNumberGenerator"



const DevisSkeleton = () => (
    <div className="relative min-h-screen bg-card md:bg-background overflow-hidden pb-12">
        <div className="relative mx-auto px-4 md:px-6 py-4 md:py-8 space-y-6">
            {/* Breadcrumb Skeleton */}
            <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
            </div>

            {/* Header Skeleton */}
            <div className="flex items-center gap-2 mb-6">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-64" />
            </div>

            {/* Client Info Card Skeleton */}
            <Card className="border-none shadow-sm rounded-sm">
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Prestation Details Card Skeleton */}
            <Card className="border-none shadow-sm rounded-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-muted/50 p-4 border-b">
                                <div className="grid grid-cols-6 gap-4">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                            </div>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="p-4 border-b last:border-0">
                                    <div className="grid grid-cols-6 gap-4">
                                        <Skeleton className="h-8 w-full" />
                                        <Skeleton className="h-8 w-full" />
                                        <Skeleton className="h-8 w-full" />
                                        <Skeleton className="h-8 w-full" />
                                        <Skeleton className="h-8 w-full" />
                                        <Skeleton className="h-8 w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end pt-6">
                            <div className="w-full max-w-sm space-y-3">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <div className="pt-3 border-t flex justify-between">
                                    <Skeleton className="h-6 w-24" />
                                    <Skeleton className="h-8 w-32" />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
)

interface Prestation {
    id: string;
    description: string;
    unit: string;
    quantity: number | string;
    unitPrice: number | string;
    metierId?: string;
    metierLabel?: string;
    realMetierId?: string;
}

export const CreateDevis = () => {
    const { id, slug } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [prestations, setPrestations] = useState<Prestation[]>([])
    const [includeBeforeAfter, setIncludeBeforeAfter] = useState(false)
    const [clientName, setClientName] = useState("")
    const [clientEmail, setClientEmail] = useState("")
    const [clientPhone, setClientPhone] = useState("")
    const [clientAddress, setClientAddress] = useState("")
    const [tvaRate, setTvaRate] = useState(20)
    const [isSaved, setIsSaved] = useState(false)
    const [isSavingDraft, setIsSavingDraft] = useState(false)
    const [isSavingSent, setIsSavingSent] = useState(false)
    const [createdDevis, setCreatedDevis] = useState<any>(null)
    const [validUntil, setValidUntil] = useState<Date | undefined>(() => {
        const date = new Date()
        date.setDate(date.getDate() + 30)
        return date
    })
    const [foundEmails, setFoundEmails] = useState<string[]>([])
    const [isSearchingEmails, setIsSearchingEmails] = useState(false)
    const [showCustomEmailInput, setShowCustomEmailInput] = useState(false)
    const [facade, setFacade] = useState<any>(null)
    const [isGeneratingSimulation, setIsGeneratingSimulation] = useState(false)
    const [localSimulationUrl, setLocalSimulationUrl] = useState<string | null>(null)
    const [notes, setNotes] = useState("")
    const [simulationCostEstimate, setSimulationCostEstimate] = useState<{
        creditsRequired: number
        hasEnoughCredits: boolean
    } | null>(null)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [availableImages, setAvailableImages] = useState<string[]>([])
    const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false)
    const [allMetiers, setAllMetiers] = useState<any[]>([])
    const [selectedMetierIds, setSelectedMetierIds] = useState<string[]>([])
    const [artisanConfigs, setArtisanConfigs] = useState<any[]>([])

    const EMAIL_SEARCH_COST = 2

    const getEmail = async () => {
        const site = facade?.website
        if (!site) {
            toast.error("Aucun site web disponible pour cette façade")
            return
        }

        // Check credits
        if ((user?.credit_balance || 0) < EMAIL_SEARCH_COST) {
            toast.error(`Crédits insuffisants. Requis: ${EMAIL_SEARCH_COST}, Disponibles: ${user?.credit_balance || 0}`)
            return
        }

        setIsSearchingEmails(true)
        try {
            // 1. Find emails
            const data = await EmailFinderServiceInstance.getEmails(site)
            console.log('emails found by service:', data)

            if (data && Array.isArray(data) && data.length > 0) {
                await CreditLedger.createEntry({
                    profileId: user?.id || "",
                    type: "email_search",
                    amount: -EMAIL_SEARCH_COST,
                    referenceId: id,
                    referenceType: "facade_email_search",
                    metadata: {
                        website: site,
                        emails_found: data.length
                    }
                })

                setFoundEmails(data)
                if (data.length > 0 && !clientEmail) {
                    setClientEmail(data[0])
                }
                toast.success(`${data.length} email(s) trouvé(s)`)
            } else {
                toast.error("Aucun email trouvé pour ce site")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erreur lors de la recherche d'emails")
        } finally {
            setIsSearchingEmails(false)
        }
    }

    const { pathname } = useLocation()
    const { user } = useAuth()
    const isAutoEntrepreneur = user?.is_entreprise === false

    // Load simulation cost estimate when component mounts or when simulation status changes
    useEffect(() => {
        const loadSimulationCost = async () => {
            if (user?.credit_balance !== undefined) {
                const hasExistingSimulation = !!localSimulationUrl || !!facade?.scan_facades?.[0]?.simulated_facade_image
                const estimate = await SimulationCostCalculator.estimateSimulationCost(user.credit_balance, hasExistingSimulation)
                setSimulationCostEstimate({
                    creditsRequired: estimate.creditsRequired,
                    hasEnoughCredits: estimate.hasEnoughCredits
                })
            }
        }
        loadSimulationCost()
    }, [user?.credit_balance, localSimulationUrl, facade])


    // Load artisan prestations (tariffs) and assigned metiers
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user?.id) return
            try {
                const { data } = await DevisServiceInstance.getArtisanMetiers(user.id)

                const mappedMetiers = (data || []).map((m: any) => ({
                    id: m.metier_id,
                    profileMetierId: m.id,
                    label: m.metiers?.label || "Sans catégorie",
                    tariffs: m.tariffs || []
                }))

                setAllMetiers(mappedMetiers)
                setSelectedMetierIds(mappedMetiers.map(m => m.id))
                setArtisanConfigs(data || []) // Keep raw configs for tariff lookup if needed

                // Initialize prestations with ALL assigned metiers
                const initialPrestations: Prestation[] = []
                for (const metier of mappedMetiers) {
                    if (metier.tariffs.length > 0) {
                        const items = metier.tariffs.map((t: any) => ({
                            id: t.id,
                            description: t.service_name,
                            unit: t.unit,
                            quantity: 1,
                            unitPrice: t.unit_price_cents / 100,
                            metierId: metier.profileMetierId,
                            metierLabel: metier.label,
                            realMetierId: metier.id
                        }))
                        initialPrestations.push(...items)
                    } else {
                        initialPrestations.push({
                            id: `temp-${metier.id}-${Date.now()}`,
                            description: "",
                            unit: "m²",
                            quantity: 0,
                            unitPrice: 0,
                            metierId: metier.profileMetierId,
                            metierLabel: metier.label,
                            realMetierId: metier.id
                        })
                    }
                }
                setPrestations(initialPrestations)
            } catch (error) {
                console.error("Error loading initial data:", error)
            }
        }
        fetchInitialData()
    }, [user?.id])

    // Calculate totals
    const subtotal = prestations.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0)


    useEffect(() => {
        console.log("id", id)
        console.log("facade", facade)
    }, [id, facade])


    // get facade data by id
    useEffect(() => {
        const fetchFacade = async () => {
            setLoading(true)
            try {
                const facadeData = await FacadesServiceInstance.getFacadeById(id!)
                console.log("facade data fetched:", facadeData)

                // Initialize client info states from facade data
                if (facadeData.address?.name) setClientName(facadeData.address.name)
                if (facadeData.formatted_address) setClientAddress(facadeData.formatted_address)
                if (facadeData.international_phone_number) setClientPhone(facadeData.international_phone_number)

                // Handle emails - NO AUTOMATIC SEARCH
                if (facadeData.emails && Array.isArray(facadeData.emails) && facadeData.emails.length > 0) {
                    setFoundEmails(facadeData.emails)
                    if (!clientEmail) {
                        setClientEmail(facadeData.emails[0])
                    }
                }

                // Handle streetview images
                if (facadeData.streetview_url) {
                    try {
                        const urls = JSON.parse(facadeData.streetview_url)
                        if (Array.isArray(urls) && urls.length > 0) {
                            setAvailableImages(urls)
                            setSelectedImageIndex(0) // Default to first image
                        }
                    } catch (error) {
                        console.error("Error parsing streetview_url:", error)
                    }
                }

                setFacade(facadeData)
            } catch (error) {
                console.error("Error fetching facade:", error)
            } finally {
                setLoading(false)
                window.scrollTo(0, 0)
            }
        }
        fetchFacade()

    }, [id])



    // Automatically set TVA based on profile type
    useEffect(() => {
        if (isAutoEntrepreneur) {
            setTvaRate(0)
        } else {
            setTvaRate(20)
        }
    }, [isAutoEntrepreneur])

    const tvaAmount = (subtotal * tvaRate) / 100
    const totalTTC = subtotal + tvaAmount

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])

    const handleAddPrestation = () => {
        const newPrestation = {
            id: String(Date.now() + Math.random()),
            description: "",
            quantity: 0,
            unit: "m²",
            unitPrice: 0,
            metierLabel: "Divers"
        }
        setPrestations([...prestations, newPrestation])
    }
    const updatePrestation = (id: string, field: string, value: string | number) => {
        setPrestations(
            prestations.map((p) =>
                p.id === id ? { ...p, [field]: value } : p
            )
        )
    }
    const removePrestation = (id: string) => {
        setPrestations(prestations.filter((p) => p.id !== id))
    }

    const duplicatePrestation = (id: string) => {
        const prestationToDuplicate = prestations.find(p => p.id === id)
        if (prestationToDuplicate) {
            const newPrestation = {
                ...prestationToDuplicate,
                id: String(Date.now() + Math.random()),
            }
            const index = prestations.findIndex(p => p.id === id)
            const newPrestations = [...prestations]
            newPrestations.splice(index + 1, 0, newPrestation)
            setPrestations(newPrestations)
        }
    }

    const handleCreateDevis = async (isDraft: boolean) => {
        // 1. Validation
        if (!clientName) {
            toast.error("Le nom du client est obligatoire")
            return
        }
        if (!clientEmail && !clientPhone) {
            toast.error("Veuillez renseigner un email ou un numéro de téléphone")
            return
        }
        if (prestations.length === 0) {
            toast.error("Le devis doit contenir au moins une prestation")
            return
        }
        if (subtotal <= 0) {
            toast.error("Le montant total ne peut pas être nul")
            return
        }

        if (isDraft) {
            setIsSavingDraft(true)
        } else {
            setIsSavingSent(true)
        }

        try {
            let quoteNumber = "";
            let reference = "";

            if (!isDraft && user?.id) {
                const businessType = user.metier_id ? await getBusinessTypeLabel(user.metier_id) : "Artisan";
                const businessName = user.company_name || user.display_name || "Business";
                const result = await generateArtisanQuoteNumber(businessType, businessName, user.id);
                quoteNumber = result.quoteNumber;
                reference = result.reference;
            }

            // 2. Prepare Payload
            const payload = {
                profile_id: user?.id,
                quote_number: isDraft ? null : quoteNumber,
                reference: isDraft ? null : reference,
                client_name: clientName,
                client_email: clientEmail,
                client_phone: clientPhone,
                client_address: clientAddress ? { address: clientAddress } : {},
                subtotal_cents: Math.round(subtotal * 100),
                tax_rate: tvaRate / 100,
                tax_cents: Math.round(tvaAmount * 100),
                total_cents: Math.round(totalTTC * 100),
                currency: "EUR",
                status: isDraft ? "draft" : "ready",
                valid_until: validUntil ? validUntil.toISOString() : null,
                sent_at: isDraft ? null : new Date(),
                accepted_at: isDraft ? null : new Date(),
                refused_at: isDraft ? null : new Date(),
                metadata: {
                    includeBeforeAfter,
                    facade_id: id,
                    notes: notes,
                    metiers: allMetiers.filter(m => selectedMetierIds.includes(m.id)).map(m => m.label),
                    prestations_data: prestations.map(p => ({
                        metierId: p.metierId,
                        metierLabel: p.metierLabel,
                        realMetierId: p.realMetierId
                    }))
                },
                pdf_url: ""
            }

            // 3. Generate and Upload PDF ONLY if not a draft
            if (!isDraft) {
                const quote_number = payload.quote_number
                const pdfDoc = await generateDevisPdf({
                    ref: quote_number,
                    artisan: {
                        name: user?.display_name || "Artisan",
                        companyName: user?.company_name || "",
                        email: user?.email || "",
                        phone: user?.phone || "",
                        address: user?.adresse || "",
                        // @ts-ignore
                        logoUrl: user?.logo_url || user?.avatar_url || "",
                        // @ts-ignore
                        signatureUrl: user?.signature_url || "",
                    },
                    client: clientName || "Client non spécifié",
                    clientAddress: clientAddress,
                    clientEmail: clientEmail,
                    clientPhone: clientPhone,
                    date: new Date().toLocaleDateString('fr-FR'),
                    validUntil: validUntil ? validUntil.toLocaleDateString('fr-FR') : undefined,
                    items: prestations.map(p => ({
                        label: p.description || "Prestation sans titre",
                        unit: p.unit,
                        quantity: Number(p.quantity),
                        price: Number(p.unitPrice)
                    })),
                    subtotal: subtotal,
                    tvaRate: tvaRate,
                    tvaAmount: isAutoEntrepreneur ? 0 : tvaAmount,
                    totalTTC: totalTTC,
                    includeBeforeAfter: includeBeforeAfter,
                    imageBefore: availableImages[selectedImageIndex] || (facade?.streetview_url ? JSON.parse(facade.streetview_url)[0] : ""),
                    imageAfter: localSimulationUrl || facade?.scan_facades[0].simulated_facade_image || "",
                    facadeAddress: facade?.formatted_address,
                    facadeScore: facade?.score,
                    notes: notes
                })

                const pdfBlob = pdfDoc
                const pdfFile = new File([pdfBlob], `${quote_number}.pdf`, { type: 'application/pdf' })

                if (user?.id) {
                    const uploadedUrl = await uploadDocument(pdfFile, user.id)
                    if (uploadedUrl) {
                        payload.pdf_url = uploadedUrl
                    }
                }
            }

            // 4. Call Service
            const { data } = await DevisServiceInstance.createDevis(payload, prestations, id)

            if (data) {
                toast.success(isDraft ? "Brouillon enregistré" : "Devis créé et envoyé")
                setCreatedDevis(data)
                setIsSaved(true)
                navigate(`/devis/${data.id}`)
                // We stay on the page to allow user to download PDF or send via mail/WhatsApp
            }
        } catch (error) {
            console.error("Error creating devis:", error)
            toast.error("Erreur lors de la création du devis")
        } finally {
            setIsSavingDraft(false)
            setIsSavingSent(false)
        }
    }

    const toggleMetier = (metier: any) => {
        const isSelected = selectedMetierIds.includes(metier.id)

        if (isSelected) {
            // Remove
            setSelectedMetierIds(prev => prev.filter(id => id !== metier.id))
            setPrestations(prev => prev.filter(p => p.realMetierId !== metier.id))
        } else {
            // Add
            setSelectedMetierIds(prev => [...prev, metier.id])
            const config = artisanConfigs.find(c => c.metier_id === metier.id)

            if (config && config.tariffs && config.tariffs.length > 0) {
                const newItems = config.tariffs.map((t: any) => ({
                    id: String(Date.now() + Math.random()),
                    description: t.service_name,
                    unit: t.unit,
                    quantity: 1,
                    unitPrice: t.unit_price_cents / 100,
                    metierId: config.id,
                    metierLabel: metier.label,
                    realMetierId: metier.id
                }))
                setPrestations(prev => [...prev, ...newItems])
            } else {
                addEmptyPrestation(metier, config?.id)
            }
        }
    }

    const addEmptyPrestation = (metier: any, profileMetierId?: string) => {
        const newItem: Prestation = {
            id: `temp-${metier.id}-${Date.now()}`,
            description: "",
            unit: "m²",
            quantity: 0,
            unitPrice: 0,
            metierId: profileMetierId,
            metierLabel: metier.label,
            realMetierId: metier.id
        }
        setPrestations(prev => [...prev, newItem])
    }



    const handleGenerateSimulation = async () => {
        if (!facade || !user?.id) return

        // Check if user has enough credits
        if (simulationCostEstimate && !simulationCostEstimate.hasEnoughCredits) {
            toast.error(`Crédits insuffisants. Requis: ${simulationCostEstimate.creditsRequired}, Disponibles: ${user.credit_balance || 0}`)
            return
        }

        // Get the scan_facade ID from the facade data
        const scanFacadeId = facade.scan_facades?.[0]?.id
        if (!scanFacadeId) {
            toast.error("Aucune relation scan_facade trouvée")
            return
        }

        // Get the facade image URL - use selected image
        let facadeImageUrl: string | null = null
        try {
            if (availableImages.length > 0) {
                facadeImageUrl = availableImages[selectedImageIndex]
            } else if (facade.streetview_url) {
                const urls = JSON.parse(facade.streetview_url)
                facadeImageUrl = urls[0]
            }
        } catch {
            facadeImageUrl = null
        }

        if (!facadeImageUrl) {
            toast.error("Aucune image de façade disponible")
            return
        }

        setIsGeneratingSimulation(true)
        try {
            // Prepare prestations data for simulation
            const prestationsForSimulation = prestations
                .filter(p => p.description && Number(p.quantity) > 0)
                .map(p => ({
                    description: p.description,
                    unit: p.unit,
                    quantity: p.quantity,
                    unitPrice: p.unitPrice,
                    metierLabel: p.metierLabel
                }))

            const hasExistingSimulation = !!localSimulationUrl || !!facade?.scan_facades?.[0]?.simulated_facade_image

            const result = await GeminiSimulationServiceInstance.generateSimulation({
                facadeId: facade.id,
                scanFacadeId,
                facadeImageUrl,
                profileId: user.id,
                facadeScore: facade.score,
                scoreBreakdown: facade.score_breakdown,
                prestations: prestationsForSimulation.length > 0 ? prestationsForSimulation : undefined,
                isRegeneration: hasExistingSimulation
            }, user.credit_balance || 0)

            if (result.success && result.localImageUrl) {
                // Display immediately with local blob URL
                setLocalSimulationUrl(result.localImageUrl)
                await FacadeServiceInstance.updateScanFacadeSimulationImage(result.localImageUrl, id, slug)
                toast.success("Simulation générée avec succès")

                // Update user credit balance in context (subtract the cost)
                if (simulationCostEstimate) {
                    // You may want to refresh user data here to get updated balance
                    // or update the local state
                }
            } else {
                toast.error(result.error || "Erreur lors de la génération")
            }
        } catch (error) {
            console.error("Simulation error:", error)
            toast.error("Erreur lors de la génération de la simulation")
        } finally {
            setIsGeneratingSimulation(false)
        }
    }

    if (loading) return <DevisSkeleton />

    return (
        <div className="relative min-h-screen bg-card md:bg-background overflow-hidden pb-12">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
            </div>

            <div className="relative mx-auto   px-4 md:px-6 py-4 md:py-8 space-y-6">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/devis">Devis</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Génération du devis</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                {/* Header */}
                <div className="flex items-center  gap-2 mb-6">
                    <Link to="/devis">
                        <ArrowLeft className="h-6 w-6 text-foreground bg-muted rounded-full p-1" />
                    </Link>
                    <h1 className="text-3xl font-bold text-foreground/70">Génération du devis</h1>
                </div>

                {/* Client Information */}
                <Card className="border-none shadow-sm rounded-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-bold">Informations client</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="client-name">Nom du client</Label>
                                <Input
                                    id="client-name"
                                    placeholder="ex: Dupont Pierre, SARL Reno..."
                                    className="rounded-sm"
                                    value={clientName}
                                    readOnly
                                    onChange={(e) => setClientName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Adresse du client</Label>
                                <Input
                                    id="address"
                                    placeholder="ex: 12 bis rue des lilas, 75001 Paris"
                                    className="rounded-sm"
                                    value={clientAddress}
                                    readOnly
                                    onChange={(e) => setClientAddress(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                {isSearchingEmails ? (
                                    <div className="flex items-center gap-2 h-10 px-3 bg-muted/20 rounded-sm border border-input animate-pulse">
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                        <span className="text-sm text-muted-foreground italic">Recherche d'emails...</span>
                                    </div>
                                ) : foundEmails.length > 1 ? (
                                    <div className="space-y-2">
                                        <Select
                                            value={showCustomEmailInput ? "custom" : clientEmail}
                                            onValueChange={(val) => {
                                                if (val === "custom") {
                                                    setShowCustomEmailInput(true)
                                                    setClientEmail("")
                                                } else {
                                                    setShowCustomEmailInput(false)
                                                    setClientEmail(val)
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="rounded-sm w-full h-10!">
                                                <SelectValue placeholder="Choisir un email" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {foundEmails.map((email) => (
                                                    <SelectItem key={email} value={email}>
                                                        {email}
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value="custom" className="text-primary font-medium">
                                                    + Saisir manuellement
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {showCustomEmailInput && (
                                            <Input
                                                id="email-custom"
                                                type="email"
                                                placeholder="Saisir l'email du client"
                                                className="rounded-sm animate-in fade-in slide-in-from-top-1 duration-200"
                                                value={clientEmail}
                                                onChange={(e) => setClientEmail(e.target.value)}
                                                autoFocus
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="ex: client@email.com"
                                                className="rounded-sm flex-1"
                                                value={clientEmail}
                                                onChange={(e) => setClientEmail(e.target.value)}
                                            />
                                            <div className="flex flex-col gap-1">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className={cn(
                                                        "h-10 gap-2 px-4 whitespace-nowrap",
                                                        (user?.credit_balance || 0) >= EMAIL_SEARCH_COST
                                                            ? "text-primary border-primary/20 hover:bg-primary/5"
                                                            : "text-destructive border-destructive/20 hover:bg-destructive/5 cursor-not-allowed"
                                                    )}
                                                    onClick={getEmail}
                                                    disabled={isSearchingEmails || !facade?.website || (user?.credit_balance || 0) < EMAIL_SEARCH_COST}
                                                >
                                                    {isSearchingEmails ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <MailSearch className="h-4 w-4" />
                                                    )}
                                                    Trouver l'email
                                                </Button>
                                                <div className={cn(
                                                    "text-[10px] font-semibold px-2 py-0.5 rounded text-center",
                                                    (user?.credit_balance || 0) >= EMAIL_SEARCH_COST
                                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                                        : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                                                )}>
                                                    {EMAIL_SEARCH_COST} crédit{EMAIL_SEARCH_COST > 1 ? 's' : ''}
                                                    {(user?.credit_balance || 0) < EMAIL_SEARCH_COST && " - Insuffisant"}
                                                </div>
                                            </div>
                                        </div>
                                        {!facade?.website && (
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Info className="h-3 w-3" />
                                                Aucun site web disponible pour cette façade
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Téléphone</Label>
                                <Input
                                    id="phone"
                                    placeholder="ex: +33 6 12 34 56 78"
                                    className="rounded-sm"
                                    value={clientPhone}
                                    onChange={(e) => setClientPhone(e.target.value)}
                                />
                            </div>
                        </div>

                    </CardContent>
                </Card>
                {/* select metiers */}
                <Card className="border-none shadow-sm rounded-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-bold">Sélectionner les métiers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {allMetiers.map(metier => {
                                const isSelected = selectedMetierIds.includes(metier.id)
                                return (
                                    <button
                                        key={metier.id}
                                        type="button"
                                        onClick={() => toggleMetier(metier)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-200 text-sm font-semibold",
                                            isSelected
                                                ? "bg-primary border-primary text-white shadow-md active:scale-95"
                                                : "bg-background border-muted hover:border-primary/50 text-muted-foreground hover:text-primary active:scale-95"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-4 w-4 rounded-full flex items-center justify-center border transition-colors",
                                            isSelected ? "bg-white text-primary" : "border-muted-foreground/30 bg-muted"
                                        )}>
                                            <Check className={cn("h-2.5 w-2.5 transition-opacity", isSelected ? "opacity-100" : "opacity-0")} strokeWidth={4} />
                                        </div>
                                        {metier.label}
                                    </button>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>




                {/* Prestation Details */}
                <Card className="border-none shadow-sm rounded-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between gap-1">
                            <CardTitle className="text-sm md:text-lg font-bold">Détails des préstations</CardTitle>
                            <Button
                                variant="outline"
                                onClick={handleAddPrestation}
                                className="h-10 border-2 border-dashed border-border hover:bg-accent/50 flex items-center"
                            >
                                <Plus className="h-4 w-4" />
                                Ajouter
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Prestations Table */}
                            <div className="space-y-3">
                                {prestations.length === 0 ? (
                                    <Empty className="bg-card shadow-sm border mx-auto">
                                        <EmptyHeader>
                                            <EmptyMedia variant="icon">
                                                <Text />
                                            </EmptyMedia>
                                            <EmptyTitle>Aucune prestation</EmptyTitle>
                                            <EmptyDescription>
                                                Vous n'avez pas encore ajouté de prestation. Commencez par ajouter votre première prestation.
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                ) : (
                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="w-[80px]">N°</TableHead>
                                                    <TableHead>Description</TableHead>
                                                    <TableHead className="w-[120px]">Unité</TableHead>
                                                    <TableHead className="w-[100px]">Qté</TableHead>
                                                    <TableHead className="w-[120px]">Prix Unit. (€)</TableHead>
                                                    <TableHead className="w-[120px] text-right">Total HT (€)</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {Object.entries(
                                                    prestations.reduce((acc, p) => {
                                                        const label = p.metierLabel || "Divers"
                                                        if (!acc[label]) acc[label] = []
                                                        acc[label].push(p)
                                                        return acc
                                                    }, {} as Record<string, Prestation[]>)
                                                ).map(([metierLabel, items]: [string, Prestation[]]) => (
                                                    <React.Fragment key={metierLabel}>
                                                        {metierLabel !== "Divers" && (
                                                            <TableRow className="bg-muted/30 border-y">
                                                                <TableCell colSpan={7} className="py-2 px-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                                        <span className="text-sm font-bold text-foreground/80 lowercase first-letter:uppercase">
                                                                            {metierLabel}
                                                                        </span>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                        {items.map((prestation, i) => (
                                                            <TableRow key={prestation.id} className="group">
                                                                <TableCell className="font-medium text-muted-foreground">
                                                                    {i + 1}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        value={prestation.description}
                                                                        onChange={(e) => updatePrestation(prestation.id, "description", e.target.value)}
                                                                        placeholder="Désignation de la prestation"
                                                                        className="h-9 border-transparent hover:border-input focus:border-primary transition-colors bg-transparent focus:bg-background"
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Select
                                                                        value={prestation.unit}
                                                                        onValueChange={(value) => updatePrestation(prestation.id, "unit", value)}
                                                                    >
                                                                        <SelectTrigger className="h-9! bg-transparent border-transparent hover:border-input focus:border-primary">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="m²">m²</SelectItem>
                                                                            <SelectItem value="pièce">pièce</SelectItem>
                                                                            <SelectItem value="unités">unités</SelectItem>
                                                                            <SelectItem value="m">m</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        type="number"
                                                                        value={prestation.quantity}
                                                                        onChange={(e) => updatePrestation(prestation.id, "quantity", e.target.value)}
                                                                        className={cn(
                                                                            "h-9 bg-transparent hover:border-input focus:border-primary text-center",
                                                                            Number(prestation.quantity) <= 0 ? "border-destructive!" : "border-transparent"
                                                                        )}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        type="number"
                                                                        value={prestation.unitPrice}
                                                                        onChange={(e) => updatePrestation(prestation.id, "unitPrice", e.target.value)}
                                                                        className={cn(
                                                                            "h-9 bg-transparent hover:border-input focus:border-primary text-center",
                                                                            Number(prestation.unitPrice) <= 0 ? "border-destructive!" : "border-transparent"
                                                                        )}
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="text-right font-semibold text-foreground">
                                                                    {(Number(prestation.quantity) * Number(prestation.unitPrice)).toFixed(2)}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => duplicatePrestation(prestation.id)}
                                                                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                                            title="Dupliquer"
                                                                        >
                                                                            <Copy className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => removePrestation(prestation.id)}
                                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                            title="Supprimer"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>

                            {/* Total Section */}
                            <div className="flex justify-end pt-6">
                                <div className="w-full max-w-sm p-6 bg-muted/30 rounded-lg space-y-3 border border-border/50">
                                    <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                                        <span>Total HT</span>
                                        <span>{subtotal.toFixed(2)} €</span>
                                    </div>

                                    {tvaRate > 0 && (
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <span>TVA ({tvaRate}%)</span>
                                            </div>
                                            <span>{tvaAmount.toFixed(2)} €</span>
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-border/60 flex justify-between items-center">
                                        <span className="text-lg font-bold text-foreground">Total TTC</span>
                                        <span className="text-2xl font-extrabold text-primary">
                                            {totalTTC.toFixed(2)} €
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>


                {/* Comparison Avant/Après */}
                <Card className="border-none shadow-sm rounded-sm">
                    <CardHeader className="">
                        <CardTitle className="text-lg font-bold flex flex-col md:flex-row items-start gap-2 md:items-center justify-between">
                            Comparaison avant/après
                            <div className="flex items-center gap-3 px-3 py-2 bg-muted/40 rounded-lg border border-border/50">
                                <Switch
                                    id="ia-img"
                                    checked={includeBeforeAfter}
                                    onCheckedChange={setIncludeBeforeAfter}
                                />
                                <Label htmlFor="ia-img" className="text-sm font-semibold cursor-pointer whitespace-nowrap">
                                    à inclure dans le devis
                                </Label>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Image Comparison Placeholder */}
                        <div className="grid grid-cols-1 md:grid-cols-2  gap-2">
                            <div className="relative w-full h-56 md:h-82 bg-muted/20 overflow-hidden rounded-sm border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center group">
                                <span className="absolute bottom-2 left-2 text-foreground/80 text-sm bg-secondary/70 px-2 py-1 rounded-sm z-10 flex items-center gap-2">
                                    Avant (originale)
                                    {availableImages.length > 1 && (
                                        <span className="ml-1 text-xs text-primary font-semibold">
                                            - Image {selectedImageIndex + 1}/{availableImages.length}
                                        </span>
                                    )}
                                </span>

                                {/* Image Selector Button - Only show if multiple images */}
                                {availableImages.length > 1 && (
                                    <Popover open={isImageSelectorOpen} onOpenChange={setIsImageSelectorOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="secondary"
                                                className="absolute top-2 right-2 z-10 h-9 w-9 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 hover:bg-background border-2 border-primary/20"
                                                title="Changer l'image"
                                            >
                                                <Images className="h-4 w-4 text-primary" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[90vw] max-w-2xl p-4" align="end">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-semibold flex items-center gap-2">
                                                        <Images className="h-4 w-4 text-primary" />
                                                        Sélectionner l'image de façade
                                                    </Label>
                                                    <span className="text-xs text-muted-foreground">
                                                        {availableImages.length} images disponibles
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto pr-2">
                                                    {availableImages.map((imageUrl, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedImageIndex(index)
                                                                setIsImageSelectorOpen(false)
                                                            }}
                                                            className={cn(
                                                                "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                                                                selectedImageIndex === index
                                                                    ? "border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30"
                                                                    : "border-border hover:border-primary/50"
                                                            )}
                                                        >
                                                            <img
                                                                src={imageUrl}
                                                                alt={`Façade ${index + 1}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            {selectedImageIndex === index && (
                                                                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                                                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                                                                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="absolute bottom-1 right-1 bg-background/80 text-foreground text-xs px-1.5 py-0.5 rounded">
                                                                {index + 1}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}

                                <img
                                    src={availableImages[selectedImageIndex] || "/facade.png"}
                                    alt="Facade avant"
                                    className="w-full h-full object-fit"
                                />
                            </div>
                            <div className="relative w-full h-56 md:h-82 overflow-hidden bg-muted/20 rounded-sm border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center">
                                <span className="absolute bottom-2 left-2 text-foreground/80 text-sm bg-secondary/70 px-2 py-1 rounded-sm flex items-center gap-2 z-10">Après la simulation <Sparkles className="h-3 w-3 text-primary" /></span>
                                {isGeneratingSimulation ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <PegtopLoader />
                                        <p className="text-sm text-muted-foreground mt-8">Génération IA en cours...</p>
                                    </div>
                                ) : (localSimulationUrl || facade?.scan_facades?.[0]?.simulated_facade_image) ? (
                                    <div className="relative w-full h-full group/simulation">
                                        <img
                                            src={localSimulationUrl || facade.scan_facades[0].simulated_facade_image}
                                            alt="Facade après simulation"
                                            className="w-full h-full object-fit"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/simulation:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 z-20">
                                            <div className="flex flex-col items-center gap-3 w-full max-w-[200px]">
                                                {simulationCostEstimate && (
                                                    <div className={cn(
                                                        "px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 shadow-sm bg-white/90 text-emerald-700 border border-emerald-200"
                                                    )}>
                                                        <Calculator className="h-3 w-3" />
                                                        <span>
                                                            Coût: {simulationCostEstimate.creditsRequired} crédit{simulationCostEstimate.creditsRequired > 1 ? 's' : ''}
                                                            {!simulationCostEstimate.hasEnoughCredits && " (Insuffisant)"}
                                                        </span>
                                                    </div>
                                                )}
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="rounded-xl px-6 py-4 shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-white text-primary hover:bg-white/90 border-none"
                                                    onClick={handleGenerateSimulation}
                                                    disabled={
                                                        isGeneratingSimulation ||
                                                        !facade ||
                                                        (simulationCostEstimate && !simulationCostEstimate.hasEnoughCredits)
                                                    }
                                                >
                                                    <Sparkles className="h-4 w-4 mr-2" />
                                                    <span className="font-bold">Régénérer</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-6 p-8">
                                        <div className="flex flex-col items-center gap-4 text-center">
                                            <p className="text-sm text-muted-foreground font-medium">Aucune simulation disponible</p>
                                            <div className="flex flex-col items-center gap-3 w-full">
                                                {simulationCostEstimate && (
                                                    <div className={cn(
                                                        "px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm",
                                                        simulationCostEstimate.hasEnoughCredits
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                                                            : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
                                                    )}>
                                                        <Calculator className="h-3.5 w-3.5" />
                                                        <span>
                                                            Coût: {simulationCostEstimate.creditsRequired} crédit{simulationCostEstimate.creditsRequired > 1 ? 's' : ''}
                                                            {!simulationCostEstimate.hasEnoughCredits && (
                                                                <span className="ml-1">(Insuffisant)</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                                <Button
                                                    variant="default"
                                                    size="lg"
                                                    className="rounded-xl px-8 py-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-r from-primary to-primary/80"
                                                    onClick={handleGenerateSimulation}
                                                    disabled={
                                                        isGeneratingSimulation ||
                                                        !facade ||
                                                        (simulationCostEstimate && !simulationCostEstimate.hasEnoughCredits)
                                                    }
                                                >
                                                    <Sparkles className="h-5 w-5 mr-2" />
                                                    <span className="font-bold">Créer une simulation</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </CardContent>
                </Card>
                {/* Validité du devis */}
                <Card className="border-2 border-dashed border-border/50 shadow-sm rounded-sm ">
                    <CardHeader className="">
                        <CardTitle className="text-lg font-bold">Informations complémentaires</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2 flex flex-col">
                                <Label htmlFor="valid-until" className="mb-1">Date d'expiration</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full md:w-[280px] justify-start text-left font-normal rounded-sm h-10 border-input",
                                                !validUntil && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {validUntil ? format(validUntil, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={validUntil}
                                            onSelect={setValidUntil}
                                            initialFocus
                                            locale={fr}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <p className="text-xs text-muted-foreground italic mt-2">
                                    Par défaut, le devis est valable 30 jours.
                                </p>
                            </div>

                            <div className="space-y-2 flex flex-col">
                                <Label htmlFor="notes" className="mb-1">Notes et observations</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Précisez ici les conditions particulières, délais de réalisation, ou toute autre information utile..."
                                    className="min-h-[120px] rounded-sm resize-none"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground italic mt-2">
                                    Ces notes seront visibles sur le devis PDF.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {/* Status-dependent Action Buttons */}
                <div className="flex flex-col md:flex-row justify-end gap-4 pt-8">
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <Button

                            disabled={isSavingDraft || isSavingSent}
                            onClick={() => handleCreateDevis(true)}
                            className="h-10 px-8 border-warning/20 dark:border-warning/30 bg-warning/5 dark:bg-warning/10 text-warning hover:bg-warning hover:text-white rounded-xl font-semibold transition-all w-full md:w-auto shadow-sm"
                        >
                            {isSavingDraft ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <FileText className="h-5 w-5" />
                            )}
                            {isSavingDraft ? "Enregistrement..." : "Enregistrer en brouillon"}
                        </Button>
                        <Button
                            disabled={isSavingSent || isSavingDraft}
                            onClick={() => handleCreateDevis(false)}
                            className="h-10 px-10 bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] rounded-xl font-bold shadow-xl shadow-primary/20 transition-all w-full md:w-auto"
                        >
                            {isSavingSent ? (
                                <Loader2 className="h-5 w-5  animate-spin" />
                            ) : (
                                <FileText className="h-5 w-5 " />
                            )}
                            {isSavingSent ? "Enregistrement..." : "Valider le devis"}
                        </Button>
                    </div>
                </div>
            </div>
        </div >
    )
}