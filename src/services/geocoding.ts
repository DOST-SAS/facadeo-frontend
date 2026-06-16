// Geocoding service that works with both Google Places and Mapbox
export interface GeocodingSuggestion {
  id: string
  text: string
  description: string
  coordinates?: { lat: number; lng: number }
}

export class GeocodingService {
  private static mapChoice = import.meta.env.VITE_MAP_CHOICE || 'google'

  static async getSuggestions(query: string): Promise<GeocodingSuggestion[]> {
    if (!query.trim() || query.length < 3) {
      return []
    }

    try {
      if (this.mapChoice === 'mapbox') {
        return await this.getMapboxSuggestions(query)
      } else {
        return await this.getGoogleSuggestions(query)
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      return []
    }
  }

  private static async getMapboxSuggestions(query: string): Promise<GeocodingSuggestion[]> {
    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
    if (!accessToken) {
      return []
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${accessToken}&autocomplete=true&limit=5&types=address,poi`
    )

    if (!response.ok) {
      throw new Error('Mapbox geocoding request failed')
    }

    const data = await response.json()
    
    return data.features?.map((feature: {
      id?: string
      text?: string
      place_name: string
      center: [number, number]
    }, index: number) => ({
      id: feature.id || `mapbox-${index}`,
      text: feature.text || feature.place_name,
      description: feature.place_name,
      coordinates: {
        lat: feature.center[1],
        lng: feature.center[0]
      }
    })) || []
  }

  private static async getGoogleSuggestions(query: string): Promise<GeocodingSuggestion[]> {
    // For Google Places, we'll use the Geocoding API for simplicity
    // In a production app, you might want to use the Places Autocomplete API
    const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY
    if (!apiKey) {
      return []
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}&language=fr&region=fr`
    )

    if (!response.ok) {
      throw new Error('Google geocoding request failed')
    }

    const data = await response.json()
    
    if (data.status !== 'OK') {
      return []
    }

    return data.results?.slice(0, 5).map((result: {
      place_id?: string
      formatted_address: string
      geometry: {
        location: {
          lat: number
          lng: number
        }
      }
    }, index: number) => ({
      id: result.place_id || `google-${index}`,
      text: result.formatted_address.split(',')[0], // First part of address
      description: result.formatted_address,
      coordinates: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      }
    })) || []
  }

  static async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      if (this.mapChoice === 'mapbox') {
        return await this.geocodeWithMapbox(address)
      } else {
        return await this.geocodeWithGoogle(address)
      }
    } catch (error) {
      console.error('Error geocoding address:', error)
      return null
    }
  }

  private static async geocodeWithMapbox(address: string): Promise<{ lat: number; lng: number } | null> {
    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
    if (!accessToken) return null

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${accessToken}&limit=1`
    )

    const data = await response.json()
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center
      return { lat, lng }
    }
    
    return null
  }

  private static async geocodeWithGoogle(address: string): Promise<{ lat: number; lng: number } | null> {
    const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY
    if (!apiKey) return null

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    )

    const data = await response.json()
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return { lat: location.lat, lng: location.lng }
    }
    
    return null
  }
}