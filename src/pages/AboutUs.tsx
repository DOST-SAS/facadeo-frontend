import { useEffect } from "react"
import { Link } from "react-router-dom"
import { ModeToggle } from "@/components/mode-toggle"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { MapPin, Users, Star, TrendingUp } from "lucide-react"

const AboutUs = () => {
	useEffect(() => {
		// Optionally add AOS or other animation init here
	}, [])

	return (
		<div className="flex flex-col min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-50 selection:bg-primary/20 dark:selection:bg-primary/30 selection:text-primary overflow-x-hidden font-sans transition-colors duration-300">
			<BackgroundEffects />
			<Navbar />

			<main className="relative flex-1 z-10 w-full">
				<AboutHero />
				<MissionSection />
				<TeamSection />
				<TechSection />
				<ContactSection />
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
	const { theme } = useTheme()
	return (
		<header className="fixed top-0 w-full z-50 transition-all duration-300 h-20 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 py-4 shadow-sm">
			<div className="container px-4 md:px-6 mx-auto flex items-center justify-between">
				<Link to="/" className="flex items-center gap-2 group">
					<img src={"/whiteLogo.png"} alt="" className="w-10 h-10 rounded-full" />
					<span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">FAÇADEO</span>
				</Link>
				<nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
						<a href="/#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Fonctionnalités</a>
						<a href="/#how-it-works" className="hover:text-slate-900 dark:hover:text-white transition-colors">Comment ça marche</a>
						<a href="/#pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">Tarifs</a>
				</nav>
				<div className="flex items-center gap-4">
					<ModeToggle />
					<Link to="/register">
						<Button size="sm" className="rounded-full px-5 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg transition-all hover:scale-105">
							Démarrer gratuitement
						</Button>
					</Link>
				</div>
			</div>
		</header>
	)
}

const AboutHero = () => (
	<section className="relative h-[60vh] pt-32 pb-10 flex flex-col items-center justify-center text-center">
		<h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 max-w-4xl text-slate-900 dark:text-white">
			À propos de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-accent">FAÇADEO</span>
		</h1>
		<p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-6 leading-relaxed">
			Notre mission : révolutionner la prospection et la gestion des chantiers grâce à l’intelligence artificielle.
		</p>
	</section>
)

const MissionSection = () => {
	const { theme } = useTheme()
		return (
			<section className="py-24 bg-white/[0.02] border-y border-white/5">
				<div className="container px-4 md:px-6 mx-auto grid md:grid-cols-2 gap-12 items-center">
					<div>
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
							<Star className="w-4 h-4" />
							Notre mission
						</div>
						<h2 className="text-3xl md:text-5xl font-bold mb-6">
							Simplifier la vie des façadiers et artisans du bâtiment
						</h2>
						<p className="text-slate-500 dark:text-slate-400 text-lg mb-4">
						FAÇADEO est né d’un constat simple : la prospection et la gestion des devis prennent trop de temps et d’énergie aux professionnels du bâtiment. Notre équipe a donc conçu une plateforme qui automatise la détection des chantiers, la création de devis et le suivi client, pour que vous puissiez vous concentrer sur votre savoir-faire.
					</p>
					<ul className="space-y-3 text-slate-700 dark:text-slate-300 font-medium">
						<li className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Booster votre chiffre d’affaires</li>
						<li className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Trouver des chantiers près de chez vous</li>
						<li className="flex items-center gap-2"><Star className="w-5 h-5 text-primary" /> Gagner du temps au quotidien</li>
					</ul>
				</div>
				<div className="flex justify-center">
					<img src={theme === 'light' ? "/assets/result-light.jpeg" : "/assets/result-dark.jpeg"} alt="Mission FAÇADEO" className="rounded-2xl shadow-xl w-full max-w-md object-cover" />
				</div>
			</div>
		</section>
	)
}

const TeamSection = () => (
	<section className="py-24">
		<div className="container px-4 md:px-6 mx-auto text-center">
			<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-4">
				<Users className="w-4 h-4" />
				Notre équipe
			</div>
			<h2 className="text-3xl md:text-5xl font-bold mb-6">Des experts du bâtiment et de la tech</h2>
			<p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12">
				FAÇADEO rassemble des professionnels du bâtiment, des ingénieurs IA et des passionnés de digital, tous animés par la volonté de moderniser le secteur.
			</p>
			<div className="flex flex-wrap justify-center gap-10 hidden">
				{/* Replace with real team members */}
				<div className="flex flex-col items-center">
					<img src="/assets/team1.jpg" alt="Fondateur" className="w-28 h-28 rounded-full object-cover mb-3 border-4 border-primary/30" />
					<div className="font-bold">Hugo Martin</div>
					<div className="text-slate-500 text-sm">Fondateur & CEO</div>
				</div>
				<div className="flex flex-col items-center">
					<img src="/assets/team2.jpg" alt="CTO" className="w-28 h-28 rounded-full object-cover mb-3 border-4 border-primary/30" />
					<div className="font-bold">Sarah Dupont</div>
					<div className="text-slate-500 text-sm">CTO</div>
				</div>
				<div className="flex flex-col items-center">
					<img src="/assets/team3.jpg" alt="IA Engineer" className="w-28 h-28 rounded-full object-cover mb-3 border-4 border-primary/30" />
					<div className="font-bold">Mehdi Benali</div>
					<div className="text-slate-500 text-sm">Ingénieur IA</div>
				</div>
			</div>
		</div>
	</section>
)

const TechSection = () => (
	<section className="py-24 bg-white/[0.02] border-y border-white/5">
		<div className="container px-4 md:px-6 mx-auto text-center">
			<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold uppercase tracking-wider mb-4">
				<Star className="w-4 h-4" />
				Nos technologies
			</div>
			<h2 className="text-3xl md:text-5xl font-bold mb-6">Des outils de pointe pour des résultats concrets</h2>
			<p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12">
				Nous utilisons l’intelligence artificielle, la vision par ordinateur et les meilleures APIs du marché pour offrir une expérience fluide et performante à nos utilisateurs.
			</p>
			<div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
				<div className="flex items-center gap-2"><MapPin className="w-6 h-6" /><span className="font-bold text-lg">Google Maps</span></div>
				<div className="flex items-center gap-2"><Star className="w-6 h-6" /><span className="font-bold text-lg">Gemini AI</span></div>
				<div className="flex items-center gap-2"><TrendingUp className="w-6 h-6" /><span className="font-bold text-lg">Stripe</span></div>
			</div>
		</div>
	</section>
)

const ContactSection = () => (
	<section className="py-24">
		<div className="container px-4 md:px-6 mx-auto text-center">
			<h2 className="text-3xl md:text-5xl font-bold mb-6">Contactez-nous</h2>
			<p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-8">
				Une question ? Un projet ? Notre équipe vous répond sous 24h.
			</p>
			<Link to="/contact">
				<Button size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg transition-all hover:scale-105">
					Nous écrire
				</Button>
			</Link>
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
					<li><Link to="#" className="hover:text-primary">Fonctionnalités</Link></li>
					<li><Link to="#" className="hover:text-primary">Tarifs</Link></li>
					<li><Link to="#" className="hover:text-primary">Enterprise</Link></li>
				</ul>
			</div>
			<div>
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
		</div>
		<div className="container px-4 md:px-6 mx-auto mt-12 pt-8 border-t border-white/5 text-center text-slate-600">
			© 2026 FAÇADEO Inc. Tous droits réservés.
		</div>
	</footer>
)

export default AboutUs