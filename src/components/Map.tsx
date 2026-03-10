import { forwardRef } from "react"
import GoogleMap, { type GoogleMapRef } from "./GoogleMap"
import MapboxMap, { type MapboxMapRef } from "./MapboxMap"

interface FacadeMarker {
  id: string
  name: string
  coordinates: { lat: number; lng: number }
  address: string
  types: string[]
  score?: number | null
}

interface MapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  radius?: number
  facades?: FacadeMarker[]
  onAddressChange?: (address: string, coordinates: { lat: number; lng: number }) => void
  className?: string
  /** Color mode for markers: 'businessType' uses business category colors, 'score' uses score-based colors */
  colorMode?: 'businessType' | 'score'
}

export type MapRef = GoogleMapRef | MapboxMapRef

const Map = forwardRef<MapRef, MapProps>((props, ref) => {
  const mapChoice = import.meta.env.VITE_MAP_CHOICE || 'google'
  
  if (mapChoice === 'mapbox') {
    return <MapboxMap ref={ref as React.Ref<MapboxMapRef>} {...props} />
  }
  
  // Default to Google Maps
  return <GoogleMap ref={ref as React.Ref<GoogleMapRef>} {...props} />
})

Map.displayName = "Map"

export default Map