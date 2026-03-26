import { useEffect, useState, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, CheckCircle2, Zap, X, Radar, ArrowLeft, ChevronsUpDown, Check, Loader, TriangleAlert, CheckCircle, Calculator } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { GOOGLE_PLACE_TYPES } from "@/constants"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import Map, { type MapRef } from "@/components/Map"
import MapSearch from "@/components/MapSearch"
import { type GeocodingSuggestion } from "@/services/geocoding"
import { useFacadeDetection } from "@/hooks/useFacadeDetection"
import { useScanCostEstimate } from "@/hooks/useScanCostEstimate"
import { useAuth } from "@/context/AuthContext"
import { createScan, type CreateScanPayload } from "@/services/artisan/scanService"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import toast from "react-hot-toast"
import { ScansServiceInstance } from "@/services/artisan/scansServices"
import type { Settings } from "@/types/adminSettingsTypes"
import type { Plan } from "@/types/PlansTypes"
import { AbonnementServiceInstance } from "@/services/artisan/Abonemmentsservices"

export default function CreateScan() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [scanName, setScanName] = useState("")
    const [address, setAddress] = useState("")
    const [searchValue, setSearchValue] = useState("")
    const [coordinates, setCoordinates] = useState({ lat: 48.8566, lng: 2.3522 })
    const [radius, setRadius] = useState(30)
    const [untreatedSince] = useState("3")
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [open, setOpen] = useState(false)
    const [openalert, setOpenalert] = useState(false)
    const [settings, setSettings] = useState<Partial<Settings>>()
    const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({})
    const [maxRadius, setMaxRadius] = useState(0)
    const [MAX_SCANS, setMAX_SCANS] = useState(0)

    const [launching, setLaunching] = useState(false)
    const mapRef = useRef<MapRef>(null)

    // Use dynamic cost estimation
    const {
        estimate: costEstimate,
        scanLaunchCost,
        isLoading: costLoading,
        estimateCost,
        calculateScanLaunchCost,
        chargeForDetection,
        chargeForScanLaunch,
        getMinimumCreditsRequired
    } = useScanCostEstimate()

    useEffect(() => {
        if (user?.scans_number === 0) {
            navigate("/scans")
        }
    }, [user])
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await ScansServiceInstance.getSettings()
                if (data) setSettings(data)
            } catch (error) {
                console.error('Error fetching settings:', error)
            }
        }
        fetchSettings()
    }, [])

    useEffect(() => {
        const fetchCurrentPlan = async () => {

            if (!user?.id) return
            try {
                const { data, error } = await AbonnementServiceInstance.getCurrentSubscription(user.id)
                if (error) throw error

                if (data?.plans) {
                    console.log("Current plan :", data.plans)
                    setCurrentPlan(data.plans)
                    setMaxRadius(data.plans.features?.find(f => f.key === "max_radius_m")?.value as number)
                    setMAX_SCANS(data.plans.features?.find(f => f.key === "max_scans_per_month")?.value as number)
                } else {
                    console.log("No active subscription found for user, checking for free plan...")
                    // If no subscription record, try to find the free plan as default
                    const { data: plans } = await AbonnementServiceInstance.getAbonnement()
                    const freePlan = plans?.find((p: any) => p.type === 'free' || p.price_cents === 0)
                    if (freePlan) {
                        console.log("Current plan (default free):", freePlan)
                        setCurrentPlan(freePlan)
                        setMaxRadius(freePlan.features?.find((f: any) => f.key === 'max_radius_m')?.value)
                        setMAX_SCANS(freePlan.features?.find((f: any) => f.key === 'max_scans_per_month')?.value)
                    } else {
                        console.warn("No free plan found in database")
                    }
                }
            } catch (error) {
                console.error('Error fetching current plan:', error)
            }
        }
        fetchCurrentPlan()
    }, [user?.id])

    // User's available credits from profile
    const availableCredits = user?.credit_balance ?? 0

    // Minimum credits required (for 60 facades - max possible)
    const [minimumCreditsRequired, setMinimumCreditsRequired] = useState<number>(0)

    // Track detection cost charged
    const [detectionCost, setDetectionCost] = useState<number>(0)

    // Track if we've already charged for this detection to prevent duplicate charges
    const hasChargedForDetectionRef = useRef(false)

    const {
        isLoading: loading,
        result: facadeResult,
        error: facadeError,
        isFound,
        detectFacades,
        reset: resetFacadeDetection
    } = useFacadeDetection()

    const estimatedFacades = facadeResult?.totalFound || costEstimate?.estimatedFacades || 0
    const scanCost = scanLaunchCost?.totalCreditsRequired || 0

    // Track if params changed after detection
    const [hasParamsChanged, setHasParamsChanged] = useState(false)

    // Store previous values to detect actual changes
    const prevParamsRef = useRef({ radius, address, selectedTypes, untreatedSince })

    // Estimate cost when radius changes and check minimum credits for 60 facades
    useEffect(() => {
        if (radius >= 100) {
            estimateCost(radius)
            // Get minimum credits required for max 60 facades
            getMinimumCreditsRequired().then(minCredits => {
                setMinimumCreditsRequired(minCredits)
            })
        }
    }, [radius, estimateCost, getMinimumCreditsRequired])

    useEffect(() => {
        const prev = prevParamsRef.current
        const paramsChanged =
            prev.radius !== radius ||
            prev.address !== address ||
            prev.selectedTypes !== selectedTypes ||
            prev.untreatedSince !== untreatedSince

        // Only reset if params actually changed AND we had previous results
        if (paramsChanged && isFound) {
            setHasParamsChanged(true)
            resetFacadeDetection()
        }

        // Update ref for next comparison
        prevParamsRef.current = { radius, address, selectedTypes, untreatedSince }
    }, [radius, address, selectedTypes, untreatedSince, resetFacadeDetection, isFound])

    useEffect(() => {
        if (isFound && facadeResult && facadeResult.totalFound > 0) {
            console.log('===========================================')
            console.log('=== FINAL EXTRACTED DATA - EACH PLACE WITH ITS OWN COORDINATES ===')
            console.log('===========================================')

            // Log search center
            console.log('Search Center:')
            console.log(`  lat: ${facadeResult.searchCenter.lat}`)
            console.log(`  lng: ${facadeResult.searchCenter.lng}`)
            console.log('---')

            // Log each facade individually with its own coordinates
            console.log(`Total Facades Found: ${facadeResult.totalFound}`)
            console.log('---')

            facadeResult.facades.forEach((facade, index) => {
                console.log(`[${index + 1}] ${facade.name}`)
                console.log(`    place_id: ${facade.id}`)
                console.log(`    coordinates:`)
                console.log(`      lat: ${facade.coordinates.lat}`)
                console.log(`      lng: ${facade.coordinates.lng}`)
                console.log(`    address: ${facade.address}`)
                console.log(`    types: [${facade.types.join(', ')}]`)
                console.log(`    distance: ${facade.distance?.toFixed(2)}m`)
                console.log('---')
            })

            // Also log in JSON format for easy copying
            console.log('===========================================')
            console.log('=== JSON FORMAT ===')
            console.log('===========================================')
            const formattedOutput = {
                center_location: {
                    lat: facadeResult.searchCenter.lat,
                    lng: facadeResult.searchCenter.lng
                },
                total_found: facadeResult.totalFound,
                places: facadeResult.facades.map(facade => ({
                    name: facade.name,
                    place_id: facade.id,
                    type: facade.types[0] || "point_of_interest",
                    coordinates: {
                        lat: facade.coordinates.lat,
                        lng: facade.coordinates.lng
                    },
                    address: facade.address,
                    distance_meters: facade.distance
                }))
            }
            console.log(JSON.stringify(formattedOutput, null, 2))
            console.log('===========================================')

            // Calculate scan launch cost based on facades found
            calculateScanLaunchCost(facadeResult.totalFound)

            // Only charge for detection once per detection session
            if (!hasChargedForDetectionRef.current) {
                hasChargedForDetectionRef.current = true

                const paginationCalls = Math.ceil(facadeResult.totalFound / 20)
                chargeForDetection(facadeResult.totalFound, paginationCalls)
                    .then(result => {
                        if (result) {
                            setDetectionCost(result.chargedCredits)
                            toast.success(`Détection réussie! ${result.chargedCredits} crédits débités pour ${facadeResult.totalFound} façades trouvées.`)
                        }
                    })
                    .catch(err => {
                        console.error("Failed to charge for detection:", err)
                        toast.error("Erreur lors du débit des crédits de détection")
                        // Reset flag on error so user can retry
                        hasChargedForDetectionRef.current = false
                    })
            }

            setOpenalert(true)
        }
    }, [isFound, facadeResult, calculateScanLaunchCost, chargeForDetection])

    const handleAddressChange = useCallback((newAddress: string, newCoordinates: { lat: number; lng: number }) => {
        setAddress(newAddress)
        setCoordinates(newCoordinates)
    }, [])

    const handleSearch = useCallback((searchAddress: string) => {
        mapRef.current?.searchAddress(searchAddress)
    }, [])

    const handleGetCurrentLocation = useCallback(() => {
        mapRef.current?.getCurrentLocation()
    }, [])

    const handleSelectSuggestion = useCallback((suggestion: GeocodingSuggestion) => {
        if (suggestion.coordinates) {
            setAddress(suggestion.description)
            setSearchValue(suggestion.description)
            setCoordinates(suggestion.coordinates)
        }
    }, [])

    const removeType = (type: string) => {
        setSelectedTypes(selectedTypes.filter((t) => t !== type))
    }

    const handleFindFacades = async () => {
        if (!coordinates || !coordinates.lat || !coordinates.lng) {
            toast.error("Veuillez sélectionner une position sur la carte avant de lancer la recherche.")
            return
        }

        if (!radius || radius < 100) {
            toast.error("Veuillez définir un rayon d'au moins 100 mètres.")
            return
        }

        // Check if user has enough credits for max 60 facades BEFORE detection
        if (minimumCreditsRequired > 0 && availableCredits < minimumCreditsRequired) {
            toast.error(`Crédits insuffisants. Minimum requis: ${minimumCreditsRequired} crédits (pour détecter jusqu'à 60 façades).`)
            return
        }

        try {
            // Reset the charge flag when starting a new detection
            hasChargedForDetectionRef.current = false

            // Perform facade detection
            await detectFacades({
                coordinates,
                radius,
                types: selectedTypes.length > 0 ? selectedTypes : undefined
            })

            setHasParamsChanged(false)
        } catch (error) {
            console.error("Facade detection failed:", error)
            toast.error("Erreur lors de la détection.")
        }
    }

    const generateSlug = (name: string): string => {
        return name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            || `scan-${Date.now()}`
    }

    const handleLaunchScan = async () => {
        if (launching) return
        if (!isFound || !facadeResult) {
            toast.error("Veuillez d'abord calculer le coût en cliquant sur 'Trouver les façades'.")
            return
        }

        // Check if user has enough credits for scan launch
        if (!scanLaunchCost || !scanLaunchCost.hasEnoughCredits) {
            toast.error("Crédits insuffisants pour lancer le scan. Veuillez recharger votre compte.")
            return
        }

        setLaunching(true)
        try {
            const slug = generateSlug(scanName || "scan-sans-nom")

            const payload: CreateScanPayload = {
                name: scanName || "Scan sans nom",
                slug: slug,
                description: `Scanning storefronts in ${address || "selected area"}`,
                center: {
                    lat: facadeResult.searchCenter.lat,
                    lon: facadeResult.searchCenter.lng
                },
                address_text: address || "Adresse non définie",
                radius_meters: radius,
                filters: {
                    types: selectedTypes.length > 0 ? selectedTypes : ["point_of_interest"]
                },
                places: facadeResult.facades.map(facade => ({
                    name: facade.name,
                    place_id: facade.id,
                    type: facade.types[0] || "point_of_interest",
                    location: {
                        lat: facade.coordinates.lat,
                        lon: facade.coordinates.lng
                    },
                    // Additional fields from Google Places API
                    formatted_address: facade.formatted_address,
                    formatted_phone_number: facade.formatted_phone_number,
                    international_phone_number: facade.international_phone_number,
                    types: facade.types.join(','),
                    website: facade.website
                })),
                // Include cost info for backend
                estimated_cost: scanLaunchCost.totalCreditsRequired,
                cost_breakdown: {
                    detection_cost: detectionCost,
                    scan_launch_cost: scanLaunchCost.totalCreditsRequired,
                    total_facades: facadeResult.totalFound
                }
            }

            const response = await createScan(payload)

            if (response.status === "accepted") {
                // Charge credits after scan is accepted
                const chargeResult = await chargeForScanLaunch(
                    facadeResult.totalFound,
                    response.slug || slug
                )

                if (chargeResult) {
                    toast.success(`Scan lancé! ${chargeResult.chargedCredits} crédits débités pour ${estimatedFacades} façades.`)
                }

                setOpenalert(false)
                resetFacadeDetection()

                // Redirect to the scan detail page
                navigate(`/scans/${response.slug}`)
            } else {
                toast.error("Le scan n'a pas été accepté. Veuillez réessayer.")
            }
        } catch (err) {
            console.error("Launch failed", err)
            toast.error(err instanceof Error ? err.message : "Erreur lors du lancement du scan.")
        } finally {
            setLaunching(false)
        }
    }

    return (
        <div className="relative h-full bg-background overflow-hidden flex flex-col">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
            </div>

            {/* Header Section */}
            <div className="relative z-10 px-6 pt-6 pb-4 space-y-3">
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
                            <BreadcrumbPage>Création d'un scan</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex items-center gap-2">
                    <Link to="/scans">
                        <ArrowLeft className="h-6 w-6 text-foreground bg-muted rounded-full p-1" />
                    </Link>
                    <h1 className="text-2xl font-bold text-foreground/70">Création d'un scan</h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative flex-1 flex flex-col lg:flex-row px-4 pb-4 gap-4 overflow-hidden">

                {/* Left Side - Map */}
                <div className="relative w-full lg:w-3/5 h-[400px] lg:h-full bg-card rounded-xl overflow-hidden shadow-sm">
                    <div className="absolute inset-2 rounded-md overflow-hidden">
                        <Map
                            ref={mapRef}
                            center={coordinates}
                            zoom={13}
                            radius={radius}
                            colorMode="businessType"
                            facades={facadeResult?.facades.map(facade => {
                                // Log what we're passing to the Map component
                                console.log(`[PASSING TO MAP] ${facade.name}:`, {
                                    lat: facade.coordinates.lat,
                                    lng: facade.coordinates.lng,
                                    rawCoords: facade.coordinates
                                })
                                return {
                                    id: facade.id,
                                    name: facade.name,
                                    coordinates: {
                                        lat: facade.coordinates.lat,
                                        lng: facade.coordinates.lng
                                    },
                                    address: facade.address,
                                    types: facade.types
                                }
                            }) || []}
                            onAddressChange={handleAddressChange}
                            className="h-full w-full rounded-md"
                        />
                    </div>

                    {/* Search Bar - Positioned between map and right panel */}
                    <div className="absolute top-16 left-4 z-10 bg-muted/90 rounded-full">
                        <MapSearch
                            value={searchValue}
                            onChange={setSearchValue}
                            onSearch={handleSearch}
                            onGetCurrentLocation={handleGetCurrentLocation}
                            onSelectSuggestion={handleSelectSuggestion}
                        />
                    </div>
                </div>

                {/* Right Side - Filters and Configuration */}
                <div className="w-full lg:w-2/5 h-auto lg:h-full overflow-y-auto pb-6 space-y-4">


                    {/* Configuration Form */}
                    <Card className="shadow-sm border-none">
                        <CardContent className="space-y-5 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="scan-name" className="text-sm font-medium">
                                    Nom du scan
                                </Label>
                                <Input
                                    id="scan-name"
                                    value={scanName}
                                    onChange={(e) => setScanName(e.target.value)}
                                    placeholder="Ex: Rénovation façades Est"
                                    className="h-10"
                                />
                            </div>

                            {/* Radius */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Rayon :</Label>
                                    <span className="text-sm font-semibold text-foreground">{radius}m</span>
                                </div>
                                <Slider
                                    value={[radius]}
                                    onValueChange={(value) => setRadius(value[0])}
                                    min={10}
                                    max={maxRadius || settings?.maxScanRadiusMeters || 2000}
                                    step={10}
                                    showTooltip={true}
                                    formatValue={(v) => `${v}m`}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>10m</span>
                                    <span>{maxRadius || settings?.maxScanRadiusMeters || 2000}m</span>
                                </div>
                            </div>

                            {/* Business Types */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Types de commerces à cibler</Label>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={open}
                                            className="w-full h-10 justify-between font-normal text-muted-foreground hover:text-foreground"
                                        >
                                            {selectedTypes.length > 0
                                                ? `${selectedTypes.length} ${selectedTypes.length === 1 ? "type sélectionné" : "types sélectionnés"}`
                                                : "Sélectionner des types"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Rechercher un type..." />
                                            <CommandList>
                                                <CommandEmpty>Aucun type trouvé.</CommandEmpty>
                                                <CommandGroup>
                                                    {GOOGLE_PLACE_TYPES.sort((a, b) => a.label.localeCompare(b.label)).map((type) => (
                                                        <CommandItem
                                                            key={type.value}
                                                            value={type.label}
                                                            onSelect={() => {
                                                                setSelectedTypes(
                                                                    selectedTypes.includes(type.value)
                                                                        ? selectedTypes.filter((t) => t !== type.value)
                                                                        : [...selectedTypes, type.value]
                                                                )
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedTypes.includes(type.value) ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {type.label}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTypes?.map((type) => {
                                        const typeLabel = GOOGLE_PLACE_TYPES.find(t => t.value === type)?.label || type
                                        return (
                                            <Badge
                                                key={type}
                                                variant="secondary"
                                                className="bg-primary/5 text-foreground border-0 px-3 py-1.5 text-sm font-medium flex items-center gap-1.5"
                                            >
                                                {typeLabel}
                                                <button
                                                    onClick={() => removeType(type)}
                                                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                                    aria-label={`Remove ${type}`}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        )
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Validation Card */}
                    <Card className="shadow-sm border-none">
                        <CardContent className="space-y-4 pt-4">
                            <div className="space-y-3">
                                <h4 className="text-md font-medium text-foreground">Récapitulatif</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span className="text-muted-foreground">Nom :</span>
                                        <span className="text-foreground font-semibold">{scanName || "Non défini"}</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span className="text-muted-foreground">Adresse :</span>
                                        <span className="text-foreground font-semibold truncate">{address || "Non définie"}</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span className="text-muted-foreground">Rayon :</span>
                                        <span className="text-foreground font-semibold">{radius}m</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span className="text-muted-foreground">Types :</span>
                                        <span className="text-foreground font-semibold">{selectedTypes.length} sélectionnés</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Calculator className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span className="text-muted-foreground">Vos crédits :</span>
                                        <span className={cn(
                                            "font-semibold",
                                            availableCredits < scanCost ? "text-destructive" : "text-success"
                                        )}>
                                            {availableCredits}
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-warning/5 rounded-sm border border-dashed border-warning/50">
                                <TriangleAlert className="h-5 w-5 min-w-5 text-warning" />
                                <div className="text-xs text-foreground">
                                    {costLoading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader className="h-3 w-3 animate-spin" />
                                            Calcul du coût...
                                        </span>
                                    ) : minimumCreditsRequired > 0 ? (
                                        <div className="space-y-1">
                                            {availableCredits < minimumCreditsRequired ? (
                                                <p className="text-destructive font-medium">
                                                    ⚠️ Crédits insuffisants pour la détection
                                                </p>
                                            ) : (
                                                <p className="text-success font-medium">
                                                    ✓ Crédits suffisants pour la détection
                                                </p>
                                            )}
                                            <p>
                                                Minimum requis: <span className="font-semibold">{minimumCreditsRequired} crédits</span>
                                                <span className="text-muted-foreground ml-1">(pour détecter jusqu'à 60 façades)</span>
                                            </p>
                                            {detectionCost > 0 && (
                                                <p className="text-success">
                                                    ✓ Détection: {detectionCost} crédits débités
                                                </p>
                                            )}
                                            {scanLaunchCost && (
                                                <p>
                                                    Coût du scan: <span className="font-semibold text-warning">{scanLaunchCost.totalCreditsRequired} crédits</span>
                                                </p>
                                            )}
                                            {scanLaunchCost && !scanLaunchCost.hasEnoughCredits && (
                                                <p className="text-destructive font-medium">
                                                    ⚠️ Crédits insuffisants pour lancer le scan
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p>Calcul du coût minimum en cours...</p>
                                    )}
                                </div>
                            </div>

                            {facadeError && (
                                <div className="flex items-center gap-3 p-3 bg-destructive/5 rounded-sm border border-dashed border-destructive/50">
                                    <X className="h-5 w-5 min-w-5 text-destructive" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-destructive">Erreur de détection</p>
                                        <p className="text-muted-foreground">{facadeError.message}</p>
                                    </div>
                                </div>
                            )}

                            <Button
                                variant="default"
                                className="w-full h-12 flex items-center gap-2"
                                disabled={loading || (isFound && !hasParamsChanged) || (minimumCreditsRequired > 0 && availableCredits < minimumCreditsRequired)}
                                onClick={handleFindFacades}
                            >
                                {loading ? (
                                    <>
                                        <Loader className="h-5 w-5 animate-spin" />
                                        Calcul en cours
                                    </>
                                ) : (minimumCreditsRequired > 0 && availableCredits < minimumCreditsRequired) ? (
                                    <>
                                        <TriangleAlert className="h-5 w-5" />
                                        Crédits insuffisants ({minimumCreditsRequired} requis)
                                    </>
                                ) : (
                                    <>
                                        <Search className="h-5 w-5" />
                                        {isFound ? "Re-détecter les façades" : "Détecter les façades"}
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="default"
                                className="w-full h-12 flex items-center gap-2 bg-[#000] hover:bg-[#000]/90"
                                disabled={!isFound || launching || hasParamsChanged || (scanLaunchCost && !scanLaunchCost.hasEnoughCredits)}
                                onClick={handleLaunchScan}
                            >
                                {launching ? (
                                    <>
                                        <Loader className="h-5 w-5 animate-spin" />
                                        Lancement en cours...
                                    </>
                                ) : scanLaunchCost && !scanLaunchCost.hasEnoughCredits ? (
                                    <>
                                        <TriangleAlert className="h-5 w-5" />
                                        Crédits insuffisants
                                    </>
                                ) : (
                                    <>
                                        <Radar className="h-5 w-5" />
                                        Lancer Le Scan
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Alert Dialog */}
            <AlertDialog open={openalert} onOpenChange={setOpenalert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 justify-between">
                            Confirmer le scan
                            <AlertDialogCancel className="p-2! border-none!">
                                <X className="h-6 w-6" />
                            </AlertDialogCancel>
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Voulez-vous vraiment lancer ce scan avec les {estimatedFacades} façades détectées ?
                            {scanLaunchCost && ` (${scanLaunchCost.totalCreditsRequired} crédits seront débités)`}
                            {detectionCost > 0 && ` - Détection déjà facturée: ${detectionCost} crédits`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="flex items-center gap-3 p-3 bg-warning/5 border border-warning/50 rounded-sm">
                        <Zap className="h-5 w-5 text-warning" />
                        <div className="text-sm space-y-1">
                            <div>Façades détectées: <span className="font-semibold">{estimatedFacades}</span></div>
                            {detectionCost > 0 && (
                                <div className="text-success">✓ Détection: <span className="font-semibold">{detectionCost}</span> crédits (déjà débités)</div>
                            )}
                            <div>Coût du scan: <span className="font-bold text-primary">{scanLaunchCost?.totalCreditsRequired || 0}</span> crédits</div>
                            {/*  {scanLaunchCost && (
                                <div className="text-xs text-muted-foreground">
                                    ({scanLaunchCost.totalCostPerFacade.toFixed(2)} crédits/façade = StreetView×15 + Gemini×3)
                                </div>
                            )} */}
                        </div>
                    </div>

                    <div className="text-sm">
                        {scanLaunchCost && !scanLaunchCost.hasEnoughCredits ? (
                            <div className="flex items-center gap-3 p-3 bg-destructive/5 rounded-sm border border-dashed border-destructive/50">
                                <CheckCircle className="h-5 w-5 text-destructive" />
                                <span className="font-semibold">Crédits insuffisants</span>
                                <span className="text-xs text-muted-foreground">({availableCredits} disponibles)</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-3 bg-success/5 rounded-sm border border-dashed border-success/50">
                                <CheckCircle className="h-5 w-5 text-success" />
                                <span className="font-semibold">Crédits suffisants</span>
                                <span className="text-xs text-muted-foreground">({availableCredits} disponibles)</span>
                            </div>
                        )}
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (scanLaunchCost && !scanLaunchCost.hasEnoughCredits) {
                                    toast.error("Crédits insuffisants")
                                    return
                                }
                                await handleLaunchScan()
                            }}
                            disabled={launching || (scanLaunchCost && !scanLaunchCost.hasEnoughCredits)}
                        >
                            {launching ? (
                                <>
                                    <Loader className="h-5 w-5 animate-spin" />
                                    Lancement
                                </>
                            ) : (
                                <>
                                    <Radar className="h-5 w-5" />
                                    Lancer le scan
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
