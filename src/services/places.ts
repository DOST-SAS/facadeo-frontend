import { z } from "zod"

// Validation schemas
export const FacadeDetectionInputSchema = z.object({
  coordinates: z.object({
    lat: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
    lng: z.number().min(-180).max(180, "Longitude must be between -180 and 180")
  }),
  radius: z.number().min(100, "Radius must be at least 100m").max(10000, "Radius cannot exceed 10km"),
  types: z.array(z.string()).optional()
})

export type FacadeDetectionInput = z.infer<typeof FacadeDetectionInputSchema>

// Place interfaces - using Google Maps JS SDK types
export interface GooglePlace {
  place_id: string
  name: string
  vicinity: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  types: string[]
  business_status?: string
  rating?: number
  user_ratings_total?: number
  price_level?: number
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
}

export interface DetectedFacade {
  id: string
  name: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  types: string[]
  businessStatus?: string
  rating?: number
  userRatingsTotal?: number
  priceLevel?: number
  photoReference?: string
  distance?: number
  // Additional fields from Place Details API
  formatted_address?: string
  formatted_phone_number?: string
  international_phone_number?: string
  website?: string
}

export interface FacadeDetectionResult {
  facades: DetectedFacade[]
  totalFound: number
  estimatedCost: number
  searchRadius: number
  searchCenter: {
    lat: number
    lng: number
  }
}

export interface FacadeDetectionError {
  code: 'VALIDATION_ERROR' | 'API_ERROR' | 'QUOTA_EXCEEDED' | 'NO_RESULTS' | 'NETWORK_ERROR'
  message: string
  details?: unknown
}

export class PlacesService {
  private static readonly GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_MAP_PLACES_API_KEY
  private static readonly COST_PER_FACADE = 2
  private static readonly BASE_COST = 5
  private static placesService: google.maps.places.PlacesService | null = null

  /**
   * Initialize the Places Service with a map or div element
   */
  static initPlacesService(mapOrElement: google.maps.Map | HTMLDivElement): void {
    this.placesService = new google.maps.places.PlacesService(mapOrElement)
  }

  /**
   * Get or create a PlacesService instance
   */
  private static getPlacesService(): google.maps.places.PlacesService {
    if (this.placesService) {
      return this.placesService
    }

    // Create a hidden div for PlacesService if no map is available
    let attributionDiv = document.getElementById('places-attribution')
    if (!attributionDiv) {
      attributionDiv = document.createElement('div')
      attributionDiv.id = 'places-attribution'
      attributionDiv.style.display = 'none'
      document.body.appendChild(attributionDiv)
    }

    this.placesService = new google.maps.places.PlacesService(attributionDiv as HTMLDivElement)
    return this.placesService
  }

  /**
   * Detect facades within a radius around given coordinates
   */
  static async detectFacades(input: FacadeDetectionInput): Promise<FacadeDetectionResult> {
    // Validate input
    const validationResult = FacadeDetectionInputSchema.safeParse(input)
    if (!validationResult.success) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input parameters',
        details: validationResult.error.issues
      } as FacadeDetectionError
    }

    const { coordinates, radius, types } = validationResult.data

    try {
      // Fetch places using Google Maps JS SDK
      const places = await this.fetchNearbyPlaces(coordinates, radius, types)
      
      // Process and filter places - pass radius and types to ensure only relevant places are included
      const facades = this.processPlaces(places, coordinates, radius, types)
      
      // Enrich facades with detailed information (phone, website, etc.)
      const enrichedFacades = await this.enrichFacadesWithDetails(facades)
      
      // Calculate cost
      const estimatedCost = this.calculateCost(enrichedFacades.length, radius)

      return {
        facades: enrichedFacades,
        totalFound: enrichedFacades.length,
        estimatedCost,
        searchRadius: radius,
        searchCenter: coordinates
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error as FacadeDetectionError
      }
      
      console.error('Unexpected error in facade detection:', error)
      throw {
        code: 'API_ERROR',
        message: 'An unexpected error occurred during facade detection',
        details: error
      } as FacadeDetectionError
    }
  }

  /**
   * Fetch nearby places using Google Maps JavaScript SDK (no CORS issues)
   */
  private static async fetchNearbyPlaces(
    coordinates: { lat: number; lng: number }, 
    radius: number,
    types?: string[]
  ): Promise<GooglePlace[]> {
    // Check if Google Maps is loaded
    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
      throw {
        code: 'API_ERROR',
        message: 'Google Maps JavaScript SDK is not loaded. Make sure the Places library is included.'
      } as FacadeDetectionError
    }

    const service = this.getPlacesService()
    const allPlaces: GooglePlace[] = []

    // If specific types are provided, search for each type
    // Otherwise, use 'establishment' as default
    const searchTypes = types && types.length > 0 ? types : ['establishment']

    // Fetch places for each type
    for (const type of searchTypes) {
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(coordinates.lat, coordinates.lng),
        radius: radius,
        type: type
      }

      const placesForType = await new Promise<GooglePlace[]>((resolve, reject) => {
        const typePlaces: GooglePlace[] = []

        const handleResults = (
          results: google.maps.places.PlaceResult[] | null,
          status: google.maps.places.PlacesServiceStatus,
          pagination: google.maps.places.PlaceSearchPagination | null
        ) => {
          if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
            reject({
              code: 'QUOTA_EXCEEDED',
              message: 'Google Places API quota exceeded. Please try again later.'
            } as FacadeDetectionError)
            return
          }

          if (status !== google.maps.places.PlacesServiceStatus.OK && 
              status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            reject({
              code: 'API_ERROR',
              message: `Google Places API error: ${status}`
            } as FacadeDetectionError)
            return
          }

          if (results && results.length > 0) {
            // Transform PlaceResult to our GooglePlace format
            const transformedPlaces = results.map(place => this.transformPlaceResult(place))
            typePlaces.push(...transformedPlaces)
          }

          // Fetch more results if available and we haven't hit our limit
          if (pagination && pagination.hasNextPage && typePlaces.length < 60) {
            setTimeout(() => {
              pagination.nextPage()
            }, 2000)
          } else {
            resolve(typePlaces)
          }
        }

        service.nearbySearch(request, handleResults)
      })

      allPlaces.push(...placesForType)
    }

    return allPlaces
  }

  /**
   * Transform Google Maps PlaceResult to our GooglePlace format
   */
  private static transformPlaceResult(place: google.maps.places.PlaceResult): GooglePlace {
    // Extract coordinates - handle both function and direct value access
    let lat = 0
    let lng = 0
    
    if (place.geometry?.location) {
      const location = place.geometry.location
      
      // Google Maps LatLng objects have lat() and lng() methods
      // We need to handle this carefully as the type system can be misleading
      try {
        // First, try calling as methods (standard Google Maps LatLng)
        const latFn = location.lat
        const lngFn = location.lng
        
        if (typeof latFn === 'function' && typeof lngFn === 'function') {
          lat = latFn.call(location)
          lng = lngFn.call(location)
        } else {
          // Direct property access (shouldn't happen with real Google Maps API)
          lat = Number(latFn) || 0
          lng = Number(lngFn) || 0
        }
      } catch (e) {
        console.warn('Error extracting coordinates for place:', place.name, e)
        // Last resort: try to access as properties
        try {
          const loc = location as unknown as { lat: number; lng: number }
          lat = Number(loc.lat) || 0
          lng = Number(loc.lng) || 0
        } catch {
          console.error('Failed to extract coordinates for:', place.name)
        }
      }
    }

    const transformedPlace = {
      place_id: place.place_id || '',
      name: place.name || '',
      vicinity: place.vicinity || '',
      geometry: {
        location: {
          lat,
          lng
        }
      },
      types: place.types || [],
      business_status: place.business_status,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      price_level: place.price_level,
      photos: place.photos?.map((photo: google.maps.places.PlacePhoto) => ({
        photo_reference: photo.getUrl({ maxWidth: 400 }),
        height: photo.height,
        width: photo.width
      }))
    }

    // Log each place with its own coordinates immediately after extraction
    console.log(`[RAW DATA] Place: ${transformedPlace.name}`)
    console.log(`  place_id: ${transformedPlace.place_id}`)
    console.log(`  coordinates: { lat: ${transformedPlace.geometry.location.lat}, lng: ${transformedPlace.geometry.location.lng} }`)
    console.log(`  address: ${transformedPlace.vicinity}`)
    console.log(`  types: [${transformedPlace.types.join(', ')}]`)
    console.log('---')

    return transformedPlace
  }

  /**
   * Process and filter places to create facade objects
   */
  private static processPlaces(
    places: GooglePlace[], 
    searchCenter: { lat: number; lng: number },
    radius: number,
    types?: string[]
  ): DetectedFacade[] {
    console.log('===========================================')
    console.log('=== PROCESSING PLACES - INPUT ===')
    console.log(`Total places received: ${places.length}`)
    console.log(`Search radius: ${radius}m`)
    console.log(`Selected types: ${types?.join(', ') || 'all'}`)
    console.log('===========================================')
    
    // Remove duplicates by place_id
    const uniquePlaces = places.filter((place, index, self) => 
      index === self.findIndex(p => p.place_id === place.place_id)
    )

    console.log(`After deduplication: ${uniquePlaces.length} unique places`)

    // Filter and transform places
    const facades: DetectedFacade[] = uniquePlaces
      .filter(place => this.isRelevantBusiness(place, types))
      .map(place => this.transformToFacade(place, searchCenter))
      .filter(facade => facade !== null) as DetectedFacade[]

    console.log(`After filtering and transformation: ${facades.length} facades`)
    
    // Filter facades to only include those within the specified radius
    const facadesWithinRadius = facades.filter(facade => {
      const isWithinRadius = (facade.distance || 0) <= radius
      if (!isWithinRadius) {
        console.log(`[FILTERED OUT] ${facade.name} - distance: ${facade.distance?.toFixed(2)}m > radius: ${radius}m`)
      }
      return isWithinRadius
    })

    console.log(`After radius filtering: ${facadesWithinRadius.length} facades within ${radius}m`)
    
    // Sort by distance (closest first)
    const sortedFacades = facadesWithinRadius.sort((a, b) => (a.distance || 0) - (b.distance || 0))
    
    console.log('===========================================')
    console.log('=== FINAL PROCESSED FACADES ===')
    sortedFacades.forEach((facade, idx) => {
      console.log(`[${idx}] ${facade.name}`)
      console.log(`    RAW coordinates object:`, facade.coordinates)
      console.log(`    lat: ${facade.coordinates.lat} (type: ${typeof facade.coordinates.lat})`)
      console.log(`    lng: ${facade.coordinates.lng} (type: ${typeof facade.coordinates.lng})`)
    })
    console.log('===========================================')
    
    return sortedFacades
  }

  /**
   * Check if a place is a relevant business
   */
  private static isRelevantBusiness(place: GooglePlace, selectedTypes?: string[]): boolean {
    // Filter out places that are not active businesses
    if (place.business_status === 'CLOSED_PERMANENTLY') {
      return false
    }

    // Basic validation - must have name and address
    if (!place.name || !place.vicinity) {
      return false
    }

    // If specific types are selected, check if place matches any of them
    if (selectedTypes && selectedTypes.length > 0) {
      const matchesSelectedType = place.types.some(type => 
        selectedTypes.includes(type)
      )
      
      if (!matchesSelectedType) {
        return false
      }
    } else {
      // If no specific types selected, be more permissive
      // Exclude only generic/administrative types that aren't actual businesses
      const excludedTypes = [
        'political',
        'country',
        'administrative_area_level_1',
        'administrative_area_level_2',
        'administrative_area_level_3',
        'administrative_area_level_4',
        'administrative_area_level_5',
        'locality',
        'sublocality',
        'sublocality_level_1',
        'sublocality_level_2',
        'postal_code',
        'postal_town',
        'route',
        'street_address',
        'intersection',
        'natural_feature',
        'colloquial_area',
        'neighborhood'
      ]

      // Check if place has at least one type that's not in the excluded list
      const hasRelevantType = place.types.some(type => !excludedTypes.includes(type))
      
      if (!hasRelevantType) {
        console.log(`[FILTERED OUT - NO RELEVANT TYPE] ${place.name} - types: ${place.types.join(', ')}`)
        return false
      }
    }

    return true
  }

  /**
   * Transform Google Place to DetectedFacade
   */
  private static transformToFacade(
    place: GooglePlace, 
    searchCenter: { lat: number; lng: number }
  ): DetectedFacade | null {
    try {
      const placeCoords = place.geometry.location
      
      // Validate coordinates - don't use places with invalid coordinates
      if (!placeCoords || (placeCoords.lat === 0 && placeCoords.lng === 0)) {
        console.warn(`[transformToFacade] Skipping ${place.name} - invalid coordinates`)
        return null
      }
      
      const distance = this.calculateDistance(
        searchCenter,
        placeCoords
      )

      const facade = {
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
      
      // Log each facade with its own coordinates after transformation
      console.log(`[EXTRACTED DATA] Facade: ${facade.name}`)
      console.log(`  id: ${facade.id}`)
      console.log(`  coordinates: { lat: ${facade.coordinates.lat}, lng: ${facade.coordinates.lng} }`)
      console.log(`  address: ${facade.address}`)
      console.log(`  types: [${facade.types.join(', ')}]`)
      console.log(`  distance: ${facade.distance?.toFixed(2)}m`)
      console.log('---')
      
      return facade
    } catch (error) {
      console.warn('Failed to transform place to facade:', place.place_id, error)
      return null
    }
  }

  /**
   * Calculate distance between two coordinates in meters
   */
  private static calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = point1.lat * Math.PI / 180
    const φ2 = point2.lat * Math.PI / 180
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  /**
   * Calculate estimated cost for facade detection
   */
  private static calculateCost(facadeCount: number, radius: number): number {
    const radiusFactor = Math.ceil(radius / 1000) // Cost increases with radius
    return this.BASE_COST + (facadeCount * this.COST_PER_FACADE) + radiusFactor
  }

  /**
   * Fetch detailed information for a single place
   */
  static async fetchPlaceDetails(placeId: string): Promise<{
    formatted_address?: string
    formatted_phone_number?: string
    international_phone_number?: string
    website?: string
  }> {
    const service = this.getPlacesService()
    
    return new Promise((resolve) => {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: ['formatted_address', 'formatted_phone_number', 'international_phone_number', 'website']
      }

      service.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve({
            formatted_address: place.formatted_address,
            formatted_phone_number: place.formatted_phone_number,
            international_phone_number: place.international_phone_number,
            website: place.website
          })
        } else {
          // Return empty object if details fetch fails
          resolve({})
        }
      })
    })
  }

  /**
   * Enrich facades with detailed information from Place Details API
   * This fetches additional fields like phone numbers and website
   */
  static async enrichFacadesWithDetails(facades: DetectedFacade[]): Promise<DetectedFacade[]> {
    console.log(`[ENRICHING] Fetching details for ${facades.length} facades...`)
    
    // Fetch details for all facades in parallel with rate limiting
    const enrichedFacades = await Promise.all(
      facades.map(async (facade, index) => {
        // Add small delay to avoid hitting rate limits (100ms between requests)
        await new Promise(resolve => setTimeout(resolve, index * 100))
        
        try {
          const details = await this.fetchPlaceDetails(facade.id)
          console.log(`[ENRICHED] ${facade.name}:`, details)
          
          return {
            ...facade,
            formatted_address: details.formatted_address,
            formatted_phone_number: details.formatted_phone_number,
            international_phone_number: details.international_phone_number,
            website: details.website
          }
        } catch (error) {
          console.warn(`Failed to fetch details for ${facade.name}:`, error)
          return facade
        }
      })
    )

    return enrichedFacades
  }

  /**
   * Get photo URL for a place
   * Note: When using JS SDK, photoReference is already a full URL
   */
  static getPhotoUrl(photoReference: string, _maxWidth: number = 400): string {
    if (!photoReference) {
      return ''
    }

    // If it's already a URL (from JS SDK), return as-is
    if (photoReference.startsWith('http')) {
      return photoReference
    }

    // Fallback for REST API photo references
    if (!this.GOOGLE_PLACES_API_KEY) {
      return ''
    }

    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${_maxWidth}&photo_reference=${photoReference}&key=${this.GOOGLE_PLACES_API_KEY}`
  }
}