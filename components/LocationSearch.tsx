'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Search, MapPin, Navigation, X, Loader2 } from 'lucide-react'
import { GlassInput } from './ui/GlassInput'
import { GlassButton } from './ui/GlassButton'
import { GlassCard } from './ui/GlassCard'
import { geocodeLocation } from '@/lib/weather/openmeteo'
import { getUserLocation, isGeolocationSupported } from '@/lib/utils/geolocation'
import { Coordinates, LocationSearchResult } from '@/types'

interface LocationSearchProps {
  onLocationSelect: (location: LocationSearchResult & Coordinates) => void
  isLoading?: boolean
}

export function LocationSearch({ onLocationSelect, isLoading }: LocationSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{
    name: string
    lat: number
    lon: number
    country: string
    admin1?: string
  }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const searchResults = await geocodeLocation(searchQuery)
      setResults(searchResults)
      setShowResults(searchResults.length > 0)
    } catch (err) {
      setError('Error buscando ubicación')
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      handleSearch(value)
    }, 300)
  }

  // Handle location selection
  const handleSelectLocation = (result: typeof results[0]) => {
    onLocationSelect({
      name: result.name,
      lat: result.lat,
      lon: result.lon,
      country: result.country,
      state: result.admin1,
    })
    setQuery(`${result.name}, ${result.country}`)
    setShowResults(false)
  }

  // Handle "Use my location" button
  const handleUseMyLocation = async () => {
    if (!isGeolocationSupported()) {
      setError('Geolocalización no soportada')
      return
    }

    setIsLocating(true)
    setError(null)

    try {
      const coords = await getUserLocation()
      onLocationSelect({
        name: 'Mi ubicación',
        lat: coords.lat,
        lon: coords.lon,
        country: '',
      })
      setQuery('Mi ubicación')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error obteniendo ubicación')
    } finally {
      setIsLocating(false)
    }
  }

  // Clear search
  const handleClear = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
    setError(null)
  }

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <GlassInput
            type="text"
            placeholder="Buscar ubicación..."
            value={query}
            onChange={handleInputChange}
            onFocus={() => results.length > 0 && setShowResults(true)}
            icon={
              isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )
            }
            className="w-full"
            disabled={isLoading}
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <GlassButton
          onClick={handleUseMyLocation}
          disabled={isLocating || isLoading}
          variant="secondary"
          className="shrink-0"
          title="Usar mi ubicación"
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Navigation className="w-5 h-5" />
          )}
          <span className="hidden sm:inline">Mi ubicación</span>
        </GlassButton>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-red-400 text-sm">{error}</p>
      )}

      {/* Search results dropdown */}
      {showResults && results.length > 0 && (
        <GlassCard 
          variant="primary" 
          className="absolute z-50 w-full mt-2 p-2 max-h-60 overflow-y-auto"
          animate={false}
        >
          {results.map((result, index) => (
            <button
              key={`${result.lat}-${result.lon}-${index}`}
              onClick={() => handleSelectLocation(result)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <MapPin className="w-4 h-4 text-white/60 shrink-0" />
              <div className="min-w-0">
                <p className="text-white font-medium truncate">{result.name}</p>
                <p className="text-white/60 text-sm truncate">
                  {result.admin1 ? `${result.admin1}, ` : ''}{result.country}
                </p>
              </div>
            </button>
          ))}
        </GlassCard>
      )}
    </div>
  )
}

