import {
  Croissant, UtensilsCrossed, Pill, Coffee, Car, Scissors, ShoppingBag,
  Building2, Briefcase, Dumbbell, Flower2, Sofa, Fuel, Gem,
  Shirt, BookOpen, Bike, Wine, Film, Palette, Stethoscope, Scale,
  Wrench, Home, Plane, PawPrint, Store, Sparkles, type LucideIcon
} from "lucide-react"

export interface BusinessTypeConfig {
  icon: LucideIcon
  color: string
  label: string
  iconPath: string
}

// SVG paths for icons (simplified versions for map markers)
const iconPaths = {
  croissant: "M4.5 9.5c0-1.5 1-3 2.5-3.5 1-.3 2-.3 3 0 1.5.5 2.5 2 2.5 3.5M7 14c-1.5 0-3-1-3.5-2.5-.3-1-.3-2 0-3 .5-1.5 2-2.5 3.5-2.5M17 14c1.5 0 3-1 3.5-2.5.3-1 .3-2 0-3-.5-1.5-2-2.5-3.5-2.5M12 19c-1.5 0-3-1-3.5-2.5-.3-1-.3-2 0-3 .5-1.5 2-2.5 3.5-2.5s3 1 3.5 2.5c.3 1 .3 2 0 3-.5 1.5-2 2.5-3.5 2.5z",
  utensils: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7",
  pill: "M10.5 20.5L3.5 13.5a4.95 4.95 0 1 1 7-7l7 7a4.95 4.95 0 1 1-7 7zM8.5 8.5l7 7",
  coffee: "M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zM6 2v4M10 2v4M14 2v4",
  car: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-4H8L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2M7 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM13 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0z",
  scissors: "M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12",
  shoppingBag: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  building: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18zM6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4",
  briefcase: "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
  dumbbell: "M6.5 6.5a2.12 2.12 0 0 1 3 3L6 13l-3.5-3.5a2.12 2.12 0 0 1 3-3zM17.5 17.5a2.12 2.12 0 0 1-3-3L18 11l3.5 3.5a2.12 2.12 0 0 1-3 3zM14 10l-4 4",
  flower: "M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V9m-4.5 3a4.5 4.5 0 1 0 4.5 4.5M7.5 12H9m7.5 0a4.5 4.5 0 1 1-4.5 4.5m4.5-4.5H15m-3 4.5V15",
  sofa: "M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0zM4 18v2M20 18v2",
  fuel: "M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17M13 10h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 6M7 10h4M7 14h4",
  gem: "M6 3h12l4 6-10 13L2 9zM11 3l1 10M2 9h20M12 3l-1 10",
  shirt: "M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z",
  book: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",
  bike: "M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 17V5l4 6h5M5 14l4-7h6",
  wine: "M8 22h8M12 18v4M12 18a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5z",
  film: "M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5M2 2h20v20H2z",
  palette: "M12 2a10 10 0 0 0 0 20c.55 0 1-.45 1-1 0-.28-.11-.53-.29-.71a1.49 1.49 0 0 1-.3-1.58c.25-.59.85-1 1.54-1H16a6 6 0 0 0 6-6c0-5.52-4.48-10-10-10zM5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM8 14.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM12 7.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM16.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z",
  stethoscope: "M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4M22 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z",
  scale: "M12 3v18M3 7l3 9a5.002 5.002 0 0 0 6 0l3-9M18 7l3 9a5.002 5.002 0 0 1-6 0l-3-9M3 7h6M15 7h6",
  wrench: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  plane: "M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z",
  pawPrint: "M11 14c.5-.3 1.1-.5 1.7-.5.6 0 1.2.2 1.7.5M8.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM18.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM15 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM12 18c-2.5 0-4.5-1.5-4.5-3.5 0-1 .5-2 1.5-2.5.5-.3 1.1-.5 1.7-.5h2.6c.6 0 1.2.2 1.7.5 1 .5 1.5 1.5 1.5 2.5 0 2-2 3.5-4.5 3.5z",
  store: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  sparkles: "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5zM19 13l1 3 3 1-3 1-1 3-1-3-3-1 3-1zM5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5z"
}


// Map business types to icons and colors
export const businessTypeConfig: Record<string, BusinessTypeConfig> = {
  // Food & Dining
  "bakery": { icon: Croissant, color: "#F59E0B", label: "Boulangerie", iconPath: iconPaths.croissant },
  "Boulangerie": { icon: Croissant, color: "#F59E0B", label: "Boulangerie", iconPath: iconPaths.croissant },
  "restaurant": { icon: UtensilsCrossed, color: "#EF4444", label: "Restaurant", iconPath: iconPaths.utensils },
  "Restaurant": { icon: UtensilsCrossed, color: "#EF4444", label: "Restaurant", iconPath: iconPaths.utensils },
  "cafe": { icon: Coffee, color: "#8B5CF6", label: "Café", iconPath: iconPaths.coffee },
  "Café": { icon: Coffee, color: "#8B5CF6", label: "Café", iconPath: iconPaths.coffee },
  "bar": { icon: Wine, color: "#EC4899", label: "Bar", iconPath: iconPaths.wine },
  "Bar": { icon: Wine, color: "#EC4899", label: "Bar", iconPath: iconPaths.wine },
  
  // Health & Wellness
  "pharmacy": { icon: Pill, color: "#10B981", label: "Pharmacie", iconPath: iconPaths.pill },
  "Pharmacie": { icon: Pill, color: "#10B981", label: "Pharmacie", iconPath: iconPaths.pill },
  "drugstore": { icon: Pill, color: "#10B981", label: "Pharmacie", iconPath: iconPaths.pill },
  "doctor": { icon: Stethoscope, color: "#3B82F6", label: "Docteur", iconPath: iconPaths.stethoscope },
  "Docteur": { icon: Stethoscope, color: "#3B82F6", label: "Docteur", iconPath: iconPaths.stethoscope },
  "dentist": { icon: Stethoscope, color: "#06B6D4", label: "Dentiste", iconPath: iconPaths.stethoscope },
  "Dentiste": { icon: Stethoscope, color: "#06B6D4", label: "Dentiste", iconPath: iconPaths.stethoscope },
  "gym": { icon: Dumbbell, color: "#F97316", label: "Gym", iconPath: iconPaths.dumbbell },
  "Gym": { icon: Dumbbell, color: "#F97316", label: "Gym", iconPath: iconPaths.dumbbell },
  "spa": { icon: Sparkles, color: "#A855F7", label: "Spa", iconPath: iconPaths.sparkles },
  "Spa": { icon: Sparkles, color: "#A855F7", label: "Spa", iconPath: iconPaths.sparkles },
  
  // Beauty & Personal Care
  "beauty salon": { icon: Scissors, color: "#EC4899", label: "Salon de beauté", iconPath: iconPaths.scissors },
  "Salon de beauté": { icon: Scissors, color: "#EC4899", label: "Salon de beauté", iconPath: iconPaths.scissors },
  "hair care": { icon: Scissors, color: "#F472B6", label: "Salon de coiffure", iconPath: iconPaths.scissors },
  "Salon de coiffure": { icon: Scissors, color: "#F472B6", label: "Salon de coiffure", iconPath: iconPaths.scissors },
  
  // Retail & Shopping
  "clothing store": { icon: Shirt, color: "#8B5CF6", label: "Boutique de vêtements", iconPath: iconPaths.shirt },
  "Boutique de vêtements": { icon: Shirt, color: "#8B5CF6", label: "Boutique de vêtements", iconPath: iconPaths.shirt },
  "shoe store": { icon: ShoppingBag, color: "#6366F1", label: "Boutique de chaussures", iconPath: iconPaths.shoppingBag },
  "Boutique de chaussures": { icon: ShoppingBag, color: "#6366F1", label: "Boutique de chaussures", iconPath: iconPaths.shoppingBag },
  "jewelry store": { icon: Gem, color: "#F59E0B", label: "Boutique de bijoux", iconPath: iconPaths.gem },
  "Boutique de bijoux": { icon: Gem, color: "#F59E0B", label: "Boutique de bijoux", iconPath: iconPaths.gem },
  "book store": { icon: BookOpen, color: "#84CC16", label: "Boutique de livres", iconPath: iconPaths.book },
  "Boutique de livres": { icon: BookOpen, color: "#84CC16", label: "Boutique de livres", iconPath: iconPaths.book },
  "bicycle store": { icon: Bike, color: "#22C55E", label: "Boutique de vélo", iconPath: iconPaths.bike },
  "Boutique de vélo": { icon: Bike, color: "#22C55E", label: "Boutique de vélo", iconPath: iconPaths.bike },
  "furniture store": { icon: Sofa, color: "#78716C", label: "Boutique de meubles", iconPath: iconPaths.sofa },
  "Boutique de meubles": { icon: Sofa, color: "#78716C", label: "Boutique de meubles", iconPath: iconPaths.sofa },
  "florist": { icon: Flower2, color: "#F43F5E", label: "Boutique de fleurs", iconPath: iconPaths.flower },
  "Boutique de fleurs": { icon: Flower2, color: "#F43F5E", label: "Boutique de fleurs", iconPath: iconPaths.flower },
  
  // Automotive
  "car dealer": { icon: Car, color: "#3B82F6", label: "Vendeur de voitures", iconPath: iconPaths.car },
  "Vendeur de voitures": { icon: Car, color: "#3B82F6", label: "Vendeur de voitures", iconPath: iconPaths.car },
  "car rental": { icon: Car, color: "#0EA5E9", label: "Location de voitures", iconPath: iconPaths.car },
  "Location de voitures": { icon: Car, color: "#0EA5E9", label: "Location de voitures", iconPath: iconPaths.car },
  "car repair": { icon: Wrench, color: "#64748B", label: "Réparation de voitures", iconPath: iconPaths.wrench },
  "Réparation de voitures": { icon: Wrench, color: "#64748B", label: "Réparation de voitures", iconPath: iconPaths.wrench },
  "gas station": { icon: Fuel, color: "#EF4444", label: "Station d'essence", iconPath: iconPaths.fuel },
  "Station d'essence": { icon: Fuel, color: "#EF4444", label: "Station d'essence", iconPath: iconPaths.fuel },
  
  // Professional Services
  "bank": { icon: Building2, color: "#1E40AF", label: "Banque", iconPath: iconPaths.building },
  "Banque": { icon: Building2, color: "#1E40AF", label: "Banque", iconPath: iconPaths.building },
  "accounting": { icon: Briefcase, color: "#475569", label: "Comptabilité", iconPath: iconPaths.briefcase },
  "Comptabilité": { icon: Briefcase, color: "#475569", label: "Comptabilité", iconPath: iconPaths.briefcase },
  "lawyer": { icon: Scale, color: "#7C3AED", label: "Avocat", iconPath: iconPaths.scale },
  "Avocat": { icon: Scale, color: "#7C3AED", label: "Avocat", iconPath: iconPaths.scale },
  "insurance agency": { icon: Briefcase, color: "#0891B2", label: "Agence d'assurance", iconPath: iconPaths.briefcase },
  "Agence d'assurance": { icon: Briefcase, color: "#0891B2", label: "Agence d'assurance", iconPath: iconPaths.briefcase },
  "real estate agency": { icon: Home, color: "#059669", label: "Agence immobilière", iconPath: iconPaths.home },
  "Agence immobilière": { icon: Home, color: "#059669", label: "Agence immobilière", iconPath: iconPaths.home },
  
  // Entertainment
  "movie theater": { icon: Film, color: "#DC2626", label: "Cinéma", iconPath: iconPaths.film },
  "Cinéma": { icon: Film, color: "#DC2626", label: "Cinéma", iconPath: iconPaths.film },
  "art gallery": { icon: Palette, color: "#A855F7", label: "Galerie d'art", iconPath: iconPaths.palette },
  "Galerie d'art": { icon: Palette, color: "#A855F7", label: "Galerie d'art", iconPath: iconPaths.palette },
  
  // Travel & Services
  "travel agency": { icon: Plane, color: "#0EA5E9", label: "Agence de voyage", iconPath: iconPaths.plane },
  "Agence de voyage": { icon: Plane, color: "#0EA5E9", label: "Agence de voyage", iconPath: iconPaths.plane },
  "veterinary care": { icon: PawPrint, color: "#22C55E", label: "Soins vétérinaires", iconPath: iconPaths.pawPrint },
  "Soins vétérinaires": { icon: PawPrint, color: "#22C55E", label: "Soins vétérinaires", iconPath: iconPaths.pawPrint },
  "pet store": { icon: PawPrint, color: "#F97316", label: "Boutique de chiens", iconPath: iconPaths.pawPrint },
  "Boutique de chiens": { icon: PawPrint, color: "#F97316", label: "Boutique de chiens", iconPath: iconPaths.pawPrint },
}

// Default config for unknown types
export const defaultBusinessConfig: BusinessTypeConfig = {
  icon: Store,
  color: "#6B7280",
  label: "Commerce",
  iconPath: iconPaths.store
}

/**
 * Get the configuration for a business type
 */
export function getBusinessTypeConfig(types: string[]): BusinessTypeConfig {
  for (const type of types) {
    const config = businessTypeConfig[type]
    if (config) return config
  }
  return defaultBusinessConfig
}

/**
 * Generate an SVG marker with icon inside a colored circle - Airbnb style
 */
export function generateMarkerWithIcon(config: BusinessTypeConfig): string {
  const { color, iconPath } = config
  
  return `
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.2"/>
        </filter>
      </defs>
      <circle cx="24" cy="24" r="20" fill="${color}" filter="url(#shadow)"/>
      <g transform="translate(12, 12)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="${iconPath}"/>
      </g>
    </svg>
  `
}

/**
 * Generate a simple colored circle marker (fallback)
 */
export function generateDetailedMarkerSvg(config: BusinessTypeConfig): string {
  return generateMarkerWithIcon(config)
}
