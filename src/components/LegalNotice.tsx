import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Code2,
  Cookie,
  Database,
  FileText,
  Gavel,
  Globe2,
  Link,
  Link2,
  Lock,
  Mail,
  Server,
  Shield,
  UserCheck,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const LegalNotice = () => {
  const sections = [
    {
      icon: UserCheck,
      title: "1. Éditeur du site",
      content: [
        {
          text: (
            <>
              Le site <b>FAÇADEO</b> est édité par :
              <br />
              <b>SAS DOST</b>
              <br />
              Siège social :<br />
              Pôle Développement Économique – Pépinière<br />
              1010 Av. de l&apos;Europe<br />
              33260 La Teste-de-Buch – France
              <br /><br />
              Téléphone : +33 (0)6 59 94 26 01<br />
              Email : <a href="mailto:contact@dost.pro" className="underline text-primary">contact@dost.pro</a>
              <br /><br />
              Directeur de la publication : <b>Ismael SANE</b>
            </>
          ),
        },
      ],
    },
    {
      icon: Gavel,
      title: "2. Conditions d’utilisation",
      content: [
        {
          text: (
            <>
              Le site accessible à l’adresse <a href="http://www.dost.pro" className="underline text-primary">www.dost.pro</a> est exploité dans le respect de la législation française.
              <br /><br />
              L&apos;utilisation de ce site est régie par les présentes conditions générales. En utilisant le site, vous reconnaissez avoir pris connaissance de ces conditions et les avoir acceptées.
              <br /><br />
              Celles-ci peuvent être modifiées à tout moment et sans préavis par la SAS DOST.
              <br /><br />
              La SAS DOST ne saurait être tenue responsable en aucune manière d’une mauvaise utilisation du service.
            </>
          ),
        },
      ],
    },
    {
      icon: Database,
      title: "3. Description du service",
      content: [
        {
          text: (
            <>
              FAÇADEO est une plateforme SaaS dédiée au secteur du BTP permettant notamment :
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>la mise en relation entre donneurs d’ordre et sous-traitants</li>
                <li>la gestion d’appels d’offres</li>
                <li>l’analyse de documents techniques</li>
                <li>la génération de chiffrages</li>
                <li>la gestion de projets et de données administratives</li>
              </ul>
            </>
          ),
        },
      ],
    },
    {
      icon: AlertCircle,
      title: "4. Limitation de responsabilité",
      content: [
        {
          text: (
            <>
              Les informations contenues sur ce site sont aussi précises que possible et le site est périodiquement mis à jour. Toutefois, il peut contenir des inexactitudes, omissions ou lacunes.
              <br /><br />
              Tout contenu téléchargé se fait aux risques et périls de l’utilisateur et sous sa seule responsabilité.
              <br /><br />
              En conséquence, la SAS DOST ne saurait être tenue responsable :
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>d’un quelconque dommage subi par l’ordinateur de l’utilisateur</li>
                <li>d’une perte de données consécutive au téléchargement</li>
                <li>d’une mauvaise utilisation du service</li>
              </ul>
              <br />
              Les photos et visuels sont non contractuels.
              <br /><br />
              Les liens hypertextes présents sur ce site vers d’autres ressources ne sauraient engager la responsabilité de la SAS DOST.
            </>
          ),
        },
      ],
    },
    {
      icon: Shield,
      title: "5. Données personnelles",
      content: [
        {
          text: (
            <>
              Conformément au <b>Règlement Général sur la Protection des Données (RGPD)</b>, la SAS DOST s’engage à protéger les données personnelles des utilisateurs.
              <br /><br />
              Des données peuvent être collectées notamment lors :
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>de la création d’un compte utilisateur</li>
                <li>de l’utilisation des services</li>
                <li>de l’analyse de navigation (Google Analytics)</li>
              </ul>
              <br />
              Les utilisateurs disposent des droits suivants :
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>droit d’accès</li>
                <li>droit de rectification</li>
                <li>droit de suppression</li>
                <li>droit d’opposition</li>
              </ul>
              <br />
              Ces droits peuvent être exercés en contactant : <a href="mailto:contact@dost.pro" className="underline text-primary">contact@dost.pro</a>
              <br /><br />
              Les informations personnelles collectées ne sont en aucun cas vendues ou cédées à des tiers, sauf nécessité liée à l’exécution du service.
            </>
          ),
        },
      ],
    },
    {
      icon: Lock,
      title: "6. Confidentialité",
      content: [
        {
          text: (
            <>
              Vos données personnelles sont strictement confidentielles et ne seront utilisées que dans le cadre du service proposé.
            </>
          ),
        },
      ],
    },
    {
      icon: FileText,
      title: "7. Propriété intellectuelle",
      content: [
        {
          text: (
            <>
              L’ensemble du contenu du site (textes, images, graphismes, logo, icônes, etc.) est la propriété exclusive de la SAS DOST, sauf mention contraire.
              <br /><br />
              Toute reproduction, distribution, modification ou exploitation, même partielle, est strictement interdite sans autorisation écrite préalable.
              <br /><br />
              Toute violation constitue une contrefaçon sanctionnée par le Code de la propriété intellectuelle.
              <br /><br />
              La SAS DOST est également propriétaire des droits relatifs aux bases de données du site.
            </>
          ),
        },
      ],
    },
    {
      icon: Link2,
      title: "8. Liens hypertextes",
      content: [
        {
          text: (
            <>
              Les utilisateurs ne peuvent mettre en place un lien vers le site sans autorisation préalable de la SAS DOST.
              <br /><br />
              Les liens externes présents sur le site ne sont pas sous le contrôle de la SAS DOST, qui ne saurait être tenue responsable de leur contenu.
            </>
          ),
        },
      ],
    },
    {
      icon: Server,
      title: "9. Hébergement",
      content: [
        {
          text: (
            <>
              Le site FAÇADEO est hébergé par :
              <br /><br />
              <b>Netlify, Inc.</b><br />
              2325 3rd Street, Suite 215<br />
              San Francisco, CA 94107<br />
              États-Unis<br />
              Site web : <a href="https://www.netlify.com" className="underline text-primary" target="_blank" rel="noopener noreferrer">https://www.netlify.com</a>
              <br /><br />
              Les services backend, API et traitements applicatifs sont hébergés par :
              <br /><br />
              <b>Render Services, Inc.</b><br />
              525 Brannan Street, Suite 300<br />
              San Francisco, CA 94107<br />
              États-Unis<br />
              Site web : <a href="https://render.com" className="underline text-primary" target="_blank" rel="noopener noreferrer">https://render.com</a>
              <br /><br />
              Les données applicatives (base de données, authentification, stockage) sont hébergées par :
              <br /><br />
              <b>Supabase, Inc.</b><br />
              95 Third Street, 2nd Floor<br />
              San Francisco, CA 94103<br />
              États-Unis<br />
              Site web : <a href="https://supabase.com" className="underline text-primary" target="_blank" rel="noopener noreferrer">https://supabase.com</a>
              <br /><br />
              Certaines données peuvent être hébergées en dehors de l’Union européenne, notamment via nos prestataires techniques (Netlify, Render, Supabase), dans le respect des garanties prévues par le Règlement Général sur la Protection des Données (RGPD).
            </>
          ),
        },
      ],
    },
    {
      icon: Cookie,
      title: "10. Cookies",
      content: [
        {
          text: (
            <>
              Le site utilise des cookies à des fins :
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>statistiques</li>
                <li>d’amélioration de l’expérience utilisateur</li>
              </ul>
              <br />
              L’utilisateur peut configurer son navigateur pour refuser les cookies.
            </>
          ),
        },
      ],
    },
    {
      icon: Globe2,
      title: "11. Droit applicable et litiges",
      content: [
        {
          text: (
            <>
              Les présentes conditions sont régies par le droit français.
              <br /><br />
              Tout litige sera de la compétence exclusive des tribunaux dont dépend le siège social de la SAS DOST.
              <br /><br />
              La langue de référence est le français.
            </>
          ),
        },
      ],
    },
    {
      icon: Code2,
      title: "12. Conditions techniques",
      content: [
        {
          text: (
            <>
              Le site est développé avec le framework <b>Ruby on Rails</b>.
              <br /><br />
              Pour une expérience optimale, il est recommandé d’utiliser des navigateurs modernes (Chrome, Firefox, Safari, etc.).
            </>
          ),
        },
      ],
    },
    {
      icon: Mail,
      title: "13. Contact",
      content: [
        {
          text: (
            <>
              Pour toute question, suggestion ou demande :
              <br />
              📧 <a href="mailto:contact@dost.pro" className="underline text-primary">contact@dost.pro</a>
            </>
          ),
        },
      ],
    },
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
      {/* Background Effects */}
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
            Mentions légales
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Merci de lire attentivement les présentes modalités d&apos;utilisation avant de parcourir ce site.<br />
            En vous connectant sur ce site, vous acceptez sans réserve les présentes modalités.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>Dernière mise à jour : 22 décembre 2025</span>
          </div>
        </div>

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
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {item.text}
                      </div>
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
                <h3 className="text-lg font-bold text-foreground">Modification des mentions légales</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  La SAS DOST se réserve le droit de modifier à tout moment les présentes mentions légales. Les modifications prendront effet dès leur publication sur cette page. Nous vous invitons à consulter régulièrement cette page pour rester informé.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LegalNotice