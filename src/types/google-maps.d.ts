declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: HTMLElement, opts?: MapOptions)
      setCenter(latLng: LatLng | LatLngLiteral): void
      addListener(eventName: string, handler: Function): void
    }

    class Marker {
      constructor(opts?: MarkerOptions)
      setPosition(latLng: LatLng | LatLngLiteral): void
      getPosition(): LatLng | undefined
      setMap(map: Map | null): void
      addListener(eventName: string, handler: Function): void
    }

    class Circle {
      constructor(opts?: CircleOptions)
      setCenter(center: LatLng | LatLngLiteral): void
      setRadius(radius: number): void
    }

    class LatLng {
      constructor(lat: number, lng: number)
      lat(): number
      lng(): number
    }

    class Geocoder {
      constructor()
      geocode(request: GeocoderRequest, callback: (results: GeocoderResult[], status: GeocoderStatus) => void): void
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral
      zoom?: number
      styles?: MapTypeStyle[]
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral
      map?: Map
      draggable?: boolean
      title?: string
      icon?: string | MarkerIcon
    }

    interface MarkerIcon {
      url: string
      scaledSize?: Size
      anchor?: Point
    }

    class Size {
      constructor(width: number, height: number)
    }

    class Point {
      constructor(x: number, y: number)
    }

    class InfoWindow {
      constructor(opts?: InfoWindowOptions)
      open(map?: Map, anchor?: Marker): void
      setContent(content: string): void
      close(): void
    }

    interface InfoWindowOptions {
      content?: string
      position?: LatLng | LatLngLiteral
    }

    interface CircleOptions {
      strokeColor?: string
      strokeOpacity?: number
      strokeWeight?: number
      fillColor?: string
      fillOpacity?: number
      map?: Map
      center?: LatLng | LatLngLiteral
      radius?: number
    }

    interface LatLngLiteral {
      lat: number
      lng: number
    }

    interface MapMouseEvent {
      latLng: LatLng | null
    }

    interface GeocoderRequest {
      address?: string
      location?: LatLng | LatLngLiteral
    }

    interface GeocoderResult {
      formatted_address: string
      geometry: {
        location: LatLng
      }
    }

    interface MapTypeStyle {
      featureType?: string
      elementType?: string
      stylers?: Array<{ [key: string]: string }>
    }

    enum GeocoderStatus {
      OK = "OK"
    }

    // StreetView namespace
    class StreetViewPanorama {
      constructor(container: HTMLElement, opts?: StreetViewPanoramaOptions)
      setPosition(latLng: LatLng | LatLngLiteral): void
      setPov(pov: StreetViewPov): void
      setZoom(zoom: number): void
      getPosition(): LatLng | undefined
      getPov(): StreetViewPov
      getZoom(): number
      addListener(eventName: string, handler: Function): void
    }

    interface StreetViewPanoramaOptions {
      position?: LatLng | LatLngLiteral
      pov?: StreetViewPov
      zoom?: number
      addressControl?: boolean
      showRoadLabels?: boolean
      motionTracking?: boolean
      motionTrackingControl?: boolean
      linksControl?: boolean
      panControl?: boolean
      zoomControl?: boolean
      fullscreenControl?: boolean
      enableCloseButton?: boolean
    }

    interface StreetViewPov {
      heading: number
      pitch: number
    }

    // Places namespace
    namespace places {
      class PlacesService {
        constructor(attrContainer: HTMLDivElement | Map)
        nearbySearch(
          request: PlaceSearchRequest,
          callback: (
            results: PlaceResult[] | null,
            status: PlacesServiceStatus,
            pagination: PlaceSearchPagination | null
          ) => void
        ): void
        getDetails(
          request: PlaceDetailsRequest,
          callback: (
            result: PlaceResult | null,
            status: PlacesServiceStatus
          ) => void
        ): void
      }

      interface PlaceSearchRequest {
        location: LatLng | LatLngLiteral
        radius: number
        type?: string
        keyword?: string
      }

      interface PlaceDetailsRequest {
        placeId: string
        fields?: string[]
      }

      interface PlaceResult {
        place_id?: string
        name?: string
        vicinity?: string
        geometry?: {
          location?: LatLng
        }
        types?: string[]
        business_status?: string
        rating?: number
        user_ratings_total?: number
        price_level?: number
        photos?: PlacePhoto[]
        // Additional fields from Place Details
        formatted_address?: string
        formatted_phone_number?: string
        international_phone_number?: string
        website?: string
      }

      interface PlacePhoto {
        getUrl(opts: { maxWidth?: number; maxHeight?: number }): string
        height: number
        width: number
      }

      interface PlaceSearchPagination {
        hasNextPage: boolean
        nextPage(): void
      }

      enum PlacesServiceStatus {
        OK = "OK",
        ZERO_RESULTS = "ZERO_RESULTS",
        OVER_QUERY_LIMIT = "OVER_QUERY_LIMIT",
        REQUEST_DENIED = "REQUEST_DENIED",
        INVALID_REQUEST = "INVALID_REQUEST",
        UNKNOWN_ERROR = "UNKNOWN_ERROR",
        NOT_FOUND = "NOT_FOUND"
      }
    }
  }
}

declare global {
  interface Window {
    google: typeof google
  }
}