import { useEffect, useMemo, useState } from "react"
import { Eye, MoreVertical, Download, Send, FileText, Search, Loader2 } from "lucide-react"
import { downloadPdf } from "@/utils/downloadpdf"
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
import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "react-router-dom"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import type { Devis } from "@/types/devisTypes"
import { statusBadgeConfig } from "@/lib/utils"
import { DevisServiceInstance } from "@/services/admin/devisServices"
import { TableSkeleton } from "@/components/TableSkeleton"

type DevisStatus = Devis["status"]

export default function AdminDevis() {
    const [devis, setDevis] = useState<Devis[]>([])
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<DevisStatus | "all">("all")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchDevis = async () => {
            setLoading(true)
            try {
                const filters = {
                    searchterm: searchQuery,
                    status: statusFilter,
                }
                const result = await DevisServiceInstance.getDevis(page, pageSize, filters)
                setDevis(result.data)
                const total = result.pagination?.totalPages || Math.ceil((result.pagination?.total || 0) / pageSize)
                setTotalPages(total)
            } catch (error) {
                console.error("Error fetching devis:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchDevis()
    }, [page, pageSize, searchQuery, statusFilter])

    const columns = useMemo<ColumnDef<Devis>[]>(
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
                accessorKey: "reference",
                header: "Référence",
                cell: ({ row }) => (
                    <span className="font-semibold text-foreground/60">
                        {row.original.reference || 'aucune référence générée'}
                    </span>
                ),
            },
            {
                accessorKey: "artisan",
                header: "Artisan",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        {
                            row.original.artisan?.avatar ? (
                                <img src={row.original.artisan.avatar} alt="" className="w-8 h-8 rounded-full" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-xs font-medium text-muted-foreground/60">
                                        {row.original.artisan?.display_name?.charAt(0)?.toUpperCase() || '?'}
                                        {row.original.artisan?.display_name?.charAt(1)?.toUpperCase() || ''}
                                    </span>
                                </div>
                            )
                        }
                        <div>
                            <div className="font-semibold text-foreground truncate">
                                {row.original.artisan?.display_name || '-'}
                            </div>
                            <div className="text-xs text-muted-foreground/80 truncate">
                                {row.original.artisan?.email || '-'}
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: "clientName",
                header: "Client",
                cell: ({ row }) => (
                    <div className="max-w-[180px]">
                        <div className="font-medium text-foreground truncate">
                            {row.original.client_name}
                        </div>
                        <div className="text-xs text-muted-foreground/80 truncate">
                            {row.original.client_email || row.original.client_phone || "-"}
                        </div>
                    </div>
                ),
            },

            {
                accessorKey: "amount",
                header: "Montant",
                cell: ({ row }) => (
                    <div className="text-center">
                        <span className="font-medium text-sm text-foreground/60">
                            {(row.original.total_cents ?? 0) / 100} €
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
                                <Link to={`/admin/devis/${row.original.id}`}>
                                    <DropdownMenuItem className="hover:bg-muted hover:text-foreground group">
                                        <Eye className="h-4 w-4 group-hover:text-background" />
                                        Voir les détails
                                    </DropdownMenuItem>
                                </Link>
                                {row.original.pdf_url && (
                                    <DropdownMenuItem onClick={() => downloadPdf(row.original.pdf_url!, `devis_${row.original.quote_number || "brouillon"}.pdf`)}>
                                        <Download className="h-4 w-4 group-hover:text-background" />
                                        Télécharger PDF
                                    </DropdownMenuItem>
                                )}
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
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground/70">Gestion des devis</h1>
                    </div>
                </header>

                {/* Filters Section */}
                <div className="mb-6 flex flex-col md:flex-row gap-4 bg-card p-4 rounded-sm shadow-sm">
                    <div className="relative md:flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par référence, client ou adresse..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-12"
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onValueChange={(value) => setStatusFilter(value as DevisStatus | "all")}
                    >
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Filtrer par statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            <SelectItem value="draft">Brouillon</SelectItem>
                            <SelectItem value="ready">Prêt</SelectItem>
                            <SelectItem value="sent">Envoyé</SelectItem>
                            <SelectItem value="accepted">Accepté</SelectItem>
                            <SelectItem value="rejected">Refusé</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table Section */}
                <section>
                    {loading ? (
                        <TableSkeleton />
                    ) : devis.length === 0 ? (
                        <Empty className="bg-card shadow-sm border">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <FileText />
                                </EmptyMedia>
                                <EmptyTitle>Aucun devis trouvé</EmptyTitle>
                                <EmptyDescription>
                                    {searchQuery || statusFilter !== "all"
                                        ? "Aucun résultat ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                                        : "Aucun devis n'a été créé pour le moment."}
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={devis}
                            manualPagination={true}
                            pageIndex={page - 1}
                            pageCount={totalPages}
                            onPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
                            pageSize={pageSize}
                        />
                    )}
                </section>
            </div>
        </div>
    )
}