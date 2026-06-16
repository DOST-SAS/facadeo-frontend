import { useEffect, useState, useRef } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Lightbox } from "@/components/ui/lightbox"
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
    Camera,
    Globe2
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
import { ScansServiceInstance } from "@/services/artisan/scansServices"
import type { Facade } from "@/types/scansTypes"
import { getPlaceTypeLabel } from "@/utils/businessTypeConverter"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

const chartConfig = {
    value: {
        label: "Score",
    },
} satisfies ChartConfig

// Helper to parse PostGIS WKB hex to lat/lng (currently unused but kept for future use)
// const parseWKBPoint = (wkb: string | { coordinates?: number[] } | null): { lat: number; lng: number } | null => {
//     if (!wkb) return null
//     
//     // If it's already an object with coordinates
//     if (typeof wkb === 'object' && wkb?.coordinates) {
//         return { lat: wkb.coordinates[1] || 0, lng: wkb.coordinates[0] || 0 }
//     }
//     
//     // Parse WKB hex string (SRID 4326 Point format)
//     if (typeof wkb === 'string' && wkb.length >= 50) {
//         try {
//             const hexString = wkb.toUpperCase()
//             const hasEWKB = hexString.startsWith('0101000020')
//             const coordStart = hasEWKB ? 18 : 10
//             
//             const xHex = hexString.slice(coordStart, coordStart + 16)
//             const yHex = hexString.slice(coordStart + 16, coordStart + 32)
//             
//             const lng = parseHexToDouble(xHex)
//             const lat = parseHexToDouble(yHex)
//             
//             if (!isNaN(lat) && !isNaN(lng)) {
//                 return { lat, lng }
//             }
//         } catch (e) {
//             console.error('Error parsing WKB:', e)
//         }
//     }
//     
//     return null
// }

// Helper to convert hex string to double (little-endian)
// const parseHexToDouble = (hex: string): number => {
//     const bytes = new Uint8Array(8)
//     for (let i = 0; i < 8; i++) {
//         bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
//     }
//     const view = new DataView(bytes.buffer)
//     return view.getFloat64(0, true)
// }

// Helper to parse streetview_url JSON array
const parseStreetviewUrls = (streetviewUrl: string | null): string[] => {
    if (!streetviewUrl) return []
    try {
        if (streetviewUrl.startsWith('[')) {
            return JSON.parse(streetviewUrl)
        }
        return [streetviewUrl]
    } catch {
        return []
    }
}

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

// Helper to get facade display name
const getFacadeDisplayName = (facade: Facade | null): string => {
    if (!facade) return 'Façade'
    if (facade.business?.name) return facade.business.name
    if (facade.address?.name) return facade.address.name
    if (facade.address?.street) return `${facade.address.street}, ${facade.address.city || ''}`
    return facade.facade_number || 'Façade'
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

export function DetailsFacade() {
    const { user } = useAuth()
    const { id, slug } = useParams()
    const navigate = useNavigate()
    const [zoom, setZoom] = useState(100)
    const [facade, setFacade] = useState<Facade | null>(null)
    const [totalDetected, setTotalDetected] = useState(0)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [showStreetView, setShowStreetView] = useState(false)
    const [facadesList, setFacadesList] = useState<Array<{ id: string; facade_number?: string; name: string }>>([])
    const [currentFacadeIndex, setCurrentFacadeIndex] = useState(-1)
    const [isCapturing, setIsCapturing] = useState(false)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [showLightbox, setShowLightbox] = useState(false)
    const [isSavingImage, setIsSavingImage] = useState(false)
    const [streetViewInfo, setStreetViewInfo] = useState<{ lat: number; lng: number; heading: number; pitch: number; zoom: number } | null>(null)
    const streetViewRef = useRef<HTMLDivElement>(null)
    const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null)

    // Parse streetview URLs from facade data
    const streetviewImages = parseStreetviewUrls(facade?.streetview_url || null)
    const currentImage = streetviewImages[currentImageIndex] 

    // Parse streetview metadata
    const streetviewMetadata: StreetViewMetadata | null = facade?.streetview_metadata
        ? (typeof facade.streetview_metadata === 'string'
            ? JSON.parse(facade.streetview_metadata)
            : facade.streetview_metadata)
        : null
    const rank1Metadata = getRank1Metadata(streetviewMetadata)

    // Extract surface from score_breakdown
    const surfaceM2 = facade?.score_breakdown?.surface_m || facade?.surface_m2 || 0

    useEffect(() => {
        if (facade && user) {
            if (facade?.scan?.profile_id !== user.id) {
                navigate(-1)
            }
        }
    }, [id, facade])

    useEffect(() => {
        const fetchFacade = async () => {
            setLoading(true)
            try {
                const facadeData = await ScansServiceInstance.getFacadeById(id!, slug!)
                console.log("from details facade", facadeData)
                setFacade(facadeData)
            } catch (error) {
                console.error("Error fetching facade:", error)
            } finally {
                setLoading(false)
            }
        }
        const fetchTotalDetected = async () => {
            try {
                const total = await ScansServiceInstance.getFacadeTotalDetected(id!)
                setTotalDetected(total)
            } catch (error) {
                console.error("Error fetching total detected:", error)
            }
        }
        const fetchFacadesList = async () => {
            try {
                const facades = await ScansServiceInstance.getFacadesByScanSlug(slug!)
                setFacadesList(facades)
                const currentIndex = facades.findIndex(f => f.id === id)
                setCurrentFacadeIndex(currentIndex)
            } catch (error) {
                console.error("Error fetching facades list:", error)
            }
        }
        fetchFacade()
        fetchTotalDetected()
        fetchFacadesList()
    }, [id, slug])

    // Image navigation
    const handlePrevImage = () => {
        setCurrentImageIndex(prev => prev > 0 ? prev - 1 : streetviewImages.length - 1)
    }

    const handleNextImage = () => {
        setCurrentImageIndex(prev => prev < streetviewImages.length - 1 ? prev + 1 : 0)
    }

    // Facade navigation
    const handlePrevFacade = () => {
        if (currentFacadeIndex > 0 && facadesList.length > 0) {
            const prevFacade = facadesList[currentFacadeIndex - 1]
            navigate(`/scans/${slug}/facades/${prevFacade.id}`)
        }
    }

    const handleNextFacade = () => {
        if (currentFacadeIndex < facadesList.length - 1 && facadesList.length > 0) {
            const nextFacade = facadesList[currentFacadeIndex + 1]
            navigate(`/scans/${slug}/facades/${nextFacade.id}`)
        }
    }

    // Capture Street View image
    const handleCaptureStreetView = async () => {
        if (!panoramaRef.current) return

        setIsCapturing(true)

        try {
            // Get current panorama position and POV
            const position = panoramaRef.current.getPosition()
            const pov = panoramaRef.current.getPov()
            const currentZoom = panoramaRef.current.getZoom()

            if (!position) {
                throw new Error('Unable to get Street View position')
            }

            // Create a canvas to capture the Street View
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            if (!ctx) {
                throw new Error('Unable to create canvas context')
            }

            // Set canvas size (adjust as needed)
            canvas.width = 1280
            canvas.height = 720

            // Use Google Street View Static API to get the image
            const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY
            const lat = position.lat()
            const lng = position.lng()
            const heading = pov.heading
            const pitch = pov.pitch

            // Calculate FOV based on zoom level
            // Google Street View zoom ranges from 0 to 5
            // FOV ranges from 120° (zoom 0) to ~10° (zoom 5)
            // Formula: FOV = 180 / (2^zoom)
            const fov = Math.max(10, Math.min(120, 180 / Math.pow(2, currentZoom)))

            const staticUrl = `https://maps.googleapis.com/maps/api/streetview?size=${canvas.width}x${canvas.height}&location=${lat},${lng}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${apiKey}`

            console.log('Capturing with zoom:', currentZoom, 'FOV:', fov)

            // Load the image
            const img = new Image()
            img.crossOrigin = 'anonymous'

            await new Promise((resolve, reject) => {
                img.onload = resolve
                img.onerror = reject
                img.src = staticUrl
            })

            // Draw image on canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
            setCapturedImage(dataUrl)

            // Show lightbox for confirmation
            setShowLightbox(true)

        } catch (error) {
            console.error('Error capturing Street View:', error)
            alert('Erreur lors de la capture de l\'image. Veuillez réessayer.')
        } finally {
            setIsCapturing(false)
        }
    }

    // Confirm captured image - upload and update database
    const handleConfirmImage = async () => {
        if (!capturedImage || !id) return

        setIsSavingImage(true)

        try {
            // Convert data URL to Blob
            const response = await fetch(capturedImage)
            const blob = await response.blob()

            // Upload image to storage
            const imageUrl = await ScansServiceInstance.uploadFacadeImage(id, blob)

            // Update facade streetview_url in database
            await ScansServiceInstance.updateFacadeStreetviewUrl(id, imageUrl)

            // Refresh facade data to show new image
            const updatedFacade = await ScansServiceInstance.getFacadeById(id, slug!)
            setFacade(updatedFacade)

            // Reset state
            setShowLightbox(false)
            setCapturedImage(null)
            setCurrentImageIndex(0) // Show the new image (first in array)

            // Show success message
            toast.success('Image enregistrée avec succès!')

        } catch (error) {
            console.error('Error saving image:', error)
            toast.error('Erreur lors de l\'enregistrement de l\'image. Veuillez réessayer.')
        } finally {
            setIsSavingImage(false)
        }
    }

    // Decline captured image
    const handleDeclineImage = () => {
        setShowLightbox(false)
        setCapturedImage(null)
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
                motionTrackingControl: false,
                zoomControl: true, // Enable zoom controls
                enableCloseButton: false
            })

            // Update info when panorama changes
            const updateInfo = () => {
                if (!panoramaRef.current) return
                const pos = panoramaRef.current.getPosition()
                const pov = panoramaRef.current.getPov()
                const currentZoom = panoramaRef.current.getZoom()
                if (pos) {
                    setStreetViewInfo({
                        lat: pos.lat(),
                        lng: pos.lng(),
                        heading: Math.round(pov.heading),
                        pitch: Math.round(pov.pitch),
                        zoom: currentZoom
                    })
                }
            }

            // Initial update
            updateInfo()

            // Listen for changes
            panoramaRef.current.addListener('position_changed', updateInfo)
            panoramaRef.current.addListener('pov_changed', updateInfo)
            panoramaRef.current.addListener('zoom_changed', updateInfo)
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
        <div className="relative min-h-screen bg-background overflow-hidden ">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
            </div>

            <div className="relative mx-auto   px-6 py-8">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/scans">Scans</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href={`/scans/${facade?.scan?.slug}`}>{facade?.scan?.name}</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Détails de la façade</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                {/* Header */}
                <div className="my-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link to={`/scans/${slug}`}>
                            <ArrowLeft className="h-6 w-6 text-foreground bg-muted rounded-full p-1 hover:bg-muted/80 transition-colors" />
                        </Link>
                        <h1 className="text-lg md:text-3xl font-bold text-foreground/70 truncate max-w-[50%]">
                            {getFacadeDisplayName(facade)}
                        </h1>
                        <span className="py-1 text-sm bg-muted rounded-full px-3 text-foreground/70 font-medium">
                            #{facade?.facade_number}
                        </span>
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex items-center gap-2">
                        {facadesList.length > 0 && (
                            <span className="text-xs text-muted-foreground font-medium mr-1">
                                {currentFacadeIndex + 1} / {facadesList.length}
                            </span>
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-lg hover:bg-muted disabled:opacity-30 border-border/50"
                            onClick={handlePrevFacade}
                            disabled={currentFacadeIndex <= 0 || facadesList.length === 0}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-lg hover:bg-muted disabled:opacity-30 border-border/50"
                            onClick={handleNextFacade}
                            disabled={currentFacadeIndex >= facadesList.length - 1 || facadesList.length === 0}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
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
                                    {showStreetView && (
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-9 w-9 bg-secondary hover:bg-secondary/80 shadow-sm"
                                            onClick={handleCaptureStreetView}
                                            disabled={isCapturing}
                                            title="Capturer l'image actuelle"
                                        >
                                            {isCapturing ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground"></div>
                                            ) : (
                                                <Camera className="h-4 w-4" />
                                            )}
                                        </Button>
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

                                {/* Enhanced View Mode Toggle */}
                                {rank1Metadata && (
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                                        <div className="flex items-center p-1 rounded-full bg-background border border-border shadow-2xl transition-all duration-300 hover:border-border/80">
                                            <button
                                                onClick={() => setShowStreetView(false)}
                                                className={cn(
                                                    "flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300",
                                                    !showStreetView
                                                        ? "bg-primary text-primary-foreground shadow-lg scale-105"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                                                )}
                                            >
                                                <ImageIcon className={cn("h-4 w-4 transition-transform", !showStreetView && "scale-110")} />
                                                <span className="text-[11px] font-bold uppercase tracking-wider">Images</span>
                                            </button>

                                            <div className="w-px h-4 bg-border/40 mx-1" />

                                            <button
                                                onClick={() => setShowStreetView(true)}
                                                className={cn(
                                                    "flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300",
                                                    showStreetView
                                                        ? "bg-primary text-primary-foreground shadow-lg scale-105"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                                                )}
                                            >
                                                <Navigation className={cn("h-4 w-4 transition-transform", showStreetView && "scale-110")} />
                                                <span className="text-[11px] font-bold uppercase tracking-wider">Street View</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Image Navigation (if multiple images and not in street view) */}
                                {!showStreetView && streetviewImages.length > 1 && (
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
                                    {!showStreetView && streetviewImages.length > 1 && (
                                        <div className="px-2 py-1 flex items-center gap-1.5 rounded-lg bg-secondary shadow-sm">
                                            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-xs font-semibold text-foreground">{currentImageIndex + 1}/{streetviewImages.length}</span>
                                        </div>
                                    )}
                                    {!showStreetView && (
                                        <div className="px-2 py-1 flex items-center justify-center rounded-lg bg-secondary/90 backdrop-blur-sm shadow-sm">
                                            <span className="text-xs font-semibold text-foreground">{zoom}%</span>
                                        </div>
                                    )}
                                </div>

                                <div className="max-h-[600px] overflow-hidden flex items-center justify-center min-h-[400px] relative">
                                    {loading ? (
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                            <p className="text-sm text-muted-foreground">Chargement...</p>
                                        </div>
                                    ) : showStreetView ? (
                                        <>
                                            <div
                                                ref={streetViewRef}
                                                className="w-full h-[500px] rounded-sm"
                                                style={{ minHeight: '400px' }}
                                            />
                                            {/* Street View Info Overlay */}
                                            {/* {streetViewInfo && (
                                                <div className="absolute w-[70%] bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 p-3 rounded-lg bg-secondary shadow-lg border border-border/50">
                                                    <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-background/50">
                                                        <MapPin className="h-3.5 w-3.5 text-primary" />
                                                        <span className="text-xs font-mono text-foreground">
                                                            {streetViewInfo.lat.toFixed(6)}, {streetViewInfo.lng.toFixed(6)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-background/50">
                                                        <Navigation className="h-3.5 w-3.5 text-info" />
                                                        <span className="text-xs font-mono text-foreground">
                                                            H: {streetViewInfo.heading}°
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-background/50">
                                                        <Ruler className="h-3.5 w-3.5 text-warning" />
                                                        <span className="text-xs font-mono text-foreground">
                                                            P: {streetViewInfo.pitch}°
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-background/50">
                                                        <ZoomIn className="h-3.5 w-3.5 text-success" />
                                                        <span className="text-xs font-mono text-foreground">
                                                            Z: {streetViewInfo.zoom}
                                                        </span>
                                                    </div>
                                                </div>
                                            )} */}
                                        </>
                                    ) : (
                                        <img
                                            src={currentImage}
                                            alt={`Facade ${currentImageIndex + 1}`}
                                            className="w-full h-full rounded-sm object-cover transition-transform duration-200"
                                            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/facade.png'
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Image Thumbnails (only when not in street view) */}
                                {!showStreetView && streetviewImages.length > 1 && (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 p-2 rounded-lg bg-secondary shadow-lg">
                                        {streetviewImages.map((url, index) => (
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
                                                        (e.target as HTMLImageElement).src = '/facade.png'
                                                    }}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Facade Information */}
                        <Card className="border-none shadow-sm rounded-sm p-0">
                            <CardContent className="p-3">
                                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-primary"></div>
                                    Informations de la façade
                                </h2>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {/* Address - Full Width */}
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
                                                <Globe2 className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Site web</p>
                                                <a href={facade?.website} target="_blank" className="text-sm font-medium text-foreground truncate max-w-[70%] block hover:underline">{facade?.website}</a>
                                            </div>
                                        </div>
                                    </div>



                                    {/* Street View Date */}
                                    <div className="p-4 rounded-xl border border-border/50 bg-background hover:shadow-sm transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-accent/10 text-accent">
                                                <Phone className="h-4 w-4" />

                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tél </p>
                                                <p className="text-sm font-medium text-foreground">
                                                    {facade?.formatted_phone_number}
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
                                {/* Total de Détections - Simple & User-Friendly */}
                                <div className="mt-6 p-4 rounded-xl border border-border bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Radar className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground uppercase tracking-tight">Total de Détections</h4>
                                                <p className="text-xs text-muted-foreground">Le nombre de scans effectués sur la façade</p>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-black text-foreground">
                                            {totalDetected || 0}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="mt-8">
                            <Link to={`/devis/create/${slug}/${id}`} className="block">
                                <Button className="w-full h-14 bg-primary text-white hover:bg-primary/90 rounded-xl font-bold uppercase tracking-wider gap-2">
                                    <FileText className="h-5 w-5" />
                                    Créer un devis
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox for image confirmation */}
            {capturedImage && (
                <Lightbox
                    isOpen={showLightbox}
                    imageUrl={capturedImage}
                    onConfirm={handleConfirmImage}
                    onDecline={handleDeclineImage}
                    isLoading={isSavingImage}
                />
            )}
        </div>
    )
}