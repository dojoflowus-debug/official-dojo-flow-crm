import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Loader2 } from 'lucide-react'

export default function AddressAutocomplete({ 
  value, 
  onChange, 
  onAddressSelect,
  disabled = false,
  label = "Street Address",
  placeholder = "Start typing an address..."
}) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceTimer = useRef(null)
  const wrapperRef = useRef(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch address suggestions
  const fetchSuggestions = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/address/autocomplete?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Address autocomplete error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const newValue = e.target.value
    setQuery(newValue)
    onChange(newValue)

    // Don't show suggestions until user has typed at least 3 characters
    if (newValue.length < 3) {
      setShowSuggestions(false)
      setSuggestions([])
      return
    }

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 500) // Wait 500ms after user stops typing to give keyboard time
  }

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion.street_address)
    setShowSuggestions(false)
    setSuggestions([])
    
    // Call the callback with full address details
    if (onAddressSelect) {
      onAddressSelect({
        street_address: suggestion.street_address,
        city: suggestion.city,
        state: suggestion.state,
        zip_code: suggestion.zip_code,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude
      })
    }
  }

  return (
    <div ref={wrapperRef} className="relative grid gap-2">
      <Label htmlFor="address-autocomplete">{label}</Label>
      <div className="relative">
        <Input
          id="address-autocomplete"
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          disabled={disabled}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border last:border-b-0 flex items-start gap-2"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {suggestion.street_address}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {suggestion.city}, {suggestion.state} {suggestion.zip_code}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !loading && suggestions.length === 0 && query.length >= 3 && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border border-border rounded-md shadow-lg px-4 py-3 text-sm text-muted-foreground">
          No addresses found. Try a different search.
        </div>
      )}
    </div>
  )
}

