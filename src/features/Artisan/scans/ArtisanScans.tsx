import { useEffect, useMemo, useState } from "react"
import { Eye, RotateCcw, Trash2, Plus, Search, MoreVertical, ScanSearch, LayoutGrid, List, MapPin, Layers, Coins, ChevronLeft, ChevronRight, Calendar, Clock, Radar, ChevronRightCircle } from "lucide-react"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { ColumnDef } from "@tanstack/react-table"
import { type Scan, type ScanStatus } from "../../../types/scansTypes"
import { Link } from "react-router-dom"
import { TableSkeleton } from "@/components/TableSkeleton"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { statusBadgeConfig, formatRelativeDate, cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { ScansServiceInstance } from "@/services/artisan/scansServices"
import { DeleteModal } from "@/components/DeleteModel"
import toast from "react-hot-toast"

export function ArtisanScans() {
    const { user } = useAuth()
    const [scans, setScans] = useState<Scan[]>([])
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<ScanStatus | "all">("all")
    const [loading, setLoading] = useState(false)
    const [viewMode, setViewMode] = useState<"table" | "cards">("cards")
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
                    search: searchQuery,
                    status: statusFilter
                }
                const scans = await ScansServiceInstance.getScans(user?.id!, page, pageSize, filters)
                setScans(scans.data)
                setTotalPages(scans.totalPages)
            } catch (error) {
                console.error("Error fetching scans:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchScans()
    }, [user?.id, page, pageSize, searchQuery, statusFilter])

    const columns = useMemo<ColumnDef<Scan>[]>(
        () => [
            {
                id: "index",
                header: "N°",
                cell: ({ row }) => (
                    <div className="text-sm font-medium text-foreground/80">
                        {row.index + 1}
                    </div>
                )
            },
            {
                accessorKey: "name",
                header: "Nom du scan",
                cell: ({ row }) => (
                    <Link to={`/scans/${row.original.slug}`}>
                        <span className="font-semibold text-foreground/80 underline truncate block max-w-[200px]">{row.original.name}</span>
                        <span className="font-medium "> {row.original.address_text}</span>
                    </Link>
                ),
            },

            {
                accessorKey: "radius_meters",
                header: "Rayon",
                cell: ({ row }) => (
                    <span className="font-medium">{row.original.radius_meters} m</span>

                ),
            },
            {
                accessorKey: "facadesCount",
                header: "Façades détectées",
                cell: ({ row }) => (
                    <div className="flex justify-center">
                        <span className="font-medium text-sm text-muted-foreground/80">
                            {row.original.facadesCount || 0}
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
                            {row.original.actual_cost_credits || 0}
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
                                <Link to={`/scans/${row.original.slug}`}>
                                    <DropdownMenuItem>
                                        <Eye className="h-4 w-4 group-hover:text-primary" />
                                        Voir les détails
                                    </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => handleDelete(row.original.id)}
                                    className="text-red-500 hover:text-white hover:bg-destructive! group cursor-pointer">
                                    <Trash2 className="h-4 w-4 group-hover:text-white!" />
                                    Supprimer
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ),
            },
        ],
        []
    )

    // Reset to page 1 when filters change
    useMemo(() => {
        setPage(1)
    }, [searchQuery, statusFilter])

    return (
        <div className="min-h-screen bg-background relative overflow-hidden ">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
            </div>

            <div className="relative mx-auto  px-6 py-8 rounded-sm">
                {/* Header */}
                <header className="mb-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center justify-between md:justify-start gap-4">
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground/70">Liste des scans</h1>

                    </div>
                    <div className="flex items-center gap-3">
                        {user?.scans_number === 0 ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="w-full sm:w-auto">
                                        <Button
                                            disabled
                                            variant="default"
                                            className="w-full opacity-50 cursor-not-allowed transition-all bg-linear-to-r from-primary to-primary/80 shadow-md shadow-primary/20 rounded-xl h-11"
                                        >
                                            <Plus className="h-5 w-5" />
                                            <span>Nouveau scan</span>
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="rounded-xl shadow-xl">
                                    Limite atteinte. Améliorez votre forfait pour plus de scans.
                                </TooltipContent>
                            </Tooltip>
                        ) : (
                            <Link to="/scans/create" className="w-full sm:w-auto">
                                <Button
                                    variant="default"
                                    className="w-full transition-all bg-linear-to-r from-primary to-primary/80 hover:scale-105 active:scale-95 shadow-md shadow-primary/20 rounded-xl h-11"
                                    title="Ajouter un scan"
                                >
                                    <Plus className="h-5 w-5" />
                                    <span>Nouveau scan</span>
                                </Button>
                            </Link>
                        )}
                    </div>
                </header>


                {/* Filters Section */}
                <div className="mb-8 flex flex-col lg:flex-row gap-4 bg-white/40 dark:bg-card/40 backdrop-blur-xl p-3 rounded-2xl border border-border/40 shadow-2xl shadow-primary/5">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                            placeholder="Rechercher par nom ou adresse..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 h-12 bg-muted/20 border-border/20 rounded-xl focus-visible:ring-primary/20 transition-all hover:bg-muted/30"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Select
                            value={statusFilter}
                            onValueChange={(value) => setStatusFilter(value as ScanStatus | "all")}
                        >
                            <SelectTrigger className="w-full sm:w-[200px] h-12">
                                <SelectValue placeholder="Tous les statuts" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/40 shadow-2xl backdrop-blur-xl">
                                <SelectItem value="all" className="rounded-lg font-medium">Tous les statuts</SelectItem>
                                <SelectItem value="completed" className="rounded-lg font-medium">Completé</SelectItem>
                                <SelectItem value="running" className="rounded-lg font-medium">En cours</SelectItem>
                                <SelectItem value="failed" className="rounded-lg font-medium">Échoué</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border/50">
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
                            <button
                                onClick={() => setViewMode('cards')}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300",
                                    viewMode === 'cards'
                                        ? "bg-card text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <LayoutGrid size={14} />
                                Cartes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table/Cards Section */}
                <section>
                    {loading ? (
                        viewMode === "table" ? (
                            <TableSkeleton />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <Card key={i} className="flex flex-col p-0 h-full border-border/40 bg-gradient-to-br from-white/60 to-white/30 dark:from-card/60 dark:to-card/30 backdrop-blur-xl shadow-lg rounded-3xl overflow-hidden">
                                        <CardHeader className="p-5 pb-3">
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Skeleton className="h-6 w-6 rounded-full bg-primary/10" />
                                                    <Skeleton className="h-6 w-24 rounded-full bg-muted/60" />
                                                </div>
                                                <Skeleton className="h-8 w-8 rounded-full bg-muted/60" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Skeleton className="h-7 w-3/4 rounded-lg" />
                                                <div className="flex items-center gap-1.5">
                                                    <Skeleton className="h-3.5 w-3.5 rounded-full" />
                                                    <Skeleton className="h-3 w-1/2 rounded-md" />
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="grow flex flex-col gap-4 px-5">
                                            <div className="grid grid-cols-2 gap-3 p-1">
                                                <div className="p-3 rounded-2xl bg-muted/30 border border-border/50">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <Skeleton className="h-4 w-4 rounded-full" />
                                                        <Skeleton className="h-3 w-16 rounded-md" />
                                                    </div>
                                                    <Skeleton className="h-8 w-16 rounded-lg" />
                                                </div>
                                                <div className="p-3 rounded-2xl bg-muted/30 border border-border/50">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <Skeleton className="h-4 w-4 rounded-full" />
                                                        <Skeleton className="h-3 w-16 rounded-md" />
                                                    </div>
                                                    <Skeleton className="h-8 w-16 rounded-lg" />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between py-2 border-t border-dashed border-border/50">
                                                <div className="flex items-center gap-1.5">
                                                    <Skeleton className="h-3.5 w-3.5 rounded-full" />
                                                    <Skeleton className="h-3 w-24 rounded-md" />
                                                </div>
                                                <div className="flex items-center gap-1.5 pl-3 border-l border-border/50">
                                                    <Skeleton className="h-3.5 w-3.5 rounded-full" />
                                                    <Skeleton className="h-3 w-16 rounded-md" />
                                                </div>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="p-5 pt-0">
                                            <Skeleton className="h-11 w-full rounded-xl" />
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )
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
                                        : "Vous n'avez pas encore créé de scan. Commencez par créer votre premier scan."}
                                </EmptyDescription>
                            </EmptyHeader>
                            {!searchQuery && statusFilter === "all" && (
                                <EmptyContent>
                                    <Link to="/scans/create">
                                        <Button disabled={user?.scans_number < 1}>
                                            <Plus className="h-4 w-4" />
                                            Créer un nouveau scan
                                        </Button>
                                    </Link>
                                </EmptyContent>
                            )}
                        </Empty>
                    ) : viewMode === "table" ? (
                        <DataTable
                            columns={columns}
                            data={scans}
                            manualPagination={true}
                            pageIndex={page - 1}
                            pageCount={totalPages}
                            onPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
                            pageSize={pageSize}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {scans.map((scan, idx) => {
                                const scanIndex = (page - 1) * pageSize + idx + 1
                                const StatusIcon = statusBadgeConfig[scan.status].icon

                                return (
                                    <Card key={scan.id} className="group p-0 relative flex flex-col h-full border-border/40 bg-gradient-to-br from-white/60 to-white/30 dark:from-card/60 dark:to-card/30 backdrop-blur-xl shadow-lg hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 rounded-3xl overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                        <CardHeader className="p-5 pb-3">
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/20">
                                                        {scanIndex}
                                                    </span>
                                                    <div className={`flex items-center gap-1.5 pl-1.5 pr-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${statusBadgeConfig[scan.status].className}`}>
                                                        <StatusIcon className="h-3 w-3" />
                                                        {statusBadgeConfig[scan.status].label}
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-52 p-1 rounded-2xl border-border/50 shadow-xl backdrop-blur-xl bg-background/95">
                                                        <Link to={`/scans/${scan.slug}`}>
                                                            <DropdownMenuItem className="gap-2 p-2.5 rounded-xl cursor-pointer focus:bg-primary/10 focus:text-primary">
                                                                <Eye className="h-4 w-4 text-primary" />
                                                                <span className="font-medium text-primary">Voir les détails</span>
                                                            </DropdownMenuItem>
                                                        </Link>

                                                        <DropdownMenuSeparator className="bg-border/50 my-1" />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(scan.id)}
                                                            className="gap-2 p-2.5 rounded-xl cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                            <span className="font-medium text-destructive">Supprimer</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <div className="space-y-1.5">
                                                <CardTitle className="text-xl font-bold leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                                                    <Link to={`/scans/${scan.slug}`}>
                                                        {scan.name}
                                                    </Link>
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/80">
                                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                                                    <span className="line-clamp-1">{scan.address_text}</span>
                                                </CardDescription>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="grow flex flex-col gap-4 px-5">
                                            <div className="grid grid-cols-2 gap-3 p-1">
                                                <div className="group/stat relative p-3 rounded-2xl bg-muted/30 border border-border/50 hover:bg-background/80 hover:border-primary/20 hover:shadow-inner transition-all duration-300">
                                                    <div className="flex items-center gap-2 mb-1.5 text-muted-foreground group-hover/stat:text-primary transition-colors">
                                                        <Layers className="h-4 w-4" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Façades</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-1">
                                                        <p className="text-2xl font-bold tracking-tight text-foreground">{scan.facadesCount || 0}</p>
                                                        <span className="text-[10px] font-medium text-muted-foreground/60">détectées</span>
                                                    </div>
                                                </div>
                                                <div className="group/stat relative p-3 rounded-2xl bg-muted/30 border border-border/50 hover:bg-background/80 hover:border-primary/20 hover:shadow-inner transition-all duration-300">
                                                    <div className="flex items-center gap-2 mb-1.5 text-muted-foreground group-hover/stat:text-primary transition-colors">
                                                        <Coins className="h-4 w-4" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Coût</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-1">
                                                        <p className="text-2xl font-bold tracking-tight text-foreground">{scan.actual_cost_credits || 0}</p>
                                                        <span className="text-[10px] font-medium text-muted-foreground/60">crédits</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between py-2 border-t border-dashed border-border/50">
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                                    <Calendar className="h-3.5 w-3.5 text-primary/60" />
                                                    {formatRelativeDate(scan.created_at)}
                                                </div>
                                                <div className="flex items-center gap-1.5 pl-3 border-l border-border/50">
                                                    <Radar className="h-3.5 w-3.5 text-primary/60" />
                                                    <span className="text-xs font-medium text-muted-foreground">{scan.radius_meters}m</span>
                                                </div>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="p-5 pt-0">
                                            <Link to={`/scans/${scan.slug}`} className="w-full">
                                                <Button className="w-full rounded-xl h-11 font-bold text-sm bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all duration-300 group/btn">
                                                    <span>Consulter le rapport</span>
                                                    <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                                </Button>
                                            </Link>
                                        </CardFooter>
                                    </Card>
                                )
                            })}
                        </div>
                    )}

                    {/* Pagination for Card View */}
                    {!loading && viewMode === "cards" && totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-between bg-card p-4 rounded-xl border border-border/40 shadow-sm shadow-primary/5">
                            <span className="text-sm text-muted-foreground font-medium">
                                Page <span className="text-foreground">{page}</span> sur <span className="text-foreground">{totalPages}</span>
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="h-9 gap-1.5 rounded-lg border-border hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all font-medium"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Précédent
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="h-9 gap-1.5 rounded-lg border-border hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all font-medium"
                                >
                                    Suivant
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </section>
            </div >
            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={onConfirmDelete}
                loading={isDeleting}
                title="Supprimer le scan"
                description="Êtes-vous sûr de vouloir supprimer ce scan ? Cette action supprimera également toutes les façades associées et ne pourra pas être annulée."
            />
        </div >
    )
}
