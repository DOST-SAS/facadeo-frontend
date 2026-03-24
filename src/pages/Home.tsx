import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    ArrowRight,
    Building2,
    ScanLine,
    Brain,
    ShieldCheck,
    Zap,
    ScanBarcode,
    FileText,
    CreditCard,
    MapPin,
    Smartphone,
    CheckCircle2,
    Users,
    TrendingUp,
    Clock,
    ChevronRight,
    Play,
    Star,
    ArrowBigUp,
    ArrowUp,
    Loader2,
    Coins,
    Check
} from "lucide-react"
import { Link } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import AOS from 'aos'
import 'aos/dist/aos.css'
import { ModeToggle } from "@/components/mode-toggle"
import { useTheme } from "@/components/theme-provider"
import Threads from "@/components/reactbits/RippleGrid"

import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
import type { Plan } from "@/types/PlansTypes"
import { PublicPlansServiceInstance } from "@/services/publicPlansService"

const Home = () => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: false,
            offset: 100
        })
    }, [])

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-50 selection:bg-primary/20 dark:selection:bg-primary/30 selection:text-primary overflow-x-hidden font-sans transition-colors duration-300">
            <BackgroundEffects />
            <Navbar />

            <main className="relative flex-1 z-10 w-full">
                <div className="fixed bottom-4 right-4 z-50 cursor-pointer bg-white dark:bg-white/10 backdrop-blur-sm rounded-full p-3 hover:bg-slate-50 dark:hover:bg-white/20 transition-colors shadow-lg border border-slate-200 dark:border-white/10" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <ArrowUp className="w-5 h-5 text-primary dark:text-white" />
                </div>
                <HeroSection />
                <FeaturesBento />
                <HowItWorks />
                <BrandTicker />
                <PricingSection />
                <CTASection />
            </main>

            <Footer />
        </div>
    )
}

const BackgroundEffects = () => (
    <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-white dark:bg-[radial-gradient(circle_at_50%_0%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-100/30 dark:bg-primary/20 blur-[120px] rounded-full opacity-40 dark:opacity-20 animate-blob" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-100/20 dark:bg-accent/10 blur-[100px] rounded-full opacity-30 dark:opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] dark:opacity-100 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
    </div>
)

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false)
    const { theme } = useTheme()
    const { user } = useAuth()

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <header className={`fixed top-0 w-full z-50 transition-all duration-300 h-20 ${scrolled ? 'bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 py-4 shadow-sm' : 'bg-transparent py-6'}`}>
            <div className="container px-4 md:px-6 mx-auto flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group">
                    {theme === "dark" ? <img src={"/whiteLogo.png"} alt="" className="w-10 h-10 rounded-full" /> : <img src={"/whiteLogo.png"} alt="" className="w-10 h-10 rounded-full" />}
                    <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">FAÇADEO</span>
                </Link>
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Fonctionnalités</a>
                    <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white transition-colors">Comment ça marche</a>
                    <a href="#pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">Tarifs</a>
                </nav>
                <div className="flex items-center gap-4">
                    <ModeToggle />
                    {user ? (
                        <Link to={user.role === 'admin' ? "/admin" : "/artisan"}>
                            <Button size="sm" className="rounded-full px-5 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg transition-all hover:scale-105">
                                Mon Espace
                            </Button>
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="hidden md:block text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"> Connexion </Link>
                            <Link to="/register">
                                <Button size="sm" className="rounded-full px-5 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg transition-all hover:scale-105">
                                    Démarrer gratuitement
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}

const HeroSection = () => {
    const { theme } = useTheme()

    return (
        <section className="relative h-screen pt-20 pb-10 md:pt-32 md:pb-32 overflow-hidden bg-transparent">
            {/* Dynamic Background Grid */}
            <div className="absolute inset-x-0 top-0 bottom-0 z-0 pointer-events-none overflow-hidden h-full w-full">
                <Threads
                    amplitude={1}
                    distance={0.5}
                    enableMouseInteraction={false}

                />
            </div>

            <div className="w-full h-fit uppercase  absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2  px-4 md:px-6 mx-auto flex flex-col items-center text-center z-10">
                <h1
                    className="text-5xl md:text-7xl font-bold tracking-tight mb-4 max-w-5xl text-slate-900 dark:text-white"
                    data-aos="fade-up"
                    data-aos-delay="100"
                    data-aos-offset="-200"
                >
                    Trouvez vos prochains <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-accent">chantiers en 5 minutes</span>
                </h1>

                <p
                    className="text-sm md:text-md text-slate-600 dark:text-slate-400 max-w-2xl mb-10 leading-relaxed"
                    data-aos="fade-up"
                    data-aos-delay="200"
                    data-aos-offset="-200"
                >
                    L'IA détecte pour vous les façades à rénover dans votre zone, génère les devis avec simulation avant/après et vous aide à signer 3x plus de contrats.
                </p>

                <div
                    className="flex flex-col sm:flex-row items-center gap-4"
                    data-aos="fade-up"
                    data-aos-delay="300"
                    data-aos-offset="-200"
                >
                    <Link to="/register">
                        <Button size="lg" className="h-12 px-8 rounded-full text-base bg-primary hover:bg-primary/90 shadow-[0_0_30px_-10px_var(--color-primary)] transition-all hover:scale-105">
                            Commencer gratuitement
                        </Button>
                    </Link>
                    <Link to="/demo">
                        <Button variant="outline" size="lg" className="h-12 px-8 rounded-full text-base border-slate-500 dark:border-white/10 bg-white hover:bg-white/10 backdrop-blur-sm text-slate-600 dark:text-slate-300 dark:hover:text-white transition-all">
                            <Play className="w-4 h-4 mr-2" />
                            Voir Démo
                        </Button>
                    </Link>
                </div>

            </div>
        </section>
    )
}

const BrandTicker = () => (
    <div className="w-full py-10 border-y border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-4" data-aos="fade-up">
            <p className="text-center text-sm text-slate-500 mb-8 font-medium tracking-wide">PROPULSÉ PAR DES TECHNOLOGIES DE POINTE</p>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="flex items-center gap-2"><MapPin className="w-6 h-6" /><span className="font-bold text-lg">Google Maps</span></div>
                <div className="flex items-center gap-2"><ShieldCheck className="w-6 h-6" /><span className="font-bold text-lg">Street View</span></div>
                <div className="flex items-center gap-2"><Zap className="w-6 h-6" /><span className="font-bold text-lg">Gemini AI</span></div>
                <div className="flex items-center gap-2"><CreditCard className="w-6 h-6" /><span className="font-bold text-lg">Stripe</span></div>
            </div>
        </div>
    </div>
)

const FeaturesBento = () => {
    const { theme } = useTheme()
    return (
        <section className="py-32 relative overflow-hidden" id="features">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="text-center mb-24" data-aos="fade-up">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Arrêtez de chercher des clients.
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Laissez-les venir à vous.</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-md">
                        FAÇADEO scanne votre secteur, identifie les façades qui ont besoin de rénovation et crée automatiquement des devis personnalisés avec simulations.
                    </p>
                </div>

                {/* 3 Columns Benefits */}
                <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 mb-32" data-aos="fade-up">
                    {[
                        {
                            title: "Prospection Automatique",
                            description: ["Scannez jusqu'à 5 km de rayon", "L'IA détecte les façades dégradées", "Score de priorité 0-100"],
                            icon: MapPin,
                            color: "primary"
                        },
                        {
                            title: "Devis en 30 secondes",
                            description: ["Photos avant/après par IA", "Calcul automatique des surfaces", "Personnalisation de vos tarifs"],
                            icon: FileText,
                            color: "accent"
                        },
                        {
                            title: "Envoi Automatique",
                            description: ["Emails professionnels + PDF", "CRM intégré", "Relances automatisées"],
                            icon: Zap,
                            color: "green-500"
                        }
                    ].map((benefit, i) => (
                        <Card key={i} className="group relative bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 backdrop-blur-md hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] overflow-hidden">
                            <div className={cn(
                                "absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity",
                                benefit.color === 'primary' ? "bg-primary" :
                                    benefit.color === 'accent' ? "bg-accent" :
                                        "bg-green-500"
                            )} />

                            <CardHeader className="pb-4">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center border mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                                    benefit.color === 'primary' ? "bg-primary/10 border-primary/20 text-primary group-hover:bg-primary group-hover:text-white" :
                                        benefit.color === 'accent' ? "bg-accent/10 border-accent/20 text-accent group-hover:bg-accent group-hover:text-white" :
                                            "bg-green-500/10 border-green-500/20 text-green-500 group-hover:bg-green-500 group-hover:text-white"
                                )}>
                                    <benefit.icon className="w-7 h-7" />
                                </div>
                                <CardTitle className="text-2xl font-bold tracking-tight">{benefit.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {benefit.description.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className={cn(
                                            "mt-1 p-0.5 rounded-full",
                                            benefit.color === 'primary' ? "text-primary bg-primary/10" :
                                                benefit.color === 'accent' ? "text-accent bg-accent/10" :
                                                    "text-green-500 bg-green-500/10"
                                        )}>
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
                                            {item}
                                        </p>
                                    </div>
                                ))}
                            </CardContent>
                            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                        </Card>
                    ))}
                </div>

                <div className="space-y-40">
                    {/* Feature 1: AI Analysis */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-16 items-center" id="features">
                        <div className="lg:col-span-3 order-2 md:order-1">
                            <div className="grid grid-cols-12 gap-2" data-aos="fade-right">
                                {/* Large Card - Dashboard with Map */}
                                <div className="col-span-12 relative group">
                                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-blue-500/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0f172a]">
                                        {/* Browser Header */}
                                        <div className="h-8 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 flex items-center px-4 gap-2">
                                            <div className="flex gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50" />
                                            </div>
                                            <div className="mx-auto w-32 h-3 rounded-full bg-slate-200 dark:bg-white/10" />
                                        </div>
                                        <div className="h-[300px]">
                                            <img
                                                src={theme === 'light' ? "/assets/result-light.jpeg" : "/assets/result-dark.jpeg"}
                                                alt="Dashboard"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Medium Card - Score Facade */}
                                <div className="col-span-6 relative group ">
                                    <div className="absolute -inset-4 bg-gradient-to-r from-accent/30 to-orange-500/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                                    <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0f172a]">
                                        <div className="h-[200px]">
                                            <img
                                                src={theme === 'light' ? "/assets/facade-light.jpeg" : "/assets/facade-dark.jpeg"}
                                                alt="Facade Score"
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Medium Card - Analytics Dashboard */}
                                <div className="col-span-6 relative group ">
                                    <div className="absolute -inset-4 bg-gradient-to-r from-green-500/30 to-emerald-500/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                                    <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0f172a]">
                                        <div className="h-[200px]">
                                            <img
                                                src={theme === 'light' ? "/assets/dash-light.png" : "/assets/dash-dark.png"}
                                                alt="Analytics"
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-8 order-1 md:order-2" data-aos="fade-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                                <Brain className="w-3.5 h-3.5" />
                                Intelligence Artificielle
                            </div>
                            <h3 className="text-4xl font-bold leading-tight">Une IA qui travaille comme votre œil d'expert</h3>
                            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                                Notre IA analyse instantanément l'état des façades et détecte les opportunités de rénovation dans votre secteur.
                            </p>
                            <ul className="space-y-4">
                                {['Détection en quelques minutes', 'Scoring intelligent 0-100', 'Analyse Street-View HD'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                                        <div className="p-1 rounded-full bg-primary/10 text-primary">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Feature 2: Smart Estimation */}
                    <div className="grid md:grid-cols-2 gap-20 items-center">
                        <div className="space-y-8" data-aos="fade-right">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider">
                                <FileText className="w-3.5 h-3.5" />
                                Devis Automatisés
                            </div>
                            <h3 className="text-4xl font-bold leading-tight">Des devis qui vendent vos services</h3>
                            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                                Finies les heures passées sur Excel. Générez des devis professionnels avec simulations visuelles en quelques clics.
                            </p>
                            <ul className="space-y-4">
                                {['Calcul automatique des surfaces', 'Photos de simulation avant/après', 'Intégration de vos propres tarifs'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                                        <div className="p-1 rounded-full bg-accent/10 text-accent">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="relative group" data-aos="fade-left">
                            <div className="absolute -inset-6 bg-gradient-to-tr from-accent/20 via-orange-500/10 to-transparent rounded-[3rem] blur-3xl opacity-50 group-hover:opacity-80 transition-all duration-700" />
                            <div className="relative h-[500px] w-fit mx-auto rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl bg-white dark:bg-white/5 p-2">
                                    <img
                                        src="/assets/devispdf.jpg"
                                        alt="Devis PDF"
                                        className="w-full h-full rounded-2xl object-contain group-hover:scale-101 transition-transform duration-700"
                                    />
                                
                            </div>
                        </div>
                    </div>

                    {/* Feature 3: Professional Reports */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-16 items-center">
                        <div className="lg:col-span-3 order-2 md:order-1 relative group" data-aos="fade-up">
                            <div className="absolute -inset-8 bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-transparent rounded-[4rem] blur-3xl opacity-50" />
                            <div className="relative h-[450px] w-full bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-2 overflow-hidden">
                                {/* Simulated Dashboard UI */}
                              <img src={`${theme === 'dark' ? '/assets/crm.jpeg' : '/assets/crm-light.jpeg'}`} className="w-full h-full rounded-2xl object-contain group-hover:scale-101 transition-transform duration-700" alt="" />
                                {/* Animated Particles or something similar could go here */}
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-8 order-1 md:order-2" data-aos="fade-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold uppercase tracking-wider">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Performance & CRM
                            </div>
                            <h3 className="text-4xl font-bold leading-tight">Suivez vos performances comme un chef d'entreprise</h3>
                            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                                Un tableau de bord complet pour piloter votre activité, suivre vos devis signés et optimiser votre taux de conversion.
                            </p>
                            <ul className="space-y-4">
                                {['Tableaux de bord en temps réel', 'Suivi du CA potentiel', 'Gestion simplifiée des clients'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                                        <div className="p-1 rounded-full bg-green-500/10 text-green-500">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

const HowItWorks = () => {
    const steps = [
        { num: '1', title: 'DÉFINISSEZ VOTRE ZONE', desc: 'Entrez une adresse et définissez un rayon de recherche', icon: MapPin },
        { num: '2', title: "L'IA SCANNE PENDANT QUELQUES MINUTES", desc: 'Détection automatique des façades via Street View', icon: ScanBarcode },
        { num: '3', title: 'FILTREZ LES MEILLEURES OPPORTUNITÉS', desc: 'Visualisez les façades avec leur score de priorité', icon: Building2 },
        { num: '4', title: 'GÉNÉREZ LES DEVIS + SIMULATIONS', desc: 'Créez des devis avec visuels avant/après automatiquement', icon: FileText },
        { num: '5', title: 'ENVOYEZ ET SUIVEZ', desc: 'Envoi automatique par email et suivi des conversions', icon: Zap },
    ]

    return (
        <section className="py-24 bg-white/[0.02] border-y border-white/5" id="how-it-works">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="text-center mb-16" data-aos="fade-up">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Comment ça marche ?</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">Du scan au devis en moins de 5 minutes.</p>
                </div>

                <div className="grid md:grid-cols-5 gap-5 relative">
                    <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -z-10" />

                    {steps.map((step, i) => (
                        <div key={i} className="relative flex flex-col items-center text-center group" data-aos="fade-up" data-aos-delay={i * 100}>
                            <div className="w-24 h-24 rounded-2xl  bg-card border border-white/10 flex items-center justify-center mb-6 shadow-xl relative z-10 group-hover:border-primary/50 group-hover:scale-110 transition-all duration-300">
                                <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <step.icon className="w-10 h-10 text-slate-600 group-hover:text-primary transition-colors" />
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-card border border-card">
                                    {step.num}
                                </div>
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-slate-600">{step.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}


const PricingSection = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                setLoading(true);
                const data = await PublicPlansServiceInstance.getPublicPlans();
                if (data) {
                    const sortedPlans = [...(data as Plan[])].sort((a, b) => {
                        const typeA = a.type?.toLowerCase();
                        const typeB = b.type?.toLowerCase();
                        if (typeA === 'free') return -1;
                        if (typeB === 'free') return 1;
                        return 0;
                    });
                    setPlans(sortedPlans);
                }
            } catch (error) {
                console.error("Error fetching plans:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    return (
        <section className="py-24 relative overflow-hidden" id="pricing">
            {/* Subtle Background */}
            <div className="absolute inset-0 bg-white dark:bg-[#020617]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-primary/20 blur-[150px] opacity-30 rounded-full pointer-events-none" />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="text-center mb-20" data-aos="fade-up">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-slate-900 dark:text-white">
                        Tarification <span className="text-primary dark:text-white">Simple</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg">
                        Une tarification adaptée à votre croissance. Changez de plan à tout moment.
                    </p>
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-[500px] rounded-3xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {plans.filter(plan => plan.type?.toLowerCase() !== 'free').map((plan, index) => {
                            const isFree = plan.type?.toLowerCase() === 'free';
                            const isProfessional = plan.type?.toLowerCase() === 'professional';

                            return (
                                <Card
                                    key={plan.id}
                                    className={cn(
                                        "relative p-2! overflow-visible transition-all hover:shadow-md border",
                                        isFree
                                            ? "border-muted bg-muted/5 shadow-sm"
                                            : "border-primary/50 shadow-lg scale-105 z-10"
                                    )}
                                    data-aos="fade-up"
                                    data-aos-delay={index * 100}
                                >
                                    {isProfessional && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full uppercase tracking-wider">
                                            Recommandé
                                        </div>
                                    )}

                                    <CardContent className="p-2 flex flex-col h-full">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-lg border bg-background",
                                                    isFree ? "text-muted-foreground" : "text-primary"
                                                )}>
                                                    <Coins className="h-4 w-4" />
                                                </div>
                                                <div className={cn(
                                                    "font-bold text-base leading-tight uppercase",
                                                    isFree ? "text-foreground/60" : "text-foreground"
                                                )}>
                                                    {plan.type}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-bold text-foreground">
                                                    {(plan.price_cents / 100).toFixed(0)}€
                                                </span>
                                                <span className="text-muted-foreground text-sm font-medium">
                                                    /{plan.type === 'free' ? '7 jours' : 'mois'}
                                                </span>
                                            </div>
                                        </div>

                                        <ul className="space-y-2 mb-6 flex-1">
                                            <li className={cn(
                                                "flex items-center gap-2 text-sm p-2 rounded-lg mb-3 border",
                                                isFree
                                                    ? "bg-muted/50 border-border/50 text-muted-foreground"
                                                    : "bg-primary/5 border-primary/20 text-foreground"
                                            )}>
                                                <div className={cn(
                                                    "p-1 rounded-md shrink-0",
                                                    isFree ? "bg-muted" : "bg-primary/10"
                                                )}>
                                                    <Coins className={cn(
                                                        "h-3.5 w-3.5",
                                                        isFree ? "text-muted-foreground" : "text-primary"
                                                    )} />
                                                </div>
                                                <span className="flex-1 font-medium">Crédits</span>
                                                <span className={cn(
                                                    "font-bold px-2 py-0.5 rounded-md text-xs",
                                                    isFree
                                                        ? "bg-muted text-muted-foreground"
                                                        : "bg-primary text-primary-foreground"
                                                )}>
                                                    +{plan.monthly_credit}
                                                </span>
                                            </li>
                                            {plan.features?.map((feature, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-sm text-foreground/70">
                                                    <Check className={cn(
                                                        "h-3.5 w-3.5 shrink-0",
                                                        isFree ? "text-muted-foreground" : "text-primary"
                                                    )} />
                                                    <span className="flex-1">{feature.label}</span>
                                                    <span className="font-semibold">{feature.value}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <Link to="/register" className="w-full">
                                            <Button
                                                className={cn(
                                                    "w-full h-10 font-bold rounded-xl transition-all",
                                                    isFree
                                                        ? "bg-secondary text-secondary-foreground/60 hover:bg-secondary/80"
                                                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                                                )}
                                            >
                                                Choisir ce plan
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

const CTASection = () => (
    <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10" />

        <div className="container px-4 md:px-6 mx-auto relative z-10 text-center" data-aos="zoom-in">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Prêt à arrêter de perdre du temps en prospection ?</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">Rejoignez les façadiers qui signent plus de chantiers en perdant moins de temps.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/register">
                    <Button size="lg" variant="default" className="h-14 px-10 text-lg rounded-full ">Essayer gratuitement (7 jours)</Button>
                </Link>
                <Link to="/demo">
                    <Button variant="outline" size="lg" className="h-14 px-10 text-lg rounded-full border-white/10 bg-black/20 text-white hover:bg-white/10">
                        <Play className="w-5 h-5 mr-2" />
                        Voir une démo vidéo
                    </Button>
                </Link>
            </div>
        </div>
    </section>
)

const Footer = () => (
    <footer className="border-t border-white/5 bg-[#020617] py-12 text-sm z-50">
        <div className="container px-4 md:px-6 mx-auto grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <img src="/whiteLogo.png" alt="" />
                    </div>
                    <span className="font-bold text-lg text-white">FAÇADEO</span>
                </div>
                <p className="text-slate-500">L'intelligence artificielle au service du bâtiment.</p>
            </div>

            <div>
                <h4 className="font-bold mb-4 text-white">Produit</h4>
                <ul className="space-y-2 text-slate-500">
                    <li><Link to="#features" className="hover:text-primary">Fonctionnalités</Link></li>
                    <li><Link to="#pricing" className="hover:text-primary">Tarifs</Link></li>
                    <li><Link to="/enterprise" className="hover:text-primary">Enterprise</Link></li>
                </ul>
            </div>

            <div className="hidden">
                <h4 className="font-bold mb-4 text-white">Ressources</h4>
                <ul className="space-y-2 text-slate-500">
                    <li><Link to="#" className="hover:text-primary">Documentation</Link></li>
                    <li><Link to="#" className="hover:text-primary">Blog</Link></li>
                    <li><Link to="#" className="hover:text-primary">Support</Link></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold mb-4 text-white">Légal</h4>
                <ul className="space-y-2 text-slate-500">
                    <li><Link to="/legal-notice" className="hover:text-primary">Mentions légales</Link></li>
                    <li><Link to="/privacy" className="hover:text-primary">Confidentialité</Link></li>
                    <li><Link to="/terms" className="hover:text-primary">CGU</Link></li>
                </ul>
            </div>
            <div>
                <div className="flex gap-4">
                    <a href="https://www.linkedin.com/company/facadeo" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-primary text-slate-400 hover:scale-110 transition">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M19 3A2 2 0 0 1 21 5v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14Zm-9.5 7.25H7V17h2.5v-6.75ZM8.25 6.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm7.25 3.5c-1.1 0-1.75.6-2.06 1.13V10.25H11V17h2.5v-3.25c0-.87.63-1.5 1.5-1.5s1.5.63 1.5 1.5V17H19v-3.5c0-2.07-1.43-3.25-3.25-3.25Z"/></svg>
                    </a>
                    <a href="https://www.facebook.com/facadeo" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-primary text-slate-400 hover:scale-110 transition">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M22 12a10 10 0 1 0-11.5 9.95v-7.05H8v-2.9h2.5V9.5c0-2.47 1.48-3.84 3.74-3.84 1.08 0 2.22.19 2.22.19v2.44h-1.25c-1.23 0-1.61.77-1.61 1.56v1.87h2.74l-.44 2.9h-2.3v7.05A10 10 0 0 0 22 12Z"/></svg>
                    </a>
                    <a href="https://www.instagram.com/facadeo" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-primary text-slate-400 hover:scale-110 transition">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17" cy="7" r="1.5" fill="currentColor"/></svg>
                    </a>
                </div>
            </div>
        </div>
        <div className="container px-4 md:px-6 mx-auto mt-12 pt-8 border-t border-white/5 text-center text-slate-600">
            © 2026 FAÇADEO Inc. Tous droits réservés.
        </div>
    </footer>
)

export default Home