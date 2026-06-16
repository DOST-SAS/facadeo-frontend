# Map Integration (Google Maps & Mapbox)

## Components

### Map (Unified Component)
A unified map component that automatically switches between Google Maps and Mapbox based on environment configuration:
- Interactive map with draggable marker
- Radius circle visualization
- Click-to-place marker functionality
- Reverse geocoding (coordinates to address)
- Forward geocoding (address to coordinates)
- Current location detection
- Dynamic script loading

### GoogleMap
Google Maps implementation with:
- Google Maps JavaScript API
- Dynamic script loading
- TypeScript definitions

### MapboxMap
Mapbox implementation with:
- Mapbox GL JS
- Vector tiles
- Modern WebGL rendering

### MapSearch
A search input component that works with both map providers:
- Expandable search input with smooth animations
- **Real-time search suggestions** as you type (3+ characters)
- Keyboard navigation (Arrow keys, Enter, Escape)
- Current location button
- Search on Enter key press
- Automatic provider detection (Google Places/Mapbox Geocoding)

## Usage

```tsx
import Map, { type MapRef } from "@/components/Map"
import MapSearch from "@/components/MapSearch"

const [address, setAddress] = useState("")
const [coordinates, setCoordinates] = useState({ lat: 48.8566, lng: 2.3522 })
const mapRef = useRef<MapRef>(null)

const handleAddressChange = (newAddress: string, newCoordinates: { lat: number; lng: number }) => {
  setAddress(newAddress)
  setCoordinates(newCoordinates)
}

const handleSearch = (searchAddress: string) => {
  mapRef.current?.searchAddress(searchAddress)
}

const handleGetCurrentLocation = () => {
  mapRef.current?.getCurrentLocation()
}

<Map
  ref={mapRef}
  center={coordinates}
  zoom={13}
  radius={500}
  onAddressChange={handleAddressChange}
  className="h-full w-full"
/>

<MapSearch
  value={address}
  onChange={setAddress}
  onSearch={handleSearch}
  onGetCurrentLocation={handleGetCurrentLocation}
/>
```

## Environment Variables

### Map Provider Selection
```
VITE_MAP_CHOICE="google"    # Use Google Maps (default)
VITE_MAP_CHOICE="mapbox"    # Use Mapbox
```

### Google Maps Configuration
```
VITE_GOOGLE_MAP_API_KEY=your_google_api_key_here
VITE_GOOGLE_MAP_PLACES_API_KEY=your_places_api_key_here
```

### Mapbox Configuration
```
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

## API Requirements

### Google Maps
The Google Maps API key needs these APIs enabled:
- Maps JavaScript API
- Places API (for search functionality)
- Geocoding API (for address/coordinate conversion)

### Mapbox
- Mapbox account with access token
- Geocoding API included in most plans

## Map Provider Comparison

| Feature | Google Maps | Mapbox |
|---------|-------------|---------|
| **Pricing** | Pay per request | Monthly subscription |
| **Styling** | Limited customization | Highly customizable |
| **Performance** | Good | Excellent (WebGL) |
| **Data Coverage** | Excellent worldwide | Good worldwide |
| **Offline Support** | Limited | Better support |
| **Bundle Size** | Larger | Smaller |

## Technical Notes

- Automatic provider switching based on environment variable
- Dynamic script loading for both providers
- Real-time search suggestions with 300ms debouncing
- Keyboard navigation support (Arrow keys, Enter, Escape)
- Proper TypeScript definitions
- Error handling and fallbacks
- Prevents multiple script loads
- Unified API interface regardless of provider

## Search Suggestions Features

- **Auto-complete**: Shows suggestions after typing 3+ characters
- **Provider-aware**: Uses Google Places or Mapbox Geocoding based on map choice
- **Keyboard Navigation**: 
  - ↑/↓ arrows to navigate suggestions
  - Enter to select highlighted suggestion
  - Escape to close suggestions
- **Smart Selection**: Clicking a suggestion automatically updates map location
- **Debounced Requests**: Optimized API calls to reduce costs
- **Loading States**: Visual feedback during search
- **Error Handling**: Graceful fallback when no suggestions found