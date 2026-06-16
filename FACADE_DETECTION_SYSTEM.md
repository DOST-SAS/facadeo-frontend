# Système de Détection de Façades - Documentation Technique Complète

## Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du système](#architecture-du-système)
3. [Flux de données détaillé](#flux-de-données-détaillé)
4. [Composants principaux](#composants-principaux)
5. [Processus de détection](#processus-de-détection)
6. [Affichage sur la carte](#affichage-sur-la-carte)
7. [Gestion des états](#gestion-des-états)
8. [Optimisations et performances](#optimisations-et-performances)

---

## Vue d'ensemble

### Concept Théorique

Le système de détection de façades est conçu pour identifier et localiser des commerces (boulangeries, restaurants, pharmacies, etc.) 
dans un rayon géographique défini autour d'un point central. L'objectif est de permettre aux artisans de cibler des façades 
commerciales nécessitant potentiellement des travaux de rénovation.

### Principe de Fonctionnement

1. **Sélection de zone** : L'utilisateur définit un point central (coordonnées GPS) et un rayon de recherche
2. **Détection** : Le système interroge l'API Google Places pour trouver tous les établissements dans cette zone
3. **Filtrage** : Les résultats sont filtrés selon des critères métier (types de commerce, statut d'activité)
4. **Affichage** : Les façades détectées sont affichées sur une carte interactive avec des marqueurs personnalisés
5. **Estimation** : Le coût en crédits est calculé en fonction du nombre de façades trouvées

---

## Architecture du Système

### Stack Technique


- **Frontend Framework** : React 18 avec TypeScript
- **State Management** : React Hooks (useState, useEffect, useCallback, useRef, useMemo)
- **Cartographie** : Google Maps JavaScript SDK
- **API Externe** : Google Places API (Nearby Search)
- **Validation** : Zod pour la validation des schémas de données
- **UI Components** : Composants personnalisés (shadcn/ui)
- **Notifications** : React Hot Toast

### Structure des Dossiers

```
src/
├── features/Artisan/scans/
│   └── CreateScan.tsx          # Interface principale de création de scan
├── hooks/
│   └── useFacadeDetection.ts   # Hook personnalisé pour la logique de détection
├── services/
│   └── places.ts               # Service d'interaction avec Google Places API
├── components/
│   ├── Map.tsx                 # Wrapper de sélection de carte (Google/Mapbox)
│   ├── GoogleMap.tsx           # Composant carte Google Maps
│   └── MapSearch.tsx           # Barre de recherche d'adresse
└── utils/
    └── businessTypeIcons.ts    # Configuration des icônes par type de commerce
```

---

## Flux de Données Détaillé

### 1. Initialisation de l'Interface (CreateScan.tsx)



#### États Locaux

```typescript
const [scanName, setScanName] = useState("")                    // Nom du scan
const [address, setAddress] = useState("")                      // Adresse textuelle
const [searchValue, setSearchValue] = useState("")              // Valeur de recherche
const [coordinates, setCoordinates] = useState({                // Position GPS
  lat: 48.8566, 
  lng: 2.3522 
})
const [radius, setRadius] = useState(500)                       // Rayon en mètres
const [selectedTypes, setSelectedTypes] = useState<string[]>([  // Types de commerces
  "Boulangerie", 
  "Restaurant", 
  "Pharmacie"
])
const [launching, setLaunching] = useState(false)               // État de lancement
const [availableCredits, setAvailableCredits] = useState(200)   // Crédits disponibles
```

#### Hook de Détection

```typescript
const {
  isLoading,        // Indique si une détection est en cours
  result,           // Résultat de la détection (FacadeDetectionResult)
  error,            // Erreur éventuelle
  isFound,          // Indique si des façades ont été trouvées
  detectFacades,    // Fonction pour lancer la détection
  reset             // Fonction pour réinitialiser l'état
} = useFacadeDetection()
```

### 2. Interaction Utilisateur avec la Carte



#### a) Chargement de la Carte (GoogleMap.tsx)

**Étape 1 : Vérification de l'API Key**
```typescript
const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY
if (!apiKey) {
  setError("Google Maps API key not found")
  return
}
```

**Étape 2 : Chargement du Script Google Maps**
```typescript
const script = document.createElement('script')
script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&v=weekly`
script.async = true
script.defer = true
```

Les bibliothèques chargées :
- **places** : Pour l'API Places (recherche de lieux)
- **geometry** : Pour les calculs de distance et géométrie

**Étape 3 : Initialisation de la Carte**
```typescript
const mapInstance = new window.google.maps.Map(mapRef.current, {
  center,           // Position initiale
  zoom,             // Niveau de zoom
  styles: [...]     // Styles personnalisés (masquage des POI par défaut)
})
```

**Étape 4 : Création du Marqueur Central**
```typescript
const markerInstance = new window.google.maps.Marker({
  position: center,
  map: mapInstance,
  draggable: true,  // Permet de déplacer le marqueur
  title: "Zone de scan"
})
```



**Étape 5 : Création du Cercle de Rayon**
```typescript
const circleInstance = new window.google.maps.Circle({
  strokeColor: "#12658bff",
  strokeOpacity: 0.8,
  strokeWeight: 2,
  fillColor: "#0ea5e9",
  fillOpacity: 0.2,
  map: mapInstance,
  center,
  radius,           // Rayon en mètres
  clickable: false
})
```

#### b) Événements de la Carte

**Déplacement du Marqueur (Drag & Drop)**
```typescript
markerInstance.addListener("dragend", () => {
  const position = markerInstance.getPosition()
  const lat = position.lat()
  const lng = position.lng()
  
  // Mise à jour du cercle
  circleInstance.setCenter({ lat, lng })
  
  // Géocodage inverse pour obtenir l'adresse
  const geocoder = new window.google.maps.Geocoder()
  geocoder.geocode({ location: { lat, lng } }, (results, status) => {
    if (status === 'OK' && results?.[0]) {
      onAddressChange?.(results[0].formatted_address, { lat, lng })
    }
  })
})
```

**Clic sur la Carte**
```typescript
mapInstance.addListener("click", (event) => {
  const lat = event.latLng.lat()
  const lng = event.latLng.lng()
  
  // Déplacement du marqueur et du cercle
  markerInstance.setPosition({ lat, lng })
  circleInstance.setCenter({ lat, lng })
  
  // Géocodage inverse
  // ... (même logique que dragend)
})
```



### 3. Processus de Détection des Façades

#### a) Déclenchement de la Détection (CreateScan.tsx)

```typescript
const handleFindFacades = async () => {
  // Validation des paramètres
  if (!coordinates || !coordinates.lat || !coordinates.lng) {
    toast.error("Veuillez sélectionner une position sur la carte")
    return
  }
  
  if (!radius || radius < 100) {
    toast.error("Veuillez définir un rayon d'au moins 100 mètres")
    return
  }
  
  // Appel du hook de détection
  await detectFacades({
    coordinates,
    radius
  })
  
  setHasParamsChanged(false)
}
```

#### b) Hook useFacadeDetection

**Structure du Hook**
```typescript
export function useFacadeDetection(): UseFacadeDetectionReturn {
  const [state, setState] = useState<UseFacadeDetectionState>({
    isLoading: false,
    result: null,
    error: null,
    isFound: false
  })
  
  const detectFacades = useCallback(async (input: FacadeDetectionInput) => {
    // Mise à jour de l'état : chargement en cours
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }))
    
    try {
      // Appel du service Places
      const result = await PlacesService.detectFacades(input)
      
      // Mise à jour avec les résultats
      setState(prev => ({
        ...prev,
        isLoading: false,
        result,
        isFound: true,
        error: null
      }))
      
      toast.success(`${result.totalFound} façades détectées`)
      
    } catch (error) {
      // Gestion des erreurs
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as FacadeDetectionError,
        result: null,
        isFound: false
      }))
      
      // Affichage d'un message d'erreur approprié
    }
  }, [])
  
  return { ...state, detectFacades, reset, clearError }
}
```



#### c) Service PlacesService (places.ts)

**Validation des Entrées**
```typescript
static async detectFacades(input: FacadeDetectionInput): Promise<FacadeDetectionResult> {
  // Validation avec Zod
  const validationResult = FacadeDetectionInputSchema.safeParse(input)
  if (!validationResult.success) {
    throw {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input parameters',
      details: validationResult.error.issues
    }
  }
  
  const { coordinates, radius } = validationResult.data
  
  // Suite du processus...
}
```

**Schéma de Validation Zod**
```typescript
export const FacadeDetectionInputSchema = z.object({
  coordinates: z.object({
    lat: z.number()
      .min(-90)
      .max(90, "Latitude must be between -90 and 90"),
    lng: z.number()
      .min(-180)
      .max(180, "Longitude must be between -180 and 180")
  }),
  radius: z.number()
    .min(100, "Radius must be at least 100m")
    .max(10000, "Radius cannot exceed 10km")
})
```

**Recherche de Lieux avec Google Places API**
```typescript
private static async fetchNearbyPlaces(
  coordinates: { lat: number; lng: number }, 
  radius: number
): Promise<GooglePlace[]> {
  // Vérification du chargement de Google Maps
  if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
    throw {
      code: 'API_ERROR',
      message: 'Google Maps JavaScript SDK is not loaded'
    }
  }
  
  const service = this.getPlacesService()
  const allPlaces: GooglePlace[] = []
  
  // Configuration de la requête
  const request: google.maps.places.PlaceSearchRequest = {
    location: new google.maps.LatLng(coordinates.lat, coordinates.lng),
    radius: radius,
    type: 'establishment'  // Tous les établissements
  }
  
  return new Promise((resolve, reject) => {
    const handleResults = (results, status, pagination) => {
      // Gestion des différents statuts
      if (status === 'OVER_QUERY_LIMIT') {
        reject({ code: 'QUOTA_EXCEEDED', message: '...' })
        return
      }
      
      if (status === 'OK' && results && results.length > 0) {
        // Transformation des résultats
        const transformedPlaces = results.map(place => 
          this.transformPlaceResult(place)
        )
        allPlaces.push(...transformedPlaces)
      }
      
      // Pagination : récupération des résultats suivants
      if (pagination && pagination.hasNextPage && allPlaces.length < 60) {
        setTimeout(() => {
          pagination.nextPage()
        }, 2000)  // Délai requis par Google
      } else {
        resolve(allPlaces)
      }
    }
    
    service.nearbySearch(request, handleResults)
  })
}
```



**Transformation des Résultats Google Places**
```typescript
private static transformPlaceResult(place: google.maps.places.PlaceResult): GooglePlace {
  let lat = 0
  let lng = 0
  
  if (place.geometry?.location) {
    const location = place.geometry.location
    
    // Extraction des coordonnées
    // Google Maps LatLng a des méthodes lat() et lng()
    try {
      const latFn = location.lat
      const lngFn = location.lng
      
      if (typeof latFn === 'function' && typeof lngFn === 'function') {
        lat = latFn.call(location)
        lng = lngFn.call(location)
      } else {
        // Accès direct aux propriétés (fallback)
        lat = Number(latFn) || 0
        lng = Number(lngFn) || 0
      }
    } catch (e) {
      console.warn('Error extracting coordinates:', e)
    }
  }
  
  return {
    place_id: place.place_id || '',
    name: place.name || '',
    vicinity: place.vicinity || '',
    geometry: {
      location: { lat, lng }
    },
    types: place.types || [],
    business_status: place.business_status,
    rating: place.rating,
    user_ratings_total: place.user_ratings_total,
    price_level: place.price_level,
    photos: place.photos?.map(photo => ({
      photo_reference: photo.getUrl({ maxWidth: 400 }),
      height: photo.height,
      width: photo.width
    }))
  }
}
```

**Traitement et Filtrage des Lieux**
```typescript
private static processPlaces(
  places: GooglePlace[], 
  searchCenter: { lat: number; lng: number }
): DetectedFacade[] {
  // Suppression des doublons par place_id
  const uniquePlaces = places.filter((place, index, self) => 
    index === self.findIndex(p => p.place_id === place.place_id)
  )
  
  // Filtrage et transformation
  const facades: DetectedFacade[] = uniquePlaces
    .filter(place => this.isRelevantBusiness(place))
    .map(place => this.transformToFacade(place, searchCenter))
    .filter(facade => facade !== null) as DetectedFacade[]
  
  // Tri par distance (plus proche en premier)
  return facades.sort((a, b) => (a.distance || 0) - (b.distance || 0))
}
```



**Filtrage des Commerces Pertinents**
```typescript
private static isRelevantBusiness(place: GooglePlace): boolean {
  // Exclusion des commerces fermés définitivement
  if (place.business_status === 'CLOSED_PERMANENTLY') {
    return false
  }
  
  // Vérification des types de commerce pertinents
  const relevantTypes = place.types.some(type => 
    businessPlaces.includes(type) ||  // Types prédéfinis
    type.includes('store') || 
    type.includes('shop') ||
    type === 'establishment'
  )
  
  return relevantTypes && Boolean(place.name) && Boolean(place.vicinity)
}
```

**Transformation en Façade Détectée**
```typescript
private static transformToFacade(
  place: GooglePlace, 
  searchCenter: { lat: number; lng: number }
): DetectedFacade | null {
  try {
    const placeCoords = place.geometry.location
    
    // Validation des coordonnées
    if (!placeCoords || (placeCoords.lat === 0 && placeCoords.lng === 0)) {
      return null
    }
    
    // Calcul de la distance par rapport au centre
    const distance = this.calculateDistance(searchCenter, placeCoords)
    
    return {
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      coordinates: {
        lat: placeCoords.lat,
        lng: placeCoords.lng
      },
      types: place.types,
      businessStatus: place.business_status,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      priceLevel: place.price_level,
      photoReference: place.photos?.[0]?.photo_reference,
      distance
    }
  } catch (error) {
    console.warn('Failed to transform place:', error)
    return null
  }
}
```

**Calcul de Distance (Formule de Haversine)**
```typescript
private static calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371e3  // Rayon de la Terre en mètres
  
  // Conversion en radians
  const φ1 = point1.lat * Math.PI / 180
  const φ2 = point2.lat * Math.PI / 180
  const Δφ = (point2.lat - point1.lat) * Math.PI / 180
  const Δλ = (point2.lng - point1.lng) * Math.PI / 180
  
  // Formule de Haversine
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  
  return R * c  // Distance en mètres
}
```



**Calcul du Coût**
```typescript
private static calculateCost(facadeCount: number, radius: number): number {
  const BASE_COST = 5
  const COST_PER_FACADE = 2
  
  const radiusFactor = Math.ceil(radius / 1000)  // Coût augmente avec le rayon
  
  return BASE_COST + (facadeCount * COST_PER_FACADE) + radiusFactor
}
```

**Résultat Final**
```typescript
return {
  facades,                    // Tableau de DetectedFacade
  totalFound: facades.length, // Nombre total de façades
  estimatedCost,              // Coût en crédits
  searchRadius: radius,       // Rayon de recherche
  searchCenter: coordinates   // Centre de recherche
}
```

---

## Affichage sur la Carte

### 1. Réception des Résultats (CreateScan.tsx)

```typescript
useEffect(() => {
  if (isFound && facadeResult && facadeResult.totalFound > 0) {
    // Affichage de l'alerte de confirmation
    setOpenalert(true)
    
    // Les façades sont automatiquement passées au composant Map
  }
}, [isFound, facadeResult])
```

### 2. Transmission au Composant Map

```typescript
<Map
  ref={mapRef}
  center={coordinates}
  zoom={13}
  radius={radius}
  facades={facadeResult?.facades.map(facade => ({
    id: facade.id,
    name: facade.name,
    coordinates: facade.coordinates,
    address: facade.address,
    types: facade.types
  })) || []}
  onAddressChange={handleAddressChange}
/>
```



### 3. Création des Marqueurs de Façades (GoogleMap.tsx)

```typescript
useEffect(() => {
  if (!map || !window.google) return
  
  // Nettoyage des marqueurs existants
  facadeMarkersRef.current.forEach(marker => {
    marker.setMap(null)
  })
  
  // Zoom pour afficher toutes les façades
  if (memoizedFacades.length > 0 && circle) {
    const circleBounds = circle.getBounds()
    if (circleBounds) {
      map.fitBounds(circleBounds)
    }
  }
  
  // Variable pour gérer les info windows
  let currentInfoWindow = null
  
  // Création des nouveaux marqueurs
  const newMarkers = memoizedFacades.map(facade => {
    // 1. Obtenir la configuration du type de commerce
    const typeConfig = getBusinessTypeConfig(facade.types)
    
    // 2. Générer le SVG du marqueur avec l'icône
    const markerSvg = generateMarkerWithIcon(typeConfig)
    
    // 3. Créer le marqueur Google Maps
    const marker = new window.google.maps.Marker({
      position: facade.coordinates,
      map: map,
      title: facade.name,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(markerSvg),
        scaledSize: new window.google.maps.Size(48, 48),
        anchor: new window.google.maps.Point(24, 24)
      }
    })
    
    // 4. Créer le contenu de l'info window
    const infoWindowContent = createInfoWindowContent(facade, typeConfig)
    
    // 5. Créer l'info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: infoWindowContent
    })
    
    // 6. Événements d'ouverture
    marker.addListener('click', () => {
      if (currentInfoWindow) currentInfoWindow.close()
      infoWindow.open(map, marker)
      currentInfoWindow = infoWindow
    })
    
    marker.addListener('mouseover', () => {
      if (currentInfoWindow) currentInfoWindow.close()
      infoWindow.open(map, marker)
      currentInfoWindow = infoWindow
    })
    
    return marker
  })
  
  // Mise à jour de la référence
  facadeMarkersRef.current = newMarkers
}, [map, memoizedFacades, circle])
```



### 4. Configuration des Icônes par Type de Commerce

**Structure de Configuration (businessTypeIcons.ts)**
```typescript
export interface BusinessTypeConfig {
  icon: LucideIcon        // Composant d'icône Lucide
  color: string           // Couleur hexadécimale
  label: string           // Label en français
  iconPath: string        // Chemin SVG de l'icône
}

export const businessTypeConfig: Record<string, BusinessTypeConfig> = {
  "bakery": { 
    icon: Croissant, 
    color: "#F59E0B", 
    label: "Boulangerie", 
    iconPath: "M4.5 9.5c0-1.5..." 
  },
  "restaurant": { 
    icon: UtensilsCrossed, 
    color: "#EF4444", 
    label: "Restaurant", 
    iconPath: "M3 2v7c0..." 
  },
  // ... autres types
}
```

**Sélection de la Configuration**
```typescript
export function getBusinessTypeConfig(types: string[]): BusinessTypeConfig {
  // Parcourir les types du lieu
  for (const type of types) {
    const config = businessTypeConfig[type]
    if (config) return config
  }
  
  // Configuration par défaut si aucun type ne correspond
  return defaultBusinessConfig
}
```

**Génération du Marqueur SVG**
```typescript
export function generateMarkerWithIcon(config: BusinessTypeConfig): string {
  const { color, iconPath } = config
  
  return `
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.2"/>
        </filter>
      </defs>
      
      <!-- Cercle de fond avec ombre -->
      <circle cx="24" cy="24" r="20" fill="${color}" filter="url(#shadow)"/>
      
      <!-- Icône blanche au centre -->
      <g transform="translate(12, 12)" 
         fill="none" 
         stroke="#ffffff" 
         stroke-width="2" 
         stroke-linecap="round" 
         stroke-linejoin="round">
        <path d="${iconPath}"/>
      </g>
    </svg>
  `
}
```



### 5. Info Window Personnalisée

**Structure HTML/CSS Inline**
```typescript
const infoWindowContent = `
  <style>
    .gm-style-iw-c { 
      padding: 0 !important; 
      border-radius: 20px !important; 
      box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important; 
    }
    .gm-style-iw-d { 
      overflow: visible !important; 
      max-height: none !important; 
    }
  </style>
  
  <div style="width: 280px; border-radius: 20px; background: #ffffff;">
    <!-- En-tête avec icône -->
    <div style="background: linear-gradient(...); padding: 32px 20px;">
      <div style="width: 56px; height: 56px; border-radius: 14px;">
        <svg>...</svg>
      </div>
    </div>
    
    <!-- Corps -->
    <div style="padding: 20px;">
      <h3>${facade.name}</h3>
      <span>${typeConfig.label}</span>
      <p>${facade.address}</p>
      <p>${facade.types.slice(0, 3).join(' • ')}</p>
    </div>
  </div>
`
```

---

## Gestion des États

### 1. Détection des Changements de Paramètres

```typescript
const [hasParamsChanged, setHasParamsChanged] = useState(false)
const prevParamsRef = useRef({ radius, address, selectedTypes, untreatedSince })

useEffect(() => {
  const prev = prevParamsRef.current
  const paramsChanged = 
    prev.radius !== radius || 
    prev.address !== address || 
    prev.selectedTypes !== selectedTypes || 
    prev.untreatedSince !== untreatedSince
  
  // Réinitialisation si les paramètres ont changé après une détection
  if (paramsChanged && isFound) {
    setHasParamsChanged(true)
    resetFacadeDetection()
  }
  
  // Mise à jour de la référence
  prevParamsRef.current = { radius, address, selectedTypes, untreatedSince }
}, [radius, address, selectedTypes, untreatedSince, resetFacadeDetection, isFound])
```

**Pourquoi cette approche ?**
- Évite les détections inutiles
- Informe l'utilisateur que les résultats ne sont plus valides
- Force une nouvelle détection si les paramètres changent



### 2. États du Bouton de Détection

```typescript
<Button
  variant="default"
  disabled={loading || (isFound && !hasParamsChanged)}
  onClick={handleFindFacades}
>
  {loading ? (
    <>
      <Loader className="h-5 w-5 animate-spin" />
      Calcul en cours
    </>
  ) : (
    <>
      <Search className="h-5 w-5" />
      {isFound ? "Re-détecter les façades" : "Détecter les façades"}
    </>
  )}
</Button>
```

**États possibles :**
1. **Initial** : "Détecter les façades" (activé)
2. **Chargement** : "Calcul en cours" avec spinner (désactivé)
3. **Résultats trouvés** : "Re-détecter les façades" (désactivé si pas de changement)
4. **Paramètres modifiés** : "Re-détecter les façades" (activé)

### 3. Gestion de la Boîte de Dialogue de Confirmation

```typescript
useEffect(() => {
  if (isFound && facadeResult && facadeResult.totalFound > 0) {
    setOpenalert(true)
  }
}, [isFound, facadeResult])
```

**Contenu de la boîte de dialogue :**
```typescript
<AlertDialog open={openalert} onOpenChange={setOpenalert}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirmer le scan</AlertDialogTitle>
      <AlertDialogDescription>
        Voulez-vous vraiment lancer ce scan ? 
        (Cela débitera {cost} crédits)
      </AlertDialogDescription>
    </AlertDialogHeader>
    
    <!-- Estimation -->
    <div>
      <div>Estimation: {estimatedFacades} façades</div>
      <div>Coût estimé: {cost} crédits</div>
    </div>
    
    <!-- Vérification des crédits -->
    {cost > availableCredits ? (
      <div>Crédits insuffisants ({availableCredits} disponibles)</div>
    ) : (
      <div>Crédits suffisants ({availableCredits} disponibles)</div>
    )}
    
    <AlertDialogFooter>
      <AlertDialogCancel>Annuler</AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleLaunchScan}
        disabled={launching || cost > availableCredits}
      >
        Lancer le scan
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```



---

## Optimisations et Performances

### 1. Mémoïsation des Façades

```typescript
const memoizedFacades = useMemo(() => facades, [facades])
```

**Pourquoi ?**
- Évite la recréation des marqueurs à chaque render
- Améliore les performances lors des mises à jour de l'UI
- Réduit les appels inutiles à l'API Google Maps

### 2. Utilisation de useCallback

```typescript
const handleAddressChange = useCallback((newAddress, newCoordinates) => {
  setAddress(newAddress)
  setCoordinates(newCoordinates)
}, [])

const handleSearch = useCallback((searchAddress) => {
  mapRef.current?.searchAddress(searchAddress)
}, [])
```

**Avantages :**
- Évite la recréation des fonctions à chaque render
- Stabilise les références pour les composants enfants
- Réduit les re-renders inutiles

### 3. Nettoyage des Marqueurs

```typescript
useEffect(() => {
  return () => {
    facadeMarkersRef.current.forEach(marker => {
      marker.setMap(null)
    })
  }
}, [])
```

**Importance :**
- Libère la mémoire
- Évite les fuites mémoire
- Supprime les listeners d'événements

### 4. Gestion de la Pagination Google Places

```typescript
if (pagination && pagination.hasNextPage && allPlaces.length < 60) {
  setTimeout(() => {
    pagination.nextPage()
  }, 2000)  // Délai obligatoire de 2 secondes
} else {
  resolve(allPlaces)
}
```

**Limites :**
- Maximum 60 résultats par recherche (3 pages de 20)
- Délai de 2 secondes entre chaque page (requis par Google)
- Gestion asynchrone avec Promises



### 5. Initialisation Différée de la Carte

```typescript
useEffect(() => {
  const initMap = async () => {
    // Vérification des dimensions du conteneur
    const rect = mapRef.current.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      // Attendre que le conteneur ait des dimensions
      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          resizeObserver.disconnect()
          setTimeout(() => initMap(), 50)
        }
      })
      resizeObserver.observe(mapRef.current)
      return
    }
    
    // Initialisation de la carte...
  }
  
  // Délai pour s'assurer que le composant est monté
  const timeout = setTimeout(() => initMap(), 50)
  
  return () => clearTimeout(timeout)
}, [])
```

**Pourquoi cette complexité ?**
- Évite les erreurs d'initialisation sur des conteneurs invisibles
- Gère les cas de chargement asynchrone
- Assure une initialisation propre de Google Maps

### 6. Gestion des Coordonnées Google Maps LatLng

```typescript
// Google Maps LatLng a des méthodes lat() et lng()
const latFn = location.lat
const lngFn = location.lng

if (typeof latFn === 'function' && typeof lngFn === 'function') {
  lat = latFn.call(location)
  lng = lngFn.call(location)
} else {
  // Fallback pour accès direct
  lat = Number(latFn) || 0
  lng = Number(lngFn) || 0
}
```

**Problème résolu :**
- Google Maps LatLng n'est pas un objet simple
- Les coordonnées sont accessibles via des méthodes, pas des propriétés
- Nécessite une gestion spéciale pour l'extraction

---

## Flux Complet Résumé

```
1. INITIALISATION
   └─> Chargement de CreateScan.tsx
       └─> Initialisation des états locaux
       └─> Initialisation du hook useFacadeDetection
       └─> Chargement du composant Map
           └─> Chargement du script Google Maps
           └─> Création de la carte, marqueur central, cercle

2. INTERACTION UTILISATEUR
   └─> Déplacement du marqueur ou clic sur la carte
       └─> Mise à jour des coordonnées
       └─> Géocodage inverse pour obtenir l'adresse
       └─> Mise à jour de l'état dans CreateScan

3. CONFIGURATION
   └─> Ajustement du rayon (slider)
   └─> Sélection des types de commerces
   └─> Saisie du nom du scan

4. DÉTECTION
   └─> Clic sur "Détecter les façades"
       └─> Validation des paramètres
       └─> Appel de detectFacades() du hook
           └─> Appel de PlacesService.detectFacades()
               └─> Validation Zod des entrées
               └─> Appel de fetchNearbyPlaces()
                   └─> Requête Google Places API (nearbySearch)
                   └─> Gestion de la pagination
                   └─> Transformation des résultats
               └─> Traitement des lieux (processPlaces)
                   └─> Suppression des doublons
                   └─> Filtrage (isRelevantBusiness)
                   └─> Transformation (transformToFacade)
                   └─> Calcul des distances
                   └─> Tri par distance
               └─> Calcul du coût
               └─> Retour du résultat
           └─> Mise à jour de l'état du hook
           └─> Affichage du toast de succès

5. AFFICHAGE
   └─> Mise à jour de l'état isFound
       └─> Déclenchement du useEffect dans CreateScan
           └─> Ouverture de la boîte de dialogue
           └─> Passage des façades au composant Map
               └─> Déclenchement du useEffect dans GoogleMap
                   └─> Nettoyage des anciens marqueurs
                   └─> Zoom pour afficher le cercle
                   └─> Création des nouveaux marqueurs
                       └─> Pour chaque façade :
                           └─> Obtention de la config du type
                           └─> Génération du SVG du marqueur
                           └─> Création du marqueur Google Maps
                           └─> Création de l'info window
                           └─> Ajout des listeners (click, hover)

6. LANCEMENT DU SCAN
   └─> Clic sur "Lancer le scan" dans la boîte de dialogue
       └─> Vérification des crédits
       └─> Déduction des crédits
       └─> Fermeture de la boîte de dialogue
       └─> Réinitialisation de l'état
       └─> Affichage du toast de succès
```



---

## Structures de Données

### FacadeDetectionInput
```typescript
{
  coordinates: {
    lat: number,    // -90 à 90
    lng: number     // -180 à 180
  },
  radius: number    // 100 à 10000 mètres
}
```

### GooglePlace (Résultat brut de Google Places)
```typescript
{
  place_id: string,
  name: string,
  vicinity: string,
  geometry: {
    location: {
      lat: number,
      lng: number
    }
  },
  types: string[],
  business_status?: string,
  rating?: number,
  user_ratings_total?: number,
  price_level?: number,
  photos?: Array<{
    photo_reference: string,
    height: number,
    width: number
  }>
}
```

### DetectedFacade (Façade transformée)
```typescript
{
  id: string,
  name: string,
  address: string,
  coordinates: {
    lat: number,
    lng: number
  },
  types: string[],
  businessStatus?: string,
  rating?: number,
  userRatingsTotal?: number,
  priceLevel?: number,
  photoReference?: string,
  distance?: number  // Distance en mètres par rapport au centre
}
```

### FacadeDetectionResult (Résultat final)
```typescript
{
  facades: DetectedFacade[],
  totalFound: number,
  estimatedCost: number,
  searchRadius: number,
  searchCenter: {
    lat: number,
    lng: number
  }
}
```

### BusinessTypeConfig (Configuration d'icône)
```typescript
{
  icon: LucideIcon,
  color: string,      // Couleur hexadécimale
  label: string,      // Label en français
  iconPath: string    // Chemin SVG
}
```



---

## Gestion des Erreurs

### Types d'Erreurs

```typescript
type FacadeDetectionErrorCode = 
  | 'VALIDATION_ERROR'    // Paramètres invalides
  | 'API_ERROR'           // Erreur de l'API Google
  | 'QUOTA_EXCEEDED'      // Quota API dépassé
  | 'NO_RESULTS'          // Aucun résultat trouvé
  | 'NETWORK_ERROR'       // Erreur réseau

interface FacadeDetectionError {
  code: FacadeDetectionErrorCode,
  message: string,
  details?: unknown
}
```

### Gestion dans le Hook

```typescript
catch (error) {
  const facadeError = error as FacadeDetectionError
  
  setState(prev => ({
    ...prev,
    isLoading: false,
    error: facadeError,
    result: null,
    isFound: false
  }))
  
  // Messages d'erreur personnalisés
  switch (facadeError.code) {
    case 'VALIDATION_ERROR':
      toast.error('Paramètres invalides. Vérifiez les coordonnées et le rayon.')
      break
    case 'QUOTA_EXCEEDED':
      toast.error('Quota API dépassé. Réessayez plus tard.')
      break
    case 'NO_RESULTS':
      toast.error('Aucune façade trouvée dans cette zone.')
      break
    case 'NETWORK_ERROR':
      toast.error('Erreur de connexion. Vérifiez votre connexion internet.')
      break
    default:
      toast.error(facadeError.message || 'Erreur lors de la détection des façades.')
  }
}
```

### Affichage des Erreurs dans l'UI

```typescript
{facadeError && (
  <div className="flex items-center gap-3 p-3 bg-destructive/5 rounded-sm">
    <X className="h-5 w-5 text-destructive" />
    <div>
      <p className="font-semibold text-destructive">Erreur de détection</p>
      <p className="text-muted-foreground">{facadeError.message}</p>
    </div>
  </div>
)}
```

---

## Variables d'Environnement Requises

```env
# Clé API Google Maps (avec Places API activée)
VITE_GOOGLE_MAP_API_KEY=your_google_maps_api_key

# Clé API Google Places (peut être la même que Maps)
VITE_GOOGLE_MAP_PLACES_API_KEY=your_google_places_api_key

# Choix de la carte (google ou mapbox)
VITE_MAP_CHOICE=google
```

### Configuration Google Cloud Platform

1. **Activer les APIs nécessaires :**
   - Maps JavaScript API
   - Places API
   - Geocoding API

2. **Restrictions recommandées :**
   - Restriction par domaine (HTTP referrers)
   - Restriction par API (limiter aux APIs utilisées)
   - Quotas journaliers

3. **Coûts estimés :**
   - Maps JavaScript API : Gratuit jusqu'à 28,000 chargements/mois
   - Places API (Nearby Search) : $32 pour 1000 requêtes
   - Geocoding API : $5 pour 1000 requêtes



---

## Limitations et Contraintes

### Limitations Google Places API

1. **Nombre de résultats :**
   - Maximum 60 résultats par recherche (3 pages de 20)
   - Pagination avec délai obligatoire de 2 secondes entre les pages

2. **Rayon de recherche :**
   - Maximum 50,000 mètres (50 km)
   - Dans notre implémentation : limité à 10,000 mètres (10 km)

3. **Types de lieux :**
   - Un seul type par requête
   - Dans notre implémentation : type 'establishment' pour tous les commerces

4. **Quotas :**
   - Limite de requêtes par jour selon le plan Google Cloud
   - Coût par requête selon le type d'API utilisé

### Limitations Techniques

1. **Performance :**
   - Temps de réponse variable selon le nombre de résultats
   - Pagination asynchrone peut prendre plusieurs secondes

2. **Précision :**
   - Dépend de la qualité des données Google Places
   - Certains commerces peuvent ne pas être référencés
   - Les coordonnées peuvent être approximatives

3. **Filtrage :**
   - Le filtrage par type de commerce se fait côté client
   - Tous les établissements sont récupérés, puis filtrés
   - Peut entraîner des coûts API inutiles

---

## Améliorations Possibles

### Court Terme

1. **Cache des Résultats**
   ```typescript
   // Stocker les résultats en localStorage ou IndexedDB
   const cacheKey = `facades_${lat}_${lng}_${radius}`
   const cachedResult = localStorage.getItem(cacheKey)
   if (cachedResult) {
     return JSON.parse(cachedResult)
   }
   ```

2. **Filtrage Côté Serveur**
   - Créer un backend pour gérer les requêtes Google Places
   - Filtrer les résultats avant de les envoyer au client
   - Réduire la bande passante et améliorer les performances

3. **Debouncing des Changements de Rayon**
   ```typescript
   const debouncedRadius = useDebounce(radius, 500)
   // Utiliser debouncedRadius pour les calculs
   ```



### Moyen Terme

1. **Clustering des Marqueurs**
   ```typescript
   import { MarkerClusterer } from "@googlemaps/markerclusterer"
   
   const clusterer = new MarkerClusterer({
     map,
     markers: facadeMarkers
   })
   ```

2. **Filtrage Dynamique**
   - Permettre de filtrer les façades affichées sans nouvelle détection
   - Filtres par type, note, distance, etc.

3. **Export des Résultats**
   - Export CSV des façades détectées
   - Export PDF avec carte et liste
   - Intégration avec un CRM

4. **Historique des Scans**
   - Sauvegarder les scans précédents
   - Comparer les résultats dans le temps
   - Suivre l'évolution des commerces

### Long Terme

1. **Intelligence Artificielle**
   - Prédiction de la probabilité de besoin de rénovation
   - Analyse des photos de façades (si disponibles)
   - Scoring automatique des opportunités

2. **Intégration Multi-Sources**
   - Combiner Google Places avec d'autres sources (OpenStreetMap, etc.)
   - Enrichissement des données avec des APIs tierces
   - Validation croisée des informations

3. **Mode Hors Ligne**
   - Téléchargement des zones pour utilisation hors ligne
   - Synchronisation automatique lors de la reconnexion
   - Cache intelligent des données

4. **Optimisation des Coûts API**
   - Système de cache distribué
   - Agrégation des requêtes
   - Utilisation d'APIs alternatives moins coûteuses

---

## Debugging et Logs

### Logs de Développement

Le système inclut plusieurs points de logging pour faciliter le debugging :

```typescript
// Dans transformPlaceResult
console.log(`[PlacesService] Transformed ${place.name}: lat=${lat}, lng=${lng}`)

// Dans transformToFacade
console.log(`[transformToFacade] ${place.name} - returning:`, {
  lat: facade.coordinates.lat,
  lng: facade.coordinates.lng
})

// Dans CreateScan (useEffect)
console.log('=== RAW FACADE DATA ===')
facadeResult.facades.forEach((f, idx) => {
  console.log(`Facade ${idx}: ${f.name}`)
  console.log('  - coordinates object:', f.coordinates)
  console.log('  - lat:', f.coordinates.lat)
  console.log('  - lng:', f.coordinates.lng)
})
```

### Outils de Debugging Recommandés

1. **React DevTools**
   - Inspection des états et props
   - Profiling des performances
   - Détection des re-renders inutiles

2. **Google Maps Platform Console**
   - Monitoring des requêtes API
   - Analyse des coûts
   - Détection des erreurs

3. **Network Tab (DevTools)**
   - Inspection des requêtes Places API
   - Vérification des temps de réponse
   - Analyse des payloads



---

## Sécurité

### Protection de la Clé API

1. **Variables d'Environnement**
   - Ne jamais commiter les clés API dans le code
   - Utiliser des fichiers .env (exclus du git)
   - Différentes clés pour dev/staging/production

2. **Restrictions Google Cloud**
   ```
   Application restrictions:
   - HTTP referrers (web sites)
     - https://yourdomain.com/*
     - https://*.yourdomain.com/*
   
   API restrictions:
   - Restrict key to specific APIs
     - Maps JavaScript API
     - Places API
     - Geocoding API
   ```

3. **Backend Proxy (Recommandé)**
   ```typescript
   // Au lieu d'appeler directement Google Places
   const response = await fetch('/api/places/nearby', {
     method: 'POST',
     body: JSON.stringify({ coordinates, radius })
   })
   
   // Le backend gère la clé API de manière sécurisée
   ```

### Validation des Données

1. **Validation Zod**
   - Toutes les entrées utilisateur sont validées
   - Protection contre les injections
   - Typage strict avec TypeScript

2. **Sanitization**
   ```typescript
   // Nettoyage des entrées textuelles
   const sanitizedName = scanName.trim().slice(0, 100)
   const sanitizedAddress = address.trim()
   ```

---

## Tests

### Tests Unitaires Recommandés

```typescript
// places.test.ts
describe('PlacesService', () => {
  describe('calculateDistance', () => {
    it('should calculate correct distance between two points', () => {
      const point1 = { lat: 48.8566, lng: 2.3522 }
      const point2 = { lat: 48.8606, lng: 2.3376 }
      const distance = PlacesService.calculateDistance(point1, point2)
      expect(distance).toBeCloseTo(1200, -2) // ~1.2km
    })
  })
  
  describe('isRelevantBusiness', () => {
    it('should filter out permanently closed businesses', () => {
      const place = {
        business_status: 'CLOSED_PERMANENTLY',
        types: ['restaurant'],
        name: 'Test',
        vicinity: 'Test'
      }
      expect(PlacesService.isRelevantBusiness(place)).toBe(false)
    })
  })
})
```

### Tests d'Intégration

```typescript
// useFacadeDetection.test.ts
describe('useFacadeDetection', () => {
  it('should detect facades successfully', async () => {
    const { result } = renderHook(() => useFacadeDetection())
    
    await act(async () => {
      await result.current.detectFacades({
        coordinates: { lat: 48.8566, lng: 2.3522 },
        radius: 500
      })
    })
    
    expect(result.current.isFound).toBe(true)
    expect(result.current.result?.facades.length).toBeGreaterThan(0)
  })
})
```

### Tests E2E

```typescript
// createScan.e2e.test.ts
describe('Create Scan Flow', () => {
  it('should complete full scan creation flow', async () => {
    // 1. Charger la page
    await page.goto('/scans/create')
    
    // 2. Cliquer sur la carte
    await page.click('.map-container', { position: { x: 200, y: 200 } })
    
    // 3. Ajuster le rayon
    await page.fill('input[type="range"]', '1000')
    
    // 4. Lancer la détection
    await page.click('button:has-text("Détecter les façades")')
    
    // 5. Vérifier les résultats
    await expect(page.locator('.alert-dialog')).toBeVisible()
    await expect(page.locator('text=/\\d+ façades/')).toBeVisible()
  })
})
```

---

## Conclusion

Le système de détection de façades est une solution complète qui combine :

1. **Interface Utilisateur Intuitive**
   - Carte interactive
   - Contrôles simples
   - Feedback visuel immédiat

2. **Architecture Robuste**
   - Séparation des responsabilités
   - Gestion d'état prévisible
   - Code maintenable et testable

3. **Intégration API Efficace**
   - Utilisation optimale de Google Places
   - Gestion des erreurs complète
   - Performance optimisée

4. **Expérience Utilisateur Soignée**
   - Marqueurs personnalisés par type
   - Info windows détaillées
   - Notifications claires

Le système est prêt pour la production avec quelques améliorations recommandées pour l'optimisation des coûts et des performances à grande échelle.

---

**Dernière mise à jour :** 26 Décembre 2025  
**Version :** 1.0.0  
**Auteur :** Équipe Facadeo
