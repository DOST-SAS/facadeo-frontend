import { useEffect, useMemo, useState } from "react"
import { Eye, RotateCcw, BarChart3, Copy, Trash2, Search, MoreVertical, ScanSearch, MapPin, Calendar, Target, TrendingUp, Activity, ShieldAlert } from "lucide-react"
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ColumnDef } from "@tanstack/react-table"
import { type Scan, type ScanStatus } from "@/types/scansTypes"
import { Link } from "react-router-dom"
import { TableSkeleton } from "@/components/TableSkeleton"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { cn, statusBadgeConfig } from "@/lib/utils"
import { ScansServiceInstance } from "@/services/admin/scansServices"
import { DeleteModal } from "@/components/DeleteModel"
import toast from "react-hot-toast"

export default function AdminScans() {
    const [scans, setScans] = useState<Scan[]>([])
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<ScanStatus | "all">("all")
    const [loading, setLoading] = useState(false)
    const [isStatsOpen, setIsStatsOpen] = useState(false)
    const [selectedScan, setSelectedScan] = useState<Scan | null>(null)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [scanToDelete, setScanToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = (id: string) => {
        setScanToDelete(id)
        setIsDeleteModalOpen(true)
    }

    const onConfirmDelete = async () => {
        if (!scanToDelete) return
        setIsDeleting(true)
        try {
            await ScansServiceInstance.deleteScan(scanToDelete)
            toast.success("Scan supprimé avec succès")
            setScans(prev => prev.filter(s => s.id !== scanToDelete))
        } catch (error) {
            console.error("Error deleting scan:", error)
            toast.error("Erreur lors de la suppression du scan")
        } finally {
            setIsDeleting(false)
            setIsDeleteModalOpen(false)
            setScanToDelete(null)
        }
    }

    useEffect(() => {
        const fetchScans = async () => {
            setLoading(true)
            try {
                const filters = {
                    searchterm: searchQuery,
                    status: statusFilter,
                }
                const result = await ScansServiceInstance.getScans(page, pageSize, filters)
                setScans(result.data)
                const total = result.pagination?.totalPages || Math.ceil((result.pagination?.total || 0) / pageSize)
                setTotalPages(total)
            } catch (error) {
                console.error("Error fetching scans:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchScans()
    }, [page, pageSize, searchQuery, statusFilter])

    const columns = useMemo<ColumnDef<Scan>[]>(
        () => [
            {
                id: "index",
                header: "N°",
                cell: ({ row }) => (
                    <div className="text-sm font-medium text-foreground/80">
                        {row.index + 1 + (page - 1) * pageSize}
                    </div>
                )
            },
            {
                accessorKey: "title",
                header: "Nom du scan",
                cell: ({ row }) => (
                    <>
                        <Link to={`/admin/scans/${row.original.slug}`}>
                            <span className="font-semibold text-foreground/80 underline truncate block max-w-[200px]">{row.original.name}</span>
                        </Link>
                        <span className="font-normal text-xs text-muted-foreground/80 truncate"> {row.original.address_text}</span>
                    </>

                ),
            },

            {
                accessorKey: "radius_meters",
                header: "Rayon",
                cell: ({ row }) => (
                    <span className="font-light text-sm text-muted-foreground/80 truncate block max-w-[170px]">
                        <span className="font-semibold truncate">{row.original.radius_meters}m</span>
                    </span>
                ),
            },
            {
                accessorKey: "facadesCount",
                header: "Façades détectées",
                cell: ({ row }) => (
                    <div className="flex justify-center">
                        <span className="font-medium text-sm text-muted-foreground/80">
                            {row.original.facadesCount}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: "totalCredits",
                header: "Coût des crédits",
                cell: ({ row }) => (
                    <div className="text-center">
                        <span className="font-medium text-sm text-muted-foreground/80">
                            {row.original.estimated_cost_credits}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: "status",
                header: "Statut",
                cell: ({ row }) => {
                    const StatusIcon = statusBadgeConfig[row.original.status].icon
                    return (
                        <span
                            className={`inline-flex items-center gap-1.5 px-2 py-1 font-medium tracking-wide rounded-lg border ${statusBadgeConfig[row.original.status].className} transition-all`}
                        >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusBadgeConfig[row.original.status].label}
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
                            <DropdownMenuContent align="end" className="w-48">
                                <Link to={`/admin/scans/${row.original.slug}`}>
                                    <DropdownMenuItem>
                                        <Eye className="h-4 w-4 group-hover:text-primary" />
                                        Voir les détails
                                    </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator />
                                 <DropdownMenuItem 
                                    variant="destructive"
                                    onClick={() => handleDelete(row.original.id)}
                                    className="cursor-pointer"
                                >
                                    <Trash2 className="h-4 w-4 group-hover:text-primary" />
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
        <div className="min-h-screen bg-background relative overflow-hidden ">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
            </div>

            <div className="relative mx-auto   px-6 py-8 rounded-sm">
                {/* Header */}
                <header className="mb-7 flex items-center justify-between">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-foreground/70">Gestion des scans</h1>
                    </div>
                </header>


                {/* Filters Section */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-sm shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par nom ou adresse..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-full"
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onValueChange={(value) => setStatusFilter(value as ScanStatus | "all")}
                    >
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Filtrer par statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            <SelectItem value="completed">Completé</SelectItem>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="running">En cours</SelectItem>
                            <SelectItem value="failed">Échoué</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table Section */}
                <section>
                    {
                        loading ? (
                            <TableSkeleton />
                        ) : scans.length === 0 ? (
                            <Empty className="bg-card shadow-sm border">
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <ScanSearch />
                                    </EmptyMedia>
                                    <EmptyTitle>Aucun scan trouvé</EmptyTitle>
                                    <EmptyDescription>
                                        {searchQuery || statusFilter !== "all"
                                            ? "Aucun résultat ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                                            : "Aucun scan n'a été créé pour le moment."}
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={scans}
                                manualPagination={true}
                                pageIndex={page - 1}
                                pageCount={totalPages}
                                onPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
                                pageSize={pageSize}
                            />
                        )}
                </section>
            </div>

            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={onConfirmDelete}
                loading={isDeleting}
                title="Supprimer le scan"
                description="Êtes-vous sûr de vouloir supprimer ce scan ? Cette action supprimera définitivement le scan et toutes ses données associées de la base de données."
            />
        </div>
    )
}