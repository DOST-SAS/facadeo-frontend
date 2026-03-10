import React from "react"
import { Link } from "react-router-dom"
import { FileText, Download, ArrowDown, ArrowUp, ScanLine, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Facade } from "@/types/scansTypes"
import { getPlaceTypeLabel } from "@/utils/businessTypeConverter"

type ScanStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'canceled'

interface FacadesListProps {
    facades?: Facade[]
    slug?: string
    selectedSurfaces: Facade[]
    newFacadeIds: Set<string>
    loading: boolean
    scanStatus?: ScanStatus
    onSelectionChange: (facades: Facade[]) => void
    onSortScore: (direction: 'asc' | 'desc') => void
    onExportPdf: () => void
}


// Simplified Scan Progress Animation with GIF
function ScanProgressAnimation({ facadesCount }: { facadesCount: number }) {
    const [currentStage, setCurrentStage] = React.useState(0)

    const scanningStages = [
        "Recherche Google Places...",
        "Récupération Street View...",
        "Détection des défauts...",
    ]

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStage((prev) => (prev + 1) % scanningStages.length)
        }, 2500)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="mb-4 p-2 rounded-xl border border-primary/20 bg-linear-to-br from-primary/5 to-transparent shadow-sm">
            {/* Centered Lottie Animation */}
            <div className="flex justify-center mb-2">
                <iframe
                    className="w-28 h-28 object-contain"
                    src="https://lottie.host/embed/71e55625-9d90-474a-88d0-8d259689133b/tLI4Xe2jpw.lottie"
                    title="Scanning animation"
                />
            </div>

            {/* Scanning Steps */}
            <div className="space-y-2">
                {scanningStages.map((stage, index) => {
                    const isActive = index === currentStage
                    const isCompleted = index < currentStage

                    return (
                        <div
                            key={index}
                            className={`relative p-2 rounded-lg border transition-all duration-500 ${isActive
                                ? 'border-primary/40 bg-primary/5 shadow-sm'
                                : isCompleted
                                    ? 'border-primary/20 bg-primary/5 opacity-60'
                                    : 'border-border/30 bg-muted/20 opacity-40'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {/* Step Number/Status */}
                                <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isActive
                                    ? 'bg-primary text-primary-foreground animate-pulse'
                                    : isCompleted
                                        ? 'bg-primary/60 text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                    }`}>
                                    {isCompleted ? '✓' : index + 1}
                                </div>

                                {/* Step Content */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-semibold transition-all ${isActive ? 'text-primary' : 'text-foreground/70'
                                        }`}>
                                        {stage}
                                    </p>

                                    {/* Skeleton Loading Animation - only for active step */}
                                    {isActive && (
                                        <div className="mt-1.5 space-y-1">
                                            <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary/40 rounded-full animate-[shimmer_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
                                            </div>
                                            <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary/40 rounded-full animate-[shimmer_2s_ease-in-out_infinite] delay-100" style={{ width: '40%' }} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Loading Spinner for active step */}
                                {isActive && (
                                    <div className="shrink-0">
                                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Footer with facade count */}
            <div className="pt-2 border-t border-border/30 flex items-center justify-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                        {facadesCount}
                        <span className="text-xs text-muted-foreground">
                            façade{facadesCount !== 1 ? 's' : ''} détectée{facadesCount !== 1 ? 's' : ''}
                        </span>
                    </span>
                </div>

            </div>

            {/* Shimmer animation keyframes */}
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}</style>
        </div>
    )
}

// Helper to get facade display name
const getFacadeDisplayName = (facade: Facade): string => {
    if (facade.business?.name) return facade.business.name
    if (facade.address?.name) return facade.address.name
    if (facade.address?.street) return `${facade.address.street}, ${facade.address.city || ''}`
    return facade.facade_number || 'Façade'
}

// Helper to get first streetview image URL
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

export function FacadesList({
    facades,
    slug,
    selectedSurfaces,
    newFacadeIds,
    loading,
    scanStatus,
    onSelectionChange,
    onSortScore,
    onExportPdf,
}: FacadesListProps) {
    const handleCheckboxChange = (facade: Facade, checked: boolean) => {
        if (checked) {
            onSelectionChange([...selectedSurfaces, facade])
        } else {
            onSelectionChange(selectedSurfaces.filter((s) => s.id !== facade.id))
        }
    }

    const isScanning = scanStatus === 'running' || scanStatus === 'pending'

    return (
        <section className="rounded-xl bg-gradient-to-b from-card to-card/80 w-full lg:w-[420px] p-4 border border-border/30 shadow-sm">


            {/* Scan Progress Animation - shown when scanning */}
            {isScanning && (
                <ScanProgressAnimation facadesCount={facades?.length || 0} />
            )}
            {/* Header Actions */}
            <div className="flex items-center gap-2 mb-4">
                <Button
                    disabled={selectedSurfaces.length === 0}
                    variant="outline"
                    size="sm"
                    onClick={onExportPdf}
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
                        {facades?.length || 0}
                    </Badge>
                </div>
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-primary/20 hover:text-primary rounded-md"
                        onClick={() => onSortScore('desc')}
                        title="Score décroissant"
                    >
                        <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-primary/20 hover:text-primary rounded-md"
                        onClick={() => onSortScore('asc')}
                        title="Score croissant"
                    >
                        <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Facades List */}
            <ScrollArea className="h-[480px] w-full pr-4 ">
                <div className="space-y-2 ">
                    {facades?.map((item) => (
                        <div
                            key={item.id}
                            className={cn(
                                "group relative p-2 rounded-sm border bg-background transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
                                selectedSurfaces.some(surface => surface.id === item.id)
                                    ? "border-primary/50 bg-primary/5 shadow-sm shadow-primary/10"
                                    : "border-border/40",
                                newFacadeIds.has(item.id) && "animate-pulse border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/20"
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
                                <div className="flex-1 min-w-0 space-y-2">
                                    <Link
                                        to={`/scans/${slug}/facades/${item.id}`}
                                        className="block font-medium text-sm text-foreground hover:text-primary transition-colors line-clamp-1 truncate max-w-[240px]"
                                    >
                                        {getFacadeDisplayName(item)}
                                    </Link>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {item.surface_m2 && (
                                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                                <span className="font-medium">{item.surface_m2}m²</span>
                                            </span>
                                        )}
                                        {item?.types && (
                                            <div className="flex flex-wrap gap-1">
                                                {item.types
                                                    .split(',')
                                                    .slice(0, 2)
                                                    .map((type: string) => type.trim())
                                                    .filter(Boolean)
                                                    .map((type: string) => (
                                                        <span
                                                            key={type}
                                                            className="inline-flex items-center gap-1 text-xs text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full truncate max-w-[120px]"
                                                        >
                                                            <Store className="h-3 w-3 shrink-0" />
                                                            <span className="truncate">
                                                                {getPlaceTypeLabel(type)}
                                                            </span>
                                                        </span>
                                                    ))}
                                            </div>
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
                                        onCheckedChange={(checked) => handleCheckboxChange(item, checked === true)}
                                        className="h-4 w-4 cursor-pointer border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty State */}
                    {(!facades || facades.length === 0) && !loading && (
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
                        onClick={() => onSelectionChange([])}
                    >
                        Tout désélectionner
                    </Button>
                </div>
            )}
        </section>
    )
}
