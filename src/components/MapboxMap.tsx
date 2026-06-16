import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from "react"
import { useTheme } from "@/components/theme-provider"

interface MapboxMapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  radius?: number
  onAddressChange?: (address: string, coordinates: { lat: number; lng: number }) => void
  className?: string
}

export interface MapboxMapRef {
  searchAddress: (address: string) => void
  getCurrentLocation: () => void
}

// Declare Mapbox types
declare global {
  interface Window {
    mapboxgl: {
      accessToken: string
      Map: new (options: {
        container: HTMLElement
        style: string
        center: [number, number]
        zoom: number
      }) => {
        on: (event: string, callback: Function) => void
        addSource: (id: string, source: any) => void
        addLayer: (layer: any) => void
        getSource: (id: string) => any
        flyTo: (options: { center: [number, number]; duration?: number; zoom?: number }) => void
        fitBounds: (bounds: any, options?: any) => void
        setStyle: (style: string) => void
      }
      Marker: new (options?: { draggable?: boolean; color?: string }) => {
        setLngLat: (lngLat: [number, number]) => any
        addTo: (map: any) => any
        on: (event: string, callback: Function) => void
        getLngLat: () => { lng: number; lat: number }
      }
      LngLatBounds: new () => {
        extend: (lngLat: [number, number]) => void
      }
    }
  }
}

const MapboxMap = forwardRef<MapboxMapRef, MapboxMapProps>(({
  center = { lat: 48.8566, lng: 2.3522 }, // Default to Paris
  zoom = 13,
  radius = 500,
  onAddressChange,
  className = ""
}, ref) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<ReturnType<typeof window.mapboxgl.Marker.prototype.setLngLat> | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { theme } = useTheme()

  // Create a geographic circle for radius visualization
  const createCircle = useCallback((centerCoords: [number, number], radiusInMeters: number) => {
    const points = 64
    const coords = []



    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI
      const dx = radiusInMeters * Math.cos(angle)
      const dy = radiusInMeters * Math.sin(angle)

      // Convert meters to degrees (approximate)
      const deltaLat = dy / 111320
      const deltaLng = dx / (111320 * Math.cos(centerCoords[1] * Math.PI / 180))

      coords.push([
        centerCoords[0] + deltaLng,
        centerCoords[1] + deltaLat
      ])
    }

    // Close the circle
    coords.push(coords[0])

    const circle = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coords]
      }
    }


    return circle
  }, [])

  useEffect(() => {
    const initMap = async () => {
      const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

      if (!accessToken) {
        setError("Mapbox access token not found")
        return
      }

      // Ensure the map container is available and has dimensions
      if (!mapRef.current) {
        console.warn("Map container not available")
        return
      }

      // Check if the container has dimensions
      const rect = mapRef.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        console.warn("Map container has no dimensions, waiting for visibility...")

        // Use ResizeObserver to wait for the container to have dimensions
        if (typeof ResizeObserver !== 'undefined') {
          const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
              resizeObserver.disconnect()
              setTimeout(() => initMap(), 50)
            }
          })

          resizeObserver.observe(mapRef.current)
        } else {
          // Fallback: retry after a delay
          setTimeout(() => initMap(), 200)
        }
        return
      }

      try {
        // Load Mapbox GL JS dynamically
        if (!window.mapboxgl) {
          // Load CSS
          const cssLink = document.createElement('link')
          cssLink.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css'
          cssLink.rel = 'stylesheet'
          document.head.appendChild(cssLink)

          // Load JS
          const script = document.createElement('script')
          script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js'
          script.async = true

          await new Promise<void>((resolve, reject) => {
            script.onload = () => {
              setTimeout(resolve, 100)
            }
            script.onerror = () => reject(new Error('Failed to load Mapbox GL JS'))
            document.head.appendChild(script)
          })
        }

        // Double-check the container is still available
        if (!mapRef.current) {
          console.warn("Map container became unavailable")
          return
        }

        // Set access token
        window.mapboxgl.accessToken = accessToken

        // Create map instance with theme-based style
        const mapStyle = theme === 'dark'
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/streets-v12'

        const mapInstance = new window.mapboxgl.Map({
          container: mapRef.current,
          style: mapStyle,
          center: [center.lng, center.lat], // Mapbox uses [lng, lat]
          zoom: zoom
        })

        // Wait for map to load
        mapInstance.on('load', () => {
          // Create marker
          const markerInstance = new window.mapboxgl.Marker({
            draggable: true,
            color: '#0ea5e9'
          })
            .setLngLat([center.lng, center.lat])
            .addTo(mapInstance)

          // Add circle source and layer for radius visualization
          mapInstance.addSource('radius-circle', {
            type: 'geojson',
            data: createCircle([center.lng, center.lat], radius)
          })

          mapInstance.addLayer({
            id: 'radius-circle-fill',
            type: 'fill',
            source: 'radius-circle',
            paint: {
              'fill-color': '#0ea5e9',
              'fill-opacity': 0.2
            }
          })

          mapInstance.addLayer({
            id: 'radius-circle-stroke',
            type: 'line',
            source: 'radius-circle',
            paint: {
              'line-color': '#0ea5e9',
              'line-width': 2,
              'line-opacity': 0.8
            }
          })

          // Add marker drag listener
          markerInstance.on('dragend', () => {
            const lngLat = markerInstance.getLngLat()
            const lat = lngLat.lat
            const lng = lngLat.lng

            // Update circle position
            mapInstance.getSource('radius-circle').setData(createCircle([lng, lat], radius))

            // Reverse geocoding
            reverseGeocode(lng, lat)
          })

          // Add map click listener
          mapInstance.on('click', (e: { lngLat: { lng: number; lat: number } }) => {
            const lng = e.lngLat.lng
            const lat = e.lngLat.lat

            markerInstance.setLngLat([lng, lat])

            // Update circle position
            mapInstance.getSource('radius-circle').setData(createCircle([lng, lat], radius))

            // Reverse geocoding
            reverseGeocode(lng, lat)
          })

          // Fit map to show the circle
          const bounds = new window.mapboxgl.LngLatBounds()
          const radiusInDegrees = radius / 111320 // Approximate conversion
          bounds.extend([center.lng - radiusInDegrees, center.lat - radiusInDegrees])
          bounds.extend([center.lng + radiusInDegrees, center.lat + radiusInDegrees])

          mapInstance.fitBounds(bounds, {
            padding: 50,
            maxZoom: 15
          })

          setMap(mapInstance)
          setMarker(markerInstance)
          setIsLoaded(true)
        })

      } catch (err) {
        console.error("Error loading Mapbox:", err)
        setError("Failed to load Mapbox")
      }
    }

    // Reverse geocoding function
    const reverseGeocode = async (lng: number, lat: number) => {
      try {
        const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}`
        )
        const data = await response.json()

        if (data.features && data.features.length > 0) {
          const address = data.features[0].place_name
          onAddressChange?.(address, { lat, lng })
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error)
      }
    }

    // Clear any existing timeout
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current)
    }

    // Add a small delay to ensure the component is fully mounted
    initTimeoutRef.current = setTimeout(() => {
      initMap()
    }, 50)

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
      }
    }
  }, [zoom, onAddressChange, radius]) // Removed 'center' to prevent reinitialization

  // Handle center changes without reinitializing the map
  useEffect(() => {
    if (map && marker) {
      // Only update if the center has actually changed significantly
      const currentLngLat = marker.getLngLat()
      const distance = Math.sqrt(
        Math.pow(currentLngLat.lng - center.lng, 2) +
        Math.pow(currentLngLat.lat - center.lat, 2)
      )

      // Only update if the distance is significant (more than ~10 meters in degrees)
      if (distance > 0.0001) {
        map.flyTo({
          center: [center.lng, center.lat],
          duration: 1000
        })
        marker.setLngLat([center.lng, center.lat])

        // Update circle position
        if (map.getSource('radius-circle')) {
          map.getSource('radius-circle').setData(createCircle([center.lng, center.lat], radius))
        }
      }
    }
  }, [center.lat, center.lng, map, marker, radius, createCircle])

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
      }
    }
  }, [])

  // Update map style when theme changes
  useEffect(() => {
    if (map) {
      const mapStyle = theme === 'dark'
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/streets-v12'
      map.setStyle(mapStyle)
    }
  }, [theme, map])

  // Inject custom CSS for Mapbox controls based on theme
  useEffect(() => {
    const styleId = 'mapbox-theme-controls'
    let styleElement = document.getElementById(styleId) as HTMLStyleElement

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    if (theme === 'dark') {
      styleElement.textContent = `
        .mapboxgl-ctrl-group {
          background-color: #1f2937 !important;
          border: 1px solid #374151 !important;
        }
        
        .mapboxgl-ctrl-group button {
          background-color: #1f2937 !important;
          color: #e5e7eb !important;
        }
        
        .mapboxgl-ctrl-group button:hover {
          background-color: #374151 !important;
        }
        
        .mapboxgl-ctrl-group button + button {
          border-top: 1px solid #374151 !important;
        }
        
        .mapboxgl-ctrl button .mapboxgl-ctrl-icon {
          filter: invert(1) !important;
        }
        
        .mapboxgl-ctrl-attrib {
          background-color: rgba(31, 41, 55, 0.8) !important;
          color: #e5e7eb !important;
        }
        
        .mapboxgl-ctrl-attrib a {
          color: #60a5fa !important;
        }
        
        .mapboxgl-popup-content {
          background-color: #1f2937 !important;
          color: #e5e7eb !important;
        }
        
        .mapboxgl-popup-tip {
          border-top-color: #1f2937 !important;
          border-bottom-color: #1f2937 !important;
        }
      `
    } else {
      styleElement.textContent = ''
    }

    return () => {
      // Cleanup on unmount
      const el = document.getElementById(styleId)
      if (el) {
        el.textContent = ''
      }
    }
  }, [theme])

  // Update circle radius when radius prop changes
  useEffect(() => {
    if (map && map.getSource('radius-circle') && marker) {
      const lngLat = marker.getLngLat()
      map.getSource('radius-circle').setData(createCircle([lngLat.lng, lngLat.lat], radius))
    }
  }, [radius, map, marker, createCircle])

  // Handle search functionality
  const searchAddress = async (address: string) => {
    if (!map || !address.trim()) return

    try {
      const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${accessToken}`
      )
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const [lng, lat] = feature.center

        map.flyTo({ center: [lng, lat], zoom: 15 })
        marker?.setLngLat([lng, lat])

        // Update circle position
        if (map.getSource('radius-circle')) {
          map.getSource('radius-circle').setData(createCircle([lng, lat], radius))
        }

        onAddressChange?.(feature.place_name, { lat, lng })
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
  }

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude

          map?.flyTo({ center: [lng, lat], zoom: 15 })
          marker?.setLngLat([lng, lat])

          // Update circle position
          if (map && map.getSource('radius-circle')) {
            map.getSource('radius-circle').setData(createCircle([lng, lat], radius))
          }

          // Reverse geocoding
          try {
            const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}`
            )
            const data = await response.json()

            if (data.features && data.features.length > 0) {
              const address = data.features[0].place_name
              onAddressChange?.(address, { lat, lng })
            }
          } catch (error) {
            console.error('Reverse geocoding error:', error)
          }
        },
        (error) => {
          console.error("Error getting location:", error)
        }
      )
    }
  }

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    searchAddress,
    getCurrentLocation
  }))

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-border ${className}`}>
        <div className="text-center p-8">
          <p className="text-destructive font-medium">Erreur de chargement de la carte</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Vérifiez que votre token Mapbox est configuré dans VITE_MAPBOX_ACCESS_TOKEN
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-border">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
          </div>
        </div>
      )}
    </div>
  )
})

MapboxMap.displayName = "MapboxMap"

export default MapboxMap