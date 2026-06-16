
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock, Eye, Database, UserCheck, Mail, FileText, AlertCircle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const Privacy = () => {
  const sections = [
    {
      icon: Shield,
      title: "Collecte des Informations",
      content: [
        {
          subtitle: "Informations personnelles",
          text: "Nous collectons les informations que vous nous fournissez directement, telles que votre nom, adresse e-mail, numéro de téléphone et informations d'entreprise lors de la création de votre compte ou de l'utilisation de nos services."
        },
        {
          subtitle: "Informations d'utilisation",
          text: "Nous collectons automatiquement certaines informations sur votre appareil et votre utilisation de notre plateforme, y compris votre adresse IP, le type de navigateur, les pages visitées et les actions effectuées."
        }
      ]
    },
    {
      icon: Database,
      title: "Utilisation des Données",
      content: [
        {
          subtitle: "Fourniture de services",
          text: "Nous utilisons vos informations pour fournir, maintenir et améliorer nos services, traiter vos transactions et vous envoyer des informations techniques et de support."
        },
        {
          subtitle: "Communication",
          text: "Nous pouvons utiliser vos coordonnées pour vous envoyer des mises à jour, des newsletters et des informations marketing, avec votre consentement préalable."
        },
        {
          subtitle: "Analyse et amélioration",
          text: "Vos données nous aident à comprendre comment nos services sont utilisés et à développer de nouvelles fonctionnalités adaptées à vos besoins."
        }
      ]
    },
    {
      icon: Lock,
      title: "Protection des Données",
      content: [
        {
          subtitle: "Sécurité technique",
          text: "Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction."
        },
        {
          subtitle: "Chiffrement",
          text: "Toutes les données sensibles sont chiffrées en transit et au repos en utilisant des protocoles de sécurité standard de l'industrie (SSL/TLS)."
        },
        {
          subtitle: "Accès limité",
          text: "L'accès à vos données personnelles est strictement limité aux employés et prestataires qui en ont besoin pour fournir nos services."
        }
      ]
    },
    {
      icon: Eye,
      title: "Partage des Informations",
      content: [
        {
          subtitle: "Prestataires de services",
          text: "Nous pouvons partager vos informations avec des prestataires de services tiers qui nous aident à exploiter notre plateforme, sous réserve d'obligations de confidentialité strictes."
        },
        {
          subtitle: "Obligations légales",
          text: "Nous pouvons divulguer vos informations si la loi l'exige ou en réponse à des demandes légales valides des autorités publiques."
        },
        {
          subtitle: "Pas de vente",
          text: "Nous ne vendons jamais vos données personnelles à des tiers à des fins marketing."
        }
      ]
    },
    {
      icon: UserCheck,
      title: "Vos Droits",
      content: [
        {
          subtitle: "Accès et rectification",
          text: "Vous avez le droit d'accéder à vos données personnelles et de demander leur rectification si elles sont inexactes ou incomplètes."
        },
        {
          subtitle: "Suppression",
          text: "Vous pouvez demander la suppression de vos données personnelles, sous réserve de certaines exceptions légales."
        },
        {
          subtitle: "Portabilité",
          text: "Vous avez le droit de recevoir vos données dans un format structuré et couramment utilisé et de les transférer à un autre responsable du traitement."
        },
        {
          subtitle: "Opposition",
          text: "Vous pouvez vous opposer au traitement de vos données personnelles à des fins de marketing direct à tout moment."
        }
      ]
    },
    {
      icon: FileText,
      title: "Cookies et Technologies Similaires",
      content: [
        {
          subtitle: "Utilisation des cookies",
          text: "Nous utilisons des cookies et des technologies similaires pour améliorer votre expérience, analyser l'utilisation de notre plateforme et personnaliser le contenu."
        },
        {
          subtitle: "Gestion des cookies",
          text: "Vous pouvez contrôler et gérer les cookies via les paramètres de votre navigateur. Notez que la désactivation de certains cookies peut affecter la fonctionnalité de notre plateforme."
        }
      ]
    },
    {
      icon: AlertCircle,
      title: "Conservation des Données",
      content: [
        {
          subtitle: "Durée de conservation",
          text: "Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir nos services et respecter nos obligations légales."
        },
        {
          subtitle: "Suppression automatique",
          text: "Les données des comptes inactifs peuvent être supprimées après une période d'inactivité prolongée, conformément à notre politique de conservation."
        }
      ]
    },
    {
      icon: Mail,
      title: "Contact",
      content: [
        {
          subtitle: "Questions et demandes",
          text: "Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, veuillez nous contacter à l'adresse : privacy@facadeo.com"
        },
        {
          subtitle: "Délégué à la protection des données",
          text: "Vous pouvez également contacter notre délégué à la protection des données à l'adresse : dpo@facadeo.com"
        }
      ]
    }
  ]

  return (
    <div className="relative min-h-screen bg-card md:bg-background overflow-hidden">
      {/* Background Effects - Same as ArtisanAbonnement */}
      <div className="absolute inset-0 pointer-events-none h-full">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
        <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text">
            Politique de Confidentialité
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Chez FAÇADEO, nous nous engageons à protéger votre vie privée et vos données personnelles.
            Cette politique explique comment nous collectons, utilisons et protégeons vos informations.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>Dernière mise à jour : 22 décembre 2025</span>
          </div>
        </div>

        {/* Introduction Card */}
        <Card className="mb-8 border-primary/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-bold text-foreground">Engagement de Confidentialité</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cette politique de confidentialité s'applique à tous les services fournis par FAÇADEO.
                  En utilisant notre plateforme, vous acceptez les pratiques décrites dans cette politique.
                  Nous vous encourageons à lire attentivement ce document pour comprendre comment nous traitons vos données.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon
            return (
              <Card
                key={index}
                className={cn(
                  "border shadow-sm hover:shadow-md transition-all duration-300",
                  "hover:border-primary/30"
                )}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xl font-bold text-foreground">
                      {section.title}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.content.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <h4 className="font-semibold text-foreground/90 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {item.subtitle}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed pl-3.5">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Footer Notice */}
        <Card className="mt-8 border-accent/20 bg-accent/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                <AlertCircle className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-bold text-foreground">Modifications de cette Politique</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment.
                  Les modifications entreront en vigueur dès leur publication sur cette page. Nous vous
                  encourageons à consulter régulièrement cette page pour rester informé de nos pratiques
                  en matière de confidentialité. En cas de modifications importantes, nous vous en
                  informerons par e-mail ou via une notification sur notre plateforme.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Privacy