import React, { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "react-hot-toast"
import { DevisServiceInstance } from "@/services/artisan/devisService"
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

import { ArrowLeft, Plus, Trash2, Download, Send, Sparkles, FileText, Text, Loader2, CalendarIcon, Info, Copy, Check, Calculator, Images } from "lucide-react"
import { GeminiSimulationServiceInstance, SimulationCostCalculator } from "@/services/gemini-ai"
import { PegtopLoader } from "@/components/ui/pegtop-loader"
import { FacadeServiceInstance } from "@/services/artisan/facadeService"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
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
import { FacadesServiceInstance } from "@/services/admin/facadesSevices"

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

export const EditDevis = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [prestations, setPrestations] = useState<Prestation[]>([])
    const [includeBeforeAfter, setIncludeBeforeAfter] = useState(true)
    const [clientName, setClientName] = useState("")
    const [clientEmail, setClientEmail] = useState("")
    const [clientPhone, setClientPhone] = useState("")
    const [clientAddress, setClientAddress] = useState("")
    const [quoteNumber, setQuoteNumber] = useState("")
    const [tvaRate, setTvaRate] = useState(20)
    const [validUntil, setValidUntil] = useState<Date | undefined>(undefined)
    const [notes, setNotes] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [facadeId, setFacadeId] = useState<string | undefined>(undefined)
    const [facade, setFacade] = useState<any>(null)
    const { pathname } = useLocation()
    const { user } = useAuth()
    const [allMetiers, setAllMetiers] = useState<any[]>([])
    const [selectedMetierIds, setSelectedMetierIds] = useState<string[]>([])
    const [artisanConfigs, setArtisanConfigs] = useState<any[]>([])
    const [isGeneratingSimulation, setIsGeneratingSimulation] = useState(false)
    const [localSimulationUrl, setLocalSimulationUrl] = useState<string | null>(null)
    const [simulationCostEstimate, setSimulationCostEstimate] = useState<{
        creditsRequired: number
        hasEnoughCredits: boolean
    } | null>(null)
    const [availableImages, setAvailableImages] = useState<string[]>([])
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false)
    const isAutoEntrepreneur = user?.is_entreprise === false

    // Fetch Devis Data and Artisan Metiers
    useEffect(() => {
        const fetchData = async () => {
            if (!id || !user?.id) return;
            try {
                // Fetch both in parallel
                const [devisRes, artisanMetiersRes] = await Promise.all([
                    DevisServiceInstance.getDevisById(id),
                    DevisServiceInstance.getArtisanMetiers(user.id)
                ])

                const data = devisRes.data
                const artisanMetiersData = artisanMetiersRes.data || []

                // Map Artisan Metiers
                const mappedMetiers = artisanMetiersData.map((m: any) => ({
                    id: m.metier_id,
                    profileMetierId: m.id,
                    label: m.metiers?.label || "Sans catégorie",
                    tariffs: m.tariffs || []
                }))
                setAllMetiers(mappedMetiers)
                setArtisanConfigs(artisanMetiersData)

                if (data) {
                    setQuoteNumber(data.quote_number || "")
                    setClientName(data.client_name || "")
                    setClientEmail(data.client_email || "")
                    setClientPhone(data.client_phone || "")
                    setClientAddress(data.client_address?.address || "")
                    setTvaRate(Number(data.tax_rate) * 100)

                    // 1. Get existing items from devis
                    const prestationsMetadata = data.metadata?.prestations_data || []
                    const existingItems = (data.items || []).map((item: any, idx: number) => {
                        const meta = prestationsMetadata[idx] || {}
                        const currentLabel = meta.metierLabel || item.metier_label || item.metierLabel || "Divers"
                        const matchingArtisanMetier = mappedMetiers.find((m: any) => m.label === currentLabel)

                        return {
                            id: item.id || String(Date.now() + Math.random()),
                            description: item.description || "",
                            unit: item.unit || "m²",
                            quantity: item.quantity || 0,
                            unitPrice: item.unit_price_cents ? item.unit_price_cents / 100 : 0,
                            metierId: meta.metierId || item.metier_id || item.metierId,
                            metierLabel: currentLabel === "Prestations supplémentaires" ? "Divers" : currentLabel,
                            realMetierId: meta.realMetierId || matchingArtisanMetier?.id
                        }
                    })

                    // 2. Identify which artisan métiers are already present
                    const presentMetierIds = new Set(existingItems.filter(p => p.realMetierId).map(p => p.realMetierId))

                    // 3. Prepare initial prestations: Existing items + missing artisan métiers
                    const initialPrestations = [...existingItems]

                    for (const metier of mappedMetiers) {
                        if (!presentMetierIds.has(metier.id)) {
                            // This métier is assigned to the artisan but not in this devis yet
                            // Add it as default selection
                            if (metier.tariffs.length > 0) {
                                const items = metier.tariffs.map((t: any) => ({
                                    id: t.id + "-" + Date.now(),
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
                    }

                    setPrestations(initialPrestations)
                    setSelectedMetierIds(mappedMetiers.map(m => m.id)) // All artisan métiers selected by default

                    if (data.items?.[0]?.facade_id) setFacadeId(data.items[0].facade_id)
                    if (data.metadata?.facade_id) setFacadeId(data.metadata.facade_id)
                    setIncludeBeforeAfter(data.includeBeforeAfter ?? true)
                    if (data.valid_until) setValidUntil(new Date(data.valid_until))
                    if (data.metadata?.notes) setNotes(data.metadata.notes)
                }
            } catch (error) {
                console.error("Error fetching data:", error)
                toast.error("Impossible de charger les données")
                navigate("/devis")
            }
        }
        fetchData()
    }, [id, user?.id, navigate])

    // Load simulation cost estimate
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

    // Fetch facade data when facadeId is available
    useEffect(() => {
        const fetchFacade = async () => {
            if (!facadeId) return
            try {
                const facadeData = await FacadesServiceInstance.getFacadeById(facadeId)

                // Handle streetview images
                if (facadeData.streetview_url) {
                    try {
                        const urls = JSON.parse(facadeData.streetview_url)
                        if (Array.isArray(urls) && urls.length > 0) {
                            setAvailableImages(urls)
                            setSelectedImageIndex(0)
                        }
                    } catch (error) {
                        console.error("Error parsing streetview_url:", error)
                    }
                }

                setFacade(facadeData)
            } catch (error) {
                console.error("Error fetching facade:", error)
            }
        }
        fetchFacade()
    }, [facadeId])

    const handleGenerateSimulation = async () => {
        if (!facade || !user?.id) return

        if (simulationCostEstimate && !simulationCostEstimate.hasEnoughCredits) {
            toast.error(`Crédits insuffisants. Requis: ${simulationCostEstimate.creditsRequired}, Disponibles: ${user.credit_balance || 0}`)
            return
        }

        const scanFacadeId = facade.scan_facades?.[0]?.id
        if (!scanFacadeId) {
            toast.error("Aucune relation scan_facade trouvée")
            return
        }

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
                setLocalSimulationUrl(result.localImageUrl)
                // We pass the scan slug if available from the facade data
                await FacadeServiceInstance.updateScanFacadeSimulationImage(result.localImageUrl, facade.id, facade.scan?.slug || "")
                toast.success("Simulation générée avec succès")
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


    // Calculate totals
    const subtotal = prestations.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0)

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
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        })
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

    const handleUpdateDevis = async () => {
        if (!id) return;

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

        setIsSaving(true)
        try {
            // 2. Prepare Payload
            const payload = {
                client_name: clientName,
                client_email: clientEmail,
                client_phone: clientPhone,
                client_address: clientAddress ? { address: clientAddress } : {},
                subtotal_cents: Math.round(subtotal * 100),
                tax_rate: tvaRate / 100,
                tax_cents: Math.round(tvaAmount * 100),
                total_cents: Math.round(totalTTC * 100),
                metadata: {
                    includeBeforeAfter,
                    facade_id: facadeId,
                    notes: notes,
                    metiers: allMetiers.filter(m => selectedMetierIds.includes(m.id)).map(m => m.label),
                    prestations_data: prestations.map(p => ({
                        metierId: p.metierId,
                        metierLabel: p.metierLabel,
                        realMetierId: p.realMetierId
                    }))
                },
                valid_until: validUntil ? validUntil.toISOString().split('T')[0] : null
            }

            // 3. Call Service (Update quote and quote items)
            const { data } = await DevisServiceInstance.updateDevis(id, payload, prestations, facadeId)

            if (data) {
                toast.success("Devis mis à jour")
                // Redirect to detail page
                navigate(`/devis/${data.id}`)
            }
        } catch (error) {
            console.error("Error updating devis:", error)
            toast.error("Erreur lors de la mise à jour du devis")
        } finally {
            setIsSaving(false)
        }
    }


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
                            <BreadcrumbPage>Modifier le devis {quoteNumber}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                {/* Header */}
                <div className="flex items-center  gap-2 mb-6">
                    <Link to="/devis">
                        <ArrowLeft className="h-6 w-6 text-foreground bg-muted rounded-full p-1" />
                    </Link>
                    <h1 className="text-3xl font-bold text-foreground/70">Modifier le devis {quoteNumber}</h1>
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
                                    onChange={(e) => setClientAddress(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="ex: client@email.com"
                                    className="rounded-sm"
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                />
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
                                                                            <SelectItem value="m">m</SelectItem>
                                                                            <SelectItem value="forfait">forfait</SelectItem>
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
                                    inclure les photos avant/après en pièce jointe
                                </Label>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Image Comparison */}
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
                                                                        <Check className="h-4 w-4" strokeWidth={4} />
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
                                    src={availableImages[selectedImageIndex] || (facade?.streetview_url ? JSON.parse(facade.streetview_url)[0] : "/facade.png")}
                                    alt="Facade avant"
                                    className="w-full h-full object-cover"
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
                                            className="w-full h-full object-cover"
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
                    <CardHeader className="pb-4">
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
                            disabled={isSaving}
                            onClick={handleUpdateDevis}
                            className="h-10 px-10 bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] rounded-xl font-bold shadow-xl shadow-primary/20 transition-all w-full md:w-auto"
                        >
                            {isSaving ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <FileText className="h-5 w-5" />
                            )}
                            {isSaving ? "Mise à jour..." : "Enregistrer"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}