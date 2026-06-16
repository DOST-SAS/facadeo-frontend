# FACADEO - Documentation Complète

## 📋 Vue d'Ensemble du Projet

**Facadeo** est une plateforme SaaS révolutionnaire qui utilise l'intelligence artificielle pour analyser les façades de bâtiments, détecter les pathologies et générer automatiquement des devis de rénovation. La plateforme connecte les artisans avec des clients potentiels grâce à une technologie de scan IA avancée.

### 🎯 Objectif Principal
Simplifier et automatiser le processus d'évaluation et de devis pour les travaux de façade en utilisant la vision par ordinateur et l'analyse géospatiale.

---

## 🏗️ Architecture Technique

### Stack Technologique

#### Frontend
- **Framework**: React 19.2.0 avec TypeScript
- **Build Tool**: Vite 7.2.4
- **Routing**: React Router DOM 7.9.6
- **Styling**: TailwindCSS 4.1.17
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts 2.15.4
- **Notifications**: React Hot Toast

#### Backend & Services
- **BaaS**: Supabase (Authentication, Database, Storage)
- **Maps**: Google Maps API (@googlemaps/js-api-loader)
- **Payments**: Stripe
- **PDF Generation**: jsPDF + jspdf-autotable

#### State Management
- **Context API**: AuthContext pour la gestion de l'authentification
- **Local State**: React Hooks (useState, useEffect, useCallback)

---

## 👥 Rôles Utilisateurs

### 1. **Artisan** (Rôle Principal)
Professionnel du BTP qui utilise la plateforme pour:
- Scanner des zones géographiques
- Analyser les façades détectées
- Générer des devis automatiques
- Gérer son profil et ses abonnements

### 2. **Admin** (Rôle Administrateur)
Gestionnaire de la plateforme avec accès à:
- Tableau de bord global
- Gestion des utilisateurs
- Supervision des scans et devis
- Configuration des métiers et tarifs
- Gestion des abonnements

---

## 🎨 Fonctionnalités Principales

### 🔐 Authentification & Autorisation

#### Méthodes d'Authentification
1. **Email/Password** - Inscription classique avec vérification email
2. **Google OAuth** - Connexion sociale via Google
3. **Session Management** - Gestion automatique des sessions Supabase

#### Sécurité
- Protection des routes par rôle (ProtectedRoute component)
- Vérification du statut utilisateur (actif/inactif)
- Changement de mot de passe sécurisé
- Tokens JWT gérés par Supabase

**Fichiers Clés:**
- `src/context/AuthContext.tsx` - Context d'authentification
- `src/components/ProtectedRoute.tsx` - HOC de protection des routes
- `src/features/auth/login.tsx` - Page de connexion
- `src/features/auth/register.tsx` - Page d'inscription
- `src/features/auth/callback.tsx` - Callback OAuth

---

### 🔍 Système de Scan IA

#### Workflow de Scan

1. **Création du Scan**
   - Sélection d'une adresse via Google Places API
   - Définition d'un rayon de recherche (en mètres)
   - Sélection des types de bâtiments à analyser
   - Estimation du coût en crédits

2. **Détection des Façades**
   - Recherche automatique des bâtiments dans le rayon
   - Récupération des images Street View
   - Analyse IA des façades
   - Calcul du score de dégradation (0-100)

3. **Analyse Détaillée**
   - Score global par façade
   - Breakdown détaillé (fissures, humidité, peinture, etc.)
   - Surface estimée en m²
   - Images avant/après simulation
   - Localisation GPS précise

#### Types de Pathologies Détectées
- **Fissures** - Détection et classification
- **Humidité** - Zones d'infiltration
- **Peinture** - État de la peinture
- **Joints** - Dégradation des joints
- **Isolation** - Problèmes d'isolation visible

**Fichiers Clés:**
- `src/features/Artisan/scans/CreateScan.tsx` - Interface de création
- `src/features/Artisan/scans/ArtisanScans.tsx` - Liste des scans
- `src/features/Artisan/scans/ResultScan.tsx` - Résultats détaillés
- `src/features/Artisan/facades/DetailsFacade.tsx` - Détails d'une façade
- `src/services/artisan/scansServices.ts` - API des scans

**Types de Données:**
```typescript
interface Scan {
  id: string
  name: string
  slug: string
  status: "pending" | "running" | "completed" | "failed"
  address: string
  radius_meters: number
  facadesCount: number
  estimated_cost_credits: number
  score: number
  facades: Facade[]
}

interface Facade {
  id: string
  location: GeoJSON
  address: object
  streetview_url: string
  score: number
  score_breakdown: object
  surface_m2: number
  simulated_image_url: string
}
```

---

### 📄 Génération de Devis

#### Processus de Création

1. **Informations Client**
   - Nom et prénom
   - Email et téléphone
   - Adresse complète
   - Référence projet

2. **Prestations**
   - Description du service
   - Quantité et unité (m², unité, heure)
   - Prix unitaire HT
   - Calcul automatique du total

3. **Calculs Automatiques**
   - Total HT (somme des prestations)
   - TVA configurable (5.5%, 10%, 20%)
   - Total TTC
   - Conditions de paiement

4. **Actions Disponibles**
   - **Sauvegarder comme brouillon** - Status: draft
   - **Sauvegarder** - Status: sent
   - **Télécharger PDF** - Génération PDF professionnel
   - **Envoyer par email** - Envoi au client

#### Format PDF
- En-tête avec logo et informations artisan
- Détails client et projet
- Tableau des prestations
- Totaux HT, TVA, TTC
- Conditions générales
- Signature numérique

**Fichiers Clés:**
- `src/features/Artisan/devis/CreateDevi.tsx` - Création de devis
- `src/features/Artisan/devis/ArtisanDevis.tsx` - Liste des devis
- `src/features/Artisan/devis/ArtisanDetailDevis.tsx` - Détails d'un devis
- `src/services/artisan/devisService.ts` - API des devis
- `src/utils/generateDevisPdf.ts` - Génération PDF

**Types de Données:**
```typescript
interface Devis {
  id: string
  quote_number: string
  client_name: string
  client_email: string
  client_phone: string
  client_address: string
  status: "draft" | "sent" | "accepted" | "rejected"
  total_ht: number
  total_ttc: number
  tva_rate: number
  prestations: Prestation[]
  created_at: string
}

interface Prestation {
  description: string
  quantity: number
  unit: string
  unit_price: number
  total: number
}
```

---

### 💳 Système d'Abonnement & Crédits

#### Plans d'Abonnement

1. **Plan Gratuit (Free)**
   - Accès limité
   - Crédits de démarrage
   - Fonctionnalités de base

2. **Plan Starter**
   - Crédits mensuels inclus
   - Scans illimités
   - Support standard

3. **Plan Pro**
   - Crédits mensuels augmentés
   - Fonctionnalités avancées
   - Support prioritaire

4. **Plan Enterprise**
   - Crédits illimités
   - API access
   - Support dédié

#### Système de Crédits
- **1 crédit = 1 façade analysée**
- Recharge automatique mensuelle selon l'abonnement
- Packs de crédits supplémentaires disponibles
- Historique de consommation détaillé

#### Intégration Stripe
- Paiements sécurisés
- Abonnements récurrents
- Achats one-time (packs de crédits)
- Webhooks pour synchronisation
- Gestion des factures

**Fichiers Clés:**
- `src/features/Artisan/abonnement/ArtisanAbonnement.tsx` - Gestion abonnement
- `src/features/Artisan/abonnement/SubscriptionSuccess.tsx` - Confirmation
- `src/services/artisan/Abonemmentsservices.ts` - API abonnements
- `src/services/stripeServices.ts` - Intégration Stripe

---

### ⚙️ Paramètres & Configuration

#### Profil Artisan

1. **Informations Personnelles**
   - Nom, prénom
   - Email, téléphone
   - Photo de profil
   - Changement de mot de passe

2. **Informations Entreprise**
   - Nom de l'entreprise
   - SIRET
   - Adresse
   - Logo entreprise
   - Signature numérique

3. **Configuration Métiers**
   - Sélection des métiers exercés
   - Tarifs par service
   - Description des prestations
   - Zones d'intervention

4. **Intégrations API**
   - Clé API Google Maps
   - Clé API Stripe
   - Autres services tiers

**Fichiers Clés:**
- `src/features/Artisan/settings/ArtisanSettings.tsx` - Paramètres artisan
- `src/services/artisan/profileservices.ts` - API profil

---

### 📊 Tableau de Bord

#### Dashboard Artisan

**Statistiques Affichées:**
- Total des scans effectués
- Nombre de façades analysées
- Devis générés
- Taux de conversion
- Crédits restants
- Chiffre d'affaires estimé

**Graphiques:**
- Évolution des scans (Recharts)
- Répartition par statut
- Performance mensuelle

**Actions Rapides:**
- Lancer un nouveau scan
- Créer un devis
- Voir les notifications

**Fichiers Clés:**
- `src/features/Artisan/dashboard/ArtisanDashboard.tsx`
- `src/services/artisan/dashbordService.ts`

#### Dashboard Admin

**Métriques Globales:**
- Nombre total d'utilisateurs
- Scans actifs
- Revenus mensuels
- Taux d'activation

**Gestion:**
- Liste des utilisateurs avec filtres
- Modération des scans
- Validation des devis
- Configuration des plans

**Fichiers Clés:**
- `src/features/Admin/dashboard/AdminDashboard.tsx`
- `src/services/admin/dashboardService.ts`

---

### 🔔 Notifications

#### Types de Notifications
- Scan terminé
- Nouveau devis accepté
- Crédit faible
- Expiration abonnement
- Mises à jour système

#### Système de Notification
- Notifications en temps réel
- Badge de compteur
- Marquage lu/non lu
- Historique complet

**Fichiers Clés:**
- `src/features/Artisan/notifications/ArtisanNotifications.tsx`
- `src/services/artisan/notificationsServices.ts`

---

### 🔎 Recherche Globale

#### Fonctionnalité de Recherche
- Recherche unifiée dans tous les modules
- Résultats groupés par type:
  - Scans
  - Façades
  - Devis
  - Clients

#### Implémentation
- Recherche en temps réel (debounced)
- Affichage dans un dropdown
- Navigation rapide vers les résultats
- Raccourcis clavier (Ctrl+K)

**Fichiers Clés:**
- `src/services/artisan/globalSearchService.ts`
- Intégré dans le Header

---

## 🎨 Interface Utilisateur

### Design System

#### Composants UI (shadcn/ui + Radix)
- **Button** - Boutons avec variantes
- **Card** - Cartes de contenu
- **Dialog** - Modales
- **Form** - Formulaires validés
- **Table** - Tableaux de données (@tanstack/react-table)
- **Select** - Sélecteurs
- **Input** - Champs de saisie
- **Tabs** - Onglets
- **Accordion** - Accordéons
- **Alert** - Alertes
- **Badge** - Badges de statut
- **Progress** - Barres de progression
- **Tooltip** - Info-bulles

#### Thème & Couleurs
- **Primary**: Bleu indigo (#6366f1)
- **Accent**: Jaune/Or (#fbbf24)
- **Background**: Deep blue/black (#020617)
- **Glassmorphism**: backdrop-blur + transparence
- **Gradients**: Dégradés dynamiques

#### Animations
- Transitions fluides (duration-300, duration-500)
- Hover effects (scale, translate, rotate)
- Micro-animations
- Loading states
- Skeleton loaders

### Pages Principales

#### Pages Publiques
- **Home** (`/home`) - Landing page futuriste
- **Login** (`/login`) - Connexion
- **Register** (`/register`) - Inscription
- **Terms** (`/terms`) - Conditions d'utilisation
- **Privacy** (`/privacy`) - Politique de confidentialité

#### Pages Artisan (Protégées)
- **Dashboard** (`/`) - Tableau de bord
- **Scans** (`/scans`) - Liste des scans
- **Create Scan** (`/scans/create`) - Nouveau scan
- **Scan Results** (`/scans/:slug`) - Résultats
- **Facade Details** (`/scans/:slug/facades/:id`) - Détails façade
- **Devis** (`/devis`) - Liste des devis
- **Create Devis** (`/devis/create`) - Nouveau devis
- **Devis Details** (`/devis/:id`) - Détails devis
- **Abonnement** (`/abonnement`) - Gestion abonnement
- **Paramètres** (`/parametres`) - Configuration

#### Pages Admin (Protégées)
- **Admin Dashboard** (`/admin`) - Vue d'ensemble
- **Users** (`/admin/users`) - Gestion utilisateurs
- **Scans** (`/admin/scans`) - Tous les scans
- **Facades** (`/admin/facades`) - Toutes les façades
- **Devis** (`/admin/devis`) - Tous les devis
- **Métiers** (`/admin/metiers`) - Configuration métiers
- **Abonnements** (`/admin/abonnement`) - Gestion plans
- **Paramètres** (`/admin/parametres`) - Config globale

---

## 🗂️ Structure du Projet

```
FAÇADEO/
├── public/
│   ├── whiteLogo.png
│   ├── facade_apres.png
│   └── ...
├── src/
│   ├── api/
│   │   └── api.ts                    # Configuration Supabase & API
│   ├── components/
│   │   ├── layout/
│   │   │   ├── ArtisanLayout.tsx     # Layout artisan
│   │   │   └── AdminLayout.tsx       # Layout admin
│   │   ├── Menus/
│   │   │   ├── ArtisanSidebar.tsx    # Menu latéral artisan
│   │   │   └── AdminSidebar.tsx      # Menu latéral admin
│   │   ├── ui/                       # Composants shadcn/ui
│   │   ├── ProtectedRoute.tsx        # Protection routes
│   │   ├── Terms.tsx                 # CGU
│   │   └── Privacy.tsx               # Confidentialité
│   ├── context/
│   │   └── AuthContext.tsx           # Context authentification
│   ├── features/
│   │   ├── Admin/
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── scans/
│   │   │   ├── facades/
│   │   │   ├── devis/
│   │   │   ├── metiers/
│   │   │   ├── abonnement/
│   │   │   └── settings/
│   │   ├── Artisan/
│   │   │   ├── dashboard/
│   │   │   ├── scans/
│   │   │   ├── facades/
│   │   │   ├── devis/
│   │   │   ├── notifications/
│   │   │   ├── abonnement/
│   │   │   ├── settings/
│   │   │   └── onboarding/
│   │   └── auth/
│   │       ├── login.tsx
│   │       ├── register.tsx
│   │       └── callback.tsx
│   ├── hooks/                        # Custom hooks
│   ├── lib/
│   │   └── utils.ts                  # Utilitaires (cn, etc.)
│   ├── pages/
│   │   ├── Home.tsx                  # Landing page
│   │   ├── NotFound.tsx              # 404
│   │   └── EmailVerification.tsx     # Vérification email
│   ├── routes/
│   │   └── routes.tsx                # Configuration routes
│   ├── services/
│   │   ├── admin/                    # Services API admin
│   │   ├── artisan/                  # Services API artisan
│   │   ├── cities.ts                 # API villes
│   │   ├── geocoding.ts              # Géocodage
│   │   ├── places.ts                 # Google Places
│   │   ├── imagesAPI.ts              # Gestion images
│   │   └── stripeServices.ts         # Stripe
│   ├── styles/
│   │   └── index.css                 # Styles globaux
│   ├── types/                        # Types TypeScript
│   ├── utils/
│   │   ├── generateDevisPdf.ts       # Génération PDF
│   │   └── UploadAvatars.ts          # Upload images
│   ├── App.tsx                       # Composant racine
│   └── main.tsx                      # Point d'entrée
├── .env                              # Variables d'environnement
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 🔌 Intégrations & APIs

### Supabase
- **Authentication**: Gestion complète des utilisateurs
- **Database**: PostgreSQL avec Row Level Security
- **Storage**: Stockage des images (logos, signatures, avatars)
- **Realtime**: Notifications en temps réel

**Tables Principales:**
- `profiles` - Profils utilisateurs
- `scans` - Scans effectués
- `facades` - Façades détectées
- `devis` - Devis générés
- `subscriptions` - Abonnements
- `credits_history` - Historique crédits
- `metiers` - Métiers configurables
- `notifications` - Notifications

### Google Maps Platform
- **Places API**: Recherche d'adresses
- **Geocoding API**: Conversion adresse ↔ coordonnées
- **Street View API**: Récupération images façades
- **Maps JavaScript API**: Affichage cartes interactives

### Stripe
- **Checkout Sessions**: Paiements sécurisés
- **Subscriptions**: Abonnements récurrents
- **Webhooks**: Synchronisation événements
- **Customer Portal**: Gestion self-service

---

## 🚀 Déploiement & Configuration

### Variables d'Environnement (.env)

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Stripe
VITE_STRIPE_PUBLIC_KEY=your-stripe-public-key

# App
VITE_APP_URL=http://localhost:5173
```

### Scripts NPM

```bash
# Développement
npm run dev          # Lance le serveur de dev (Vite)

# Production
npm run build        # Build TypeScript + Vite
npm run preview      # Prévisualise le build

# Qualité
npm run lint         # ESLint
```

### Build & Optimisation
- **Tree-shaking**: Élimination du code mort
- **Code splitting**: Chargement lazy des routes
- **Minification**: Compression JS/CSS
- **Image optimization**: Compression automatique

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md, lg)
- **Desktop**: > 1024px (xl, 2xl)

### Adaptations
- Navigation mobile (hamburger menu)
- Grids responsives (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Typography fluide (text-base lg:text-lg)
- Cartes empilées sur mobile

---

## 🔒 Sécurité

### Mesures Implémentées
- **Row Level Security (RLS)** sur Supabase
- **Protection CSRF** via tokens
- **Validation côté serveur** (Zod schemas)
- **Sanitization** des inputs
- **HTTPS** obligatoire en production
- **Rate limiting** sur les APIs
- **Secrets** stockés dans .env (jamais committé)

### Bonnes Pratiques
- Pas de données sensibles en localStorage
- Tokens JWT avec expiration
- Validation stricte des rôles
- Logs d'audit pour actions critiques

---

## 🧪 Tests & Qualité

### Outils
- **ESLint**: Linting JavaScript/TypeScript
- **TypeScript**: Type safety
- **React DevTools**: Debugging
- **Supabase Studio**: Gestion BDD

### Standards de Code
- Composants fonctionnels avec hooks
- Props typées avec TypeScript
- Naming conventions (camelCase, PascalCase)
- Commentaires pour logique complexe

---

## 📈 Évolutions Futures

### Fonctionnalités Prévues
- [ ] Application mobile (React Native)
- [ ] Export Excel des rapports
- [ ] Intégration CRM
- [ ] Chatbot IA pour support
- [ ] Marketplace d'artisans
- [ ] Système de reviews/ratings
- [ ] Multi-langue (i18n)
- [ ] Mode hors-ligne (PWA)
- [ ] Analyse prédictive IA
- [ ] API publique pour partenaires

### Optimisations Techniques
- [ ] Server-Side Rendering (Next.js)
- [ ] Cache Redis
- [ ] CDN pour assets
- [ ] Monitoring (Sentry)
- [ ] Analytics (Google Analytics)
- [ ] A/B Testing

---

## 👨‍💻 Guide de Développement

### Ajouter une Nouvelle Feature

1. **Créer les types** dans `src/types/`
2. **Créer le service** dans `src/services/`
3. **Créer les composants** dans `src/features/`
4. **Ajouter les routes** dans `src/routes/routes.tsx`
5. **Mettre à jour la navigation** (Sidebar)
6. **Tester** la fonctionnalité

### Conventions de Nommage

- **Composants**: PascalCase (`UserProfile.tsx`)
- **Services**: camelCase (`userService.ts`)
- **Types**: PascalCase (`UserType.ts`)
- **Hooks**: camelCase avec préfixe `use` (`useAuth.ts`)
- **Utils**: camelCase (`formatDate.ts`)

### Structure d'un Composant

```tsx
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { someService } from '@/services/someService'

interface MyComponentProps {
  title: string
  onAction?: () => void
}

export const MyComponent = ({ title, onAction }: MyComponentProps) => {
  const [data, setData] = useState(null)

  useEffect(() => {
    // Fetch data
  }, [])

  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={onAction}>Action</Button>
    </div>
  )
}
```

---

## 📞 Support & Contact

### Documentation
- **Code**: Commentaires inline
- **API**: Documentation Supabase
- **UI**: Storybook (à venir)

### Ressources
- [React Docs](https://react.dev)
- [Supabase Docs](https://supabase.com/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

---

## 📝 Changelog

### Version 1.0.0 (Actuelle)
- ✅ Système d'authentification complet
- ✅ Scan IA de façades
- ✅ Génération de devis PDF
- ✅ Système d'abonnement Stripe
- ✅ Dashboard artisan et admin
- ✅ Gestion des profils
- ✅ Notifications en temps réel
- ✅ Recherche globale
- ✅ Landing page futuriste

---

## 🎯 Métriques de Performance

### Objectifs
- **Lighthouse Score**: > 90
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: < 500KB (gzipped)

### Optimisations
- Lazy loading des routes
- Image optimization
- Code splitting
- Tree shaking
- Minification

---

## 🌟 Points Forts du Projet

1. **Design Moderne**: Interface futuriste avec glassmorphism et animations fluides
2. **IA Avancée**: Détection automatique des pathologies de façades
3. **Automatisation**: Génération automatique de devis professionnels
4. **Scalabilité**: Architecture modulaire et extensible
5. **UX Premium**: Expérience utilisateur soignée et intuitive
6. **Type Safety**: TypeScript pour une meilleure maintenabilité
7. **Intégrations**: Google Maps, Stripe, Supabase
8. **Responsive**: Adapté à tous les écrans

---

**Dernière mise à jour**: 5 janvier 2026
**Version**: 1.0.0
**Auteur**: Facadeo Team
