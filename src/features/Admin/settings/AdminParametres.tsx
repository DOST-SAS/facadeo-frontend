import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { Save, Bell, Globe, Coins, Mail, Euro, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import type { Settings } from "../../../types/adminSettingsTypes"
import { ButtonGroup } from "@/components/ui/button-group"
import { maskApiKey, cn } from "@/lib/utils"
import { SettingsServiceInstance } from "@/services/admin/settingsServices"
import AdminSettingsSkeleton from "./AdminsettingsSkeleton"

export default function AdminParametres() {
    const [isLoading, setIsLoading] = useState(false)
    const [focusedField, setFocusedField] = useState<string | null>(null)

    // Initial empty state
    const [settings, setSettings] = useState<Settings>({
        // Global
        maxScanRadiusMeters: 0,
        extractedDataExpirationDays: 0,
        retainUnusedCredits: false,
        id: "",

        // API & Tariffs
        googleMapsKey: { key: "", tarif: 0 },
        googlePlacesKey: { key: "", tarif: 0 },
        streetViewKey: { key: "", tarif: 0 },
        geminiNanoKey: { key: "", tarif: 0 },
        geminiNanoImageKey: { key: "", tarif: 0 },
        apifyApiKey: { key: "", tarif: 0 },
        BREVO_API_KEY: "",
        emailSender: "",
        STRIPE_PUBLISHABLE_KEY: "",
        STRIPE_SECRET_KEY: "",

        // Notifications
        emailEnabled: false,
        notifyOnScan: false,
        notifyOnDevis: false,
        alertEmail: "",

        // Sender Identities
        emailGeneral: { "email": "", "name": "" },
        emailOffers: { "email": "", "name": "" },
        emailSupport: { "email": "", "name": "" },
        emailNoReply: { "email": "", "name": "" }
    })

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setIsLoading(true)
                const response = await SettingsServiceInstance.getSettings()
                const fetchedSettings = response?.data?.[0]

                if (fetchedSettings) {
                    setSettings((prev) => ({
                        ...prev,
                        ...fetchedSettings,
                    }))
                } else {
                    console.warn("Aucun paramètre trouvé, utilisation des valeurs par défaut.")
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchSettings()
    }, [])

    const handleUpdateGlobalSettings = async () => {

        try {
            setIsLoading(true)
            await SettingsServiceInstance.updateSettings({
                id: settings.id,
                maxScanRadiusMeters: settings.maxScanRadiusMeters,
                extractedDataExpirationDays: settings.extractedDataExpirationDays,
                retainUnusedCredits: settings.retainUnusedCredits,
            })
            toast.success("Les paramètres globaux ont été mis à jour avec succès")
        } catch (error) {
            console.error("Failed to update global settings:", error)
            toast.error("Erreur lors de la mise à jour des paramètres")
        } finally {
            setIsLoading(false)
        }
    }
    const handleUpdateApiSettings = async () => {
        try {
            setIsLoading(true)
            await SettingsServiceInstance.updateSettings({
                id: settings.id,
                googleMapsKey: settings.googleMapsKey,
                googlePlacesKey: settings.googlePlacesKey,
                streetViewKey: settings.streetViewKey,
                geminiNanoKey: settings.geminiNanoKey,
                apifyApiKey: settings.apifyApiKey,
                BREVO_API_KEY: settings.BREVO_API_KEY,
                emailSender: settings.emailSender,
                STRIPE_PUBLISHABLE_KEY: settings.STRIPE_PUBLISHABLE_KEY,
                STRIPE_SECRET_KEY: settings.STRIPE_SECRET_KEY,
            })
            toast.success("Les API ont été mis à jour avec succès")
        } catch (error) {
            console.error("Failed to update api settings:", error)
            toast.error("Erreur lors de la mise à jour des paramètres")
        } finally {
            setIsLoading(false)
        }
    }
    const handleUpdateNotificationSettings = async () => {
        try {
            setIsLoading(true)
            await SettingsServiceInstance.updateSettings({
                id: settings.id,
                emailEnabled: settings.emailEnabled,
                notifyOnScan: settings.notifyOnScan,
                notifyOnDevis: settings.notifyOnDevis,
                alertEmail: settings.alertEmail,
                emailGeneral: settings.emailGeneral,
                emailOffers: settings.emailOffers,
                emailSupport: settings.emailSupport,
                emailNoReply: settings.emailNoReply,
            })
            toast.success("Les paramètres de communication ont été mis à jour")
        } catch (error) {
            console.error("Failed to update notification settings:", error)
            toast.error("Erreur lors de la mise à jour des paramètres")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
            </div>

            <div className="relative mx-auto  px-6 py-8">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground/70">Paramètres système</h1>
                        <p className="text-muted-foreground mt-1">Gérez les configurations globales, les tarifs et les notifications.</p>
                    </div>

                </header>

                {isLoading ? (
                    <AdminSettingsSkeleton />
                ) : (
                    <Tabs defaultValue="global" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
                            <TabsTrigger value="global" className="gap-2">
                                <Globe className="h-4 w-4" /> Global
                            </TabsTrigger>
                            <TabsTrigger value="apis" className="gap-2">
                                <Coins className="h-4 w-4" />APIs
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="gap-2">
                                <Bell className="h-4 w-4" /> Notifications
                            </TabsTrigger>
                        </TabsList>

                        {/* Global Tab */}
                        <TabsContent value="global" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-primary" />
                                        Configuration Générale
                                    </CardTitle>
                                    <CardDescription>
                                        Paramètres fondamentaux du fonctionnement de l'application.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="scan-radius">Rayon maximum de scan (mètres)</Label>
                                            <Input
                                                id="scan-radius"
                                                type="number"
                                                value={settings?.maxScanRadiusMeters ?? 0}
                                                onChange={(e) =>
                                                    setSettings((prev) => ({
                                                        ...prev,
                                                        maxScanRadiusMeters: parseInt(e.target.value || "0", 10),
                                                    }))
                                                }
                                            />
                                            <p className="text-xs text-muted-foreground">Limite géographique pour la génération.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="data-expiration">Expiration des données extraites (jours)</Label>
                                            <Input
                                                id="data-expiration"
                                                type="number"
                                                value={settings?.extractedDataExpirationDays ?? 0}
                                                onChange={(e) =>
                                                    setSettings((prev) => ({
                                                        ...prev,
                                                        extractedDataExpirationDays: parseInt(e.target.value || "0", 10),
                                                    }))
                                                }
                                            />
                                            <p className="text-xs text-muted-foreground">Durée de conservation en base de données.</p>
                                        </div>


                                    </div>
                                    <Separator className="my-6" />

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Coins className="h-4 w-4 text-primary" />
                                            <h3 className="text-sm font-semibold">Gestion des Crédits</h3>
                                        </div>

                                        <div
                                            className={cn(
                                                "relative flex items-center justify-between p-5 rounded-xl border-2 shadow-sm hover:shadow-md transition-all duration-300",
                                                settings.retainUnusedCredits
                                                    ? "bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/20 dark:to-primary/20 border-primary dark:border-primary"
                                                    : "bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-300 dark:border-slate-700"
                                            )}
                                        >
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <Label htmlFor="retain-unused-credits" className="font-semibold text-foreground cursor-pointer text-base">
                                                        Conserver les crédits non utilisés
                                                    </Label>
                                                    <Badge
                                                        variant={settings.retainUnusedCredits ? "default" : "secondary"}
                                                        className={cn(
                                                            "text-xs font-bold px-2.5 py-0.5 transition-colors",
                                                            settings.retainUnusedCredits
                                                                ? "bg-primary hover:bg-primary/80 text-white"
                                                                : "bg-slate-400 hover:bg-slate-500 text-white"
                                                        )}
                                                    >
                                                        {settings.retainUnusedCredits ? "ACTIVÉ" : "DÉSACTIVÉ"}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {settings.retainUnusedCredits
                                                        ? "✓ Les crédits inutilisés seront reportés au cycle suivant"
                                                        : "✗ Les crédits inutilisés expireront à la fin du cycle"}
                                                </p>
                                            </div>
                                            <Switch
                                                id="retain-unused-credits"
                                                checked={settings.retainUnusedCredits}
                                                onCheckedChange={(checked) => setSettings({ ...settings, retainUnusedCredits: checked })}
                                                className="ml-6 scale-110"
                                            />
                                        </div>
                                    </div>

                                </CardContent>
                                <CardFooter className="flex justify-end">
                                    <Button onClick={handleUpdateGlobalSettings} disabled={isLoading}>
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">Enregistrement...</span>
                                        ) : (
                                            <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Enregistrer</span>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>

                        </TabsContent>

                        {/* Onglet APIs & Tarifs */}
                        <TabsContent value="apis" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Coins className="h-5 w-5 text-primary" />
                                        Clés API Externes
                                    </CardTitle>
                                    <CardDescription>
                                        Configuration des services tiers connectés à la plateforme et leurs tarifs unitaires.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="maps-key">Clé API Google Maps</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="maps-key"
                                                type="text"
                                                autoComplete="off"
                                                value={focusedField === "googleMapsKey" ? settings.googleMapsKey.key : maskApiKey(settings.googleMapsKey.key || "")}
                                                onFocus={() => setFocusedField("googleMapsKey")}
                                                onBlur={() => setFocusedField(null)}
                                                onChange={(e) => setSettings({ ...settings, googleMapsKey: { ...settings.googleMapsKey, key: e.target.value } })}
                                            />
                                            <div className="relative w-32">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                    <Euro className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="pl-9"
                                                    value={settings.googleMapsKey.tarif}
                                                    onChange={(e) => setSettings({ ...settings, googleMapsKey: { ...settings.googleMapsKey, tarif: Number(e.target.value) } })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <Label htmlFor="places-key">Clé API Google Places</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="places-key"
                                                type="text"
                                                autoComplete="off"
                                                value={focusedField === "googlePlacesKey" ? settings.googlePlacesKey.key : maskApiKey(settings.googlePlacesKey.key || "")}
                                                onFocus={() => setFocusedField("googlePlacesKey")}
                                                onBlur={() => setFocusedField(null)}
                                                onChange={(e) => setSettings({ ...settings, googlePlacesKey: { ...settings.googlePlacesKey, key: e.target.value } })}
                                            />
                                            <div className="relative w-32">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                    <Euro className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="pl-9"
                                                    value={settings.googlePlacesKey.tarif}
                                                    onChange={(e) => setSettings({ ...settings, googlePlacesKey: { ...settings.googlePlacesKey, tarif: Number(e.target.value) } })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <Label htmlFor="street-view-key">Clé API Street View</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="street-view-key"
                                                type="text"
                                                autoComplete="off"
                                                value={focusedField === "streetViewKey" ? settings.streetViewKey.key : maskApiKey(settings.streetViewKey.key || "")}
                                                onFocus={() => setFocusedField("streetViewKey")}
                                                onBlur={() => setFocusedField(null)}
                                                onChange={(e) => setSettings({ ...settings, streetViewKey: { ...settings.streetViewKey, key: e.target.value } })}
                                            />
                                            <div className="relative w-32">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                    <Euro className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="pl-9"
                                                    value={settings.streetViewKey.tarif}
                                                    onChange={(e) => setSettings({ ...settings, streetViewKey: { ...settings.streetViewKey, tarif: Number(e.target.value) } })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <Label htmlFor="gemini-nano-key">Clé API Gemini Nano</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="gemini-nano-key"
                                                type="text"
                                                autoComplete="off"
                                                value={focusedField === "geminiNanoKey" ? settings.geminiNanoKey.key : maskApiKey(settings.geminiNanoKey.key || "")}
                                                onFocus={() => setFocusedField("geminiNanoKey")}
                                                onBlur={() => setFocusedField(null)}
                                                onChange={(e) => setSettings({ ...settings, geminiNanoKey: { ...settings.geminiNanoKey, key: e.target.value } })}
                                            />
                                            <div className="relative w-32">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                    <Euro className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="pl-9"
                                                    value={settings.geminiNanoKey.tarif}
                                                    onChange={(e) => setSettings({ ...settings, geminiNanoKey: { ...settings.geminiNanoKey, tarif: Number(e.target.value) } })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <Label htmlFor="apify-api-key">Clé API Apify</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="apify-api-key"
                                                type="text"
                                                autoComplete="off"
                                                value={focusedField === "apifyApiKey" ? settings.apifyApiKey.key : maskApiKey(settings.apifyApiKey.key || "")}
                                                onFocus={() => setFocusedField("apifyApiKey")}
                                                onBlur={() => setFocusedField(null)}
                                                onChange={(e) => setSettings({ ...settings, apifyApiKey: { ...settings.apifyApiKey, key: e.target.value } })}
                                            />
                                            <div className="relative w-32">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                    <Euro className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="pl-9"
                                                    value={settings.apifyApiKey.tarif}
                                                    onChange={(e) => setSettings({ ...settings, apifyApiKey: { ...settings.apifyApiKey, tarif: Number(e.target.value) } })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <Label htmlFor="brevo-api-key">Clé API BREVO</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="brevo-api-key"
                                                type="text"
                                                autoComplete="off"
                                                value={focusedField === "BREVO_API_KEY" ? settings.BREVO_API_KEY : maskApiKey(settings.BREVO_API_KEY || "")}
                                                onFocus={() => setFocusedField("BREVO_API_KEY")}
                                                onBlur={() => setFocusedField(null)}
                                                onChange={(e) => setSettings({ ...settings, BREVO_API_KEY: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <Label htmlFor="email-sender">Expéditeur par défaut (Sender Identity)</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="email-sender"
                                                type="text"
                                                placeholder="contact@facadeo.fr"
                                                value={settings.emailSender}
                                                onChange={(e) => setSettings({ ...settings, emailSender: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <Label htmlFor="stripe-pub-key">Clé Publique Stripe</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="stripe-pub-key"
                                                type="text"
                                                autoComplete="off"
                                                value={focusedField === "STRIPE_PUBLISHABLE_KEY" ? settings.STRIPE_PUBLISHABLE_KEY : maskApiKey(settings.STRIPE_PUBLISHABLE_KEY || "")}
                                                onFocus={() => setFocusedField("STRIPE_PUBLISHABLE_KEY")}
                                                onBlur={() => setFocusedField(null)}
                                                onChange={(e) => setSettings({ ...settings, STRIPE_PUBLISHABLE_KEY: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="stripe-secret-key">Clé Secrète Stripe</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="stripe-secret-key"
                                                type="text"
                                                autoComplete="off"
                                                value={focusedField === "STRIPE_SECRET_KEY" ? settings.STRIPE_SECRET_KEY : maskApiKey(settings.STRIPE_SECRET_KEY || "")}
                                                onFocus={() => setFocusedField("STRIPE_SECRET_KEY")}
                                                onBlur={() => setFocusedField(null)}
                                                onChange={(e) => setSettings({ ...settings, STRIPE_SECRET_KEY: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end">
                                    <Button onClick={handleUpdateApiSettings} disabled={isLoading}>
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">Enregistrement...</span>
                                        ) : (
                                            <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Enregistrer les APIs</span>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>

                        </TabsContent>

                        {/* Onglet Notifications & Identités Mail */}
                        <TabsContent value="notifications" className="space-y-6">
                            {/* Identités d'expédition */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-accent/10 rounded-lg">
                                            <Mail className="h-5 w-5 text-accent" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Identités d'expédition</CardTitle>
                                            <CardDescription>Configurez les noms et adresses emails utilisés pour les envois automatiques</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        {/* Email Général */}
                                        <div className="space-y-4 p-5 rounded-2xl bg-muted/20 border border-border/40">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                <h3 className="text-sm font-black uppercase tracking-wider opacity-70">Email Général</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-muted-foreground">NOM D'AFFICHAGE</Label>
                                                    <Input
                                                        placeholder="Ex: FAÇADEO"
                                                        value={settings.emailGeneral.name}
                                                        onChange={(e) => setSettings({ ...settings, emailGeneral: { ...settings.emailGeneral, name: e.target.value } })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-muted-foreground">ADRESSE EMAIL D'ENVOI</Label>
                                                    <Input
                                                        placeholder="contact@facadeo.fr"
                                                        value={settings.emailGeneral.email}
                                                        onChange={(e) => setSettings({ ...settings, emailGeneral: { ...settings.emailGeneral, email: e.target.value } })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Support Email */}
                                        <div className="space-y-4 p-5 rounded-2xl bg-muted/20 border border-border/40">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                                <h3 className="text-sm font-black uppercase tracking-wider opacity-70">Email Support Technique</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-muted-foreground">NOM D'AFFICHAGE</Label>
                                                    <Input
                                                        placeholder="Ex: Support FAÇADEO"
                                                        value={settings.emailSupport.name}
                                                        onChange={(e) => setSettings({ ...settings, emailSupport: { ...settings.emailSupport, name: e.target.value } })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-muted-foreground">ADRESSE EMAIL D'ENVOI</Label>
                                                    <Input
                                                        placeholder="support@facadeo.fr"
                                                        value={settings.emailSupport.email}
                                                        onChange={(e) => setSettings({ ...settings, emailSupport: { ...settings.emailSupport, email: e.target.value } })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Offers Email */}
                                        <div className="space-y-4 p-5 rounded-2xl bg-muted/20 border border-border/40">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="h-2 w-2 rounded-full bg-orange-500" />
                                                <h3 className="text-sm font-black uppercase tracking-wider opacity-70">Email Offres & Marketing</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-muted-foreground">NOM D'AFFICHAGE</Label>
                                                    <Input
                                                        placeholder="Ex: FAÇADEO Offres"
                                                        value={settings.emailOffers.name}
                                                        onChange={(e) => setSettings({ ...settings, emailOffers: { ...settings.emailOffers, name: e.target.value } })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-muted-foreground">ADRESSE EMAIL D'ENVOI</Label>
                                                    <Input
                                                        placeholder="offres@facadeo.fr"
                                                        value={settings.emailOffers.email}
                                                        onChange={(e) => setSettings({ ...settings, emailOffers: { ...settings.emailOffers, email: e.target.value } })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* No-Reply Email */}
                                        <div className="space-y-4 p-5 rounded-2xl bg-muted/20 border border-border/40">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="h-2 w-2 rounded-full bg-slate-500" />
                                                <h3 className="text-sm font-black uppercase tracking-wider opacity-70">Email Automatique (No-Reply)</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-muted-foreground">NOM D'AFFICHAGE</Label>
                                                    <Input
                                                        placeholder="Ex: FAÇADEO Notifications"
                                                        value={settings.emailNoReply.name}
                                                        onChange={(e) => setSettings({ ...settings, emailNoReply: { ...settings.emailNoReply, name: e.target.value } })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-muted-foreground">ADRESSE EMAIL D'ENVOI</Label>
                                                    <Input
                                                        placeholder="no-reply@facadeo.fr"
                                                        value={settings.emailNoReply.email}
                                                        onChange={(e) => setSettings({ ...settings, emailNoReply: { ...settings.emailNoReply, email: e.target.value } })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Alertes de Surveillance */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-500/10 rounded-lg">
                                            <Shield className="h-5 w-5 text-red-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Alertes de Surveillance</CardTitle>
                                            <CardDescription>Surveillance de l'activité critique de la plateforme pour les administrateurs</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="admin-email">Email de réception des alertes</Label>
                                        <Input
                                            id="admin-email"
                                            className="max-w-md"
                                            placeholder="admin@facadeo.fr"
                                            value={settings.alertEmail}
                                            onChange={(e) => setSettings({ ...settings, alertEmail: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                                            <Label htmlFor="notify-scan" className="font-medium">Nouveau scan réalisé</Label>
                                            <Switch
                                                id="notify-scan"
                                                checked={settings.notifyOnScan}
                                                onCheckedChange={(c) => setSettings({ ...settings, notifyOnScan: c })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                                            <Label htmlFor="notify-devis" className="font-medium">Nouveau devis généré</Label>
                                            <Switch
                                                id="notify-devis"
                                                checked={settings.notifyOnDevis}
                                                onCheckedChange={(c) => setSettings({ ...settings, notifyOnDevis: c })}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end p-6 border-t border-border/50">
                                    <Button onClick={handleUpdateNotificationSettings} disabled={isLoading} size="lg" className="rounded-xl px-8 shadow-xl shadow-primary/20">
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">Enregistrement...</span>
                                        ) : (
                                            <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Enregistrer les Paramètres</span>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    </Tabs>
                )
                }
            </div>
        </div>
    )
}