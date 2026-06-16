import { useEffect, useMemo, useState } from "react"
import { Eye, MoreVertical, Download, MapPin, Building, Search, Calendar, LayoutGrid, Table as TableIcon, ChevronLeft, ChevronRight, BarChart3, TrendingUp, Layers, Filter } from "lucide-react"
import { Pie, PieChart, Sector } from "recharts"
import type { PieSectorDataItem } from "recharts/types/polar/Pie"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "react-router-dom"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { FacadesServiceInstance } from "@/services/admin/facadesSevices"
import { GOOGLE_PLACE_TYPES, GOOGLE_PLACE_TYPES_I18N } from "@/constants"
import { TableSkeleton } from "@/components/TableSkeleton"
import type { Facade } from "@/types/scansTypes"

type FacadeType = typeof GOOGLE_PLACE_TYPES[number]["value"] | "all"




type ViewMode = "table" | "grid"

// Helper to parse streetview_url or simulated_image_url JSON array
const parseImageUrls = (imageUrl: string | null): string[] => {
    if (!imageUrl) return []
    try {
        if (imageUrl.startsWith('[')) {
            return JSON.parse(imageUrl)
        }
        return [imageUrl]
    } catch {
        return []
    }
}

// Helper to get first image from facade
const getFirstImage = (facade: Facade): string => {
    const urls = parseImageUrls(facade.streetview_url || facade.simulated_image_url)
    return urls[0] || "/facade.png"
}

// Helper to get facade display name (handles both businesses_cache and address.name)
const getFacadeDisplayName = (facade: Facade): string => {
    if (facade.businesses_cache?.name) return facade.businesses_cache.name
    if (facade.address?.name) return facade.address.name
    if (facade.address?.street) return `${facade.address.street}, ${facade.address.city || ''}`
    return facade.facade_number || 'Façade'
}

// Helper to get facade type
const getFacadeType = (facade: Facade): string => {
    // If we have specific types in the metadata, use them translated
    if (facade.types) {
        return (facade.types||'').split(',').slice(0, 1).map(t => ParsTypes(t.trim()))[0]
    }

    const rawType = facade.address?.type || facade.source || ''

    // Find localized label from our constants
    const typeInfo = [...GOOGLE_PLACE_TYPES, ...GOOGLE_PLACE_TYPES_I18N].find(t => t.value === rawType)
    if (typeInfo) return typeInfo.label

    // Last resort fallbacks
    return ParsTypes(rawType) || facade.businesses_cache?.name || facade.address?.name || 'N/A'
}

const FacadeImageCell = ({ facade, className }: { facade: Facade; className?: string }) => {
    const imageUrl = getFirstImage(facade)

    return (
        <img
            src={imageUrl}
            alt={getFacadeDisplayName(facade)}
            className={cn("object-cover bg-muted", className)}
            onError={(e) => {
                e.currentTarget.src = "/facade.png"
            }}
        />
    )
}


const ParsTypes = (type: string) => {
    if (!type) return "N/A"

    switch (type.toLowerCase()) {
        case "all":
            return "Tous les types"
        case "supermarket":
            return "Supermarché"
        case "grocery_or_supermarket":
            return "Épicerie / Supermarché"
        case "bakery":
            return "Boulangerie"
        case "point_of_interest":
            return "Point d'intérêt"
        case "home_goods_store":
            return "Articles de maison"
        case "store":
            return "Magasin"
        case "food":
            return "Alimentation"
        case "establishment":
            return "Établissement"
        case "pharmacy":
            return "Pharmacie"
        case "health":
            return "Santé"
        case "hair_care":
            return "Coiffure"
        case "restaurant":
            return "Restaurant"
        case "cafe":
            return "Café"
        case "bar":
            return "Bar"
        case "shop":
            return "Boutique"
        case "office":
            return "Bureau"
        case "other":
            return "Autre"
        default:
            // Return capitalized original if not found
            return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }
}

export default function AdminFacades() {
    const [facades, setFacades] = useState<Facade[]>([])
    const [page, setPage] = useState(1)
    const [pageSize] = useState(12)
    const [totalPages, setTotalPages] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [typeFilter, setTypeFilter] = useState<FacadeType>("all")
    const [scoreFilter, setScoreFilter] = useState<"all" | "low" | "medium" | "high">("all")
    const [viewMode, setViewMode] = useState<ViewMode>("grid")
    const [isStatsOpen, setIsStatsOpen] = useState(false)
    const [selectedFacade, setSelectedFacade] = useState<Facade | null>(null)
    const [loading, setLoading] = useState(false)



    useEffect(() => {
        const types = Array.from(new Set(facades.flatMap(f => {
            return  (f.types||'').split(',').map(t => t.trim());
        })))
        console.log("types", types)
    }, [facades])

    useEffect(() => {
        const fetchFacades = async () => {
            setLoading(true)
            try {
                const filters = {
                    searchterm: searchQuery,
                    type: typeFilter,
                    score: scoreFilter
                }
                const result = await FacadesServiceInstance.getFacades(page, pageSize, filters)
                console.log(result.data)    
                setFacades(result.data)
                const total = result.pagination?.totalPages || Math.ceil((result.pagination?.total || 0) / pageSize)
                setTotalPages(total)
            } catch (error) {
                console.error("Error fetching facades:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchFacades()
    }, [page, pageSize, searchQuery, typeFilter, scoreFilter])

    const columns = useMemo<ColumnDef<Facade>[]>(
        () => [
            {
                id: "index",
                header: "N°",
                cell: ({ row }) => (
                    <div className="text-sm font-medium text-foreground/60">
                        {(page - 1) * pageSize + row.index + 1}
                    </div>
                )
            },
            {
                accessorKey: "title",
                header: "Façade",
                cell: ({ row }) => (
                    <div className="flex items-center gap-3 max-w-[300px]">
                        <FacadeImageCell
                            facade={row.original}
                            className="w-16 h-16 rounded-sm border border-border shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-foreground">
                                {row.original.facade_number}
                            </div>
                            <div className="text-xs text-muted-foreground/80 flex items-center gap-1 mt-1 truncate">
                                <MapPin className="h-3 w-3" />
                                {row.original.formatted_address}
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: "type",
                header: "Type",
                cell: ({ row }) => (
                    <Badge variant="outline" className="font-medium">
                        {getFacadeType(row.original)}
                    </Badge>
                ),
            },
            {
                accessorKey: "surface",
                header: "Surface",
                cell: ({ row }) => (
                    <div className="text-center">
                        <span className="font-medium text-sm text-foreground/60">
                            {row.original.surface_m2} m²
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: "score",
                header: "Score",
                cell: ({ row }) => {
                    const score = row.original.score
                    let scoreColor = "text-red-600"
                    let bgColor = "bg-red-100"

                    if (score! >= 70) {
                        scoreColor = "text-green-600"
                        bgColor = "bg-green-100"
                    } else if (score! >= 40) {
                        scoreColor = "text-orange-600"
                        bgColor = "bg-orange-100"
                    }

                    return (
                        <div className="flex items-center justify-center">
                            <div className={`px-3 py-1 rounded-full ${bgColor}`}>
                                <span className={`font-bold text-sm ${scoreColor}`}>
                                    {score}/100
                                </span>
                            </div>
                        </div>
                    )
                },
            },
            {
                accessorKey: "date",
                header: "Date de détection",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground/80">
                        <Calendar className="h-4 w-4" />
                        {new Date(row.original.detected_at).toLocaleDateString()}
                    </div>
                ),
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
                                <Link to={`/admin/facades/${row.original.id}`}>
                                    <DropdownMenuItem className="hover:bg-muted hover:text-foreground group">
                                        <Eye className="h-4 w-4 group-hover:text-background" />
                                        Voir les détails
                                    </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                    setSelectedFacade(row.original)
                                    setIsStatsOpen(true)
                                }}>
                                    <BarChart3 className="h-4 w-4 group-hover:text-background" />
                                    Voir statistiques
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ),
            },
        ],
        [page, pageSize]
    )



    const getScoreColor = (score: number) => {
        if (score >= 70) return { text: "text-green-600", bg: "bg-green-100", border: "border-green-200" }
        if (score >= 40) return { text: "text-orange-600", bg: "bg-orange-100", border: "border-orange-200" }
        return { text: "text-red-600", bg: "bg-red-100", border: "border-red-200" }
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
            </div>

            <div className="relative mx-auto   px-4 md:px-6 py-4 md:py-8">
                {/* Header */}
                <header className="mb-7">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground/70">Gestion des Façades</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Toutes les façades détectées par les scans
                            </p>
                        </div>

                    </div>
                </header>

                {/* Filters Section */}
                <div className="mb-6 flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg shadow-sm">
                    <div className="relative md:flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par titre ou ID de scan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-12"
                        />
                    </div>
                    <Select
                        value={typeFilter}
                        onValueChange={(value) => setTypeFilter(value as FacadeType)}
                    >
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Type de façade" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les types</SelectItem>
                            {Array.from(new Set(facades.flatMap(f => {
                                return f.types ? f.types.split(',').map(t => t.trim()) : [];
                            }))).filter(Boolean).map((type) => {
                                return (
                                    <SelectItem key={type} value={type}>
                                        {ParsTypes(type)}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                    <Select
                        value={scoreFilter}
                        onValueChange={(value) => setScoreFilter(value as "all" | "low" | "medium" | "high")}
                    >
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filtrer par score" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les scores</SelectItem>
                            <SelectItem value="high">Élevé (≥70)</SelectItem>
                            <SelectItem value="medium">Moyen (40-69)</SelectItem>
                            <SelectItem value="low">Faible (&lt;40)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Content Section */}
                <section className="">
                    <div className="flex justify-end mb-4">
                        <div className="w-fit flex  items-center gap-2 bg-card border rounded-lg p-1">
                            <Button
                                variant={viewMode === "table" ? "default" : "secondary"}
                                size="sm"
                                onClick={() => setViewMode("table")}
                                className="gap-2"
                            >
                                <TableIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">Table</span>
                            </Button>
                            <Button
                                variant={viewMode === "grid" ? "default" : "secondary"}
                                size="sm"
                                onClick={() => setViewMode("grid")}
                                className="gap-2"
                            >
                                <LayoutGrid className="h-4 w-4" />
                                <span className="hidden sm:inline">Grille</span>
                            </Button>
                        </div>
                    </div>
                    {loading ? (
                        <TableSkeleton />
                    ) : facades.length === 0 ? (
                        <Empty className="bg-card shadow-sm border">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Building />
                                </EmptyMedia>
                                <div className="text-2xl font-bold text-foreground/70">Aucune façade trouvée</div>
                                <EmptyDescription>
                                    {searchQuery || typeFilter !== "all" || scoreFilter !== "all"
                                        ? "Aucun résultat ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                                        : "Aucune façade n'a encore été détectée."}
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : viewMode === "table" ? (
                        <DataTable
                            columns={columns}
                            data={facades}
                            manualPagination={true}
                            pageIndex={page - 1}
                            pageCount={totalPages}
                            onPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
                            pageSize={pageSize}
                        />
                    ) : (
                        <div className="p-6 bg-card shadow-sm   rounded-xl">
                            {/* Grid View */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {facades.map((facade) => {
                                    const scoreColors = getScoreColor(facade.score!)
                                    return (
                                        <div
                                            key={facade.id}
                                            className="group bg-card rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                                        >
                                            {/* Image */}
                                            <div className="relative h-48 overflow-hidden">
                                                <FacadeImageCell
                                                    facade={facade}
                                                    className="w-full h-full group-hover:scale-110 transition-transform duration-300"
                                                />
                                                {/* Score Badge */}
                                                <div className={cn(
                                                    "absolute top-3 right-3 px-2 py-1 rounded-full backdrop-blur-sm ",
                                                    scoreColors.bg, scoreColors.border
                                                )}>
                                                    <span className={cn("font-semibold text-xs flex items-center justify-center", scoreColors.text)}>
                                                        {facade.score}/100
                                                    </span>
                                                </div>
                                                {/* Type Badge */}
                                                <div className="absolute top-3 left-3">
                                                    <Badge variant="secondary" className="backdrop-blur-sm bg-background/80">
                                                        {/* {getFacadeDisplayName(facade)} */}
                                                        {facade.facade_number}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-4 space-y-3">
                                                <div>
                                                    <h3 className="font-semibold text-foreground line-clamp-2 mb-1 truncate">
                                                        {/* {facade.facade_number} */}
                                                        {getFacadeDisplayName(facade)}
                                                    </h3>
                                                    <div className="flex gap-1 text-xs text-muted-foreground">
                                                        <MapPin className="h-3 w-3" />
                                                        {facade.formatted_address}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-1 text-muted-foreground truncate flex-1">
                                                        <Building className="h-4 w-4 shrink-0" />
                                                        <span className="truncate">
                                                            {(facade.types||'').split(",").slice(0, 2).map(t => ParsTypes(t.trim())).join(", ")}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>{new Date(facade.detected_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2 pt-2">
                                                    <Link to={`/admin/facades/${facade.id}`} className="flex-1">
                                                        <Button variant="default" size="sm" className="w-full gap-2">
                                                            <Eye className="h-4 w-4" />
                                                            Détails
                                                        </Button>
                                                    </Link>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="sm">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => {
                                                                setSelectedFacade(facade)
                                                                setIsStatsOpen(true)
                                                            }}>
                                                                <BarChart3 className="h-4 w-4 group-hover:text-background" />
                                                                Voir statistiques
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Pagination for Grid View */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-8">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {(() => {
                                            const pages: (number | string)[] = [];
                                            const maxVisible = 5; // Show at most 5 page numbers

                                            if (totalPages <= maxVisible + 2) {
                                                // Show all pages if total is small
                                                for (let i = 1; i <= totalPages; i++) {
                                                    pages.push(i);
                                                }
                                            } else {
                                                // Always show first page
                                                pages.push(1);

                                                if (page > 3) {
                                                    pages.push('...');
                                                }

                                                // Show pages around current page
                                                const start = Math.max(2, page - 1);
                                                const end = Math.min(totalPages - 1, page + 1);

                                                for (let i = start; i <= end; i++) {
                                                    pages.push(i);
                                                }

                                                if (page < totalPages - 2) {
                                                    pages.push('...');
                                                }

                                                // Always show last page
                                                pages.push(totalPages);
                                            }

                                            return pages.map((pageNum, index) => {
                                                if (pageNum === '...') {
                                                    return (
                                                        <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                                                            ...
                                                        </span>
                                                    );
                                                }
                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={page === pageNum ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setPage(pageNum as number)}
                                                        className="w-10"
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
                                            });
                                        })()}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="rounded-full"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>

            {/* Statistics Modal */}
            <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
                <DialogContent className="sm:max-w-4xl  max-h-[95vh] flex flex-col p-0 gap-0">
                    {/* Header with gradient */}
                    <DialogHeader className="px-6 pt-3 pb-2 border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
                        <DialogTitle className="flex items-center gap-3 text-xl">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <BarChart3 className="h-5 w-5 text-primary" />
                            </div>
                            Statistiques de la façade
                        </DialogTitle>
                    </DialogHeader>

                    <ScrollArea className="h-[calc(95vh-120px)] px-6 mb-3">
                        {selectedFacade && (
                            <div className="space-y-6 pb-6 pt-4">
                                {/* Facade Info Header - Enhanced */}
                                <div className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-card via-card to-muted/20 p-4 shadow-sm">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
                                    <div className="relative flex items-start gap-3">
                                        <div className="relative">
                                            <img
                                                src={getFirstImage(selectedFacade)}
                                                alt={getFacadeDisplayName(selectedFacade)}
                                                className="w-16 h-16 object-cover rounded-lg border border-primary/20 shadow-sm"
                                                onError={(e) => {
                                                    e.currentTarget.src = "/facade.png"
                                                }}
                                            />
                                            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded-full shadow">
                                                {selectedFacade.score}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-base mb-1">{getFacadeDisplayName(selectedFacade)}</h3>
                                            <p className="text-xs text-muted-foreground mb-2">{selectedFacade.address?.city || ''}</p>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    <Building className="h-3 w-3 mr-1" />
                                                    {getFacadeType(selectedFacade)}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {new Date(selectedFacade.created_at).toLocaleDateString()}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Statistics Grid - Enhanced */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Score Card */}
                                    <Card className="border gap-0! border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-md transition-all">
                                        <CardHeader className="pb-2">
                                            <CardDescription className="flex items-center gap-1.5 text-xs">
                                                <div className="p-1 bg-primary/10 rounded">
                                                    <TrendingUp className="h-3 w-3 text-primary" />
                                                </div>
                                                Score Global
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-primary">
                                                {selectedFacade.score}<span className="text-lg">/100</span>
                                            </div>
                                            <Progress value={selectedFacade.score} className="mt-2 h-2" />
                                        </CardContent>
                                    </Card>

                                    {/* Surface Card */}
                                    <Card className="border gap-0! hover:shadow-md transition-all">
                                        <CardHeader className="pb-2">
                                            <CardDescription className="flex items-center gap-1.5 text-xs">
                                                <div className="p-1 bg-blue-500/10 rounded">
                                                    <Layers className="h-3 w-3 text-blue-600" />
                                                </div>
                                                Surface
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-foreground">
                                                {selectedFacade.surface_m2}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">mètres carrés</p>
                                        </CardContent>
                                    </Card>

                                    {/* Type Card */}
                                    <Card className="border gap-0! hover:shadow-md transition-all">
                                        <CardHeader className="pb-2">
                                            <CardDescription className="flex items-center gap-1.5 text-xs">
                                                <div className="p-1 bg-purple-500/10 rounded">
                                                    <Building className="h-3 w-3 text-purple-600" />
                                                </div>
                                                Type
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-xl font-bold text-foreground">
                                                {getFacadeType(selectedFacade)}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">Catégorie</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Defects Analysis - Enhanced with Donut Chart */}
                                <Card className="border shadow-sm p-0">
                                    <CardHeader className=" p-3">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <div className="p-1 bg-orange-500/10 rounded">
                                                <TrendingUp className="h-3 w-3 text-orange-600" />
                                            </div>
                                            Analyse des défauts
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Répartition détaillée des problèmes détectés
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="">
                                        {(() => {
                                            const breakdown = selectedFacade.score_breakdown || {};
                                            const chartData = [
                                                { name: "fissures", label: "Fissures", value: breakdown.fissures || breakdown.facade_fissuree || 0, fill: "hsl(0, 84%, 60%)" },
                                                { name: "humidite", label: "Humidité", value: breakdown.humidite || 0, fill: "hsl(221, 83%, 53%)" },
                                                { name: "decollement", label: "Décollement", value: breakdown.decollement || breakdown.facade_ecailee || breakdown.ecaillage || 0, fill: "hsl(48, 96%, 53%)" },
                                                { name: "salissures", label: "Salissures", value: breakdown.salissures || breakdown.facade_ternie || 0, fill: "hsl(180, 50%, 45%)" },
                                                { name: "decoloration", label: "Dégradation", value: breakdown.decoloration || breakdown.facade_degradee_tags_ou_temps || 0, fill: "hsl(280, 50%, 45%)" },
                                                { name: "autres", label: "Autres", value: breakdown.autres || 0, fill: "hsl(215, 16%, 47%)" },
                                            ].filter(item => item.value > 0);

                                            return (
                                                <div className="flex items-center gap-6">
                                                    {/* Legend - Left Side */}
                                                    <div className=" w-1/2 ">
                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                                            {chartData.map((item, idx) => (
                                                                <div key={idx} className="flex items-center gap-2">
                                                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">{item.label}</p>
                                                                        <p className="text-xs font-bold leading-none">{item.value}%</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Chart - Right Side */}
                                                    <div className="shrink-0 w-[200px] h-[200px]">
                                                        <ChartContainer
                                                            config={{
                                                                fissures: { label: "Fissures", color: "hsl(0, 84%, 60%)" },
                                                                humidite: { label: "Humidité", color: "hsl(221, 83%, 53%)" },
                                                                decollement: { label: "Décollement", color: "hsl(48, 96%, 53%)" },
                                                                salissures: { label: "Salissures", color: "hsl(180, 50%, 45%)" },
                                                                decoloration: { label: "Dégradation", color: "hsl(280, 50%, 45%)" },
                                                                autres: { label: "Autres", color: "hsl(215, 16%, 47%)" },
                                                            }}
                                                            className="w-full h-full"
                                                        >
                                                            <PieChart>
                                                                <ChartTooltip
                                                                    cursor={false}
                                                                    content={<ChartTooltipContent hideLabel />}
                                                                />
                                                                <Pie
                                                                    data={chartData}
                                                                    dataKey="value"
                                                                    nameKey="name"
                                                                    innerRadius={50}
                                                                    strokeWidth={5}
                                                                    activeIndex={0}
                                                                    activeShape={({
                                                                        outerRadius = 0,
                                                                        ...props
                                                                    }: PieSectorDataItem) => (
                                                                        <Sector {...props} outerRadius={outerRadius + 8} />
                                                                    )}
                                                                />
                                                            </PieChart>
                                                        </ChartContainer>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>

                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    )
}