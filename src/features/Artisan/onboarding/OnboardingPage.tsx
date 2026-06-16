import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area" // Added ScrollArea import
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Upload, PenTool, Sparkles, ArrowRight, Plus, Trash2, Text, ArrowLeft, Check, ChevronsUpDown, Search, X, AlertCircle, AlertTriangle, Bell, Mail } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import {
    Field,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldSet,
    FieldLabel,
    FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { EnterpriseProfile, TariffConfiguration, TradeConfiguration } from "@/features/Artisan/settings/types"
import type { Metier } from "@/types/artisanSettinstypes"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"
import { ProfileServiceInstance } from "@/services/artisan/profileservices"
import { useAuth } from "@/context/AuthContext"
import { uploadLogo, uploadSignature } from "@/utils/UploadAvatars"
import CitiesService from "@/services/cities"
import {
    Empty,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
} from "@/components/ui/empty"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface OnboardingModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export const OnboardingModal = ({ open, onOpenChange }: OnboardingModalProps) => {
    const { user, session } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)
    const [enterpriseProfile, setEnterpriseProfile] = useState<EnterpriseProfile>({
        activityType: "auto",
        companyName: "",
        sirenNumber: null,
        tradeConfigurations: [],
        companyLogo: "",
        signature: "",
        professionalAddress: user?.address || "",
        city: "",
        zipCode: "",
        country: "France",
        professionalEmail: user?.email || "",
        professionalPhone: user?.phone || "",
        p_provider: session?.user.user_metadata?.provider || "email",
    })

    const [isInitialized, setIsInitialized] = useState(false)

    // Fill form once user data is available
    useEffect(() => {
        if (user && user.id && !isInitialized) {
            setEnterpriseProfile(prev => ({
                ...prev,
                professionalAddress: user.address || user.adresse || prev.professionalAddress,
                professionalEmail: user.email || prev.professionalEmail,
                professionalPhone: user.phone || user.pro_phone || prev.professionalPhone,
                city: user.ville || prev.city,
                zipCode: user.code_postal || prev.zipCode,
                companyName: user.company_name || prev.companyName,
                sirenNumber: user.siret || prev.sirenNumber,
                activityType: user.is_entreprise ? "entreprise" : "auto",
            }))
            setIsInitialized(true)
        }
    }, [user?.id, isInitialized])

    const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null)
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null)
    const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null)
    const [signatureFile, setSignatureFile] = useState<File | null>(null)
    const [emailNotifications, setEmailNotifications] = useState(true)

    // City Search State
    const [cityOpen, setCityOpen] = useState(false)
    const [citySuggestions, setCitySuggestions] = useState<any[]>([])
    const [isCityLoading, setIsCityLoading] = useState(false)
    const [citySearch, setCitySearch] = useState("")

    // Trade Search State
    const [tradeSearch, setTradeSearch] = useState("")

    const [metiers, setMetiers] = useState<Metier[]>([])

    useEffect(() => {
        const loadMetiers = async () => {
            try {
                const data = await ProfileServiceInstance.getMetiers()
                console.log(data)
                setMetiers(data)
            } catch (error) {
                console.error("Failed to load metiers:", error)
            }
        }
        loadMetiers()
    }, [])

    // Auto-select "Façadier" and "Plâtrier" by default
    useEffect(() => {
        if (metiers.length > 0 && enterpriseProfile.tradeConfigurations.length === 0) {
            const defaultTrades = ["Façadier", "Plâtrier"]
            const defaultTradeConfigs: TradeConfiguration[] = []

            defaultTrades.forEach(tradeName => {
                const trade = metiers.find(m => m.label === tradeName)
                if (trade) {
                    defaultTradeConfigs.push({
                        id: `temp_metier_${Date.now()}_${Math.random()}`,
                        metier_id: trade.id,
                        metier_label: trade.label,
                        description: "",
                        tariffConfigurations: []
                    })
                }
            })

            if (defaultTradeConfigs.length > 0) {
                setEnterpriseProfile(prev => ({
                    ...prev,
                    tradeConfigurations: defaultTradeConfigs
                }))
            }
        }
    }, [metiers])

    useEffect(() => {
        const searchCities = async () => {
            if (!citySearch || citySearch.length < 2) {
                setCitySuggestions([])
                return
            }

            setIsCityLoading(true)
            try {
                const results = await CitiesService.getCityByName(citySearch)
                setCitySuggestions(results || [])
            } catch (error) {
                console.error("Failed to search cities:", error)
                setCitySuggestions([])
            } finally {
                setIsCityLoading(false)
            }
        }

        const timeoutId = setTimeout(() => {
            searchCities()
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [citySearch])

    const totalSteps = 6

    const handleCompanyLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setCompanyLogoFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setCompanyLogoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSignatureFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setSignaturePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const updateTradeDescription = (id: string, description: string) => {
        setEnterpriseProfile(prev => ({
            ...prev,
            tradeConfigurations: prev.tradeConfigurations.map(tc =>
                tc.id === id ? { ...tc, description } : tc
            )
        }))
    }

    const addTariffToTrade = (tradeId: string) => {
        const newTariff: TariffConfiguration = {
            id: `temp_tariff_${Date.now()}_${Math.random()}`,
            service_name: "Nouveau service",
            unit: "m²",
            unit_price_cents: 0,
            quantity: 1
        }
        setEnterpriseProfile(prev => ({
            ...prev,
            tradeConfigurations: prev.tradeConfigurations.map(tc =>
                tc.id === tradeId
                    ? { ...tc, tariffConfigurations: [...tc.tariffConfigurations, newTariff] }
                    : tc
            )
        }))
    }

    const removeTariffFromTrade = (tradeId: string, tariffId?: string) => {
        if (!tariffId) return
        setEnterpriseProfile(prev => ({
            ...prev,
            tradeConfigurations: prev.tradeConfigurations.map(tc =>
                tc.id === tradeId
                    ? { ...tc, tariffConfigurations: tc.tariffConfigurations.filter(t => t.id !== tariffId) }
                    : tc
            )
        }))
    }

    const updateTariff = (tradeId: string, tariffId: string | undefined, field: keyof TariffConfiguration, value: any) => {
        if (!tariffId) return
        setEnterpriseProfile(prev => ({
            ...prev,
            tradeConfigurations: prev.tradeConfigurations.map(tc =>
                tc.id === tradeId
                    ? {
                        ...tc,
                        tariffConfigurations: tc.tariffConfigurations.map(t =>
                            t.id === tariffId ? { ...t, [field]: value } : t
                        )
                    }
                    : tc
            )
        }))
    }

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1)
        } else {
            handleOnboardingComplete(enterpriseProfile)
        }
    }

    const isStepValid = () => {
        switch (currentStep) {
            case 1: // Type d'activité - Required
                if (enterpriseProfile.activityType === "entreprise") {
                    return !!(enterpriseProfile.companyName && enterpriseProfile.sirenNumber && enterpriseProfile.sirenNumber.length === 14)
                }
                return true
            case 2: // Coordonnées - Required
                return !!(
                    enterpriseProfile.professionalEmail &&
                    enterpriseProfile.professionalPhone &&
                    enterpriseProfile.professionalAddress &&
                    enterpriseProfile.city &&
                    enterpriseProfile.zipCode
                )
            case 3: // Documents - Optional
                return true
            case 4: // Métiers - Required (at least one trade)
                return enterpriseProfile.tradeConfigurations.length > 0
            case 5: // Configuration des métiers - Optional
                return true
            case 6: // Notifications - Optional
                return true
            default:
                return true
        }
    }
    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }


    const handleOnboardingComplete = async (profile: EnterpriseProfile) => {
        if (!user) return


        try {
            setIsLoading(true)
            let logoUrl = profile.companyLogo
            let signatureUrl = profile.signature

            if (user?.id) {
                if (companyLogoFile) {
                    try {
                        const uploadedUrl = await uploadLogo(companyLogoFile, user.id)
                        if (uploadedUrl) logoUrl = uploadedUrl
                    } catch (error) {
                        console.error("Failed to upload logo:", error)
                        toast.error("Erreur lors de l'upload du logo")
                    }
                }

                if (signatureFile) {
                    try {
                        const uploadedSignatureUrl = await uploadSignature(signatureFile, user.id)
                        if (uploadedSignatureUrl) signatureUrl = uploadedSignatureUrl
                    } catch (error) {
                        console.error("Failed to upload signature:", error)
                        toast.error("Erreur lors de l'upload de la signature")
                    }
                }
            }
            await ProfileServiceInstance.updateProfile(user.id, {
                company_name: profile.companyName,
                siret: profile.sirenNumber?.toString(),
                pro_phone: profile.professionalPhone,
                pro_email: profile.professionalEmail,
                logo_url: logoUrl,
                signature_url: signatureUrl,
                is_entreprise: profile.activityType === "entreprise",
                onboarding_completed: true,
                code_postal: profile.zipCode,
                ville: profile.city,
                settings: {
                    EMAIL_NOTIFICATIONS: emailNotifications,
                },
                adresse: profile.professionalAddress,
                pays: "France",
                p_provider: profile.p_provider,
            })

            // Save metiers and tariffs using batch save
            if (profile.tradeConfigurations.length > 0) {
                await ProfileServiceInstance.batchSaveMetiers(
                    user.id,
                    profile.tradeConfigurations,
                    [], // No deletions during onboarding
                    []
                )
            }

            toast.success("Profil configuré avec succès !")
            onOpenChange(false)
        } catch (error) {
            console.error("Failed to complete onboarding:", error)
            toast.error("Une erreur est survenue lors de la sauvegarde du profil.")
        } finally {
            setIsLoading(false)
        }
    }



    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl! p-2 gap-0">
                <DialogHeader className="p-2 md:p-6   ">
                    <div className="flex items-start md:items-center gap-1 md:gap-3">
                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-xl text-start flex items-center gap-2">Bienvenue sur FAÇADEO
                            </DialogTitle>
                            <DialogDescription className="text-sm text-start">
                                Configurez rapidement votre profil professionnel
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-2 md:px-6 pb-6  ">
                    <span className="text-xs mb-2 ml-5 text-muted-foreground bg-info/20 px-2 py-1 rounded-sm! flex items-center gap-2 w-fit"><AlertTriangle className="w-4 h-4" />Les données seront sauvegardées et pourront être modifiées ultérieurement.</span>

                    {/* Step 1: Type d'activité */}
                    {currentStep === 1 && (
                        <div className="p-5 rounded-lg    duration-300">
                            <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                                <div className="w-1 h-4 bg-primary rounded-full" />
                                Statut juridique
                            </h3>
                            <div className="space-y-4">
                                <FieldGroup>
                                    <FieldSet>
                                        <RadioGroup
                                            value={enterpriseProfile.activityType}
                                            onValueChange={(value) => setEnterpriseProfile({ ...enterpriseProfile, activityType: value as "auto" | "entreprise" })}
                                            className="grid grid-cols-1 md:grid-cols-2 gap-3"
                                        >
                                            <FieldLabel htmlFor="auto">
                                                <Field orientation="horizontal">
                                                    <FieldContent>
                                                        <FieldTitle>Auto-entrepreneur</FieldTitle>
                                                        <FieldDescription>Activité indépendante</FieldDescription>
                                                    </FieldContent>
                                                    <RadioGroupItem value="auto" id="auto" />
                                                </Field>
                                            </FieldLabel>
                                            <FieldLabel htmlFor="entreprise">
                                                <Field orientation="horizontal">
                                                    <FieldContent>
                                                        <FieldTitle>Entreprise</FieldTitle>
                                                        <FieldDescription>Société constituée</FieldDescription>
                                                    </FieldContent>
                                                    <RadioGroupItem value="entreprise" id="entreprise" />
                                                </Field>
                                            </FieldLabel>
                                        </RadioGroup>
                                    </FieldSet>
                                </FieldGroup>

                                {enterpriseProfile.activityType === "entreprise" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in fade-in duration-300">
                                        <div className="space-y-2">
                                            <Label htmlFor="company-name">Nom de l'entreprise</Label>
                                            <Input
                                                id="company-name"
                                                placeholder="Façades Pro SARL"
                                                value={enterpriseProfile.companyName}
                                                onChange={(e) => setEnterpriseProfile({ ...enterpriseProfile, companyName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="siren">Numéro SIRET (14 chiffres)</Label>
                                            <Input
                                                type="text"
                                                id="siren"
                                                placeholder="12345678901234"
                                                value={enterpriseProfile.sirenNumber ?? ""}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, "")
                                                    if (value.length <= 14) {
                                                        setEnterpriseProfile({ ...enterpriseProfile, sirenNumber: value || null })
                                                    }
                                                }}
                                                maxLength={14}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Coordonnées */}
                    {currentStep === 2 && (
                        <div className="p-5 rounded-lg  duration-300 space-y-4">
                            <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                                <div className="w-1 h-4 bg-primary rounded-full" />
                                Coordonnées
                            </h3>
                            <div className="space-y-2!">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email"> Email professionnel</Label>
                                        <Input
                                            id="email"
                                            className="bg-card!"
                                            type="email"
                                            placeholder="exemple@email.com"
                                            value={enterpriseProfile.professionalEmail}
                                            onChange={(e) => setEnterpriseProfile({ ...enterpriseProfile, professionalEmail: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Téléphone professionnel</Label>
                                        <Input
                                            id="phone"
                                            className="bg-card!"
                                            type="tel"
                                            placeholder="06 12 34 56 78"
                                            value={enterpriseProfile.professionalPhone}
                                            onChange={(e) => setEnterpriseProfile({ ...enterpriseProfile, professionalPhone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2!">
                                <Label htmlFor="address">Adresse postale</Label>
                                <Textarea
                                    id="address"
                                    placeholder="123 Rue de Exemple"
                                    value={enterpriseProfile.professionalAddress}
                                    onChange={(e) => setEnterpriseProfile({ ...enterpriseProfile, professionalAddress: e.target.value })}
                                    className="min-h-[70px] resize-none bg-card!"
                                />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                                <div className="space-y-2">
                                    <Label htmlFor="city">Ville</Label>
                                    <Popover open={cityOpen} onOpenChange={setCityOpen}>
                                        <PopoverTrigger asChild className="h-10">
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={cityOpen}
                                                className="w-full bg-card! justify-between font-normal text-muted-foreground"
                                            >
                                                {enterpriseProfile.city || "Rechercher une ville..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0" align="start">
                                            <Command shouldFilter={false}>
                                                <CommandInput
                                                    placeholder="Rechercher une ville..."
                                                    value={citySearch}
                                                    onValueChange={setCitySearch}
                                                />
                                                <CommandList>
                                                    {isCityLoading && (
                                                        <CommandItem disabled>Chargement...</CommandItem>
                                                    )}
                                                    {!isCityLoading && citySuggestions.length === 0 && citySearch.length >= 2 && (
                                                        <CommandEmpty>Aucune ville trouvée.</CommandEmpty>
                                                    )}
                                                    <CommandGroup>
                                                        {citySuggestions.map((city: any) => (
                                                            <CommandItem
                                                                key={`${city.nom}-${city.codesPostaux[0]}`}
                                                                value={city.nom}
                                                                onSelect={() => {
                                                                    setEnterpriseProfile(prev => ({
                                                                        ...prev,
                                                                        city: city.nom,
                                                                        zipCode: city.codesPostaux[0] || prev.zipCode
                                                                    }))
                                                                    setCityOpen(false)
                                                                    setCitySearch("")
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        enterpriseProfile.city === city.nom ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {city.nom} ({city.codesPostaux[0]})
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="zipCode">Code Postal</Label>
                                    <Input
                                        id="zipCode"
                                        className="bg-card!"
                                        placeholder="75001"
                                        value={enterpriseProfile.zipCode}
                                        onChange={(e) => setEnterpriseProfile({ ...enterpriseProfile, zipCode: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <Label htmlFor="country">Pays</Label>
                                    <Input
                                        id="country"
                                        value="France"
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                            </div>
                        </div>

                    )}

                    {/* Step 3: Documents */}
                    {currentStep === 3 && (
                        <div className="p-5 rounded-lg    duration-300">
                            <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                                <div className="w-1 h-4 bg-primary rounded-full" />
                                Documents
                                <span className="text-xs text-muted-foreground font-normal ml-auto">(optionnel)</span>
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm">Logo</Label>
                                    <div className="border-2 border-dashed h-32 border-border rounded-lg p-2 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 hover:border-primary/50 transition-all cursor-pointer relative group">
                                        {companyLogoPreview ? (
                                            <>
                                                <img src={companyLogoPreview} alt="Logo" className="h-full w-full rounded object-contain" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                                    <Upload className="h-5 w-5 text-white" />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-6 w-6 text-muted-foreground mb-1 group-hover:text-primary transition-colors" />
                                                <p className="text-xs text-muted-foreground">Ajouter</p>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            id="logo"
                                            accept="image/*"
                                            onChange={handleCompanyLogoChange}
                                            className="hidden"
                                        />
                                        <label htmlFor="logo" className="absolute inset-0 cursor-pointer" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm">Signature</Label>
                                    <div className="border-2 border-dashed h-32 border-border rounded-lg p-2 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 hover:border-primary/50 transition-all cursor-pointer relative group">
                                        {signaturePreview ? (
                                            <>
                                                <img src={signaturePreview} alt="Signature" className="h-full w-full rounded object-contain" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                                    <PenTool className="h-5 w-5 text-white" />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <PenTool className="h-6 w-6 text-muted-foreground mb-1 group-hover:text-primary transition-colors" />
                                                <p className="text-xs text-muted-foreground">Ajouter</p>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            id="signature"
                                            accept="image/*"
                                            onChange={handleSignatureChange}
                                            className="hidden"
                                        />
                                        <label htmlFor="signature" className="absolute inset-0 cursor-pointer" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Métier principal */}
                    {currentStep === 4 && (
                        <div className="px-5 rounded-lg duration-300">
                            <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                                <div className="w-1 h-4 bg-primary rounded-full" />
                                Métiers
                                <span className="text-xs text-muted-foreground font-normal ml-auto">Sélectionnez vos métiers</span>
                            </h3>

                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher un métier..."
                                    value={tradeSearch}
                                    onChange={(e) => setTradeSearch(e.target.value)}
                                    className="pl-9 bg-card"
                                />
                            </div>

                            <ScrollArea className="h-[250px] pr-4">
                                <div className="grid grid-cols-3 gap-2 justify-center">
                                    {metiers
                                        .filter(trade => trade.label.toLowerCase().includes(tradeSearch.toLowerCase()))
                                        .map((trade) => {
                                            const isSelected = enterpriseProfile.tradeConfigurations.some(tc => tc.metier_id === trade.id)
                                            return (
                                                <button
                                                    key={trade.id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setEnterpriseProfile(prev => ({
                                                                ...prev,
                                                                tradeConfigurations: prev.tradeConfigurations.filter(tc => tc.metier_id !== trade.id)
                                                            }))
                                                        } else {
                                                            setEnterpriseProfile(prev => ({
                                                                ...prev,
                                                                tradeConfigurations: [...prev.tradeConfigurations, {
                                                                    id: `temp_metier_${Date.now()}_${Math.random()}`,
                                                                    metier_id: trade.id,
                                                                    metier_label: trade.label,
                                                                    description: "",
                                                                    tariffConfigurations: []
                                                                }]
                                                            }))
                                                            setTradeSearch("")
                                                        }
                                                    }}
                                                    className={`flex items-center justify-between px-4 py-3 text-sm text-left rounded-lg transition-all border ${isSelected
                                                        ? 'bg-primary/5 border-primary text-primary'
                                                        : 'bg-card border-border hover:bg-muted/50'
                                                        }`}
                                                >
                                                    <span className="font-medium truncate">{trade.label}</span>
                                                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                                                </button>
                                            )
                                        })}

                                </div>
                                {metiers.filter(trade => trade.label.toLowerCase().includes(tradeSearch.toLowerCase())).length === 0 && (
                                    <Empty className="border-2 py-12 bg-card border-dashed">
                                        <EmptyHeader>
                                            <EmptyMedia variant="icon">
                                                <Search className="h-4 w-4" />
                                            </EmptyMedia>
                                            <EmptyTitle>Aucun métier trouvé</EmptyTitle>
                                            <EmptyDescription>
                                                Nous n'avons pas trouvé de métier correspondant à "{tradeSearch}"
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                )}
                            </ScrollArea>
                        </div>
                    )}

                    {/* Step 5: Configure Trades */}
                    {currentStep === 5 && (
                        <div className="p-5 rounded-lg duration-300">
                            <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                                <div className="w-1 h-4 bg-primary rounded-full" />
                                Configuration des métiers
                                <span className="text-xs text-muted-foreground font-normal ml-auto">
                                    {enterpriseProfile.tradeConfigurations.length} métier(s)
                                </span>
                            </h3>

                            {enterpriseProfile.tradeConfigurations.length === 0 ? (
                                <Empty className="border-none py-12">
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <PenTool className="h-6 w-6" />
                                        </EmptyMedia>
                                        <EmptyTitle>Aucun métier sélectionné</EmptyTitle>
                                        <EmptyDescription>
                                            Veuillez sélectionner au moins un métier à l'étape précédente.
                                        </EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            ) : (
                                <ScrollArea className="h-[45vh]! pr-4">
                                    <Accordion type="multiple" className="space-y-3">
                                        {enterpriseProfile.tradeConfigurations.map((tradeConfig) => (
                                            <AccordionItem
                                                key={tradeConfig.id}
                                                value={tradeConfig.id}
                                                className="border rounded-lg overflow-hidden"
                                            >
                                                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                                                            {tradeConfig.metier_label}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {tradeConfig.tariffConfigurations.length > 0 ? `${tradeConfig.tariffConfigurations.length} tarifs` : "Aucun tarif actuellement"}
                                                        </span>
                                                    </div>
                                                </AccordionTrigger>

                                                <AccordionContent className="px-4 pb-4">
                                                    <div className="space-y-4 pt-2">
                                                        {/* Description */}
                                                        <div className="space-y-2">
                                                            <Label className="text-sm">Description</Label>
                                                            <Textarea
                                                                value={tradeConfig.description}
                                                                onChange={(e) => updateTradeDescription(tradeConfig.id, e.target.value)}
                                                                placeholder={`Décrivez votre expertise en ${tradeConfig.metier_label}...`}
                                                                className="min-h-[60px] resize-none text-sm"
                                                            />
                                                        </div>

                                                        {/* Tariffs */}
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-sm font-semibold">Tarifs</Label>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => addTariffToTrade(tradeConfig.id)}
                                                                    className="h-7 text-xs"
                                                                >
                                                                    <Plus className="h-3 w-3 mr-1" />
                                                                    Ajouter
                                                                </Button>
                                                            </div>

                                                            {tradeConfig.tariffConfigurations.length === 0 ? (
                                                                <div className="text-center py-6 border border-dashed rounded-md bg-muted/10">
                                                                    <Text className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Aucun tarif configuré pour ce métier
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <ScrollArea className="h-[200px] pr-4">
                                                                    <div className="space-y-2">
                                                                        {tradeConfig.tariffConfigurations.map((tariff) => (
                                                                            <div
                                                                                key={tariff.id}
                                                                                className="relative space-y-2 bg-muted/20 hover:bg-muted/30 transition-colors p-3 rounded-md"
                                                                            >
                                                                                <Label className="text-xs text-muted-foreground ml-2">
                                                                                    Nom du service
                                                                                </Label>
                                                                                <Input
                                                                                    value={tariff.service_name}
                                                                                    onChange={(e) => updateTariff(tradeConfig.id, tariff.id, "service_name", e.target.value)}
                                                                                    placeholder="Nom du service"
                                                                                    className="h-9 text-sm"
                                                                                />
                                                                                <div className="grid grid-cols-3 gap-2">
                                                                                    <div>
                                                                                        <Label className="text-xs text-muted-foreground ml-2">
                                                                                            Mesure
                                                                                        </Label>
                                                                                        <Select
                                                                                            value={tariff.unit}
                                                                                            onValueChange={(value) => updateTariff(tradeConfig.id, tariff.id, "unit", value)}
                                                                                        >
                                                                                            <SelectTrigger className="h-9! w-full">
                                                                                                <SelectValue placeholder="Mesure" />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                <SelectItem value="m²">m²</SelectItem>
                                                                                                <SelectItem value="unite">unité</SelectItem>
                                                                                                <SelectItem value="m">m</SelectItem>
                                                                                                <SelectItem value="heure">Heure</SelectItem>
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    </div>
                                                                                    <div>
                                                                                        <Label className="text-xs text-muted-foreground ml-2">
                                                                                            Quantité
                                                                                        </Label>
                                                                                        <Input
                                                                                            type="number"
                                                                                            value={tariff.quantity}
                                                                                            onChange={(e) => updateTariff(tradeConfig.id, tariff.id, "quantity", parseFloat(e.target.value) || 0)}
                                                                                            placeholder="Qté"
                                                                                            className="h-9 text-sm"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <Label className="text-xs text-muted-foreground ml-2">
                                                                                            Prix € (HT)
                                                                                        </Label>
                                                                                        <Input
                                                                                            type="number"
                                                                                            value={tariff.unit_price_cents}
                                                                                            onChange={(e) => updateTariff(tradeConfig.id, tariff.id, "unit_price_cents", parseFloat(e.target.value) || 0)}
                                                                                            placeholder="Prix"
                                                                                            className="h-9 text-sm"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <button
                                                                                    onClick={() => removeTariffFromTrade(tradeConfig.id, tariff.id)}
                                                                                    className="absolute text-destructive top-1 right-1 p-1 underline rounded-full transition-colors flex items-center cursor-pointer justify-center hover:bg-destructive/10"
                                                                                    title="Supprimer ce tarif"
                                                                                >
                                                                                    <X className="h-4 w-4" />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </ScrollArea>
                                                            )}
                                                        </div>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </ScrollArea>
                            )}
                        </div>
                    )}

                    {/* Step 6: Notifications */}
                    {currentStep === 6 && (
                        <div className="p-5 rounded-lg duration-300">
                            <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                                <div className="w-1 h-4 bg-primary rounded-full" />
                                Notifications
                            </h3>

                            <div className="bg-muted/20 border rounded-lg p-4 space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-full bg-primary/10 text-primary mt-1">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-medium">Notifications par email</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Recevoir des emails pour les nouveaux devis et mises à jour importantes.
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={emailNotifications}
                                        onCheckedChange={setEmailNotifications}
                                    />
                                </div>

                                {emailNotifications && (
                                    <div className="bg-primary/5 border border-primary/10 rounded-md p-3 text-xs text-primary/80 flex gap-2">
                                        <Bell className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>
                                            Vous recevrez les notifications sur <strong>{enterpriseProfile.professionalEmail || "votre email"}</strong>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}


                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-3 pt-4">
                    <Button
                        onClick={handlePrevious}
                        variant="outline"
                        disabled={currentStep === 1}
                        className="text-muted-foreground"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Précédent
                    </Button>
                    <div className="flex gap-2">
                        {/* Show skip button only on optional steps (4 & 5) */}
                        {(currentStep === 4) && (
                            <Button variant="outline" onClick={handleNext} className="text-muted-foreground">
                                Passer
                            </Button>
                        )}
                    </div>
                    <Button
                        onClick={handleNext}
                        variant="default"
                        className="gap-2"
                        disabled={!isStepValid() || isLoading}
                    >
                        {currentStep === totalSteps ? (isLoading ? "Enregistrement..." : "Terminer") : "Suivant"}
                        {currentStep < totalSteps && <ArrowRight className="w-4 h-4" />}
                    </Button>
                </div>
            </DialogContent>
        </Dialog >
    )
}
