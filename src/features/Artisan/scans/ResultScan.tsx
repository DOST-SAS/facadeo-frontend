import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import {
    Plus,
    Minus,
    Crosshair,
    FileText,
    Download,
    ArrowDown,
    ArrowUp,
    ArrowLeft,
    Filter,
    RotateCcw,
    Target,
    Store,
    ScanLine,
    Activity,
    Bell,
    BellOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Link, useNavigate, useParams } from "react-router-dom"
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn, statusBadgeConfig } from "@/lib/utils"
import { generateFacadesPdf } from "@/utils/facadesExposter"
import { ScansServiceInstance } from "@/services/artisan/scansServices"
import { ScanRealtimeServiceInstance } from "@/services/artisan/scanRealtimeService"
import { NotificationsServiceInstance } from "@/services/artisan/notificationsServices"
import { useAuth } from "@/context/AuthContext"
import toast from "react-hot-toast"
import type { Scan, Facade } from "@/types/scansTypes"

import { ScanHeader, ScanFilters, FacadesList, ScanMapSection, type MapFacade } from "./components"

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

export function ResultScan() {
    const { slug } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    // State
    const [scan, setScan] = useState<Scan>()
    const [loading, setLoading] = useState(false)
    const [minScore, setMinScore] = useState(0)
    const [maxScore, setMaxScore] = useState(100)
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [selectedBusinessType, setSelectedBusinessType] = useState<string>("all")
    const [selectedSurfaces, setSelectedSurfaces] = useState<Facade[]>([])
    const [notifyEnabled, setNotifyEnabled] = useState(false)
    const [isSubscribing, setIsSubscribing] = useState(false)
    const [newFacadeIds, setNewFacadeIds] = useState<Set<string>>(new Set())




    useEffect(() => {
        if (scan && user) {
            console.log("scan", scan?.profile_id)
            console.log("user", user?.id)
            if (scan?.profile_id !== user?.id) {
                navigate(-1)
            }
        }

    }, [scan?.profile_id, user?.id])
    // Realtime handlers
    const handleFacadeUpdate = useCallback((facade: Facade, isNew: boolean) => {
        // console.log('[ResultScan] Facade update received:', { facade, isNew })

        setScan(prevScan => {
            if (!prevScan) {
                // console.warn('[ResultScan] No previous scan state, ignoring update')
                return prevScan
            }

            const existingIndex = prevScan.facades?.findIndex(f => f.id === facade.id) ?? -1
            let updatedFacades: Facade[]

            if (existingIndex >= 0) {
                // console.log('[ResultScan] Updating existing facade at index:', existingIndex)
                updatedFacades = [...(prevScan.facades || [])]
                updatedFacades[existingIndex] = facade
            } else {
                // console.log('[ResultScan] Adding new facade to list')
                updatedFacades = [facade, ...(prevScan.facades || [])]
                setNewFacadeIds(prev => new Set(prev).add(facade.id))
                setTimeout(() => {
                    setNewFacadeIds(prev => {
                        const next = new Set(prev)
                        next.delete(facade.id)
                        return next
                    })
                }, 3000)
            }

            const businessesMap = new Map()
            updatedFacades.forEach((f) => {
                if (f.business?.id) {
                    businessesMap.set(f.business.id, f.business)
                }
            })

            // console.log('[ResultScan] Updated facades count:', updatedFacades.length)

            return {
                ...prevScan,
                facades: updatedFacades,
                facadesCount: updatedFacades.length,
                businesses: Array.from(businessesMap.values()),
                businessesCount: businessesMap.size,
            }
        })

        if (isNew) {
            const businessName = facade.business?.name || 'Nouvelle façade'
            toast.success(`${businessName} détectée!`, { duration: 2000 })
        }
    }, [])

    const handleScanUpdate = useCallback((updatedScan: Partial<Scan>) => {
        setScan(prev => prev ? { ...prev, ...updatedScan } : prev)

        if (updatedScan.status === 'completed') {
            toast.success(`Scan terminé avec succès!`)
        } else if (updatedScan.status === 'failed') {
            toast.error(`Le scan a échoué`)
        }
    }, [])

    // Effects
    useEffect(() => {
        if (!scan?.id) {
            // console.log('[ResultScan] No scan ID available yet, skipping realtime setup')
            return
        }

        // console.log('[ResultScan] Setting up realtime subscriptions for scan:', scan.id)
        ScanRealtimeServiceInstance.subscribeToScanFacades(scan.id, handleFacadeUpdate)
        ScanRealtimeServiceInstance.subscribeToScanStatus(scan.id, handleScanUpdate)

        return () => {
            // console.log('[ResultScan] Cleaning up realtime subscriptions')
            ScanRealtimeServiceInstance.unsubscribeAll()
        }
    }, [scan?.id, handleFacadeUpdate, handleScanUpdate])

    useEffect(() => {
        const fetchScan = async () => {
            setLoading(true)
            try {
                const scans = await ScansServiceInstance.getScanBySlug(slug as string)
                setScan(scans)
            } catch (error: unknown) {
                console.error("Error fetching scans:", error)
                const err = error as { code?: string }
                if (err?.code === 'PGRST116') {
                    toast.error("Scan introuvable")
                } else {
                    toast.error("Erreur lors du chargement du scan")
                }
                setScan(undefined)
            } finally {
                setLoading(false)
            }
        }
        fetchScan()
    }, [slug])
    // ------------

    // Handlers
    const handleSliderChange = (values: number[]) => {
        if (values.length === 2) {
            setMinScore(values[0])
            setMaxScore(values[1])
        }
    }

    const resetFilters = () => {
        setMinScore(0)
        setMaxScore(100)
        setSelectedBusinessType("all")
    }

    const handleNotifyToggle = async () => {
        if (!user?.id || !scan?.id) {
            toast.error("Impossible de configurer les notifications")
            return
        }

        setIsSubscribing(true)
        try {
            if (!notifyEnabled) {
                await NotificationsServiceInstance.createNotification({
                    profile_id: user.id,
                    type: "scan",
                    title: `Scan "${scan.name}" terminé`,
                    message: `Le scan ${scan.name} est maintenant terminé. Consultez les résultats.`,
                    metadata: {
                        scan_id: scan.id,
                        scan_slug: scan.slug,
                        notification_type: "scan_completion"
                    }
                })
                setNotifyEnabled(true)
                toast.success("Vous serez notifié à la fin du scan")
            } else {
                setNotifyEnabled(false)
                toast.success("Notifications désactivées")
            }
        } catch (error) {
            console.error("Error toggling notifications:", error)
            toast.error("Erreur lors de la configuration des notifications")
        } finally {
            setIsSubscribing(false)
        }
    }

    const handleSortScore = (direction: 'asc' | 'desc') => {
        if (!scan?.facades) return
        const sortedFacades = [...scan.facades].sort((a, b) => {
            const scoreA = a.score || 0
            const scoreB = b.score || 0
            return direction === 'asc' ? scoreA - scoreB : scoreB - scoreA
        })
        setScan({ ...scan, facades: sortedFacades })
    }

    const handleExportPdf = async () => {
        if (!selectedSurfaces.length || !scan) return

        toast.loading("Génération du rapport PDF...", { id: "pdf-export" })
        try {
            await generateFacadesPdf(selectedSurfaces, scan.name)
            toast.success("PDF téléchargé avec succès !", { id: "pdf-export" })
        } catch (error) {
            console.error("PDF Export Error:", error)
            toast.error("Erreur lors de la génération du PDF", { id: "pdf-export" })
        }
    }

    // Computed values
    const isRunning = scan?.status === 'running' || scan?.status === 'pending'

    // Filter facades based on score and business type
    const filteredFacades = useMemo(() => {
        return scan?.facades?.filter((facade) => {
            // Filter by score range
            const score = facade.score ?? 0
            if (score < minScore || score > maxScore) {
                return false
            }

            // Filter by business type
            if (selectedBusinessType && selectedBusinessType !== "all") {
                // Check if facade's types (comma-separated string) includes the selected type
                if (facade.types) {
                    const types = facade.types.split(',').map(t => t.trim())
                    if (!types.includes(selectedBusinessType)) {
                        return false
                    }
                } else {
                    return false
                }
            }

            return true
        }) || []
    }, [scan?.facades, minScore, maxScore, selectedBusinessType])

    const facadesForMap: MapFacade[] = filteredFacades.map(facade => {
        const coords = parseWKBPoint(facade.location)
        const types = facade.types ? facade.types.split(',').map(t => t.trim()) : []
        // console.log('TYPES :', types);
        return {
            id: facade.id,
            name: getFacadeDisplayName(facade),
            coordinates: coords,
            address: getFacadeDisplayName(facade),
            types: types,
            score: facade.score
        }
    }).filter(f => f.coordinates.lat !== 0 && f.coordinates.lng !== 0) || []

    const mapCenter = useMemo(() => {
        // First try to get center from scan.address (which contains the original search center)
        if (scan?.center) {
            const centerCoords = parseWKBPoint(scan.center)
            console.log('CENTER COORDS :', centerCoords);
            if (centerCoords.lat !== 0 && centerCoords.lng !== 0) {
                return centerCoords
            }
        }

        // Fallback to first facade if scan center is not available
        if (facadesForMap.length > 0) {
            return facadesForMap[0].coordinates
        }

        // Final fallback to Paris
        return { lat: 48.8566, lng: 2.3522 }
    }, [scan?.center, facadesForMap])

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
            </div>

            <div className="relative mx-auto px-6 py-8 rounded-sm space-y-6">
                <ScanHeader
                    scan={scan}
                    isRunning={isRunning}
                    notifyEnabled={notifyEnabled}
                    isSubscribing={isSubscribing}
                    onNotifyToggle={handleNotifyToggle}
                />

                <ScanFilters
                    scan={scan}
                    minScore={minScore}
                    maxScore={maxScore}
                    selectedBusinessType={selectedBusinessType}
                    isFilterOpen={isFilterOpen}
                    onSliderChange={handleSliderChange}
                    onBusinessTypeChange={setSelectedBusinessType}
                    onResetFilters={resetFilters}
                    onFilterOpenChange={setIsFilterOpen}
                />

                <div className="flex flex-col-reverse lg:flex-row gap-4 rounded-xl bg-card/50 backdrop-blur-sm p-4 lg:min-h-[600px] border border-border/50">
                    <FacadesList
                        facades={filteredFacades}
                        slug={slug}
                        selectedSurfaces={selectedSurfaces}
                        newFacadeIds={newFacadeIds}
                        loading={loading}
                        scanStatus={scan?.status}
                        onSelectionChange={setSelectedSurfaces}
                        onSortScore={handleSortScore}
                        onExportPdf={handleExportPdf}
                    />

                    <ScanMapSection
                        facades={facadesForMap}
                        center={mapCenter}
                        radius={scan?.radius_meters || 500}
                        loading={loading}
                        isScanning={isRunning}
                    />
                </div>
            </div>
        </div>
    )
}
