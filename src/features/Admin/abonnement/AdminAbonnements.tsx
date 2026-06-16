import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Plus, Pencil, Trash2, MoreVertical, Loader2, X, FileText, Settings, Euro, List, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { ColumnDef } from "@tanstack/react-table"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import type { CreditPack, Plan } from "@/types/PlansTypes"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlansServiceInstance } from "@/services/admin/plansServices"
import { TableSkeleton } from "@/components/TableSkeleton"
import toast from "react-hot-toast"
import { DEFAULT_FEATURES } from "@/constants"
import { DeleteModal } from "@/components/DeleteModel"
import { PackServiceInstance } from "@/services/admin/PackService"

export default function AdminAbonnements() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [packs, setPacks] = useState<CreditPack[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [currentPlan, setCurrentPlan] = useState<Partial<Plan> | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [planToDelete, setPlanToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    // Form state
    const [formData, setFormData] = useState<Partial<Plan>>({
        type: "starter",
        name: "",
        slug: "",
        price_cents: 0,
        monthly_credit: 0,
        currency: "EUR",
        stripe_price_id: "",
        features: DEFAULT_FEATURES,
        sub_features: [],
        active: true,
        is_public: true,
        description: ""
    })

    // Sub-features state (array of strings)
    const [newSubFeature, setNewSubFeature] = useState("")
    const [editingSubFeatureIndex, setEditingSubFeatureIndex] = useState<number | null>(null)
    const [editingSubFeatureValue, setEditingSubFeatureValue] = useState("")

    // Pack Dialog State
    const [isPackDialogOpen, setIsPackDialogOpen] = useState(false)
    const [currentPack, setCurrentPack] = useState<Partial<CreditPack> | null>(null)
    const [isPackEditing, setIsPackEditing] = useState(false)
    const [packFormData, setPackFormData] = useState<Partial<CreditPack>>({
        name: "",
        slug: "",
        price_cents: 0,
        credit_amount: 0,
        currency: "EUR",
        active: true,
        is_public: true,
        description: ""
    })
    const [packErrors, setPackErrors] = useState<Record<string, string>>({})

    // Pack Delete State
    const [isPackDeleteModalOpen, setIsPackDeleteModalOpen] = useState(false)
    const [packToDelete, setPackToDelete] = useState<string | null>(null)

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                setIsLoading(true)
                const result = await PlansServiceInstance.getPlans()
                setPlans(result.data)
            } catch (error) {
                console.error("Error fetching plans:", error)
            } finally {
                setIsLoading(false)
            }
        }
        const fetchPacks = async () => {
            try {
                setIsLoading(true)
                const result = await PackServiceInstance.getPacks()
                setPacks(result.data)
            } catch (error) {
                console.error("Error fetching packs:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchPlans()
        fetchPacks()
    }, [])

    // Auto-generate slug from name
    useEffect(() => {
        if (formData.name && !isEditing) {
            const slug = formData.name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // Remove accents
                .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
                .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
            setFormData(prev => ({ ...prev, slug }))
        }
    }, [formData.name, isEditing])

    // Auto-generate slug from pack name
    useEffect(() => {
        if (packFormData.name && !isPackEditing) {
            const slug = packFormData.name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")
            setPackFormData(prev => ({ ...prev, slug }))
        }
    }, [packFormData.name, isPackEditing])

    const handleAddSubFeature = () => {
        if (newSubFeature.trim()) {
            setFormData({
                ...formData,
                sub_features: [...(formData.sub_features || []), newSubFeature.trim()]
            })
            setNewSubFeature("")
        }
    }

    const startEditingSubFeature = (index: number) => {
        setEditingSubFeatureIndex(index)
        setEditingSubFeatureValue(formData.sub_features?.[index] || "")
    }

    const saveEditedSubFeature = (index: number, newValue: string) => {
        if (newValue.trim()) {
            const updatedFeatures = [...(formData.sub_features || [])]
            updatedFeatures[index] = newValue.trim()
            setFormData({ ...formData, sub_features: updatedFeatures })
        }
        setEditingSubFeatureIndex(null)
    }

    const cancelEditingSubFeature = () => {
        setEditingSubFeatureIndex(null)
    }

    const removeSubFeature = (index: number) => {
        setFormData({
            ...formData,
            sub_features: formData.sub_features?.filter((_, i) => i !== index)
        })
    }

    const handleFeatureChange = (key: string, value: string | number | boolean) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features?.map(f =>
                f.key === key ? { ...f, value: value } : f
            )
        }))
    }

    const handleOpenDialog = (plan?: Plan) => {
        if (plan) {
            setIsEditing(true)
            setCurrentPlan(plan)

            let initializedFeatures = DEFAULT_FEATURES.map(def => ({ ...def }));

            if (Array.isArray(plan.features)) {
                initializedFeatures = plan.features.map(f => {
                    const def = DEFAULT_FEATURES.find(d => d.key === f.key);
                    return def ? { ...def, value: f.value ?? def.value } : f;
                });
            } else if (plan.features && typeof plan.features === 'object') {
                initializedFeatures = DEFAULT_FEATURES.map(def => ({
                    ...def,
                    value: (plan.features as any)[def.key] ?? def.value
                }));
            }

            setFormData({
                ...plan,
                features: initializedFeatures
            })
        } else {
            setIsEditing(false)
            setCurrentPlan(null)
            setFormData({
                name: "",
                slug: "",
                price_cents: 0,
                monthly_credit: 0,
                currency: "EUR",
                stripe_price_id: "",
                features: DEFAULT_FEATURES.map(def => ({ ...def })),
                sub_features: [],
                active: true,
                is_public: true,
                description: ""
            })
        }
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        setIsLoading(true)
        try {
            if (isEditing && currentPlan && currentPlan.id) {
                const updatedPlan = await PlansServiceInstance.updatePlan(currentPlan.id, formData as Plan)
                setPlans(plans.map(p => p.id === currentPlan.id ? updatedPlan : p))
            } else {
                const newPlan = await PlansServiceInstance.createPlan(formData as Plan)
                setPlans([...plans, newPlan])
            }
            setIsDialogOpen(false)
            toast.success("Plan enregistré avec succès")
        } catch (error) {
            console.error("Error saving plan:", error)
            toast.error("Erreur lors de l'enregistrement du plan")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = (id: string) => {
        setPlanToDelete(id)
        setIsDeleteModalOpen(true)
    }

    const executeDelete = async () => {
        if (!planToDelete) return
        setIsDeleting(true)
        try {
            await PlansServiceInstance.deletePlan(planToDelete)
            setPlans(plans.filter(p => p.id !== planToDelete))
            toast.success("Plan supprimé avec succès")
            setIsDeleteModalOpen(false)
        } catch (error) {
            console.error("Error deleting plan:", error)
            toast.error("Erreur lors de la suppression du plan")
        } finally {
            setIsDeleting(false)
            setPlanToDelete(null)
        }
    }

    const handleOpenPackDialog = (pack?: CreditPack) => {
        setPackErrors({})
        if (pack) {
            setIsPackEditing(true)
            setCurrentPack(pack)
            setPackFormData({ ...pack })
        } else {
            setIsPackEditing(false)
            setCurrentPack(null)
            setPackFormData({
                name: "",
                slug: "",
                price_cents: 0,
                credit_amount: 0,
                currency: "EUR",
                active: true,
                is_public: true,
                description: ""
            })
        }
        setIsPackDialogOpen(true)
    }

    const handleSavePack = async () => {
        // Validation
        const errors: Record<string, string> = {}
        if (!packFormData.name?.trim()) {
            errors.name = "Le nom du pack est requis"
        }
        if (packFormData.price_cents === undefined || packFormData.price_cents <= 0) {
            errors.price_cents = "Le prix doit être supérieur à 0"
        }
        if (packFormData.credit_amount === undefined || packFormData.credit_amount <= 0) {
            errors.credit_amount = "Le nombre de crédits doit être supérieur à 0"
        }

        if (Object.keys(errors).length > 0) {
            setPackErrors(errors)
            toast.error("Veuillez corriger les erreurs")
            return
        }

        setPackErrors({})
        try {
            if (isPackEditing && currentPack && currentPack.id) {
                const updatedPack = await PackServiceInstance.UpdatePack(currentPack.id, packFormData)
                setPacks(packs.map(p => p.id === currentPack.id ? updatedPack : p))
                toast.success("Pack mis à jour")
            } else {
                const newPack = await PackServiceInstance.createPack(packFormData)
                setPacks([...packs, newPack])
                toast.success("Pack créé")
            }
            setIsPackDialogOpen(false)
        } catch (error) {
            console.error("Error saving pack:", error)
            toast.error("Erreur lors de l'enregistrement du pack")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeletePack = (id: string) => {
        setPackToDelete(id)
        setIsPackDeleteModalOpen(true)
    }

    const executeDeletePack = async () => {
        if (!packToDelete) return
        setIsDeleting(true)
        try {
            await PackServiceInstance.deletePack(packToDelete)
            setPacks(packs.filter(p => p.id !== packToDelete))
            toast.success("Pack supprimé")
            setIsPackDeleteModalOpen(false)
        } catch (error) {
            console.error("Error deleting pack:", error)
            toast.error("Erreur lors de la suppression")
        } finally {
            setIsDeleting(false)
            setPackToDelete(null)
        }
    }

    const packColumns: ColumnDef<CreditPack>[] = [
        {
            accessorKey: "n",
            header: "N°",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-semibold">{row.index + 1}</span>
                </div>
            )
        },
        {
            accessorKey: "name",
            header: "Nom du pack",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold">{row.original.name}</span>
                    <span className="text-xs text-muted-foreground">{row.original.slug}</span>
                </div>
            )
        },
        {
            accessorKey: "price_cents",
            header: "Prix",
            cell: ({ row }) => (
                <div className="font-medium">
                    {(row.original.price_cents / 100).toFixed(2)} €
                </div>
            )
        },
        {
            accessorKey: "credit_amount",
            header: "Crédits",
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.original.credit_amount}
                </div>
            )
        },
        {
            accessorKey: "active",
            header: "État",
            cell: ({ row }) => (
                <Switch
                    checked={row.original.active}
                    onCheckedChange={async (checked) => {
                        const updatedPack = { ...row.original, active: checked }
                        setPacks((prev) => prev.map((p) => (p.id === row.original.id ? updatedPack : p)))
                        try {
                            await PackServiceInstance.UpdatePack(updatedPack.id, updatedPack)
                            toast.success("Statut du pack mis à jour")
                        } catch (error) {
                            console.error("Error updating pack:", error)
                            toast.error("Erreur lors de la mise à jour")
                            setPacks((prev) => prev.map((p) => (p.id === row.original.id ? row.original : p)))
                        }
                    }}
                />
            )
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="cursor-pointer group hover:text-white!" onClick={() => handleOpenPackDialog(row.original)}>
                                <Pencil className="mr-2 h-4 w-4 group-hover:text-white" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="group text-destructive hover:bg-destructive! hover:text-white cursor-pointer" onClick={() => handleDeletePack(row.original.id)}>
                                <Trash2 className="mr-2 h-4 w-4 text-destructive group-hover:text-white" /> Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ]

    const columns: ColumnDef<Plan>[] = [
        {
            accessorKey: "n",
            header: "N°",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-semibold">{row.index + 1}</span>
                </div>
            )
        },
        {
            accessorKey: "name",
            header: "Nom du plan",
            cell: ({ row }) => {
                const IconComponent = row.original.icon as React.ComponentType<{ className?: string }>;
                return (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            {IconComponent && <IconComponent className="h-4 w-4 text-muted-foreground" />}
                            <span className="font-semibold">{row.original.name}</span>
                        </div>
                        <span>{row.original.type}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "priceCents",
            header: "Prix",
            cell: ({ row }) => (
                <div className="font-medium">
                    {(row.original.price_cents / 100).toFixed(2)} €
                </div>
            )
        },
        {
            accessorKey: "monthlyCredit",
            header: "Crédits/Mois",
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.original.monthly_credit}
                </div>
            )
        },
        {
            accessorKey: "features",
            header: "Fonctionnalités",
            cell: ({ row }) => {
                const features = row.original.features;
                const subFeatures = row.original.sub_features;

                const normalizedFeatures = Array.isArray(features)
                    ? features
                    : DEFAULT_FEATURES.map(def => ({ ...def, value: (features as any)?.[def.key] }));

                return (
                    <div className="flex flex-col gap-2 max-w-[400px] py-1">
                        <div className="flex flex-wrap gap-2">
                            {normalizedFeatures.map((def, i) => {
                                if (def.value === undefined || def.value === null) return null;
                                if (typeof def.value === 'boolean' || def.type === 'boolean') {
                                    return (
                                        def.value ?
                                            <Badge key={i} variant="success" className="gap-1.5 rounded-md px-2 py-0.5 font-normal bg-success/10 text-success hover:bg-success/20 border-success/20 border">
                                                <Check className="h-3 w-3" />
                                                {def.label}
                                            </Badge>
                                            : <Badge key={i} variant="destructive" className="gap-1.5 rounded-md px-2 py-0.5 font-normal bg-destructive/20! text-destructive hover:bg-destructive/20 border-destructive/20 border">
                                                <X className="h-3 w-3" />
                                                {def.label}
                                            </Badge>
                                    )
                                }
                                return (
                                    <div key={i} className="inline-flex items-center h-6 text-xs border rounded-md  overflow-hidden">
                                        <div className="px-2.5 h-full flex items-center bg-muted/60 text-muted-foreground font-medium border-r">
                                            {def.label}
                                        </div>
                                        <div className="px-2.5 h-full flex items-center bg-background font-bold text-foreground">
                                            {String(def.value)}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        {subFeatures && subFeatures.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 ">
                                {subFeatures.map((feature, index) => (
                                    <span key={index} className="inline-flex items-center rounded-sm bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-gray-500/10">
                                        {feature}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )
            }
        },
        {
            accessorKey: "isActive",
            header: "État",
            cell: ({ row }) => (
                <Switch
                    checked={row.original.active}
                    onCheckedChange={async (checked) => {
                        const updatedPlan = { ...row.original, active: checked }
                        setPlans((prev) => prev.map((p) => (p.id === row.original.id ? updatedPlan : p)))
                        try {
                            await PlansServiceInstance.updatePlan(updatedPlan.id, updatedPlan)
                            toast.success("Statut mis à jour avec succès")
                        } catch (error) {
                            console.error("Error updating plan:", error)
                            toast.error("Erreur lors de la mise à jour")
                            setPlans((prev) => prev.map((p) => (p.id === row.original.id ? row.original : p)))
                        }
                    }}
                />
            )
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="cursor-pointer group  hover:text-white!" onClick={() => handleOpenDialog(row.original)}>
                                <Pencil className="mr-2 h-4 w-4  group-hover:text-white" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="group text-destructive hover:bg-destructive! hover:text-white cursor-pointer" onClick={() => handleDelete(row.original.id)}>
                                <Trash2 className="mr-2 h-4 w-4 text-destructive group-hover:text-white" /> Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ]

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
            </div>

            <div className="relative mx-auto px-6 py-8">
                <header className="mb-7 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground/70">Gestion des abonnements</h1>
                        <p className="text-muted-foreground mt-1">Configurez les plans visibles par les artisans</p>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="mr-2 h-4 w-4" /> Nouveau plan
                    </Button>
                </header>

                <div className="bg-card rounded-md border shadow-sm">
                    {isLoading ? (
                        <TableSkeleton />
                    ) : plans.length === 0 ? (
                        <Empty className="">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Loader2 className="animate-spin" />
                                </EmptyMedia>
                                <EmptyTitle>Aucun plan configuré</EmptyTitle>
                                <EmptyDescription>Créez votre premier plan d'abonnement.</EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <DataTable columns={columns} data={plans} />
                    )}
                </div>

                <header className="mb-7 mt-12 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-foreground/70">Gestion des packs de crédits</h2>
                        <p className="text-muted-foreground mt-1">Configurez les packs de crédits rechargeables</p>
                    </div>
                    <Button variant="outline" onClick={() => handleOpenPackDialog()}>
                        <Plus className="mr-2 h-4 w-4" /> Nouveau pack
                    </Button>
                </header>

                <div className="bg-card rounded-md border shadow-sm">
                    {isLoading ? (
                        <TableSkeleton />
                    ) : packs.length === 0 ? (
                        <Empty className="">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <List className="h-8 w-8 text-muted-foreground" />
                                </EmptyMedia>
                                <EmptyTitle>Aucun pack configuré</EmptyTitle>
                                <EmptyDescription>Créez votre premier pack de crédits.</EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <DataTable columns={packColumns} data={packs} />
                    )}
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[600px] max-h-[95vh] flex flex-col p-0 overflow-hidden">
                        <DialogHeader className="p-6 pb-2 shrink-0">
                            <DialogTitle>{isEditing ? "Modifier le plan" : "Créer un nouveau plan"}</DialogTitle>
                            <DialogDescription>
                                Configurez les détails du plan d'abonnement.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="px-6 py-4 flex-1 overflow-hidden flex flex-col">
                            <Tabs defaultValue="general" className="w-full flex-1 flex flex-col overflow-hidden">
                                <TabsList className="grid w-full grid-cols-3 shrink-0">
                                    <TabsTrigger value="general" className="flex items-center gap-2">
                                        <Settings className="h-4 w-4" />
                                        Général
                                    </TabsTrigger>
                                    <TabsTrigger value="pricing" className="flex items-center gap-2">
                                        <Euro className="h-4 w-4" />
                                        Tarification
                                    </TabsTrigger>
                                    <TabsTrigger value="features" className="flex items-center gap-2">
                                        <List className="h-4 w-4" />
                                        Fonctionnalités
                                    </TabsTrigger>
                                </TabsList>
                                <ScrollArea className="w-full mt-4 pr-4 h-[50vh]">
                                    <TabsContent value="general" className="mt-0 space-y-4 px-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="type">Type de plan</Label>
                                                <Select
                                                    value={formData.type || ""}
                                                    onValueChange={(value: "starter" | "professional" | "enterprise") =>
                                                        setFormData({ ...formData, type: value })
                                                    }
                                                >
                                                    <SelectTrigger className="w-full h-10! bg-card!">
                                                        <SelectValue placeholder="Sélectionner un type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="starter">Débutant</SelectItem>
                                                        <SelectItem value="professional">Professionnel</SelectItem>
                                                        <SelectItem value="enterprise">Entreprise</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Nom du plan</Label>
                                                <Input
                                                    id="name"
                                                    className="bg-card!"
                                                    value={formData.name || ""}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    placeholder="Ex: Pack Premium"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="slug">Slug (URL)</Label>
                                            <Input
                                                id="slug"
                                                value={formData.slug || ""}
                                                readOnly
                                                placeholder="Généré automatiquement..."
                                                className="bg-muted/50 cursor-not-allowed "
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description (Interne/Admin)</Label>
                                            <Textarea
                                                id="description"
                                                value={formData.description || ""}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Description du plan..."
                                                className="min-h-[100px] bg-card!"
                                            />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="pricing" className="mt-0 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="price">Prix (€)</Label>
                                                <div className="relative">
                                                    <Euro className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="price"
                                                        type="number"
                                                        step="0.01"
                                                        className="pl-9 bg-card!"
                                                        value={formData.price_cents ? formData.price_cents / 100 : 0}
                                                        onChange={(e) => setFormData({ ...formData, price_cents: Math.round(Number(e.target.value) * 100) })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="credits">Crédits inclus</Label>
                                                <Input
                                                    id="credits"
                                                    type="number"
                                                    className="bg-card!"
                                                    value={formData.monthly_credit || 0}
                                                    onChange={(e) => setFormData({ ...formData, monthly_credit: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="stripe_price_id">Stripe Price ID</Label>
                                            <Input
                                                id="stripe_price_id"
                                                className="bg-card!"
                                                value={formData.stripe_price_id || ""}
                                                onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
                                                placeholder="price_..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-base">Configuration</Label>
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between bg-card! p-2 rounded-sm">
                                                    <div className="space-y-0.5">
                                                        <Label htmlFor="active" className="text-sm">Activer le plan</Label>
                                                        <p className="text-xs text-muted-foreground">Rendre le plan disponible dans l'application</p>
                                                    </div>
                                                    <Switch
                                                        id="active"
                                                        checked={formData.active || false}
                                                        onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between bg-card! p-2 rounded-sm">
                                                    <div className="space-y-0.5">
                                                        <Label htmlFor="public" className="text-sm">Visible publiquement</Label>
                                                        <p className="text-xs text-muted-foreground">Afficher sur la page des tarifs</p>
                                                    </div>
                                                    <Switch
                                                        id="public"
                                                        checked={formData.is_public || false}
                                                        onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between bg-card! p-2 rounded-sm">
                                                    <div className="space-y-0.5">
                                                        <Label htmlFor="popular" className="text-sm">Marquer populaire</Label>
                                                        <p className="text-xs text-muted-foreground">Mettre en avant ce plan</p>
                                                    </div>
                                                    <Switch
                                                        id="popular"
                                                        checked={formData.isPopular || false}
                                                        onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="features" className="mt-0 space-y-6 pb-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="text-base font-semibold">Caractéristiques </Label>
                                                    <p className="text-xs text-muted-foreground mt-1">Définissez les limites et paramètres du plan</p>
                                                </div>
                                            </div>

                                            <div className="grid gap-4 bg-card rounded-lg border p-4">
                                                {formData.features?.map((def) => (
                                                    <div key={def.key} className="flex items-center gap-4">
                                                        <Label htmlFor={`feature-${def.key}`} className="text-base grow font-medium">
                                                            {def.label} :
                                                        </Label>
                                                        {def.type === "boolean" ? (
                                                            <Switch
                                                                id={`feature-${def.key}`}
                                                                checked={!!def.value}
                                                                onCheckedChange={(checked) => handleFeatureChange(def.key, checked)}
                                                            />
                                                        ) : (
                                                            <Input
                                                                id={`feature-${def.key}`}
                                                                type="number"
                                                                min="1"
                                                                value={(def.value as number | string) ?? 0}
                                                                onChange={(e) => handleFeatureChange(def.key, e.target.value === "" ? 0 : Number(e.target.value))}
                                                                className="w-32 h-8 font-medium"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-4 border-t">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="text-base font-semibold">Fonctionnalités Incluses</Label>
                                                    <p className="text-xs text-muted-foreground mt-1">Liste des avantages et services inclus</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Input
                                                    value={newSubFeature}
                                                    className="bg-card"
                                                    onChange={(e) => setNewSubFeature(e.target.value)}
                                                    placeholder="Nouvelle fonctionnalité"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddSubFeature();
                                                        }
                                                    }}
                                                />
                                                <Button type="button" onClick={handleAddSubFeature} size="icon">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="space-y-2 mt-3">
                                                {formData.sub_features && formData.sub_features.length > 0 ? (
                                                    formData.sub_features.map((feature, index) => (
                                                        <div key={index} className="flex items-center justify-between bg-muted/40 p-3 border-dashed rounded-lg border text-sm group hover:border-primary/50 transition-colors">
                                                            {editingSubFeatureIndex === index ? (
                                                                <div className="flex items-center gap-2 w-full">
                                                                    <Input
                                                                        value={editingSubFeatureValue}
                                                                        onChange={(e) => setEditingSubFeatureValue(e.target.value)}
                                                                        className="h-8 text-sm"
                                                                        autoFocus
                                                                        onBlur={() => saveEditedSubFeature(index, editingSubFeatureValue)}
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="secondary"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-green-600"
                                                                        onClick={() => saveEditedSubFeature(index, editingSubFeatureValue)}
                                                                    >
                                                                        <Check className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="flex items-center gap-2">
                                                                        <Check className="h-4 w-4 text-primary" />
                                                                        <span className="font-medium">{feature}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                                        <Button
                                                                            type="button"
                                                                            variant="secondary"
                                                                            size="icon"
                                                                            className="h-7 w-7"
                                                                            onClick={() => startEditingSubFeature(index)}
                                                                        >
                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant="secondary"
                                                                            size="icon"
                                                                            className="h-7 w-7 text-destructive"
                                                                            onClick={() => removeSubFeature(index)}
                                                                        >
                                                                            <X className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <Empty className="py-3! border-dashed border rounded-md bg-card">
                                                        <EmptyHeader>
                                                            <EmptyMedia variant="icon" className="w-10 h-10 mb-2 mx-auto bg-muted rounded-full">
                                                                <FileText className="h-5 w-5 text-muted-foreground" />
                                                            </EmptyMedia>
                                                            <EmptyTitle className="text-sm font-medium">Aucune fonctionnalité</EmptyTitle>
                                                            <EmptyDescription className="text-xs">Ajoutez des fonctionnalités incluses dans ce plan.</EmptyDescription>
                                                        </EmptyHeader>
                                                    </Empty>
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>
                                </ScrollArea>
                            </Tabs>
                        </div>

                        <DialogFooter className="p-6 py-2 shrink-0">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                            <Button onClick={handleSave} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Mettre à jour" : "Créer le plan"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isPackDialogOpen} onOpenChange={setIsPackDialogOpen}>
                    <DialogContent className="sm:max-w-[450px]">
                        <DialogHeader>
                            <DialogTitle>{isPackEditing ? "Modifier le pack" : "Nouveau pack de crédits"}</DialogTitle>
                            <DialogDescription>
                                Définissez les détails du pack de crédits.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="pack-name" className={cn(packErrors.name && "text-destructive")}>
                                    Nom du pack <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="pack-name"
                                    value={packFormData.name || ""}
                                    onChange={(e) => {
                                        setPackFormData({ ...packFormData, name: e.target.value })
                                        if (packErrors.name) setPackErrors({ ...packErrors, name: "" })
                                    }}
                                    placeholder="Ex: Petit Pack"
                                    className={cn(packErrors.name && "border-destructive focus-visible:ring-destructive")}
                                />
                                {packErrors.name && <p className="text-xs text-destructive font-medium">{packErrors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pack-slug">Slug</Label>
                                <Input
                                    id="pack-slug"
                                    value={packFormData.slug || ""}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pack-price" className={cn(packErrors.price_cents && "text-destructive")}>
                                        Prix (€) <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="pack-price"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={packFormData.price_cents ? packFormData.price_cents / 100 : ""}
                                        onChange={(e) => {
                                            setPackFormData({ ...packFormData, price_cents: Math.round(Number(e.target.value) * 100) })
                                            if (packErrors.price_cents) setPackErrors({ ...packErrors, price_cents: "" })
                                        }}
                                        className={cn(packErrors.price_cents && "border-destructive focus-visible:ring-destructive")}
                                    />
                                    {packErrors.price_cents && <p className="text-xs text-destructive font-medium">{packErrors.price_cents}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pack-credits" className={cn(packErrors.credit_amount && "text-destructive")}>
                                        Nombre de crédits <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="pack-credits"
                                        type="number"
                                        min="1"
                                        value={packFormData.credit_amount || ""}
                                        onChange={(e) => {
                                            setPackFormData({ ...packFormData, credit_amount: Number(e.target.value) })
                                            if (packErrors.credit_amount) setPackErrors({ ...packErrors, credit_amount: "" })
                                        }}
                                        className={cn(packErrors.credit_amount && "border-destructive focus-visible:ring-destructive")}
                                    />
                                    {packErrors.credit_amount && <p className="text-xs text-destructive font-medium">{packErrors.credit_amount}</p>}
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-2 border rounded-md">
                                <Label htmlFor="pack-active">Actif</Label>
                                <Switch
                                    id="pack-active"
                                    checked={packFormData.active}
                                    onCheckedChange={(checked) => setPackFormData({ ...packFormData, active: checked })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPackDialogOpen(false)}>Annuler</Button>
                            <Button onClick={handleSavePack} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isPackEditing ? "Mettre à jour" : "Créer"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <DeleteModal
                    isOpen={isPackDeleteModalOpen}
                    onClose={() => setIsPackDeleteModalOpen(false)}
                    onConfirm={executeDeletePack}
                    loading={isDeleting}
                    title="Supprimer le pack"
                    description="Êtes-vous sûr de vouloir supprimer ce pack de crédits ?"
                />

                <DeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={executeDelete}
                    loading={isDeleting}
                    title="Supprimer le plan"
                    description="Êtes-vous sûr de vouloir supprimer ce plan ? Cette action est irréversible."
                />
            </div>
        </div>
    )
}