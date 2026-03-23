import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "features", label: "Features" },
  { id: "about", label: "Benefits" },
  { id: "pricing", label: "Pricing" },
  { id: "footer", label: "Contact" },
];

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    window.scrollTo({ top: el.offsetTop - 72, behavior: "smooth" });
  }
}

const logos = ["AI Insight", "BuildersCloud", "OpenFacade", "25 Support", "Data Smart"];

const featureCards = [
  {
    title: "Visualisez vos chantiers",
    text: "Suivez chaque façade, chaque lot et chaque étape depuis une interface claire et moderne.",
  },
  {
    title: "Centralisez vos documents",
    text: "Rassemblez plans, photos, rapports et échanges au même endroit pour toute votre équipe.",
  },
  {
    title: "Décidez plus vite",
    text: "Pilotez vos projets avec des indicateurs lisibles, des rappels et un reporting instantané.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "0,00 €",
    desc: "Pour découvrir la plateforme",
    features: ["1 projet", "Accès équipe limité", "Stockage de base"],
    featured: false,
  },
  {
    name: "Pro",
    price: "24,90 €",
    desc: "Pour les entreprises qui pilotent plusieurs chantiers",
    features: ["Projets illimités", "Collaboration temps réel", "Suivi avancé", "Support prioritaire"],
    featured: true,
  },
  {
    name: "Team",
    price: "49,00 €",
    desc: "Pour les équipes multi-sites",
    features: ["Utilisateurs avancés", "Reporting global", "Espaces clients", "Exports complets"],
    featured: false,
  },
];

const FloatingMockup: React.FC = () => {
  const [activePill, setActivePill] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePill((prev) => (prev + 1) % 3);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative mx-auto mt-10 w-full max-w-3xl px-6">
      <div className="absolute left-0 top-1/2 hidden h-28 w-14 -translate-y-1/2 rounded-2xl bg-[#f2b26b] md:block" />
      <div className="absolute left-8 top-1/2 hidden h-28 w-14 -translate-y-1/2 rounded-2xl bg-[#83d99a] md:block" />
      <div className="absolute right-8 top-1/2 hidden h-28 w-14 -translate-y-1/2 rounded-2xl bg-[#f2b26b] md:block" />
      <div className="absolute right-0 top-1/2 hidden h-28 w-14 -translate-y-1/2 rounded-2xl bg-[#83d99a] md:block" />

      <div className="relative rounded-[2rem] bg-[#8f79f7] p-5 shadow-[0_30px_80px_rgba(72,49,170,0.28)]">
        <div className="mx-auto max-w-md rounded-2xl bg-white/95 p-4 text-left shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Dashboard
              </p>
              <h3 className="text-base font-semibold text-foreground">
                AI chantier assistant
              </h3>
            </div>
            <div className="h-9 w-9 rounded-full bg-black text-xs text-white flex items-center justify-center">
              AI
            </div>
          </div>

          <div className="grid gap-2">
            {["Suivi façade nord", "Équipe terrain", "Rapport hebdo"].map((pill, i) => (
              <div
                key={pill}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm transition-all",
                  activePill === i
                    ? "border-transparent bg-black text-white"
                    : "border-border bg-background text-foreground/80"
                )}
              >
                {pill}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Header: React.FC = () => {
  const [shrink, setShrink] = useState(false);

  useEffect(() => {
    const onScroll = () => setShrink(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all",
        shrink
          ? "bg-background/85 backdrop-blur-xl border-b border-border"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2"
        >
					<img src="/darkLogo.png" alt="Facadeo" className="h-7 w-7 rounded-full flex items-center justify-center" />
          <span className="text-sm font-semibold tracking-tight">Facadeo</span>
        </button>

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="text-sm text-foreground/70 transition-colors hover:text-foreground"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
            <Link to="/login">Connexion</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="rounded-full bg-black px-5 text-white hover:bg-black/90"
          >
            <Link to="/register">Démarrer</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

const Footer: React.FC = () => (
  <footer
    id="footer"
    className="mt-20 overflow-hidden border-t border-white/10 bg-[#0f1016] text-white"
  >
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10 grid gap-8 md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
						<img src="/whiteLogo.png" alt="Facadeo" className="h-7 w-7 rounded-full flex items-center justify-center" />
            <span className="font-semibold">Facadeo</span>
          </div>
          <p className="text-sm text-white/70">
            Plateforme de gestion moderne pour les professionnels de la façade et du bâtiment.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Produit</h4>
          <div className="space-y-2 text-sm text-white/70">
            <p>Fonctionnalités</p>
            <p>Tarifs</p>
            <p>Cas d’usage</p>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Légal</h4>
          <div className="space-y-2 text-sm text-white/70">
            <p>Confidentialité</p>
            <p>Conditions</p>
            <p>Mentions légales</p>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Rester informé</h4>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Votre email"
              className="h-10 w-full rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/40 outline-none"
            />
            <Button className="rounded-full bg-[#ff7b42] px-5 text-white hover:bg-[#ff7b42]/90">
              Envoyer
            </Button>
          </div>
        </div>
      </div>

			<div className="pointer-events-none select-none px-4 pb-6 text-center text-[20vw] font-semibold leading-none tracking-tight text-white/8">
				Facadeo
			</div>

      <div className="border-t border-white/10 pt-6 text-sm text-white/50">
        © {new Date().getFullYear()} Facadeo. Tous droits réservés.
      </div>
    </div>
  </footer>
);

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f5f2fb] text-foreground">
      <Header />

      <main className="pt-24">
        {/* HERO */}
        <section className="relative overflow-hidden px-4 pb-20 pt-10">
          <div className="mx-auto max-w-5xl text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-foreground/45">
              Gestion intelligente de projets façade
            </p>

            <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Une nouvelle manière de piloter vos chantiers
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base text-foreground/65 sm:text-lg">
              Centralisez vos équipes, vos documents, vos suivis terrain et vos reportings
              dans une plateforme élégante pensée pour les pros du bâtiment.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-black px-7 text-white hover:bg-black/90"
              >
                <Link to="/register">Créer un compte</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                <Link to="/login">Voir la démo</Link>
              </Button>
            </div>
          </div>

          <FloatingMockup />

          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-4 text-center text-xs text-foreground/40 sm:grid-cols-5">
            {logos.map((logo) => (
              <div key={logo} className="rounded-full border border-border/60 bg-white/50 px-4 py-3">
                {logo}
              </div>
            ))}
          </div>
        </section>

        {/* INTRO / DUAL BLOCKS */}
        <section id="about" className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.22em] text-foreground/40">Why Facadeo</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Pour les entreprises indépendantes, les équipes travaux et les groupes du bâtiment
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-foreground/60">
              Une expérience claire, visuelle et rapide pour réduire la friction dans la gestion
              opérationnelle.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.75rem] border border-border bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-foreground/50">
                Plus de contrôle, moins de chaos
              </p>
              <h3 className="mt-2 text-2xl font-semibold">Facadeo organise vos flux terrain</h3>
              <p className="mt-3 text-foreground/60">
                Visualisez vos projets, vos livrables et les actions prioritaires dans une seule
                interface.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="h-20 rounded-2xl bg-neutral-900" />
                <div className="h-20 rounded-2xl bg-[#ece7dc]" />
                <div className="h-20 rounded-2xl bg-[#f1f4f7]" />
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-border bg-[#f8f5ef] p-6 shadow-sm">
              <p className="text-sm font-medium text-foreground/50">Automatisation utile</p>
              <h3 className="mt-2 text-2xl font-semibold">Laissez l’IA assister vos équipes</h3>
              <p className="mt-3 text-foreground/60">
                Résumez des rapports, retrouvez une info chantier et préparez vos échanges plus vite.
              </p>

              <div className="mt-6 rounded-2xl border border-border bg-white p-4">
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-foreground/40">
                  Assistant
                </div>
                <div className="rounded-xl bg-[#f6f2ff] px-4 py-3 text-sm text-foreground/70">
                  “Prépare un résumé de l’avancement hebdomadaire du lot façade avec les points
                  bloquants.”
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.75rem] border border-border bg-white p-6 shadow-sm">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-foreground/40">
                    Module visuel
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold">Pilotage chantier 3.0</h3>
                  <p className="mt-3 text-foreground/60">
                    Supervisez l’avancement avec un espace visuel orienté action, équipes et
                    reporting.
                  </p>
                  <Button className="mt-5 rounded-full bg-black text-white hover:bg-black/90">
                    Découvrir
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="h-24 rounded-2xl bg-[url('/hero1.jpg')] bg-cover bg-center" />
                  <div className="h-24 rounded-2xl bg-[url('/hero2.jpg')] bg-cover bg-center" />
                  <div className="h-24 rounded-2xl bg-[url('/hero3.jpg')] bg-cover bg-center" />
                  <div className="h-24 rounded-2xl bg-[url('/project_sample.jpg')] bg-cover bg-center" />
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-border bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-foreground/40">Projet phare</p>
              <h3 className="mt-3 text-2xl font-semibold">Tour Lumière</h3>
              <p className="mt-3 text-foreground/60">
                Une rénovation complexe, coordonnée avec Facadeo grâce à des tableaux visuels,
                des rapports consolidés et un partage fluide.
              </p>
              <div className="mt-6 h-40 rounded-2xl bg-[url('/project_sample.jpg')] bg-cover bg-center" />
            </div>
          </div>
        </section>

        {/* DARK FEATURE CARDS */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Facadeo simplifie le travail quotidien
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-foreground/60">
              Des modules pensés pour fluidifier la collaboration, la documentation et la prise de décision.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {featureCards.map((card, index) => (
              <div
                key={card.title}
                className={cn(
                  "rounded-[1.5rem] p-6 shadow-sm",
                  index === 0
                    ? "bg-[#171922] text-white"
                    : index === 1
                    ? "bg-[#1d2230] text-white"
                    : "bg-[#232838] text-white"
                )}
              >
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  0{index + 1}
                </p>
                <h3 className="mt-4 text-xl font-semibold">{card.title}</h3>
                <p className="mt-3 text-sm text-white/70">{card.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* BIG IMAGE BANNER */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="overflow-hidden rounded-[2rem] border border-border shadow-sm">
            <div
              className="relative h-[300px] w-full bg-cover bg-center sm:h-[380px]"
              style={{ backgroundImage: "url('/hero2.jpg')" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />
              <div className="relative z-10 flex h-full items-end p-8 sm:p-10">
                <div className="max-w-2xl text-white">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/70">AI Workspace</p>
                  <h2 className="mt-3 text-3xl font-semibold sm:text-5xl">
                    Réponses rapides, meilleure visibilité, gestion plus fluide
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Transformez l’efficacité de vos opérations
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-border bg-white p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-foreground/40">Productivité</p>
              <div className="mt-3 text-4xl font-semibold">70%</div>
              <p className="mt-2 text-sm text-foreground/60">
                d’informations mieux centralisées pour vos équipes opérationnelles.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-white p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-foreground/40">Coordination</p>
              <div className="mt-3 text-4xl font-semibold">95%</div>
              <p className="mt-2 text-sm text-foreground/60">
                de fluidité gagnée dans les échanges projet, documents et validations.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-white p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-foreground/40">Réactivité</p>
              <div className="mt-3 text-4xl font-semibold">0,7 s</div>
              <p className="mt-2 text-sm text-foreground/60">
                pour retrouver rapidement une information utile dans votre espace de travail.
              </p>
            </div>
          </div>
        </section>

        {/* TESTIMONIAL */}
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Ce que disent nos utilisateurs</h2>
            <p className="mt-3 text-foreground/60">
              Une interface pensée pour les entreprises qui veulent aller vite sans perdre en clarté.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[1.5rem] bg-[#ebe4ff] p-6">
              <div className="text-4xl font-semibold">100+</div>
              <p className="mt-2 text-sm text-foreground/65">
                équipes et partenaires déjà engagés dans une gestion plus simple.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-[#f6ebe6] p-6">
              <p className="text-lg leading-relaxed text-foreground/80">
                “Nous avons enfin une vue claire sur nos projets façade. Les équipes terrain, le
                bureau et les partenaires travaillent dans le même rythme.”
              </p>
              <p className="mt-4 text-sm font-medium">Mathieu R.</p>
              <p className="text-sm text-foreground/50">Responsable travaux</p>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Choisissez l’offre adaptée à vos besoins
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-foreground/60">
              Des plans simples, lisibles et cohérents avec la croissance de votre activité.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "rounded-[1.75rem] border p-6 shadow-sm",
                  plan.featured
                    ? "border-[#181a22] bg-[#181a22] text-white"
                    : "border-border bg-white text-foreground"
                )}
              >
                <p
                  className={cn(
                    "text-xs uppercase tracking-[0.2em]",
                    plan.featured ? "text-white/45" : "text-foreground/40"
                  )}
                >
                  {plan.name}
                </p>

                <div className="mt-4 text-4xl font-semibold">{plan.price}</div>
                <p
                  className={cn(
                    "mt-2 text-sm",
                    plan.featured ? "text-white/70" : "text-foreground/60"
                  )}
                >
                  {plan.desc}
                </p>

                <ul className="mt-6 space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "inline-block h-2.5 w-2.5 rounded-full",
                          plan.featured ? "bg-white" : "bg-black"
                        )}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "mt-8 w-full rounded-full",
                    plan.featured
                      ? "bg-white text-black hover:bg-white/90"
                      : "bg-black text-white hover:bg-black/90"
                  )}
                >
                  Start now
                </Button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;