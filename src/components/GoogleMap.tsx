import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useMemo } from "react"
import { getBusinessTypeConfig, generateMarkerWithIcon } from "@/utils/businessTypeIcons"
import { useTheme } from "@/components/theme-provider"

interface FacadeMarker {
  id: string
  name: string
  coordinates: { lat: number; lng: number }
  address: string
  types: string[]
  score?: number | null
}

interface GoogleMapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  radius?: number
  facades?: FacadeMarker[]
  onAddressChange?: (address: string, coordinates: { lat: number; lng: number }) => void
  className?: string
  /** Color mode for markers: 'businessType' uses business category colors, 'score' uses score-based colors */
  colorMode?: 'businessType' | 'score'
}

export interface GoogleMapRef {
  searchAddress: (address: string) => void
  getCurrentLocation: () => void
}

const GoogleMap = forwardRef<GoogleMapRef, GoogleMapProps>(({
  center = { lat: 48.8566, lng: 2.3522 }, // Default to Paris
  zoom = 13,
  radius = 500,
  facades = [],
  onAddressChange,
  className = "",
  colorMode = 'score'
}, ref) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)
  const [circle, setCircle] = useState<google.maps.Circle | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const facadeMarkersRef = useRef<google.maps.Marker[]>([])
  const { theme } = useTheme()

  // Create a stable reference for facades
  const memoizedFacades = useMemo(() => facades, [facades])

  // Dark mode styles for Google Maps
  const darkModeStyles = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ]

  // Light mode styles
  const lightModeStyles = [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    }
  ]

  useEffect(() => {
    const initMap = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY

      if (!apiKey) {
        setError("Google Maps API key not found")
        return
      }

      // Ensure the map container is available and has dimensions
      if (!mapRef.current) {
        // console.warn("Map container not available")
        return
      }

      // Check if the container has dimensions
      const rect = mapRef.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        // console.warn("Map container has no dimensions, waiting for visibility...")

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
        // Load Google Maps script dynamically
        if (!window.google) {
          const script = document.createElement('script')
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&v=weekly`
          script.async = true
          script.defer = true

          await new Promise<void>((resolve, reject) => {
            script.onload = () => {
              // Add a small delay to ensure Google Maps is fully initialized
              setTimeout(resolve, 100)
            }
            script.onerror = () => reject(new Error('Failed to load Google Maps script'))
            document.head.appendChild(script)
          })
        }

        // Double-check the container is still available
        if (!mapRef.current) {
          // console.warn("Map container became unavailable")
          return
        }

        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center,
          zoom,
          styles: theme === 'dark' ? darkModeStyles : lightModeStyles
        })

        // Create marker
        const markerInstance = new window.google.maps.Marker({
          position: center,
          map: mapInstance,
          draggable: true,
          title: "Zone de scan"
        })

        // Create circle
        const circleInstance = new window.google.maps.Circle({
          strokeColor: "#12658bff",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#0ea5e9",
          fillOpacity: 0.2,
          map: mapInstance,
          center,
          radius,
          clickable: false // Allow clicks to pass through to the map
        } as google.maps.CircleOptions)

        // Add marker drag listener
        markerInstance.addListener("dragend", () => {
          const position = markerInstance.getPosition()
          if (position) {
            const lat = position.lat()
            const lng = position.lng()

            circleInstance.setCenter({ lat, lng })

            // Reverse geocoding to get address
            const geocoder = new window.google.maps.Geocoder()
            geocoder.geocode({ location: { lat, lng } }, (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
              if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
                const address = results[0].formatted_address
                onAddressChange?.(address, { lat, lng })
              }
            })
          }
        })

        // Add map click listener
        mapInstance.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const lat = event.latLng.lat()
            const lng = event.latLng.lng()

            markerInstance.setPosition({ lat, lng })
            circleInstance.setCenter({ lat, lng })

            // Reverse geocoding
            const geocoder = new window.google.maps.Geocoder()
            geocoder.geocode({ location: { lat, lng } }, (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
              if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
                const address = results[0].formatted_address
                onAddressChange?.(address, { lat, lng })
              }
            })
          }
        })

        setMap(mapInstance)
        setMarker(markerInstance)
        setCircle(circleInstance)
        setIsLoaded(true)
      } catch (err) {
        console.error("Error loading Google Maps:", err)
        setError("Failed to load Google Maps")
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, onAddressChange, radius]) // Removed 'center' to prevent reinitialization on every click

  // Handle center changes without reinitializing the map
  useEffect(() => {
    if (map && marker) {
      const currentPosition = marker.getPosition()
      if (currentPosition) {
        const currentLat = currentPosition.lat()
        const currentLng = currentPosition.lng()

        // Only update if the center has actually changed significantly
        const distance = Math.sqrt(
          Math.pow(currentLng - center.lng, 2) +
          Math.pow(currentLat - center.lat, 2)
        )

        // Only update if the distance is significant (more than ~10 meters in degrees)
        if (distance > 0.0001) {
          map.setCenter({ lat: center.lat, lng: center.lng })
          marker.setPosition({ lat: center.lat, lng: center.lng })

          // Update circle position
          if (circle) {
            circle.setCenter({ lat: center.lat, lng: center.lng })
          }
        }
      }
    }
  }, [center, map, marker, circle])

  // Update map styles when theme changes
  useEffect(() => {
    if (map) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map as any).setOptions({
        styles: theme === 'dark' ? darkModeStyles : lightModeStyles
      })
    }
  }, [theme, map, darkModeStyles, lightModeStyles])

  // Inject custom CSS for map controls based on theme
  useEffect(() => {
    const styleId = 'google-maps-theme-controls'
    let styleElement = document.getElementById(styleId) as HTMLStyleElement

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    if (theme === 'dark') {
      styleElement.textContent = `
        .gm-style .gm-style-cc,
        .gm-style .gm-style-cc a,
        .gm-style .gm-style-mtc,
        .gm-style .gm-style-mtc div {
          color: #e5e7eb !important;
        }
        
        .gm-style button {
          background-color: #1f2937 !important;
          border: 1px solid #374151 !important;
        }
        
        .gm-style button:hover {
          background-color: #374151 !important;
        }
        
        .gm-style button img {
          filter: invert(1) !important;
        }
        
        .gm-style .gm-style-iw-c {
          background-color: #1f2937 !important;
          color: #e5e7eb !important;
        }
        
        .gm-style .gm-style-iw-d {
          color: #e5e7eb !important;
        }
        
        .gm-style .gm-style-iw-t::after {
          background: #1f2937 !important;
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

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
      }
    }
  }, [])

  // Cleanup facade markers on unmount
  useEffect(() => {
    return () => {
      facadeMarkersRef.current.forEach(marker => {
        marker.setMap(null)
      })
    }
  }, [])

  // Update circle radius when radius prop changes
  useEffect(() => {
    if (circle) {
      circle.setRadius(radius)
    }
  }, [radius, circle])

  // Handle facade markers
  useEffect(() => {
    if (!map || !window.google) return

    // console.log('===========================================')
    // console.log('=== GOOGLE MAP RECEIVED FACADES ===')
    // console.log(`Total facades: ${memoizedFacades.length}`)
    memoizedFacades.forEach((facade, idx) => {
      // console.log(`[${idx}] ${facade.name}`)
      // console.log(`    coordinates object:`, facade.coordinates)
      // console.log(`    lat: ${facade.coordinates.lat} (type: ${typeof facade.coordinates.lat})`)
      // console.log(`    lng: ${facade.coordinates.lng} (type: ${typeof facade.coordinates.lng})`)
    })
    // console.log('===========================================')

    // Clear existing facade markers
    facadeMarkersRef.current.forEach(marker => {
      marker.setMap(null)
    })

    // When facades are loaded, zoom to fit all markers
    if (memoizedFacades.length > 0 && window.google && window.google.maps) {
      try {
        // Create bounds using proper Google Maps API with type assertion
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const googleMaps = window.google.maps as any
        const bounds = new googleMaps.LatLngBounds()
        
        // Include all facade markers in bounds
        memoizedFacades.forEach(facade => {
          bounds.extend(new googleMaps.LatLng(facade.coordinates.lat, facade.coordinates.lng))
        })
        
        // Also include the circle bounds if available
        if (circle) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const circleBounds = (circle as any).getBounds()
          if (circleBounds) {
            bounds.union(circleBounds)
          }
        }
        
        // Fit map to show all markers with padding
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map as any).fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })
      } catch (error) {
        console.error('Error fitting bounds:', error)
      }
    }

    // Track currently open info window to close it when another opens
    let currentInfoWindow: google.maps.InfoWindow | null = null

    // Helper to get score-based color configuration
    const getScoreConfig = (score: number | null | undefined) => {
      const s = score ?? 0
      if (s >= 75) {
        return { color: '#10b981', label: 'Bon', bgColor: '#d1fae5' } // emerald/green
      } else if (s >= 40) {
        return { color: '#f59e0b', label: 'Moyen', bgColor: '#fef3c7' } // amber/yellow
      } else {
        return { color: '#ef4444', label: 'Critique', bgColor: '#fee2e2' } // red
      }
    }

    // Generate score-based marker SVG
    const generateScoreMarker = (score: number | null | undefined, typeConfig: ReturnType<typeof getBusinessTypeConfig>) => {
      const scoreConfig = getScoreConfig(score)

      return `
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Background Glow -->
          <circle cx="24" cy="24" r="22" fill="${scoreConfig.color}" fill-opacity="0.1"/>
          
          <!-- Main Circle -->
          <circle cx="24" cy="24" r="16" fill="${scoreConfig.color}" />
          

          <!-- Inner Color Circle -->
          <circle cx="24" cy="24" r="14" fill="${scoreConfig.color}" />
          
          <!-- Icon -->
          <g transform="translate(12, 12)">
            <path d="${typeConfig.iconPath}" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </g>
        </svg>
      `
    }

    // Create new facade markers with color based on colorMode
    const newMarkers = memoizedFacades.map((facade, index) => {
      console.log(`[CREATING MARKER ${index + 1}/${memoizedFacades.length}] ${facade.name}`)
      console.log(`  Position: lat=${facade.coordinates.lat}, lng=${facade.coordinates.lng}`)
      console.log(`  Score: ${facade.score}`)
      console.log(`  Types: ${facade.types.join(', ')}`)
      
      // Validate coordinates before creating marker
      if (!facade.coordinates || 
          typeof facade.coordinates.lat !== 'number' || 
          typeof facade.coordinates.lng !== 'number' ||
          isNaN(facade.coordinates.lat) || 
          isNaN(facade.coordinates.lng)) {
        console.error(`[MARKER ERROR] Invalid coordinates for ${facade.name}:`, facade.coordinates)
        return null
      }
      
      // Get the business type configuration for this facade
      const typeConfig = getBusinessTypeConfig(facade.types)

      // Choose marker style based on colorMode
      let markerSvg: string
      let primaryColor: string

      if (colorMode === 'businessType') {
        // Use business type colors
        markerSvg = generateMarkerWithIcon(typeConfig)
        primaryColor = typeConfig.color
      } else {
        // Use score-based colors (default)
        markerSvg = generateScoreMarker(facade.score, typeConfig)
        primaryColor = getScoreConfig(facade.score).color
      }

      const scoreConfig = getScoreConfig(facade.score)

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
      
      const markerPosition = marker.getPosition()
      console.log(`[MARKER CREATED] ${facade.name} - marker position:`, markerPosition ? { lat: markerPosition.lat(), lng: markerPosition.lng() } : 'null')

      // Helper to convert hex to rgba
      const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
      };

      // Create modern styled info window content
      // Use primaryColor for header styling (business type or score based on mode)
      const infoWindowContent = `
        <style>
        .gm-style-iw-ch{
        padding: 0 !important; 
        }
          .gm-style-iw-c { 
            padding: 0 !important; 
            border-radius: 16px !important; 
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            background: #ffffff !important;
          }
          .gm-style-iw-d { 
            overflow: visible !important; 
            max-height: none !important; 
          }
          .gm-style-iw-tc { display: none !important; }
          .gm-ui-hover-effect { 
           display: none !important;
          }
        </style>
        <div style="
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          width: 280px;
          border-radius: 16px;
          background: #ffffff;
          overflow: hidden;
          padding: 0 !important;
        ">

          <!-- Dynamic Header -->
          <div style="
            position: relative; 
            height: 100px; 
            background: linear-gradient(to bottom right, ${primaryColor}, ${hexToRgba(primaryColor, 0.8)}); 
            overflow: hidden;
            display: flex;
            align-items: center;
            padding: 0 20px;
          ">
            <div style="
              width: 54px;
              height: 54px;
              border-radius: 14px;
              background: rgba(255, 255, 255, 0.2);
              backdrop-filter: blur(8px);
              -webkit-backdrop-filter: blur(8px);
              border: 1px solid rgba(255, 255, 255, 0.25);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
              z-index: 1;
            ">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="${typeConfig.iconPath}" />
              </svg>
            </div>
            
            <div style="margin-left: 16px; z-index: 1;">
              <div style="
                font-size: 10px; 
                font-weight: 700; 
                color: rgba(255, 255, 255, 0.9); 
                text-transform: uppercase; 
                letter-spacing: 0.05em;
                margin-bottom: 2px;
              ">
                ${typeConfig.label}
              </div>
              <div style="
                font-size: 18px; 
                font-weight: 800; 
                color: white; 
                line-height: 1.1;
                max-width: 170px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              ">
                ${facade.name}
              </div>
            </div>
          </div>

          <!-- Body Content -->
          <div style="padding: 16px 20px;">
            
            <!-- Address Row -->
            <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 24px;">
              <div style="margin-top: 2px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <p style="
                margin: 0;
                font-size: 13px;
                font-weight: 500;
                color: #64748b;
                line-height: 1.5;
              ">
                ${facade.address}
              </p>
            </div>

            <!-- Analysis Status -->
            <div style="
              background: #f8fafc;
              border-radius: 12px;
              padding: 16px;
              border: 1px solid #f1f5f9;
            ">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <span style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.02em;">Analyse</span>
                <span style="
                  font-size: 11px; 
                  font-weight: 700; 
                  padding: 3px 8px; 
                  border-radius: 6px; 
                  background: ${hexToRgba(scoreConfig.color, 0.15)};
                  color: ${scoreConfig.color};
                ">
                  ${scoreConfig.label}
                </span>
              </div>
              
              <div style="display: flex; align-items: baseline; gap: 4px; margin-bottom: 6px;">
                <span style="font-size: 32px; font-weight: 900; color: #1e293b; line-height: 1;">${facade.score ?? 0}</span>
                <span style="font-size: 14px; font-weight: 600; color: #94a3b8;">/100</span>
              </div>
              
              <!-- Premium Progress Bar -->
              <div style="
                height: 8px; 
                width: 100%; 
                background: #e2e8f0; 
                border-radius: 10px; 
                overflow: hidden;
              ">
                <div style="
                  width: ${facade.score ?? 0}%; 
                  height: 100%; 
                  background: linear-gradient(to right, ${scoreConfig.color}, ${hexToRgba(scoreConfig.color, 0.8)}); 
                  border-radius: 10px;
                  box-shadow: 0 4px 8px ${hexToRgba(scoreConfig.color, 0.2)};
                "></div>
              </div>
            </div>
          </div>
        </div>
      `;


      // Create info window with custom styling
      const infoWindow = new window.google.maps.InfoWindow({
        content: infoWindowContent
      })

      // Open on click
      marker.addListener('click', () => {
        if (currentInfoWindow) {
          currentInfoWindow.close()
        }
        infoWindow.open(map, marker)
        currentInfoWindow = infoWindow
      })

      // Open on hover
      marker.addListener('mouseover', () => {
        if (currentInfoWindow) {
          currentInfoWindow.close()
        }
        infoWindow.open(map, marker)
        currentInfoWindow = infoWindow
      })
      marker.addListener('mouseout', () => {
        infoWindow.close()
      });

      return marker
    }).filter(marker => marker !== null) as google.maps.Marker[]

    console.log(`[MARKERS SUMMARY] Created ${newMarkers.length} markers out of ${memoizedFacades.length} facades`)

    // Update ref
    facadeMarkersRef.current = newMarkers
  }, [map, memoizedFacades, circle, colorMode])

  // Handle search functionality
  const searchAddress = async (address: string) => {
    if (!map || !address.trim() || !window.google) return

    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ address }, (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
      if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
        const location = results[0].geometry.location
        const lat = location.lat()
        const lng = location.lng()

        map.setCenter({ lat, lng })
        marker?.setPosition({ lat, lng })
        circle?.setCenter({ lat, lng })

        onAddressChange?.(results[0].formatted_address, { lat, lng })
      }
    })
  }

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude

          map?.setCenter({ lat, lng })
          marker?.setPosition({ lat, lng })
          circle?.setCenter({ lat, lng })

          // Reverse geocoding
          if (window.google) {
            const geocoder = new window.google.maps.Geocoder()
            geocoder.geocode({ location: { lat, lng } }, (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
              if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
                const address = results[0].formatted_address
                onAddressChange?.(address, { lat, lng })
              }
            })
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
            Vérifiez que votre clé API Google Maps est configurée dans VITE_GOOGLE_MAP_API_KEY
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

GoogleMap.displayName = "GoogleMap"

export default GoogleMap