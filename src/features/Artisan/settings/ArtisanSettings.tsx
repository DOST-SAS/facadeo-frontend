import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Camera, Plus, Trash2, PenTool, Save, Upload, X, Text, User as UserIcon, Building2, TriangleAlert, Mail, MessageSquare, Pencil, Phone, IdCard, MapPin, Search, Check, Shield, ChevronsUpDown, Loader2, BriefcaseBusiness, Info } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ArtisanProfile, NotificationSettings, SecuritySettings, TariffConfiguration, TradeConfiguration } from "../../../types/artisanSettinstypes"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ModeToggle } from "@/components/mode-toggle"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/context/AuthContext"
import toast from "react-hot-toast"
import { uploadAvatar, uploadLogo, uploadSignature } from "@/utils/UploadAvatars"
import { ProfileServiceInstance } from "@/services/artisan/profileservices"
import type { Metier } from "@/types/artisanSettinstypes"
import { DeleteModal } from "@/components/DeleteModel"
import CitiesService from "@/services/cities"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { UsersServiceInstance } from "@/services/admin/UsersServices"



const ArtisanSettings = () => {
    const { user, session, changePassword, signOut } = useAuth()
    const [profile, setProfile] = useState<ArtisanProfile>({
        id: user?.id || "",
        role: user?.role || "artisan",
        status: user?.status || "active",
        is_admin: user?.is_admin || false,
        display_name: user?.display_name || "",
        company_name: user?.company_name || "",
        siret: user?.siret || "",
        phone: user?.phone || "",
        address: user?.address || "",
        metier_id: user?.metier_id || "",
        logo_url: user?.logo_url || "",
        signature_url: user?.signature_url || "",
        pricing_overrides: user?.pricing_overrides || {},
        settings: user?.settings || {},
        onboarding_completed: user?.onboarding_completed || false,
        created_at: user?.created_at || "",
        updated_at: user?.updated_at || "",
        lastLogin: user?.lastLogin || "",
        deleted_at: user?.deleted_at || "",
        email: user?.email || "",
        avatar: user?.avatar || "",
        pro_email: user?.pro_email || "",
        pro_phone: user?.pro_phone || "",
        adresse: user?.adresse || "",
        numberScans: user?.numberScans || 0,
        numberDevis: user?.numberDevis || 0,
        is_entreprise: user?.is_entreprise || false,
        ville: user?.ville || "",
        code_postal: user?.code_postal || "",
        pays: user?.pays || "France"
    })

    const [isInitialized, setIsInitialized] = useState(false)

    // Initial load from user context
    useEffect(() => {
        if (user && user.id && !isInitialized) {
            setProfile((prev) => ({
                ...prev,
                ...user
            }))
            // Also sync references for initial display
            setCompanyLogoPreview(user.logo_url || null)
            setSignaturePreview(user.signature_url || null)
            setProfilePhotoPreview(user.avatar || null)
            setIsInitialized(true)
        }
    }, [user?.id, isInitialized])

    useEffect(() => {
        console.log("session : ", session?.user)
        console.log("provider : ", session?.user?.app_metadata?.provider)
    }, [session])

    const [editing, setEditing] = useState(false)
    const [metiers, setMetiers] = useState<Metier[]>([])
    const [metierconfig, setMetierconfig] = useState<TradeConfiguration[]>([])
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<{ type: 'metier' | 'tariff' | 'account', id: string } | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchProfileMetiers = async () => {
        if (!user?.id) return []
        try {
            const data = await ProfileServiceInstance.getProfileMetiers(user.id)
            setMetierconfig(data)
            return data
        } catch (error) {
            console.error("Failed to fetch profile metiers", error)
            toast.error("Impossible de charger vos métiers")
            return []
        }
    }

    const [tradeSearch, setTradeSearch] = useState("")
    const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false)
    const [tempSelectedTrades, setTempSelectedTrades] = useState<string[]>([])
    const [security, setSecurity] = useState<SecuritySettings>({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    })

    const [securityErrors, setSecurityErrors] = useState<{
        currentPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
    }>({})

    const [notifications, setNotifications] = useState<NotificationSettings>({
        emailNotifications: false,
        smsNotifications: false
    })

    const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(profile.avatar || null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null)
    const [selectedSignatureFile, setSelectedSignatureFile] = useState<File | null>(null)
    const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(profile.logo_url || null)
    const [signaturePreview, setSignaturePreview] = useState<string | null>(profile.signature_url || null)
    const [editingPro, setEditingPro] = useState(false)

    // City Search State
    const [cityOpen, setCityOpen] = useState(false)
    const [citySuggestions, setCitySuggestions] = useState<any[]>([])
    const [isCityLoading, setIsCityLoading] = useState(false)
    const [citySearch, setCitySearch] = useState("")

    // Loading States
    const [isSavingUser, setIsSavingUser] = useState(false)
    const [isSavingPro, setIsSavingPro] = useState(false)
    const [isSavingMetier, setIsSavingMetier] = useState(false)
    const [isSavingSecurity, setIsSavingSecurity] = useState(false)

    // Initial States for Change Detection
    const [initialMetierConfig, setInitialMetierConfig] = useState<TradeConfiguration[]>([])

    // Change Detection
    const isUserDirty =
        profile.display_name !== user?.display_name ||
        profile.phone !== user?.phone ||
        profile.ville !== (user?.ville || "") ||
        profile.code_postal !== (user?.code_postal || "") ||
        profile.pays !== (user?.pays || "France") ||
        selectedFile !== null

    const isProDirty =
        profile.company_name !== (user?.company_name || "") ||
        profile.siret !== (user?.siret || "") ||
        profile.adresse !== (user?.adresse || "") ||
        profile.pro_email !== (user?.pro_email || "") ||
        profile.pro_phone !== (user?.pro_phone || "") ||
        profile.is_entreprise !== (user?.is_entreprise || false) ||
        selectedLogoFile !== null ||
        selectedSignatureFile !== null

    const isMetiersDirty = JSON.stringify(metierconfig) !== JSON.stringify(initialMetierConfig)

    const isSecurityDirty =
        security.currentPassword !== "" ||
        security.newPassword !== "" ||
        security.confirmPassword !== ""

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

    useEffect(() => {
        const loadData = async () => {
            if (user?.id) {
                const configs = await fetchProfileMetiers()
                if (configs) setInitialMetierConfig(configs)
            }
            const metiersData = await ProfileServiceInstance.getMetiers()
            setMetiers(metiersData)
        }
        loadData()
    }, [user?.id])






    const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setProfilePhotoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleUpdateUserProfile = async () => {
        if (!user) return;

        if (!profile.display_name || !profile.email || !profile.phone) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setIsSavingUser(true);
        let avatarUrl = profile.avatar; // default

        try {
            // Upload if a new file is selected
            if (selectedFile && user.id) {
                const uploadedUrl = await uploadAvatar(selectedFile, user.id);
                if (uploadedUrl) avatarUrl = uploadedUrl;
            }

            const { error } = await ProfileServiceInstance.updateProfile(user.id, {
                display_name: profile.display_name,
                phone: profile.phone,
                avatar: avatarUrl,
                settings: profile.settings,
                ville: profile.ville,
                code_postal: profile.code_postal,
                pays: profile.pays,
            });

            if (error) {
                toast.error(error.message);
                return;
            }
            setSelectedFile(null);
            setEditing(false);
            toast.success("Profile updated successfully");
        }
        catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setIsSavingUser(false);
        }
    };


    const handleDirectLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user?.id) return

        const loadingToast = toast.loading("Enregistrement du logo...")
        try {
            const uploadedUrl = await uploadLogo(file, user.id, profile.logo_url)
            if (uploadedUrl) {
                const { error } = await ProfileServiceInstance.updateProfile(user.id, {
                    logo_url: uploadedUrl
                })
                if (error) throw error

                setCompanyLogoPreview(uploadedUrl)
                setProfile(prev => ({ ...prev, logo_url: uploadedUrl }))
                toast.success("Logo mis à jour", { id: loadingToast })
            }
        } catch (error) {
            console.error(error)
            toast.error("Échec de la mise à jour", { id: loadingToast })
        }
    }

    const handleDirectSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user?.id) return

        const loadingToast = toast.loading("Enregistrement de la signature...")
        try {
            const uploadedUrl = await uploadSignature(file, user.id, profile.signature_url)
            if (uploadedUrl) {
                const { error } = await ProfileServiceInstance.updateProfile(user.id, {
                    signature_url: uploadedUrl
                })
                if (error) throw error

                setSignaturePreview(uploadedUrl)
                setProfile(prev => ({ ...prev, signature_url: uploadedUrl }))
                toast.success("Signature mise à jour", { id: loadingToast })
            }
        } catch (error) {
            console.error(error)
            toast.error("Échec de la mise à jour", { id: loadingToast })
        }
    }

    const handleCompanyLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedLogoFile(file)
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
            setSelectedSignatureFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setSignaturePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    // Safe synchronization for Professional profile
    useEffect(() => {
        if (user && user.id && isInitialized) {
            // Only sync URLs if local files haven't been selected (previews are already handled)
            if (!selectedLogoFile) setProfile(prev => ({ ...prev, logo_url: user.logo_url || prev.logo_url }))
            if (!selectedSignatureFile) setProfile(prev => ({ ...prev, signature_url: user.signature_url || prev.signature_url }))
        }
    }, [user?.logo_url, user?.signature_url])

    const handleUpdateProfessionalProfile = async () => {
        if (!user) return;

        setIsSavingPro(true);
        try {
            let logoUrl = profile.logo_url;
            let signatureUrl = profile.signature_url;

            if (selectedLogoFile && user.id) {
                const uploaded = await uploadLogo(selectedLogoFile, user.id, profile.logo_url);
                if (uploaded) logoUrl = uploaded;
            }

            if (selectedSignatureFile && user.id) {
                const uploaded = await uploadSignature(selectedSignatureFile, user.id, profile.signature_url);
                if (uploaded) signatureUrl = uploaded;
            }

            const { error } = await ProfileServiceInstance.updateProfile(user.id, {
                company_name: profile.company_name,
                siret: profile.siret,
                logo_url: logoUrl,
                signature_url: signatureUrl,
                adresse: profile.adresse,
                pro_email: profile.pro_email,
                pro_phone: profile.pro_phone,
                is_entreprise: profile.is_entreprise,
            });

            if (error) {
                toast.error(error.message);
                return;
            }
            setSelectedLogoFile(null);
            setSelectedSignatureFile(null);
            toast.success("Informations professionnelles mises à jour");
            setEditingPro(false);
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la mise à jour");
        } finally {
            setIsSavingPro(false);
        }
    };

    const handleCancelPro = () => {
        setEditingPro(false);
        if (user) {
            setProfile(prev => ({
                ...prev,
                company_name: user.company_name || "",
                siret: user.siret || "",
                adresse: user.adresse || "",
                pro_email: user.pro_email || "",
                pro_phone: user.pro_phone || "",
                is_entreprise: user.is_entreprise || false,
                logo_url: user.logo_url || "",
                signature_url: user.signature_url || "",
            }));
            setCompanyLogoPreview(user.logo_url || null);
            setSignaturePreview(user.signature_url || null);
            setSelectedLogoFile(null);
            setSelectedSignatureFile(null);
        }
    };

    const handleSaveSettings = async () => {
        if (!user?.id) return
        setIsSavingMetier(true)
        try {
            await ProfileServiceInstance.batchSaveMetiers(
                user.id,
                metierconfig,
                [], // deletedMetierIds (immediate delete)
                []  // deletedTariffIds (immediate delete)
            )

            // Allow DB triggers/updates to settle, then refresh
            const updatedConfigs = await fetchProfileMetiers()
            if (updatedConfigs) setInitialMetierConfig(updatedConfigs)

            toast.success("Configuration sauvegardée avec succès")
        } catch (error) {
            console.error(error)
            toast.error("Erreur lors de la sauvegarde")
        } finally {
            setIsSavingMetier(false)
        }
    }

    const handleValidateSecurity = async () => {
        const errors: { currentPassword?: string; newPassword?: string; confirmPassword?: string } = {};

        if (!security.currentPassword) {
            errors.currentPassword = "Veuillez saisir votre mot de passe actuel";
        }

        if (!security.newPassword) {
            errors.newPassword = "Veuillez saisir un nouveau mot de passe";
        } else if (security.newPassword.length < 6) {
            errors.newPassword = "Le nouveau mot de passe doit contenir au moins 6 caractères";
        }

        if (!security.confirmPassword) {
            errors.confirmPassword = "Veuillez confirmer le nouveau mot de passe";
        } else if (security.newPassword !== security.confirmPassword) {
            errors.confirmPassword = "Les nouveaux mots de passe ne correspondent pas";
        }

        if (Object.keys(errors).length > 0) {
            setSecurityErrors(errors);
            return;
        }

        setSecurityErrors({});
        setIsSavingSecurity(true);

        try {
            const result = await changePassword(security.currentPassword, security.newPassword);

            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Mot de passe modifié avec succès");
            }

            setSecurity({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
            setSecurityErrors({});
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la mise à jour du mot de passe");
        } finally {
            setIsSavingSecurity(false);
        }
    };


    const openDeleteModal = (id: string, type: 'metier' | 'tariff') => {
        setItemToDelete({ id, type })
        setDeleteModalOpen(true)
    }

    const confirmDelete = async () => {
        if (!itemToDelete) return

        setIsDeleting(true)
        try {
            if (itemToDelete.type === 'metier') {
                const tradeId = itemToDelete.id
                // If it's a temp ID, just remove from state
                if (tradeId.startsWith('temp_')) {
                    setMetierconfig(metierconfig.filter(tc => tc.id !== tradeId))
                    toast.success("Métier supprimé")
                } else {
                    // It's a real ID, delete immediately from DB
                    await ProfileServiceInstance.removeProfileMetier(tradeId)
                    setMetierconfig(metierconfig.filter(tc => tc.id !== tradeId))
                    toast.success("Métier supprimé définitivement")
                }
            } else if (itemToDelete.type === 'tariff') {
                // Tariff delete
                const tariffId = itemToDelete.id
                if (tariffId.startsWith('temp_')) {
                    setMetierconfig(metierconfig.map(tc => ({
                        ...tc,
                        tariffConfigurations: tc.tariffConfigurations.filter(t => t.id !== tariffId)
                    })))
                    toast.success("Tarif supprimé")
                } else {
                    await ProfileServiceInstance.deleteTariff(tariffId)
                    setMetierconfig(metierconfig.map(tc => ({
                        ...tc,
                        tariffConfigurations: tc.tariffConfigurations.filter(t => t.id !== tariffId)
                    })))
                    toast.success("Tarif supprimé définitivement")
                }
            } else if (itemToDelete.type === 'account') {
                if (!user?.id) return
                await UsersServiceInstance.deleteUser(user.id)
                toast.success("Compte supprimé définitivement")
                await signOut()
            }
        } catch (error) {
            console.error(error)
            toast.error("Erreur lors de la suppression")
        } finally {
            setIsDeleting(false)
            setDeleteModalOpen(false)
            setItemToDelete(null)
        }
    }

    const updateTradeDescription = (id: string, description: string) => {
        setMetierconfig(metierconfig.map(tc =>
            tc.id === id ? { ...tc, description } : tc
        ))
    }

    const addTariffToTrade = (tradeId: string) => {
        const newTariff: TariffConfiguration = {
            id: `temp_tariff_${Date.now()}`,
            service_name: "",
            unit: "m²",
            unit_price_cents: 1,
            quantity: 1
        }

        setMetierconfig(metierconfig.map(tc =>
            tc.id === tradeId ? {
                ...tc,
                tariffConfigurations: [...tc.tariffConfigurations, newTariff]
            } : tc
        ))
    }

    const removeTariffFromTrade = (tariffId: string) => {
        openDeleteModal(tariffId, 'tariff')
    }

    const updateLocalTariff = (tradeId: string, tariffId: string, field: keyof TariffConfiguration, value: any) => {
        setMetierconfig(metierconfig.map(tc =>
            tc.id === tradeId ? {
                ...tc,
                tariffConfigurations: tc.tariffConfigurations.map(t =>
                    t.id === tariffId ? { ...t, [field]: value } : t
                )
            } : tc
        ))
    }

    const handleDeleteAccountClick = () => {
        if (!user?.id) return
        setItemToDelete({ type: 'account', id: user.id })
        setDeleteModalOpen(true)
    }





    return (
        <div className="relative min-h-screen  bg-card  md:bg-background p-3 overflow-hidden md:p-6">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
            </div>
            <div className="relative space-y-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-3xl font-bold text-foreground/70 mb-5">Paramètres</h1>
                </div>
                <div className="flex items-center justify-between bg-secondary/50 p-1 rounded-sm md:hidden " >
                    <span className="text-[12px]! font-semibold text-foreground/60 ">
                        Mode sombre/clair
                    </span>
                    <ModeToggle />
                </div>
                {/* Main Settings Card */}
                <Card className="shadow-sm border-none">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Données principales</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <Tabs defaultValue="personnel" className="w-full">
                            <TabsList className="mb-10 w-full flex flex-wrap  md:w-2xl">
                                <TabsTrigger value="personnel" > <UserIcon className=" h-4 w-4" /> <span className="hidden md:inline">Personnelles</span></TabsTrigger>
                                <TabsTrigger value="proffecional"> <Building2 className=" h-4 w-4" /> <span className="hidden md:inline">Professionnelles</span></TabsTrigger>
                                <TabsTrigger value="metier"> <BriefcaseBusiness className=" h-4 w-4" /> <span className="hidden md:inline">Métier</span></TabsTrigger>
                                <TabsTrigger value="security"> <Shield className=" h-4 w-4" /> <span className="hidden md:inline">Sécurité</span></TabsTrigger>

                            </TabsList>

                            {/* Personnel Tab */}
                            <TabsContent value="personnel" className="space-y-6">
                                {/* Personal Information Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-foreground">Informations personnelles



                                    </h3>

                                    <div className="relative">
                                        {/* Edit Button */}
                                        {editing ? (
                                            <></>
                                        ) : (
                                            <div className="absolute -top-10 right-0 z-10">
                                                <Button
                                                    size="sm"
                                                    onClick={() => setEditing(!editing)}
                                                    variant={editing ? "outline" : "secondary"}
                                                    className="h-9 gap-2 border "
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    Modifier
                                                </Button>
                                            </div>
                                        )}

                                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pt-8">
                                            {/* Profile Photo */}
                                            <div className="shrink-0">
                                                <div className="relative group">
                                                    <div className="relative md:w-28 md:h-28 w-20 h-20 bg-linear-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center overflow-hidden border-4 border-background shadow-lg ring-2 ring-primary/20">
                                                        {profilePhotoPreview ? (
                                                            <>
                                                                <img src={profilePhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                                                                {editing && (
                                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <Camera className="w-6 h-6 text-white" />
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center">
                                                                <Camera className="w-8 h-8 text-primary mb-1" />
                                                                <span className="text-xs text-muted-foreground hidden md:block">Photo</span>
                                                            </div>
                                                        )}
                                                        {editing && (
                                                            <>
                                                                <input
                                                                    type="file"
                                                                    id="profile-photo"
                                                                    accept="image/*"
                                                                    onChange={handleProfilePhotoChange}
                                                                    className="hidden"
                                                                />
                                                                <label
                                                                    htmlFor="profile-photo"
                                                                    className="absolute inset-0 cursor-pointer"
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                    {editing && (
                                                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-md cursor-pointer hover:scale-110 transition-transform">
                                                            <label htmlFor="profile-photo" className="cursor-pointer flex items-center justify-center w-full h-full">
                                                                <Upload className="w-4 h-4 text-primary-foreground" />
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {!editing ? (
                                                /* View Mode - Display with Icons */
                                                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Name */}
                                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-all duration-200 border border-transparent hover:border-sidebar-border group">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                            <UserIcon className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">Nom complet</p>
                                                            <p className="text-sm font-bold text-foreground truncate">{profile.display_name || "Non renseigné"}</p>
                                                        </div>
                                                    </div>

                                                    {/* Email */}
                                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-all duration-200 border border-transparent hover:border-sidebar-border group">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                            <Mail className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">Email</p>
                                                            <p className="text-sm font-bold text-foreground truncate">{profile.email || "Non renseigné"}</p>
                                                        </div>
                                                    </div>

                                                    {/* Phone */}
                                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-all duration-200 border border-transparent hover:border-sidebar-border group">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                            <Phone className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">Téléphone</p>
                                                            <p className="text-sm font-bold text-foreground truncate">{profile.phone || "Non renseigné"}</p>
                                                        </div>
                                                    </div>

                                                    {/* Location */}
                                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-all duration-200 border border-transparent hover:border-sidebar-border group ">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                            <MapPin className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">Localisation</p>
                                                            <p className="text-sm font-bold text-foreground truncate">
                                                                {profile.ville ? `${profile.code_postal} ${profile.ville}` : "Non renseigné"}
                                                                {profile.pays && profile.pays !== "France" && ` (${profile.pays})`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Edit Mode - Input Fields */
                                                <div className="flex-1 w-full! space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="display_name" className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                                <UserIcon className="h-4 w-4 text-primary" />
                                                                Nom complet
                                                            </Label>
                                                            <Input
                                                                id="display_name"
                                                                value={profile.display_name}
                                                                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                                                                placeholder="Ex: Jean Dupont"
                                                                className="h-11 w-full bg-background/50 focus:bg-background transition-colors"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="email" className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                                <Mail className="h-4 w-4 text-primary" />
                                                                Email
                                                            </Label>
                                                            <Input
                                                                id="email"
                                                                type="email"
                                                                value={profile.email}
                                                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                                placeholder="exemple@email.com"
                                                                className="h-11 bg-background/50 focus:bg-background transition-colors"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="phone" className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                            <Phone className="h-4 w-4 text-primary" />
                                                            Téléphone
                                                        </Label>
                                                        <Input
                                                            id="phone"
                                                            type="tel"
                                                            value={profile.phone}
                                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                            placeholder="Ex: 06 12 34 56 78"
                                                            className="h-11 bg-background/50 focus:bg-background transition-colors"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="city" className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                                <MapPin className="h-4 w-4 text-primary" />
                                                                Ville
                                                            </Label>
                                                            <Popover open={cityOpen} onOpenChange={setCityOpen}>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        aria-expanded={cityOpen}
                                                                        className="w-full justify-between h-11 font-normal bg-background/50"
                                                                    >
                                                                        {profile.ville || "Rechercher une ville..."}
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
                                                                                <CommandItem disabled className="flex items-center gap-2">
                                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                                    Chargement...
                                                                                </CommandItem>
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
                                                                                            setProfile(prev => ({
                                                                                                ...prev,
                                                                                                ville: city.nom,
                                                                                                code_postal: city.codesPostaux[0] || prev.code_postal
                                                                                            }))
                                                                                            setCityOpen(false)
                                                                                            setCitySearch("")
                                                                                        }}
                                                                                    >
                                                                                        <Check
                                                                                            className={cn(
                                                                                                "mr-2 h-4 w-4",
                                                                                                profile.ville === city.nom ? "opacity-100" : "opacity-0"
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
                                                            <Label htmlFor="zipCode" className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                                <IdCard className="h-4 w-4 text-primary" />
                                                                Code Postal
                                                            </Label>
                                                            <Input
                                                                id="zipCode"
                                                                placeholder="75001"
                                                                value={profile.code_postal}
                                                                onChange={(e) => setProfile({ ...profile, code_postal: e.target.value })}
                                                                className="h-11 bg-background/50 focus:bg-background transition-colors"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="country" className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                            <MapPin className="h-4 w-4 text-primary" />
                                                            Pays
                                                        </Label>
                                                        <Input
                                                            id="country"
                                                            disabled={true}
                                                            value={profile.pays || "France"}
                                                            onChange={(e) => setProfile({ ...profile, pays: e.target.value })}
                                                            placeholder="Ex: France"
                                                            className="h-11 bg-background/50 focus:bg-background transition-colors"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>


                                    {editing ? (
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setEditing(false)}
                                                className="h-8 md:h-12 font-semibold"
                                            >
                                                Annuler
                                            </Button>
                                            <Button
                                                variant="default"
                                                onClick={handleUpdateUserProfile}
                                                className="h-8 md:h-12 font-semibold"
                                                disabled={!isUserDirty || isSavingUser}
                                            >
                                                {isSavingUser ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Save className="h-5 w-5" />
                                                )}
                                                {isSavingUser ? "Enregistrement..." : "Enregistrer"}
                                            </Button>
                                        </div>
                                    ) : (
                                        <></>
                                    )}
                                </div>
                                {/* Notification Settings */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Gérez vos préférences de notification pour rester informé
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {/* Email Notifications */}
                                        <Label
                                            htmlFor="emailNotifications"
                                            className="w-full! block cursor-pointer"
                                        >
                                            <div className="relative overflow-hidden rounded-lg border border-border bg-card hover:border-primary/50 transition-all duration-200">
                                                <div className="flex items-center justify-between p-2! md:p-4">
                                                    <div className="flex items-center gap-3  flex-1">
                                                        <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                                                            <Mail className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div className="">
                                                            <span>Notifications par email</span>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Recevez des alertes importantes par email
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        id="emailNotifications"
                                                        checked={profile.settings?.EMAIL_NOTIFICATIONS}
                                                        onCheckedChange={async (checked) => {
                                                            setProfile({ ...profile, settings: { ...profile.settings, EMAIL_NOTIFICATIONS: checked } })
                                                            await ProfileServiceInstance.updateProfile(user.id, {
                                                                settings: {
                                                                    EMAIL_NOTIFICATIONS: checked
                                                                }
                                                            })
                                                        }
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </Label>
                                    </div>
                                </div>

                            </TabsContent>

                            {/* Entreprise Tab */}
                            <TabsContent value="proffecional" className="space-y-6">
                                {/* Header with Edit Button */}
                                <div className="flex justify-between items-center pb-4 border-b">
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">Informations professionnelles
                                            <span className="ml-2 inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-[11px] font-medium normal-case align-middle shadow-sm">
                                                <Info className="h-3 w-3" />
                                                informations visibles publiquement
                                            </span>
                                        </h3>
                                        <p className="text-sm text-muted-foreground">Gérez l'identité et les coordonnées de votre structure.</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => setEditingPro(!editingPro)}
                                        variant={"outline"}
                                        className="h-9 gap-2 transition-all"
                                    >
                                        <Pencil className="h-4 w-4" />
                                        {editingPro ? "Annuler les modifications" : "Modifier"}
                                    </Button>
                                </div>

                                {/* View Mode */}
                                {!editingPro && (
                                    <div className="space-y-10 animate-in fade-in duration-500 pt-6">
                                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 rounded-2xl bg-primary/10 dark:bg-primary/20 shadow-sm border border-primary/5 dark:border-primary/10">
                                                        {profile.is_entreprise ? (
                                                            <Building2 className="h-6 w-6 text-primary" />
                                                        ) : (
                                                            <UserIcon className="h-6 w-6 text-primary" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                                                {profile.is_entreprise ? (profile.company_name || "Nom non renseigné") : (profile.display_name || "Nom non renseigné")}
                                                            </h2>
                                                            <Badge className={cn(
                                                                "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 shadow-sm",
                                                                profile.is_entreprise
                                                                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                                                                    : "bg-primary text-primary-foreground"
                                                            )}>
                                                                {profile.is_entreprise ? "Entreprise" : "Indépendant"}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium italic">
                                                            Configuration professionnelle active
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className=" grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* Left Column: Coordinates and Info */}
                                            <div className="lg:col-span-2 space-y-8">
                                                {/* Professional Details Table-like Card */}
                                                <Card className="rounded-3xl p-0 border-slate-200/70 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-950">
                                                    <CardHeader className="px-8 pt-8 pb-4">
                                                        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                                                                <IdCard className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                                            </div>
                                                            Identité & Coordonnées
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="px-0 pt-0">
                                                        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                                            {profile.is_entreprise && (
                                                                <div className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Numéro SIRET</span>
                                                                        <span className="font-bold text-slate-900 dark:text-white text-base">{profile.siret || "Non renseigné"}</span>
                                                                    </div>
                                                                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-tighter">OFFICIEL</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="px-8 py-5 flex items-center gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                                                                    <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email Professionnel</span>
                                                                    <span className="font-semibold text-slate-900 dark:text-white text-[15px]">{profile.pro_email || "Non renseigné"}</span>
                                                                </div>
                                                            </div>
                                                            <div className="px-8 py-5 flex items-center gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                                                                    <Phone className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Téléphone Professionnel</span>
                                                                    <span className="font-semibold text-slate-900 dark:text-white text-[15px]">{profile.pro_phone || "Non renseigné"}</span>
                                                                </div>
                                                            </div>
                                                            <div className="px-8 py-5 flex items-center gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                                                                    <MapPin className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Adresse du Siège</span>
                                                                    <span className="font-semibold text-slate-900 dark:text-white text-[15px]">{profile.adresse || "Non renseignée"}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>


                                            </div>
                                            {/* RIGHT COLOMN */}
                                            <div className="lg:col-span-1 space-y-8">
                                                {/* Visual Assets Preview Area */}
                                                <div className="flex flex-col gap-6">
                                                    <div className="space-y-4">
                                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-4">Logo Documents</p>
                                                        <div className="relative aspect-square md:aspect-video rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm flex items-center justify-center p-8 group/asset">
                                                            {companyLogoPreview ? (
                                                                <img src={companyLogoPreview} alt="Logo" className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover/asset:scale-110" />
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-3 text-slate-300 dark:text-slate-600">
                                                                    <Building2 className="h-12 w-12 opacity-20" />
                                                                    <span className="text-[11px] font-bold uppercase">Aucun Logo</span>
                                                                </div>
                                                            )}
                                                            {/* Hover Action Layer */}
                                                            <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-800/60 opacity-0 group-hover/asset:opacity-100 transition-all duration-300 flex flex-col items-center justify-center text-white backdrop-blur-[2px] cursor-pointer">
                                                                <Upload className="h-8 w-8 mb-2 animate-in slide-in-from-bottom-2" />
                                                                <span className="text-[11px] font-bold uppercase tracking-wider">Modifier le logo</span>
                                                            </div>
                                                            <input
                                                                type="file"
                                                                id="logo-upload-view"
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={handleDirectLogoUpload}
                                                            />
                                                            <label htmlFor="logo-upload-view" className="absolute inset-0 cursor-pointer" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 dark:text-primary/50 ml-4 flex items-center gap-2">
                                                            <PenTool className="h-3 w-3" /> Signature Numérique
                                                        </p>
                                                        <div className="relative aspect-square md:aspect-video rounded-3xl overflow-hidden border border-primary/20 dark:border-primary/30 bg-primary/[0.02] dark:bg-primary/5 shadow-sm flex items-center justify-center p-10 group/asset">
                                                            {signaturePreview ? (
                                                                <img src={signaturePreview} alt="Signature" className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover/asset:scale-110" />
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-3 text-primary/20 dark:text-primary/30">
                                                                    <PenTool className="h-12 w-12 opacity-20" />
                                                                    <span className="text-[11px] font-bold uppercase">Aucune Signature</span>
                                                                </div>
                                                            )}
                                                            {/* Hover Action Layer */}
                                                            <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover/asset:opacity-100 transition-all duration-300 flex flex-col items-center justify-center text-white backdrop-blur-[2px] cursor-pointer">
                                                                <Upload className="h-8 w-8 mb-2 animate-in slide-in-from-bottom-2" />
                                                                <span className="text-[11px] font-bold uppercase tracking-wider">Modifier la signature</span>
                                                            </div>
                                                            <input
                                                                type="file"
                                                                id="signature-upload-view"
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={handleDirectSignatureUpload}
                                                            />
                                                            <label htmlFor="signature-upload-view" className="absolute inset-0 cursor-pointer" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                )}

                                {/* Edit Mode */}
                                {editingPro && (
                                    <div className="space-y-8 animate-in slide-in-from-bottom-2 fade-in duration-500">
                                        {/* Activity Type Selection Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div
                                                onClick={() => setProfile({ ...profile, is_entreprise: false })}
                                                className={`cursor-pointer relative p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${profile.is_entreprise === false
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                                    : 'border-border bg-card hover:border-primary/50'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                                                            <UserIcon className="h-4 w-4" /> Auto-entrepreneur
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">Idéal pour les indépendants individuels.</p>
                                                    </div>
                                                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${profile.is_entreprise === false ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                                                        {profile.is_entreprise === false && <span className="h-2 w-2 rounded-full bg-current" />}
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                onClick={() => setProfile({ ...profile, is_entreprise: true })}
                                                className={`cursor-pointer relative p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${profile.is_entreprise === true
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                                    : 'border-border bg-card hover:border-primary/50'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                                                            <Building2 className="h-4 w-4" /> Entreprise / Société
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">Pour les SARL, EURL, SAS, etc.</p>
                                                    </div>
                                                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${profile.is_entreprise === true ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                                                        {profile.is_entreprise === true && <span className="h-2 w-2 rounded-full bg-current" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            {/* Left Column: Form Fields */}
                                            <div className="lg:col-span-2 space-y-8">
                                                {profile.is_entreprise && (
                                                    <div className="space-y-4 animate-in fade-in duration-300">
                                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Identité</h4>
                                                        <div className="grid gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="company-name">Nom de l'entreprise *</Label>
                                                                <div className="relative">
                                                                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                                    <Input
                                                                        id="company-name"
                                                                        value={profile.company_name}
                                                                        onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                                                                        placeholder="Ex: Façades Pro SARL"
                                                                        className="pl-9 h-11"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="siren">Numéro SIREN *</Label>
                                                                <div className="relative">
                                                                    <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                                    <Input
                                                                        id="siren"
                                                                        value={profile.siret}
                                                                        onChange={(e) => setProfile({ ...profile, siret: e.target.value })}
                                                                        placeholder="123 456 789"
                                                                        className="pl-9 h-11 font-mono"
                                                                        maxLength={14}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-4 pt-2">
                                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Coordonnées Professionnelles</h4>
                                                    <div className="grid gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="professional-address">Adresse professionnelle</Label>
                                                            <div className="relative">
                                                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                                <Input
                                                                    id="professional-address"
                                                                    value={profile.adresse}
                                                                    onChange={(e) => setProfile({ ...profile, adresse: e.target.value })}
                                                                    placeholder="123 Rue de l'Exemple"
                                                                    className="pl-9 h-11"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="professional-email">Email Professionnel</Label>
                                                                <div className="relative">
                                                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                                    <Input
                                                                        id="professional-email"
                                                                        type="email"
                                                                        value={profile.pro_email}
                                                                        onChange={(e) => setProfile({ ...profile, pro_email: e.target.value })}
                                                                        placeholder="contact@example.com"
                                                                        className="pl-9 h-11"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="professional-phone">Téléphone Professionnel</Label>
                                                                <div className="relative">
                                                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                                    <Input
                                                                        id="professional-phone"
                                                                        type="tel"
                                                                        value={profile.pro_phone}
                                                                        onChange={(e) => setProfile({ ...profile, pro_phone: e.target.value })}
                                                                        placeholder="01 23 45 67 89"
                                                                        className="pl-9 h-11"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column: Uploads */}
                                            <div className="lg:col-span-1 space-y-6">
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-sm font-medium">Logo</Label>
                                                        <Badge variant="secondary" className="text-[10px] h-5">Recommandé</Badge>
                                                    </div>
                                                    <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30 transition-all group">
                                                        <input type="file" id="company-logo" accept="image/*" onChange={handleCompanyLogoChange} className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer" />
                                                        <div className="h-48 flex flex-col items-center justify-center gap-3 p-4 text-center">
                                                            {companyLogoPreview ? (
                                                                <img src={companyLogoPreview} alt="Preview" className="h-full w-full object-contain" />
                                                            ) : (
                                                                <>
                                                                    <div className="p-3 rounded-full bg-background shadow-xs group-hover:scale-110 transition-transform">
                                                                        <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-sm font-medium text-foreground">Importer un logo</p>
                                                                        <p className="text-xs text-muted-foreground">PNG, JPG jusqu'à 2Mo</p>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-sm font-medium">Signature</Label>
                                                        <Badge variant="secondary" className="text-[10px] h-5">Recommandé</Badge>
                                                    </div>
                                                    <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30 transition-all group">
                                                        <input type="file" id="signature" accept="image/*" onChange={handleSignatureChange} className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer" />
                                                        <div className="h-40 flex flex-col items-center justify-center gap-3 p-4 text-center">
                                                            {signaturePreview ? (
                                                                <img src={signaturePreview} alt="Preview" className="h-full w-full object-contain" />
                                                            ) : (
                                                                <>
                                                                    <div className="p-2 rounded-full bg-background shadow-xs group-hover:scale-110 transition-transform">
                                                                        <PenTool className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Importer</span> une signature</p>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                )}

                                {(editingPro || isProDirty) && (
                                    <div className="flex items-center justify-end gap-4 pt-8 mt-4 border-t animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <Button variant="secondary" onClick={handleCancelPro} className="h-11 px-6 font-semibold">
                                            Annuler
                                        </Button>
                                        <Button
                                            variant="default"
                                            onClick={handleUpdateProfessionalProfile}
                                            className="h-11 px-8 font-semibold shadow-md active:scale-95 transition-all"
                                            disabled={!isProDirty || isSavingPro}
                                        >
                                            {isSavingPro ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <Save className="h-5 w-5 mr-2" />
                                            )}
                                            {isSavingPro ? "Enregistrement..." : "Enregistrer les modifications"}
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>

                            {/* métier Tab */}
                            <TabsContent value="metier" className="space-y-6">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-semibold text-foreground">Sélectionner un métier</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Ajoutez et configurez vos métiers. Chaque métier peut avoir sa propre description et ses tarifs.
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setTempSelectedTrades([])
                                                setIsAddTradeModalOpen(true)
                                            }}
                                            className="shrink-0"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Ajouter des métiers
                                        </Button>
                                    </div>

                                    <Dialog open={isAddTradeModalOpen} onOpenChange={setIsAddTradeModalOpen}>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>Sélectionnez vos métiers</DialogTitle>
                                            </DialogHeader>

                                            <div className="space-y-4 py-4">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Rechercher un métier..."
                                                        value={tradeSearch}
                                                        onChange={(e) => setTradeSearch(e.target.value)}
                                                        className="pl-9 bg-card"
                                                    />
                                                </div>

                                                <ScrollArea className="h-[350px] pr-4">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {metiers
                                                            .filter(trade => trade.label.toLowerCase().includes(tradeSearch.toLowerCase()))
                                                            .map((trade) => {
                                                                const alreadyInConfig = metierconfig.some(tc => tc.metier_id === trade.id)
                                                                const isSelected = tempSelectedTrades.includes(trade.id) || alreadyInConfig

                                                                return (
                                                                    <button
                                                                        key={trade.id}
                                                                        type="button"
                                                                        disabled={alreadyInConfig}
                                                                        onClick={() => {
                                                                            if (alreadyInConfig) return
                                                                            if (isSelected) {
                                                                                setTempSelectedTrades(prev => prev.filter(id => id !== trade.id))
                                                                            } else {
                                                                                setTempSelectedTrades(prev => [...prev, trade.id])
                                                                            }
                                                                        }}
                                                                        className={`flex items-center justify-between px-4 py-3 text-sm text-left rounded-lg transition-all border ${isSelected
                                                                            ? 'bg-primary/5 border-primary text-primary'
                                                                            : 'bg-card border-border hover:bg-muted/50'
                                                                            } ${alreadyInConfig ? 'opacity-50 cursor-not-allowed' : ''}`}
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

                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsAddTradeModalOpen(false)}>
                                                    Annuler
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        const newTrades = tempSelectedTrades.map(metierId => {
                                                            const metier = metiers.find(m => m.id === metierId)
                                                            return {
                                                                id: `temp_metier_${Date.now()}_${Math.random()}`,
                                                                metier_id: metierId,
                                                                metier_label: metier?.label,
                                                                description: "",
                                                                tariffConfigurations: []
                                                            }
                                                        })
                                                        setMetierconfig([...metierconfig, ...newTrades])
                                                        setIsAddTradeModalOpen(false)
                                                        setTempSelectedTrades([])
                                                        setTradeSearch("")
                                                        toast.success(`${newTrades.length} métier(s) ajouté(s)`)
                                                    }}
                                                    disabled={tempSelectedTrades.length === 0}
                                                >
                                                    Ajouter {tempSelectedTrades.length > 0 ? `(${tempSelectedTrades.length})` : ""}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>



                                    {/* Trade Configurations List */}
                                    <div className="space-y-3">
                                        {metierconfig.length === 0 ? (
                                            <Empty className="border mx-auto p-3!">
                                                <EmptyHeader>
                                                    <EmptyMedia variant="icon">
                                                        <Building2 />
                                                    </EmptyMedia>
                                                    <EmptyTitle>Aucun métier configuré</EmptyTitle>
                                                    <EmptyDescription>
                                                        Commencez par ajouter votre premier métier pour configurer vos services et tarifs.
                                                    </EmptyDescription>
                                                </EmptyHeader>
                                            </Empty>
                                        ) : (
                                            <Accordion type="multiple" className="space-y-3">
                                                {metierconfig.map((tradeConfig: TradeConfiguration) => (
                                                    <AccordionItem
                                                        key={tradeConfig.id}
                                                        value={tradeConfig.id}
                                                        className="border border-border rounded-lg overflow-hidden bg-card "
                                                    >
                                                        <AccordionTrigger className="relative flex-1  cursor-pointer w-full! flex items-center justify-between mb-1 hover:no-underline p-4 py-2 pr-16">
                                                            <div className="flex items-center gap-3">
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="bg-primary/10 text-primary border-0 px-3 py-1.5 text-sm font-semibold"
                                                                >
                                                                    {tradeConfig.metier_label || "Métier"}
                                                                </Badge>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {tradeConfig.tariffConfigurations.length > 0 ? `${tradeConfig.tariffConfigurations.length} tarifs` : "Aucun tarif actuellement"}
                                                                </span>
                                                            </div>
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    openDeleteModal(tradeConfig.id, 'metier')
                                                                }}
                                                                className="absolute right-2 top-2 h-8 w-8 rounded-full transition-colors flex items-center cursor-pointer justify-center hover:bg-destructive/10 ml-2"
                                                                title="Supprimer ce métier"
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </div>
                                                        </AccordionTrigger>

                                                        <AccordionContent className="px-4 pb-4">
                                                            <div className="space-y-4 pt-2">
                                                                {/* Description */}
                                                                <div className="space-y-2">
                                                                    <Label className="text-sm text-muted-foreground">
                                                                        Description du métier
                                                                    </Label>
                                                                    <Textarea
                                                                        value={tradeConfig.description}
                                                                        onChange={(e) => updateTradeDescription(tradeConfig.id, e.target.value)}
                                                                        placeholder={`Décrivez votre expertise...`}
                                                                        className="min-h-[80px] resize-none"
                                                                    />
                                                                </div>

                                                                {/* Tariffs Section */}
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label className="text-sm font-semibold text-foreground">
                                                                            Tarifs pour {tradeConfig.metier_label}
                                                                        </Label>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => addTariffToTrade(tradeConfig.id)}
                                                                            className="h-8 text-xs"
                                                                        >
                                                                            <Plus className="h-3 w-3 mr-1" />
                                                                            Ajouter un tarif
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
                                                                        <div className="space-y-2">
                                                                            {tradeConfig.tariffConfigurations.map((tariff: TariffConfiguration) => (
                                                                                <div
                                                                                    key={tariff.id}
                                                                                    className="relative space-y-2 bg-muted/20 hover:bg-muted/30 transition-colors p-3 rounded-md"
                                                                                >
                                                                                    <Label className="text-xs text-muted-foreground ml-2">
                                                                                        Nom du service
                                                                                    </Label>
                                                                                    <Input
                                                                                        value={tariff.service_name}
                                                                                        onChange={(e) =>
                                                                                            updateLocalTariff(
                                                                                                tradeConfig.id,
                                                                                                tariff.id,
                                                                                                "service_name",
                                                                                                e.target.value
                                                                                            )
                                                                                        }
                                                                                        placeholder="Nom du service"
                                                                                        className="h-9"
                                                                                    />
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div>
                                                                                            <Label className="text-xs text-muted-foreground ml-2">
                                                                                                Unité
                                                                                            </Label>
                                                                                            <Select
                                                                                                value={tariff.unit}
                                                                                                onValueChange={(value) => {
                                                                                                    updateLocalTariff(
                                                                                                        tradeConfig.id,
                                                                                                        tariff.id,
                                                                                                        "unit",
                                                                                                        value
                                                                                                    )
                                                                                                }}
                                                                                            >
                                                                                                <SelectTrigger className="h-9! w-full md:w-32">
                                                                                                    <SelectValue placeholder="Unité" />
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                    <SelectItem value="m²">m²</SelectItem>
                                                                                                    <SelectItem value="unités">unités</SelectItem>
                                                                                                    <SelectItem value="m">Mètre linéaire</SelectItem>
                                                                                                    <SelectItem value="heure">Heure</SelectItem>
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                        </div>
                                                                                        <div className=" grow">
                                                                                            <Label className="text-xs text-muted-foreground ml-2">
                                                                                                Quantité
                                                                                            </Label>
                                                                                            <Input
                                                                                                type="number"
                                                                                                value={tariff.quantity}
                                                                                                onChange={(e) =>
                                                                                                    updateLocalTariff(
                                                                                                        tradeConfig.id,
                                                                                                        tariff.id,
                                                                                                        "quantity",
                                                                                                        parseFloat(e.target.value) || 0
                                                                                                    )
                                                                                                }
                                                                                                placeholder="Qté"
                                                                                                className="h-9"
                                                                                            />
                                                                                        </div>
                                                                                        <div className=" grow">
                                                                                            <Label className="text-xs text-muted-foreground ml-2">
                                                                                                Prix HT (€)
                                                                                            </Label>
                                                                                            <Input
                                                                                                type="number"
                                                                                                value={tariff.unit_price_cents}
                                                                                                onChange={(e) =>
                                                                                                    updateLocalTariff(
                                                                                                        tradeConfig.id,
                                                                                                        tariff.id,
                                                                                                        "unit_price_cents",
                                                                                                        parseFloat(e.target.value) || 0
                                                                                                    )
                                                                                                }
                                                                                                placeholder="Prix"
                                                                                                className="h-9"
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            removeTariffFromTrade(tariff.id)
                                                                                        }
                                                                                        className="absolute text-destructive top-1 right-1 p-1 underline  rounded-full transition-colors flex items-center cursor-pointer justify-center hover:bg-destructive/10"
                                                                                        title="Supprimer ce tarif"
                                                                                    >
                                                                                        <X className="h-4 w-4" />
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                ))}
                                            </Accordion>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        variant="default"
                                        onClick={handleSaveSettings}
                                        className="h-8 md:h-12 font-semibold"
                                        disabled={!isMetiersDirty || isSavingMetier}
                                    >
                                        {isSavingMetier ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Save className="h-5 w-5" />
                                        )}
                                        {isSavingMetier ? "Enregistrement..." : "Enregistrer"}
                                    </Button>
                                </div>
                            </TabsContent>

                            {/* Security Tab */}
                            <TabsContent value="security" className="space-y-8">
                                {session && session.user?.app_metadata?.provider === "email" && (
                                    <div className="">
                                        <div>
                                            <div className="text-lg font-semibold">Sécurité</div>
                                            <p className="hidden md:block text-sm text-muted-foreground mt-1">
                                                Modifiez votre mot de passe pour sécuriser votre compte.
                                            </p>
                                        </div>
                                        <div className="space-y-4 mt-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="currentPassword" className={`text-sm ${securityErrors.currentPassword ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                    Mot de passe actuel
                                                </Label>
                                                <div className="space-y-1">
                                                    <Input
                                                        id="currentPassword"
                                                        type="text"
                                                        autoComplete="current-password"
                                                        name="current-password"
                                                        value={security.currentPassword}
                                                        onChange={(e) => {
                                                            setSecurity({ ...security, currentPassword: e.target.value });
                                                            if (securityErrors.currentPassword)
                                                                setSecurityErrors({ ...securityErrors, currentPassword: undefined });
                                                        }}
                                                        placeholder="**********"
                                                        className={`h-10 ${securityErrors.currentPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                                    />

                                                    {securityErrors.currentPassword && (
                                                        <p className="text-xs text-destructive font-medium animate-in fade-in slide-in-from-top-1">{securityErrors.currentPassword}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="newPassword" className={`text-sm ${securityErrors.newPassword ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                        Nouveau mot de passe
                                                    </Label>
                                                    <div className="space-y-1">
                                                        <Input
                                                            id="newPassword"
                                                            type="text"
                                                            autoComplete="new-password"
                                                            name="new-password"
                                                            value={security.newPassword}
                                                            onChange={(e) => {
                                                                setSecurity({ ...security, newPassword: e.target.value });
                                                                if (securityErrors.newPassword)
                                                                    setSecurityErrors({ ...securityErrors, newPassword: undefined });
                                                            }}
                                                            placeholder="**********"
                                                            className={`h-10 ${securityErrors.newPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                                        />

                                                        {securityErrors.newPassword && (
                                                            <p className="text-xs text-destructive font-medium animate-in fade-in slide-in-from-top-1">{securityErrors.newPassword}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="confirmPassword" className={`text-sm ${securityErrors.confirmPassword ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                        Confirmez le nouveau mot de passe
                                                    </Label>
                                                    <div className="space-y-1">
                                                        <Input
                                                            id="confirmPassword"
                                                            type="text"
                                                            autoComplete="new-password"
                                                            name="confirm-password"
                                                            value={security.confirmPassword}
                                                            onChange={(e) => {
                                                                setSecurity({ ...security, confirmPassword: e.target.value });
                                                                if (securityErrors.confirmPassword)
                                                                    setSecurityErrors({ ...securityErrors, confirmPassword: undefined });
                                                            }}
                                                            placeholder="**********"
                                                            className={`h-10 ${securityErrors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                                        />

                                                        {securityErrors.confirmPassword && (
                                                            <p className="text-xs text-destructive font-medium animate-in fade-in slide-in-from-top-1">{securityErrors.confirmPassword}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-end">
                                                <Button
                                                    variant="default"
                                                    onClick={handleValidateSecurity}
                                                    className="md:h-12 h-8 font-semibold"
                                                    disabled={!isSecurityDirty || isSavingSecurity}
                                                >
                                                    {isSavingSecurity ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Pencil className="h-4 w-4" />
                                                    )}
                                                    {isSavingSecurity ? "Mise à jour..." : "Modifier le mot de passe"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}



                                {/* Account Deletion - Danger Zone */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
                                            <TriangleAlert className="h-5 w-5" />
                                            Zone dangereuse
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Actions irréversibles sur votre compte
                                        </p>
                                    </div>

                                    <div className="relative overflow-hidden rounded-lg border-2 border-destructive/20 bg-linear-to-br from-destructive/5 via-background to-destructive/5">
                                        {/* Decorative accent line */}
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-destructive/50 to-transparent" />
                                        <div className="p-4 md:p-6">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-0.5 rounded-full bg-destructive/10 p-2 border border-destructive/20">
                                                            <Trash2 className="h-5 w-5 text-destructive" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-semibold text-foreground mb-1">
                                                                Suppression du compte
                                                            </h4>
                                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                                Cette action est <span className="font-semibold text-destructive">permanente et irréversible</span>.
                                                                Toutes vos données, scans, devis et configurations seront définitivement supprimés.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    variant="destructive"
                                                    onClick={handleDeleteAccountClick}
                                                    className="h-10 md:h-12 font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] shrink-0"
                                                >
                                                    <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                                                    Supprimer mon compte
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <DeleteModal
                            isOpen={deleteModalOpen}
                            onClose={() => setDeleteModalOpen(false)}
                            onConfirm={confirmDelete}
                            loading={isDeleting}
                            title={
                                itemToDelete?.type === 'metier' ? "Supprimer ce métier ?" :
                                    itemToDelete?.type === 'tariff' ? "Supprimer ce tarif ?" :
                                        "Supprimer mon compte ?"
                            }
                            description={
                                itemToDelete?.type === 'metier'
                                    ? "Voulez-vous vraiment supprimer ce métier ainsi que tous les tarifs associés ? Cette action est immédiate et irréversible."
                                    : itemToDelete?.type === 'tariff'
                                        ? "Voulez-vous vraiment supprimer ce tarif ? Cette action est immédiate et irréversible."
                                        : "Cette action est irréversible. Toutes vos données, scans et devis seront définitivement supprimés."
                            }
                        />
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}

export default ArtisanSettings