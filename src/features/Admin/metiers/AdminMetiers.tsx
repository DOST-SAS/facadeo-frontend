
import { useEffect, useMemo, useState } from "react"
import { MoreVertical, Plus, Search, Briefcase, Loader2, Pencil, Trash2 } from "lucide-react"
import { statusBadgeConfig, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { ColumnDef } from "@tanstack/react-table"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import type { Metier } from "@/types/artisanSettinstypes"
import { MetierServiceInstance } from "@/services/admin/metierService"
import { TableSkeleton } from "@/components/TableSkeleton"
import { DeleteModal } from "@/components/DeleteModel"
import toast from "react-hot-toast"

export default function AdminMetiers() {
    const [metiers, setMetiers] = useState<Metier[]>([])
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [loading, setLoading] = useState(false)

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingMetier, setEditingMetier] = useState<Metier | null>(null)
    const [formData, setFormData] = useState({ label: "", active: true })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Delete State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [metierToDelete, setMetierToDelete] = useState<string | null>(null)

    const fetchMetiers = async () => {
        setLoading(true)
        try {
            const filters = {
                searchterm: searchQuery,
                status: statusFilter === "all" ? "" : statusFilter,
            }
            const result = await MetierServiceInstance.getMetiers(page, pageSize, filters)
            setMetiers(result.data)

            if (result.pagination) {
                setTotalPages(result.pagination.totalPages)
            } else {
                setTotalPages(1) // Fallback
            }
        } catch (error) {
            console.error("Error fetching metiers:", error)
            toast.error("Erreur lors du chargement des métiers")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMetiers()
    }, [page, pageSize, searchQuery, statusFilter])

    const handleOpenCreate = () => {
        setEditingMetier(null)
        setFormData({ label: "", active: true })
        setIsModalOpen(true)
    }

    const handleOpenEdit = (metier: Metier) => {
        setEditingMetier(metier)
        setFormData({ label: metier.label, active: metier.active })
        setIsModalOpen(true)
    }

    const handleSave = async () => {
        if (!formData.label.trim()) return

        setIsSubmitting(true)
        try {
            if (editingMetier) {
                // Update
                await MetierServiceInstance.UpdateMetier(editingMetier.id, {
                    label: formData.label,
                    key: formData.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "_"),
                    active: formData.active
                })
                toast.success("Métier mis à jour")
            } else {
                // Create
                await MetierServiceInstance.createMetier({
                    label: formData.label,
                    key: formData.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "_"),
                    active: formData.active,
                    sort_order: 100
                })
                toast.success("Métier ajouté")
            }
            setIsModalOpen(false)
            fetchMetiers()
        } catch (error) {
            console.error("Error saving metier:", error)
            toast.error("Erreur lors de l'enregistrement")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleOpenDelete = (id: string) => {
        setMetierToDelete(id)
        setIsDeleteModalOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!metierToDelete) return

        setIsSubmitting(true) // Reuse submitting state for delete loading if simpler, or local var in Modal
        try {
            await MetierServiceInstance.deleteMetier(metierToDelete)
            toast.success("Métier supprimé")
            setIsDeleteModalOpen(false)
            fetchMetiers()
        } catch (error) {
            console.error("Error deleting metier:", error)
            toast.error("Erreur lors de la suppression")
        } finally {
            setIsSubmitting(false)
            setMetierToDelete(null)
        }
    }

    const columns = useMemo<ColumnDef<Metier>[]>(
        () => [
            {
                id: "index",
                header: "N°",
                cell: ({ row }) => (
                    <div className="text-sm font-medium text-foreground/60">
                        {row.index + 1 + (page - 1) * pageSize}
                    </div>
                )
            },
            {
                accessorKey: "label",
                header: "Libellé",
                cell: ({ row }) => (
                    <div className="font-semibold text-foreground truncate flex items-center gap-2">
                        {row.original.label}
                    </div>
                ),
            },
            {
                accessorKey: "key",
                header: "Clé technique",
                cell: ({ row }) => (
                    <div className="font-mono text-xs text-muted-foreground p-1 bg-muted rounded w-fit">
                        {row.original.key}
                    </div>
                ),
            },
            {
                accessorKey: "active",
                header: "Statut",
                cell: ({ row }) => {
                    const statusKey = row.original.active ? "active" : "inactive"
                    const config = statusBadgeConfig[statusKey]
                    const Icon = config.icon

                    return (
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 w-fit", config.className)}>
                            <Icon className="h-3 w-3" />
                            {config.label}
                        </span>
                    )
                },
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <div className="flex items-center justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 p-2! rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenEdit(row.original)} className="group cursor-pointer">
                                    <Pencil className=" h-4 w-4 group-hover:text-white" />
                                    Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenDelete(row.original.id)} className="group hover:text-white! hover:bg-destructive/80! cursor-pointer text-destructive focus:text-destructive">
                                    <Trash2 className=" h-4 w-4 group-hover:text-white" />
                                    Supprimer
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ),
            },
        ],
        [page, pageSize]
    )

    return (
        <div className="min-h-screen bg-card md:bg-background relative overflow-hidden ">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
            </div>
            <div className="relative mx-auto   px-4 md:px-6 py-4 md:py-8 rounded-sm">
                {/* Header */}
                <header className="mb-7 flex items-center justify-between">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground/70">Gestion des métiers</h1>
                    </div>

                    <Button onClick={handleOpenCreate}>
                        <Plus className="h-4 w-4 " />
                        Nouveau métier
                    </Button>
                </header>

                {/* Filters */}
                <div className="mb-6 flex flex-col md:flex-row gap-4 bg-card p-4 rounded-sm shadow-sm">
                    <div className="relative md:flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par libellé..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-12"
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onValueChange={(value) => setStatusFilter(value)}
                    >
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Filtrer par statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            <SelectItem value="true">Actif</SelectItem>
                            <SelectItem value="false">Inactif</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <section>
                    {loading ? (
                        <TableSkeleton />
                    ) : metiers.length === 0 ? (
                        <Empty className="bg-card shadow-sm border">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Briefcase />
                                </EmptyMedia>
                                <EmptyTitle>Aucun métier trouvé</EmptyTitle>
                                <EmptyDescription>
                                    {searchQuery || statusFilter !== "all"
                                        ? "Aucun résultat ne correspond à vos critères de recherche."
                                        : "Aucun métier n'a été créé pour le moment."}
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={metiers}
                            manualPagination={true}
                            pageIndex={page - 1}
                            pageCount={totalPages}
                            onPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
                            pageSize={pageSize}
                        />
                    )}
                </section>

                {/* Create/Edit Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingMetier ? "Modifier le métier" : "Ajouter un nouveau métier"}</DialogTitle>
                            <DialogDescription>
                                {editingMetier ? "Modifiez les informations du métier." : "Créez un nouveau métier disponible pour les artisans."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Libellé du métier</Label>
                                <Input
                                    id="name"
                                    placeholder="Ex: Électricien, Plombier..."
                                    value={formData.label}
                                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center justify-between border p-3 rounded-md">
                                <Label htmlFor="active" className="cursor-pointer">Actif</Label>
                                <Switch
                                    id="active"
                                    checked={formData.active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                            <Button onClick={handleSave} disabled={isSubmitting || !formData.label.trim()}>
                                {isSubmitting && <Loader2 className=" h-4 w-4 animate-spin" />}
                                {editingMetier ? "Enregistrer" : "Ajouter"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Modal */}
                <DeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    loading={isSubmitting}
                    title="Supprimer le métier ?"
                    description="Cette action est irréversible. Le métier ne sera plus disponible."
                />
            </div>
        </div>
    )
}