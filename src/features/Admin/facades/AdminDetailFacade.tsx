import { useEffect, useState, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
    ZoomIn,
    ZoomOut,
    Maximize2,
    MapPin,
    Ruler,
    FileText,
    ArrowLeft,
    Map,
    Calendar,
    Store,
    Radar,
    ChevronLeft,
    ChevronRight,
    ImageIcon,
    Navigation,
    Phone,
    Globe
} from "lucide-react"
import {
    Label,
    PolarGrid,
    PolarRadiusAxis,
    RadialBar,
    RadialBarChart,
} from "recharts"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { FacadesServiceInstance } from "@/services/admin/facadesSevices"
import type { Facade } from "@/types/scansTypes"
import { getPlaceTypeLabel } from "@/utils/businessTypeConverter"
import { Badge } from "@/components/ui/badge"
import { generateAdminFacadeReportPdf } from "@/utils/adminFacadeRapportPdf"
import toast from "react-hot-toast"

// Helper to parse score breakdown label
const parseScoreBreakdown = (scoreBreakdown: string | null): string => {
    switch (scoreBreakdown) {
        case 'fissures':
        case 'facade_fissuree':
            return 'Fissures'
        case 'humidite':
            return 'Humidité'
        case 'ecaillage':
        case 'facade_ecailee':
            return 'Écaillage'
        case 'salissures':
        case 'facade_ternie':
            return 'Salissures / Ternie'
        case 'decoloration':
        case 'facade_degradee_tags_ou_temps':
            return 'Décoloration / Dégradée'
        default:
            return scoreBreakdown || '-'
    }
}

const chartConfig = {
    value: {
        label: "Score",
    },
} satisfies ChartConfig

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

// Helper to get facade display name
const getFacadeDisplayName = (facade: Facade | null): string => {
    if (!facade) return 'Façade'
    if (facade.businesses_cache?.name) return facade.businesses_cache.name
    if (facade.address?.name) return facade.address.name
    if (facade.address?.street) return `${facade.address.street}, ${facade.address.city || ''}`
    return facade.facade_number || 'Façade'
}

// Helper to get facade type
const getFacadeType = (facade: Facade | null): string => {
    if (!facade) return 'N/A'
    if (facade.types) {
        return facade.types
            .split(',')
            .map((type: string) => getPlaceTypeLabel(type.trim()))
            .join(', ')
    }
    return facade.businesses_cache?.name || facade.address?.type || facade.address?.name || 'Non spécifié'
}

// Type for streetview metadata
interface StreetViewImageMetadata {
    fov: number
    rank: number
    pitch: number
    heading: number
    confidence: string
    visibility: string
    camera_position: { lat: number; lon: number }
    target_position: { lat: number; lon: number }
    original_filename: string
}

interface StreetViewMetadata {
    images: StreetViewImageMetadata[]
    verification?: {
        reasoning: string
        confidence: string
        visibility: string
    }
}

// Helper to get rank 1 image metadata from streetview_metadata
const getRank1Metadata = (metadata: StreetViewMetadata | null): StreetViewImageMetadata | null => {
    if (!metadata?.images?.length) return null
    return metadata.images.find(img => img.rank === 1) || metadata.images[0]
}

export default function AdminDetailFacade() {
    const { id } = useParams<{ id: string }>()
    const [zoom, setZoom] = useState(100)
    const [facade, setFacade] = useState<Facade | null>(null)
    const [totalDetected, setTotalDetected] = useState(0)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [showStreetView, setShowStreetView] = useState(false)
    const streetViewRef = useRef<HTMLDivElement>(null)
    const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null)
    const [isGeneratingReport, setIsGeneratingReport] = useState(false)

    const handleDownloadReport = async () => {
        if (!facade) return

        setIsGeneratingReport(true)
        const toastId = toast.loading("Génération du rapport en cours...")

        try {
            const blob = await generateAdminFacadeReportPdf({
                facade,
                totalDetected
            })

            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `rapport-facade-${facade.facade_number || facade.id.substring(0, 8)}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success("Rapport téléchargé avec succès", { id: toastId })
        } catch (error) {
            console.error("Error generating report:", error)
            toast.error("Erreur lors de la génération du rapport", { id: toastId })
        } finally {
            setIsGeneratingReport(false)
        }
    }

    // Parse image URLs from facade data (prioritize streetview_url)
    const imageUrls = parseImageUrls(facade?.streetview_url || facade?.simulated_image_url || null)
    const currentImage = imageUrls[currentImageIndex] || '/facade.png'

    // Parse streetview metadata
    const streetviewMetadata: StreetViewMetadata | null = facade?.streetview_metadata
        ? (typeof facade.streetview_metadata === 'string'
            ? JSON.parse(facade.streetview_metadata)
            : facade.streetview_metadata)
        : null
    const rank1Metadata = getRank1Metadata(streetviewMetadata)

    useEffect(() => {
        const fetchFacade = async () => {
            setLoading(true)
            try {
                if (id) {
                    const facadeData = await FacadesServiceInstance.getFacadeById(id)
                    console.log("from admin facade", facadeData)
                    setFacade(facadeData)
                }
            } catch (error) {
                console.error("Error fetching facade:", error)
            } finally {
                setLoading(false)
            }
        }
        const fetchTotalDetected = async () => {
            try {
                if (id) {
                    const total = await FacadesServiceInstance.getFacadeTotalDetected(id)
                    setTotalDetected(total)
                }
            } catch (error) {
                console.error("Error fetching total detected:", error)
            }
        }
        fetchFacade()
        fetchTotalDetected()
    }, [id])

    // Image navigation
    const handlePrevImage = () => {
        setCurrentImageIndex(prev => prev > 0 ? prev - 1 : imageUrls.length - 1)
    }

    const handleNextImage = () => {
        setCurrentImageIndex(prev => prev < imageUrls.length - 1 ? prev + 1 : 0)
    }

    // Initialize Street View when toggled on
    useEffect(() => {
        if (!showStreetView || !streetViewRef.current || !rank1Metadata) return

        // Load Google Maps API if not already loaded
        const initStreetView = () => {
            if (!window.google?.maps) {
                const script = document.createElement('script')
                script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAP_API_KEY}`
                script.async = true
                script.onload = () => createPanorama()
                document.head.appendChild(script)
            } else {
                createPanorama()
            }
        }

        const createPanorama = () => {
            if (!streetViewRef.current || !rank1Metadata) return

            const position = {
                lat: rank1Metadata.camera_position.lat,
                lng: rank1Metadata.camera_position.lon
            }

            panoramaRef.current = new google.maps.StreetViewPanorama(streetViewRef.current, {
                position,
                pov: {
                    heading: rank1Metadata.heading,
                    pitch: rank1Metadata.pitch
                },
                zoom: 1,
                addressControl: false,
                showRoadLabels: false,
                motionTracking: false,
                motionTrackingControl: false
            })
        }

        initStreetView()

        return () => {
            panoramaRef.current = null
        }
    }, [showStreetView, rank1Metadata])

    // Determine color based on score
    const getScoreColor = (score: number) => {
        if (score < 40) return "var(--destructive)"
        if (score >= 40 && score <= 75) return "var(--warning)"
        return "var(--success)"
    }

    const scoreColor = getScoreColor(facade?.score ?? 0)

    const chartData = [
        { score: "score", value: facade?.score, fill: scoreColor },
    ]

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200))
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50))

    const handleFullscreen = () => {
        const imageContainer = document.querySelector('.facade-image-container')
        if (imageContainer) {
            if (document.fullscreenElement) {
                document.exitFullscreen()
            } else {
                imageContainer.requestFullscreen().catch(err => {
                    console.error('Error attempting to enable fullscreen:', err)
                })
            }
        }
    }

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    return (
        <div className="relative min-h-screen bg-background overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
            </div>

            <div className="relative mx-auto   px-6 py-8">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/admin">Accueil</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/admin/facades">Façades</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Détails de la façade</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                {/* Header */}
                <div className="my-6 flex items-center gap-4">
                    <h1 className="text-lg md:text-3xl font-bold text-foreground/70 flex items-center gap-2">
                        <Link to="/admin/facades">
                            <ArrowLeft className="h-6 w-6 text-foreground bg-muted rounded-full p-1" />
                        </Link>
                        {getFacadeDisplayName(facade)}
                        <span className="py-1 text-sm bg-muted rounded-full px-2 text-foreground/70">#{facade?.facade_number || facade?.id}</span>
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Image Viewer */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card className="border-2 shadow-sm rounded-sm overflow-hidden border-dashed p-0.5">
                            <CardContent className="p-0 relative facade-image-container bg-muted/30">
                                {/* Image Controls */}
                                <div className="absolute top-4 left-4 z-10 flex gap-2">
                                    {!showStreetView && (
                                        <>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-9 w-9 bg-secondary hover:bg-secondary/80 shadow-sm"
                                                onClick={handleZoomOut}
                                                disabled={zoom <= 50}
                                            >
                                                <ZoomOut className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-9 w-9 bg-secondary hover:bg-secondary/80 shadow-sm"
                                                onClick={handleZoomIn}
                                                disabled={zoom >= 200}
                                            >
                                                <ZoomIn className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="h-9 w-9 bg-secondary hover:bg-secondary/80 shadow-sm"
                                        onClick={handleFullscreen}
                                    >
                                        <Maximize2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Street View Toggle */}
                                {rank1Metadata && (
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/90 backdrop-blur-sm shadow-sm">
                                        <ImageIcon className={`h-4 w-4 ${!showStreetView ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <Switch
                                            checked={showStreetView}
                                            onCheckedChange={setShowStreetView}
                                            className="data-[state=checked]:bg-primary"
                                        />
                                        <Navigation className={`h-4 w-4 ${showStreetView ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <span className="text-xs font-medium text-foreground">
                                            {showStreetView ? 'Street View' : 'Images'}
                                        </span>
                                    </div>
                                )}

                                {/* Image Navigation (if multiple images and not in street view) */}
                                {!showStreetView && imageUrls.length > 1 && (
                                    <>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-secondary/90 hover:bg-secondary shadow-lg"
                                            onClick={handlePrevImage}
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-secondary/90 hover:bg-secondary shadow-lg"
                                            onClick={handleNextImage}
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </Button>
                                    </>
                                )}

                                {/* Zoom Level & Image Counter */}
                                <div className="absolute top-4 right-4 z-10 flex gap-2">
                                    {!showStreetView && imageUrls.length > 1 && (
                                        <div className="px-2 py-1 flex items-center gap-1.5 rounded-lg bg-secondary/90 backdrop-blur-sm shadow-sm">
                                            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-xs font-semibold text-foreground">{currentImageIndex + 1}/{imageUrls.length}</span>
                                        </div>
                                    )}
                                    {!showStreetView && (
                                        <div className="px-2 py-1 flex items-center justify-center rounded-lg bg-secondary/90 backdrop-blur-sm shadow-sm">
                                            <span className="text-xs font-semibold text-foreground">{zoom}%</span>
                                        </div>
                                    )}
                                </div>

                                <div className="max-h-[600px] overflow-hidden flex items-center justify-center min-h-[400px]">
                                    {loading ? (
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                            <p className="text-sm text-muted-foreground">Chargement...</p>
                                        </div>
                                    ) : showStreetView ? (
                                        <div
                                            ref={streetViewRef}
                                            className="w-full h-[500px] rounded-sm"
                                            style={{ minHeight: '400px' }}
                                        />
                                    ) : (
                                        <img
                                            src={currentImage}
                                            alt={`Facade ${currentImageIndex + 1}`}
                                            className="w-full h-full rounded-sm object-cover transition-transform duration-200"
                                            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
                                            onError={(e) => {
                                                e.currentTarget.src = "/facade.png"
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Image Thumbnails (only when not in street view) */}
                                {!showStreetView && imageUrls.length > 1 && (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 p-2 rounded-lg bg-secondary/90 backdrop-blur-sm shadow-lg">
                                        {imageUrls.map((url, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentImageIndex(index)}
                                                className={`w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${index === currentImageIndex
                                                    ? 'border-primary ring-2 ring-primary/30'
                                                    : 'border-transparent hover:border-muted-foreground/50'
                                                    }`}
                                            >
                                                <img
                                                    src={url}
                                                    alt={`Thumbnail ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.src = "/facade.png"
                                                    }}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>


                    </div>

                    {/* Right Column - Score & Defects */}
                    <div className="space-y-4">
                        {/* Score Card */}
                        <Card className="border-none shadow-sm rounded-sm p-0">
                            <CardContent className="p-6 py-4">
                                {/* Radial Chart */}
                                <ChartContainer
                                    config={chartConfig}
                                    className="mx-auto aspect-square max-h-[150px] mb-3"
                                >
                                    <RadialBarChart
                                        data={chartData}
                                        startAngle={-90}
                                        endAngle={((facade?.score ?? 0) / 100) * 180}
                                        innerRadius={60}
                                        outerRadius={90}
                                        barSize={10}
                                        style={
                                            {
                                                fill: "var(--primary)",
                                            }
                                        }
                                    >
                                        <PolarGrid
                                            gridType="circle"
                                            radialLines={false}
                                            stroke="none"
                                            className="first:fill-muted last:fill-background"
                                            polarRadius={[66, 54]}
                                        />
                                        <RadialBar dataKey="value" background cornerRadius={10} />
                                        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                                            <Label
                                                content={({ viewBox }) => {
                                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                        return (
                                                            <text
                                                                x={viewBox.cx}
                                                                y={viewBox.cy}
                                                                textAnchor="middle"
                                                                dominantBaseline="middle"
                                                            >
                                                                <tspan
                                                                    x={viewBox.cx}
                                                                    y={viewBox.cy}
                                                                    className="text-4xl font-bold"
                                                                    style={{ fill: scoreColor }}
                                                                >
                                                                    {facade?.score}
                                                                </tspan>
                                                                <tspan
                                                                    x={viewBox.cx}
                                                                    y={(viewBox.cy || 0) + 24}
                                                                    className="fill-muted-foreground text-sm"
                                                                >
                                                                    /100
                                                                </tspan>
                                                            </text>
                                                        )
                                                    }
                                                }}
                                            />
                                        </PolarRadiusAxis>
                                    </RadialBarChart>
                                </ChartContainer>

                                {/* Defects Breakdown */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-foreground">Défauts</h3>
                                    {facade?.score_breakdown && Object.entries(facade.score_breakdown)
                                        .filter(([name]) => name !== 'surface_m') // Exclude surface_m from defects
                                        .map(([name, value], index) => {
                                        const percentage = typeof value === 'number' ? value : 0
                                        // Determine color based on defect severity (higher percentage = more severe)
                                        const getDefectColors = (percentage: number) => {
                                            if (percentage <= 40) return {
                                                fill: "bg-destructive",
                                                bg: "bg-destructive/10"
                                                
                                            }
                                            if (percentage >= 41 && percentage <= 80) return {
                                                fill: "bg-warning",
                                                bg: "bg-warning/10"
                                            }
                                            return {
                                               fill: "bg-success",
                                               bg: "bg-success/10"
                                            }
                                        }

                                            const colors = getDefectColors(percentage)

                                            return (
                                                <div key={index} className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-foreground font-medium">
                                                            {parseScoreBreakdown(name)}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {percentage}%
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={percentage}
                                                        className={`h-2 ${colors.bg}`}
                                                        indicatorClassName={colors.fill}
                                                    />
                                                </div>
                                            )
                                        })}
                                </div>
                                {/* Total Detections */}
                                <div className="mt-6 p-2 rounded-sm border-2 border-dashed border-border/50 bg-gradient-to-br from-primary/5 to-accent/5 hover:shadow-sm transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                                                <Radar className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total de Détections</p>
                                                <p className="text-2xl font-bold text-foreground">
                                                    {totalDetected || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        {/* Action Button */}
                        <div className="flex justify-end">
                            <Button
                                onClick={handleDownloadReport}
                                disabled={isGeneratingReport || !facade}
                                className="w-full h-12 bg-primary text-white hover:bg-primary/90 font-bold uppercase rounded-sm"
                            >
                                {isGeneratingReport ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Génération...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-5 w-5 mr-2" />
                                        Télécharger le rapport
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
                {/* Facade Information */}
                <Card className="border-none shadow-sm rounded-sm p-0 mt-6">
                    <CardContent className="p-3">
                        <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-primary"></div>
                            Informations de la façade
                        </h2>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {/* Address */}
                            <div className="p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Adresse</p>
                                        <p className="text-sm font-medium text-foreground truncate max-w-[80%]">
                                            {facade?.formatted_address}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* Detection Date */}
                            <div className="p-4 rounded-xl border border-border/50 bg-background hover:shadow-sm transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-warning/10 text-warning">
                                        <Calendar className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Détection</p>
                                        <p className="text-sm font-medium text-foreground">
                                            {facade?.detected_at ? new Date(facade.detected_at).toLocaleDateString('fr-FR') : '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Grid Layout for Other Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Website */}
                            <div className="p-4 rounded-xl border border-border/50 bg-background hover:shadow-sm transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-success/10 text-success">
                                        <Globe className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Site web</p>
                                        <p className="text-sm font-medium text-foreground truncate max-w-[80%]">{facade?.website || "-"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="p-4 rounded-xl border border-border/50 bg-background hover:shadow-sm transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-accent/10 text-accent">
                                        <Phone className="h-4 w-4" />

                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tél </p>
                                        <p className="text-sm font-medium text-foreground">
                                            {facade?.formatted_phone_number || "---"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Business Type - Full Width on Grid */}
                            <div className="md:col-span-2 p-4 rounded-xl border border-border/50 bg-primary/5 hover:shadow-sm transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <Store className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type de commerce</p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {facade?.types
                                                ? facade.types
                                                    .split(',')
                                                    .map((type: string, index: number) => (
                                                        <Badge
                                                            key={index}
                                                            variant="secondary"
                                                            className="bg-primary/10 text-primary border-none hover:bg-primary/20 transition-all font-bold text-[10px] px-2 py-0.5"
                                                        >
                                                            {getPlaceTypeLabel(type.trim())}
                                                        </Badge>
                                                    ))
                                                : <span className="text-sm text-muted-foreground italic">Non spécifié</span>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
