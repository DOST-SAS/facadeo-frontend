import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search, Locate, MapPin } from "lucide-react"
import { GeocodingService, type GeocodingSuggestion } from "@/services/geocoding"

interface MapSearchProps {
  value: string
  onChange: (value: string) => void
  onSearch: (address: string) => void
  onGetCurrentLocation: () => void
  onSelectSuggestion?: (suggestion: GeocodingSuggestion) => void
  className?: string
}

export default function MapSearch({
  value,
  onChange,
  onSearch,
  onGetCurrentLocation,
  onSelectSuggestion,
  className = ""
}: MapSearchProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions when user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length >= 3) {
        setIsLoading(true)
        try {
          const results = await GeocodingService.getSuggestions(value)
          setSuggestions(results)
        } catch (error) {
          console.error('Error fetching suggestions:', error)
          setSuggestions([])
        } finally {
          setIsLoading(false)
        }
      } else {
        setSuggestions([])
      }
    }

    const timeoutId = setTimeout(fetchSuggestions, 300) // Debounce
    return () => clearTimeout(timeoutId)
  }, [value])

  // Clear suggestions when input loses focus (with delay for click handling)
  useEffect(() => {
    if (!isFocused) {
      const timeoutId = setTimeout(() => {
        setSuggestions([])
        setSelectedIndex(-1)
      }, 150)
      return () => clearTimeout(timeoutId)
    }
  }, [isFocused])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelectSuggestion(suggestions[selectedIndex])
    } else if (value.trim()) {
      onSearch(value.trim())
      setSuggestions([])
    }
  }

  const handleSelectSuggestion = (suggestion: GeocodingSuggestion) => {
    onChange(suggestion.description)
    setSuggestions([])
    setSelectedIndex(-1)
    
    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion)
    } else if (suggestion.coordinates) {
      // If no custom handler, use the search function
      onSearch(suggestion.description)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit(e)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex])
        } else {
          handleSubmit(e)
        }
        break
      case 'Escape':
        setSuggestions([])
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setSelectedIndex(-1)
  }

  const isExpanded = isFocused || value.length > 0

  return (
    <div className={`relative group ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        {/* Collapsed state - just the icon button */}
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          className={`
            absolute left-0 top-0 h-10 w-10 flex items-center justify-center rounded-full bg-background border border-border shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 z-20
            ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}
          `}
        >
          <Search className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
        </button>

        {/* Expanded state - full input */}
        <div className={`
          transition-all duration-300 ease-in-out
          ${isExpanded ? 'opacity-100 w-full' : 'opacity-0 w-10 pointer-events-none'}
        `}>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
          </div>

          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Rechercher une adresse..."
            autoComplete="off"
            className="pl-10 pr-12 h-10 transition-all duration-500 ease-in-out border-border hover:border-primary/50 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 rounded-full shadow-lg hover:shadow-xl bg-glow-accent"
          />

          <button
            type="button"
            onClick={onGetCurrentLocation}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full border border-border hover:bg-primary/10 hover:border-primary transition-all duration-300"
            title="Utiliser ma position"
          >
            <Locate className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {(suggestions.length > 0 || isLoading) && (isFocused || value) && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 bg-background border border-t-0 border-border rounded-lg shadow-xl z-[60] max-h-[300px] overflow-y-auto"
        >
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Recherche en cours...
            </div>
          ) : (
            <ul className="py-1">
              {suggestions.length === 0 && !isLoading && value.length >= 3 ? (
                <li className="px-4 py-3 text-sm text-muted-foreground">
                  Aucune suggestion trouvée
                </li>
              ) : (
                suggestions.map((suggestion, index) => (
                  <li key={suggestion.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className={`w-full px-4 py-2.5 text-left hover:bg-muted/50 transition-colors flex items-start gap-3 ${
                        index === selectedIndex ? 'bg-muted' : ''
                      }`}
                    >
                      <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {suggestion.text}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {suggestion.description}
                        </div>
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}