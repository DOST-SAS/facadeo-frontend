import { useEffect, useState, useRef } from "react"
import {
    Plus,
    Minus,
    Crosshair,
    FileText,
    Download,
    ArrowDown,
    ArrowUp,
    ArrowLeft,
    ScanLine,
    Activity,
    Target,
    Filter,
    RotateCcw,
    Store
} from "lucide-react"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Link, useParams } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn, statusBadgeConfig } from "@/lib/utils"
import { ScansServiceInstance } from "@/services/artisan/scansServices"
import type { Scan, Facade } from "@/types/scansTypes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import GoogleMap, { type GoogleMapRef } from "@/components/GoogleMap"
import { getPlaceTypeLabel } from "@/utils/businessTypeConverter"

export function AdminDetailScan() {
    const { slug } = useParams()
    const [minScore, setMinScore] = useState(0)
    const [maxScore, setMaxScore] = useState(100)
    const [scan, setScan] = useState<Scan>()
    const [loading, setLoading] = useState(false)
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [selectedBusinessType, setSelectedBusinessType] = useState<string>("")
    const [selectedSurfaces, setSelectedSurfaces] = useState<Facade[]>([])
    const mapRef = useRef<GoogleMapRef>(null)

    const uniqueBusinessTypes = useMemo(() => {
        const types = new Set<string>()
        scan?.facades?.forEach((facade) => {
            const type = facade.address?.type || facade.business?.business_type
            if (type) {
                types.add(type)
            }
        })
        return Array.from(types).sort()
    }, [scan?.facades])

    useEffect(() => {
        const fetchScan = async () => {
            setLoading(true)
            try {
                if (slug) {
                    const scanData = await ScansServiceInstance.getScanBySlug(slug as string)
                    setScan(scanData)
                }
            } catch (error) {
                console.error("Error fetching scans:", error)
            } finally {
                setLoading(false)
            }
        };

        fetchScan();
    }, [slug]);

    const handleSliderChange = (values: number[]) => {
        if (values.length === 2) {
            setMinScore(values[0])
            setMaxScore(values[1])
        }
    }

    const resetFilters = () => {
        setMinScore(0)
        setMaxScore(100)
        setSelectedBusinessType("")
    }

    const ToggleSortScore = (direction: 'asc' | 'desc') => {
        if (!scan?.facades) return
        const sortedFacades = [...scan.facades].sort((a, b) => {
            const scoreA = a.score || 0
            const scoreB = b.score || 0
            return direction === 'asc' ? scoreA - scoreB : scoreB - scoreA
        })
        setScan({ ...scan, facades: sortedFacades })
    }

    // Helper to parse PostGIS WKB hex to lat/lng
    const parseWKBPoint = (wkb: string | { coordinates?: number[] }): { lat: number; lng: number } => {
        if (typeof wkb === 'object' && wkb?.coordinates) {
            return { lat: wkb.coordinates[1] || 0, lng: wkb.coordinates[0] || 0 }
        }

        if (typeof wkb === 'string' && wkb.length >= 50) {
            try {
                const hexString = wkb.toUpperCase()
                const hasEWKB = hexString.startsWith('0101000020')
                const coordStart = hasEWKB ? 18 : 10
                const xHex = hexString.slice(coordStart, coordStart + 16)
                const yHex = hexString.slice(coordStart + 16, coordStart + 32)
                const lng = parseHexToDouble(xHex)
                const lat = parseHexToDouble(yHex)
                if (!isNaN(lat) && !isNaN(lng)) {
                    return { lat, lng }
                }
            } catch (e) {
                console.error('Error parsing WKB:', e)
            }
        }
        return { lat: 0, lng: 0 }
    }

    const parseHexToDouble = (hex: string): number => {
        const bytes = new Uint8Array(8)
        for (let i = 0; i < 8; i++) {
            bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
        }
        const view = new DataView(bytes.buffer)
        return view.getFloat64(0, true)
    }

    const getFacadeDisplayName = (facade: Facade): string => {
        if (facade.business?.name) return facade.business.name
        if (facade.address?.name) return facade.address.name
        if (facade.address?.street) return `${facade.address.street}, ${facade.address.city || ''}`
        return facade.facade_number || 'Façade'
    }

    const getStreetviewImage = (facade: Facade): string | null => {
        if (!facade.streetview_url) return null
        try {
            if (typeof facade.streetview_url === 'string') {
                if (facade.streetview_url.startsWith('[')) {
                    const urls = JSON.parse(facade.streetview_url)
                    return urls[0] || null
                }
                return facade.streetview_url
            }
        } catch {
            return null
        }
        return null
    }

    const facadesForMap = scan?.facades?.map(facade => {
        const coords = parseWKBPoint(facade.location)
        const types = facade.types ? facade.types.split(',').map(t => t.trim()) : []
        return {
            id: facade.id,
            name: getFacadeDisplayName(facade),
            coordinates: coords,
            address: getFacadeDisplayName(facade),
            types: types,
            score: facade.score
        }
    }).filter(f => f.coordinates.lat !== 0 && f.coordinates.lng !== 0) || []

    const mapCenter = facadesForMap.length > 0
        ? facadesForMap[0].coordinates
        : { lat: 48.8566, lng: 2.3522 }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
            </div>
            <div className="relative mx-auto px-6 py-8 rounded-sm space-y-6">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/admin">Accueil</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/admin/scans">Scans</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Résultat du scan</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Link to="/admin/scans">
                            <ArrowLeft className="h-6 w-6 text-foreground bg-muted rounded-full p-1 hover:bg-primary/10 transition-colors" />
                        </Link>
                        <h1 className="text-lg md:text-3xl font-bold text-foreground/70">
                            {scan?.name}
                        </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {scan?.status && statusBadgeConfig[scan.status] && (() => {
                            const StatusIcon = statusBadgeConfig[scan.status].icon
                            const isAnimated = scan.status === 'running' || scan.status === 'pending'
                            return (
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium tracking-wide rounded-lg border transition-all",
                                        statusBadgeConfig[scan.status].className
                                    )}
                                >
                                    <StatusIcon className={cn("h-3.5 w-3.5", isAnimated && "animate-spin")} />
                                    {statusBadgeConfig[scan.status].label}
                                </span>
                            )
                        })()}
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <ScanLine className="h-4 w-4" />
                            <span className="font-semibold text-foreground">{scan?.facades?.length || 0}</span>
                            <span>façades détectées</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Activity className="h-4 w-4" />
                            <span>Score moyen:</span>
                            <span className="font-semibold text-foreground">
                                {scan?.facades && scan.facades.length > 0
                                    ? (scan.facades.reduce((acc, f) => acc + (f.score || 0), 0) / scan.facades.length).toFixed(0)
                                    : '0'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Mobile Filter Button */}
                <div className="md:hidden">
                    <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <SheetTrigger asChild className="flex justify-end!">
                            <Button
                                variant="outline"
                                className="h-12 gap-2 bg-card border-border hover:bg-primary/5 hover:border-primary/40"
                            >
                                <Filter className="h-4 w-4" />
                                Filtres
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[95%] p-4">
                            <SheetHeader className="p-0">
                                <SheetTitle>Filtres de recherche</SheetTitle>
                                <SheetDescription>
                                    Affinez vos résultats avec les filtres ci-dessous
                                </SheetDescription>
                            </SheetHeader>
                            <div className="mt-6">
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="font-medium text-muted-foreground" htmlFor="score-filter-min">Score (0-100)</label>
                                            <div className="font-medium">
                                                <span>{minScore}</span> - <span>{maxScore}</span>
                                            </div>
                                        </div>
                                        <Slider
                                            defaultValue={[20, 80]}
                                            max={100}
                                            step={1}
                                            value={[minScore, maxScore]}
                                            onValueChange={handleSliderChange}
                                            className="py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-medium text-muted-foreground" htmlFor="business-filter">Type de commerce</label>
                                        <div className="mt-1">
                                            <Select
                                                value={selectedBusinessType}
                                                onValueChange={setSelectedBusinessType}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner le type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Tous les types</SelectItem>
                                                    {uniqueBusinessTypes.map((type) => (
                                                        <SelectItem key={type} value={type}>
                                                            {getPlaceTypeLabel(type)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setMinScore(0)
                                        setMaxScore(100)
                                    }}
                                >
                                    Réinitialiser
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => setIsFilterOpen(false)}
                                >
                                    Appliquer
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Desktop Filters Toolbar */}
                <div className="hidden md:flex items-center justify-between p-2 rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground w-fit">
                            <Filter className="w-4 h-4" />
                            <span>Filtres</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 ">
                        {/* Business Type Filter */}
                        <div className="flex items-center gap-2">
                            <Select
                                value={selectedBusinessType}
                                onValueChange={setSelectedBusinessType}
                            >
                                <SelectTrigger className="w-[180px] h-9! bg-background border-border/60">
                                    <Store className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                                    <SelectValue placeholder="Tous les types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les types</SelectItem>
                                    {uniqueBusinessTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {getPlaceTypeLabel(type)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Separator */}
                        <div className="h-6 w-px bg-border/60" />

                        {/* Score Filter Popover */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-9 border-dashed border-border/60 bg-background hover:bg-muted/50">
                                    <Target className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                                    Score: {minScore}-{maxScore}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4" align="start">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-medium leading-none">Plage de score</h4>
                                        <span className="text-xs text-muted-foreground">{minScore} - {maxScore}</span>
                                    </div>
                                    <Slider
                                        defaultValue={[20, 80]}
                                        max={100}
                                        step={1}
                                        value={[minScore, maxScore]}
                                        onValueChange={handleSliderChange}
                                        className="py-2"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>0</span>
                                        <span>100</span>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    {/* Filters Summary & Reset */}
                    <div className="flex items-center gap-2 pl-4 border-l border-border/60 animate-in fade-in slide-in-from-right-2 duration-200">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            className="h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                            <RotateCcw className="w-3.5 h-3.5 mr-2" />
                            Réinitialiser
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col-reverse lg:flex-row gap-4 rounded-xl bg-card/50 backdrop-blur-sm p-4 lg:min-h-[600px] border border-border/50">
                    <section className="rounded-xl bg-gradient-to-b from-card to-card/80 w-full lg:w-[420px] p-4 border border-border/30 shadow-sm">
                        {/* Header Actions */}
                        <div className="flex items-center gap-2 mb-4">
                            <Button
                                disabled={selectedSurfaces.length === 0}
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-2 h-9 bg-background/50 hover:bg-primary/10 hover:border-primary/50 transition-all"
                            >
                                <FileText className="h-4 w-4" />
                                <span className="hidden sm:inline">Rapport groupé</span>
                            </Button>
                            <Button
                                disabled={selectedSurfaces.length === 0}
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-2 h-9 bg-background/50 hover:bg-primary/10 hover:border-primary/50 transition-all"
                            >
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">Exporter</span>
                            </Button>
                        </div>

                        {/* List Header */}
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-primary/10">
                                    <ScanLine className="h-4 w-4 text-primary" />
                                </div>
                                <h3 className="font-semibold text-foreground">Façades détectées</h3>
                                <Badge variant="secondary" className="ml-1 font-mono text-xs">
                                    {scan?.facades?.length || 0}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 hover:bg-primary/20 hover:text-primary rounded-md"
                                    onClick={() => ToggleSortScore('desc')}
                                    title="Score décroissant"
                                >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 hover:bg-primary/20 hover:text-primary rounded-md"
                                    onClick={() => ToggleSortScore('asc')}
                                    title="Score croissant"
                                >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        {/* Facades List */}
                        <ScrollArea className="h-[480px] w-full pr-2">
                            <div className="space-y-3">
                                {scan?.facades?.map((item) => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "group relative p-3 rounded-md border bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
                                            selectedSurfaces.some(surface => surface.id === item.id)
                                                ? "border-primary/50 bg-primary/5 shadow-sm shadow-primary/10"
                                                : "border-border/40"
                                        )}
                                    >
                                        <div className="flex gap-3">


                                            {/* Image */}
                                            <div className="relative w-20 h-20 rounded-sm bg-muted shrink-0 overflow-hidden ring-1 ring-border/50">
                                                {getStreetviewImage(item) ? (
                                                    <img
                                                        src={getStreetviewImage(item)!}
                                                        alt="facade"
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <img
                                                        src="/facade.png"
                                                        alt="facade"
                                                        className="w-full h-full object-cover opacity-60"
                                                    />
                                                )}
                                                {/* Score Badge Overlay */}
                                                <div className="absolute top-1.5 right-1.5">
                                                    {item.score !== undefined && item.score !== null && (
                                                        <div className={cn(
                                                            "px-1.5 py-0.5 rounded-md text-xs font-bold shadow-sm",
                                                            item.score >= 75 ? "bg-emerald-500 text-white" :
                                                                item.score >= 40 ? "bg-yellow-500 text-white" :
                                                                    "bg-red-500 text-white"
                                                        )}>
                                                            {item.score}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 space-y-2 ">
                                                <Link
                                                    to={`/admin/facades/${item.id}`}
                                                    className="block font-medium text-sm text-foreground hover:text-primary transition-colors line-clamp-1 underline text-primary"
                                                >
                                                    {getFacadeDisplayName(item)}
                                                </Link>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    {item.surface_m2 && (
                                                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                                            <span className="font-medium">{item.surface_m2}m²</span>
                                                        </span>
                                                    )}
                                                    {item.types && (
                                                        <span className="inline-flex items-center gap-1 text-xs text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                                                            <Store className="h-3 w-3 shrink-0" />
                                                            <span className="truncate">
                                                                {item.types
                                                                    .split(',')
                                                                    .map((type: string) => getPlaceTypeLabel(type.trim()))
                                                                    .join(', ')
                                                                }
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>

                                                {item.business?.name && item.business.name !== getFacadeDisplayName(item) && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {item.business.name}
                                                    </p>
                                                )}
                                            </div>
                                            {/* Checkbox */}
                                            <div className="flex items-start pt-1">
                                                <Checkbox
                                                    checked={selectedSurfaces.some(surface => surface.id === item.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked === true) {
                                                            setSelectedSurfaces([...selectedSurfaces, item])
                                                        } else {
                                                            setSelectedSurfaces(selectedSurfaces.filter((surface) => surface.id !== item.id))
                                                        }
                                                    }}
                                                    className="h-4 w-4 cursor-pointer border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Empty State */}
                                {(!scan?.facades || scan.facades.length === 0) && !loading && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="p-4 rounded-full bg-muted/50 mb-4">
                                            <ScanLine className="h-8 w-8 text-muted-foreground/50" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">Aucune façade détectée</p>
                                        <p className="text-xs text-muted-foreground/70 mt-1">Les résultats apparaîtront ici</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Selection Summary */}
                        {selectedSurfaces.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    <span className="font-semibold text-primary">{selectedSurfaces.length}</span> façade{selectedSurfaces.length > 1 ? 's' : ''} sélectionnée{selectedSurfaces.length > 1 ? 's' : ''}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={() => setSelectedSurfaces([])}
                                >
                                    Tout désélectionner
                                </Button>
                            </div>
                        )}
                    </section>

                    <section className="flex-1 min-w-0">
                        <div className="relative rounded-xl border border-border/50 w-full h-96 lg:h-full bg-muted/30 overflow-hidden shadow-sm">
                            {loading ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-3"></div>
                                        <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
                                    </div>
                                </div>
                            ) : (
                                <GoogleMap
                                    ref={mapRef}
                                    center={mapCenter}
                                    zoom={14}
                                    radius={scan?.radius_meters || 500}
                                    facades={facadesForMap}
                                    className="w-full h-full"
                                />
                            )}

                            {/* Map Controls */}
                            <div className="absolute bottom-24 md:bottom-4 right-4 flex flex-col gap-1.5 z-10">
                                <div className="bg-background/90 backdrop-blur-sm rounded-lg p-1 shadow-lg border border-border/50">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                                        title="Zoom avant"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                                        title="Zoom arrière"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-9 w-9 shadow-lg hover:shadow-xl hover:bg-primary/10 hover:text-primary transition-all bg-background/90 backdrop-blur-sm border border-border/50"
                                    onClick={() => mapRef.current?.getCurrentLocation()}
                                    title="Ma position"
                                >
                                    <Crosshair className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Legend */}
                            <div className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:max-w-[200px] rounded-xl bg-background/95 backdrop-blur-md p-4 shadow-lg border border-border/50 z-10">
                                <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <Target className="h-3.5 w-3.5 text-primary" />
                                    Légende des scores
                                </h4>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-500/20"></span>
                                            <span className="text-xs text-foreground/80">Bon</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">75-100</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500 shrink-0 ring-2 ring-yellow-500/20"></span>
                                            <span className="text-xs text-foreground/80">Moyen</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">40-75</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0 ring-2 ring-red-500/20"></span>
                                            <span className="text-xs text-foreground/80">Critique</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">0-40</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
