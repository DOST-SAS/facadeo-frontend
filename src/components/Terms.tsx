
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  FileText,
  Scale,
  ShieldCheck,
  Users,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"


const Terms = () => {


  const highlights = [
    {
      icon: Zap,
      title: "Mise à jour",
      value: "22 décembre 2025",
      color: "primary"
    },
    {
      icon: Users,
      title: "Utilisateurs actifs",
      value: "Protection garantie",
      color: "success"
    },
    {
      icon: ShieldCheck,
      title: "Conformité",
      value: "RGPD & Lois FR",
      color: "info"
    }
  ]

  return (
    <div className="relative min-h-screen bg-card md:bg-background overflow-hidden">
      <div className="flex items-start gap-4 mt-6 ml-4">
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white/80 dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow hover:bg-slate-50 dark:hover:bg-white/20 transition-colors text-primary font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Retour à l'accueil</span>
        </a>
      </div>
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 pointer-events-none h-full">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
        <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-success/3 blur-[60px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-12">
        {/* Enhanced Header */}
        <div className="text-center mb-12 space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30 mb-4 shadow-lg shadow-primary/10">
            <FileText className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              Conditions d'Utilisation
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Veuillez lire attentivement ces conditions générales d'utilisation avant d'utiliser la plateforme FAÇADEO.
              Votre accès et votre utilisation de nos services sont conditionnés par votre acceptation de ces conditions.
            </p>
          </div>

          {/* Highlights Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
            {highlights.map((highlight, index) => {
              const Icon = highlight.icon
              return (
                <Card key={index} className="border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-md hover:shadow-lg transition-all">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-xl border",
                      highlight.color === "primary" && "bg-primary/10 border-primary/20",
                      highlight.color === "success" && "bg-success/10 border-success/20",
                      highlight.color === "info" && "bg-info/10 border-info/20"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5",
                        highlight.color === "primary" && "text-primary",
                        highlight.color === "success" && "text-success",
                        highlight.color === "info" && "text-info"
                      )} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground font-medium">{highlight.title}</p>
                      <p className="text-sm font-bold text-foreground">{highlight.value}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>



        {/* Contact Section */}
        <Card className="mt-6 border-primary/20 bg-card shadow-lg">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20">
                <Scale className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Questions Juridiques ?</h3>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Pour toute question concernant ces conditions d'utilisation, veuillez contacter notre équipe juridique
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <a href="mailto:legal@facadeo.com" className="text-sm font-semibold text-primary hover:underline">
                  legal@facadeo.com
                </a>
                <span className="text-muted-foreground">•</span>
                <a href="mailto:support@facadeo.com" className="text-sm font-semibold text-primary hover:underline">
                  support@facadeo.com
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Terms