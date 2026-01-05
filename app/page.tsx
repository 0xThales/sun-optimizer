'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sun, AlertCircle, RefreshCw } from 'lucide-react'
import { LocationSearch } from '@/components/LocationSearch'
import { UVIndexDisplay } from '@/components/UVIndexDisplay'
import { OptimalTimeCard } from '@/components/OptimalTimeCard'
import { UVChart } from '@/components/UVChart'
import { SunTimes } from '@/components/SunTimes'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getUserLocation, isGeolocationSupported } from '@/lib/utils/geolocation'
import { WeatherData, Coordinates, LocationSearchResult } from '@/types'

export default function Home() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Fetch weather data for coordinates
  const fetchWeatherData = useCallback(async (coords: Coordinates) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/weather?lat=${coords.lat}&lon=${coords.lon}`
      )
      
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error obteniendo datos del clima')
      }

      setWeatherData(result.data)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setWeatherData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle location selection from search
  const handleLocationSelect = useCallback((location: LocationSearchResult & Coordinates) => {
    fetchWeatherData({ lat: location.lat, lon: location.lon })
  }, [fetchWeatherData])

  // Initial load - try to get user location
  useEffect(() => {
    async function initLocation() {
      if (isGeolocationSupported()) {
        try {
          const coords = await getUserLocation()
          await fetchWeatherData(coords)
        } catch {
          // Geolocation failed, show search prompt
          setIsLoading(false)
          setError('Permite el acceso a tu ubicación o busca una ciudad')
        }
      } else {
        setIsLoading(false)
        setError('Busca una ubicación para comenzar')
      }
    }

    initLocation()
  }, [fetchWeatherData])

  // Refresh data
  const handleRefresh = () => {
    if (weatherData?.location) {
      fetchWeatherData({
        lat: weatherData.location.lat,
        lon: weatherData.location.lon,
      })
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20">
                <Sun className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white text-shadow">
                  SunOptimizer
                </h1>
                <p className="text-white/60 text-sm">
                  Encuentra el mejor momento para el sol
                </p>
              </div>
            </div>
            
            {weatherData && (
              <GlassButton
                onClick={handleRefresh}
                variant="icon"
                disabled={isLoading}
                title="Actualizar datos"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </GlassButton>
            )}
          </div>

          {/* Search */}
          <LocationSearch 
            onLocationSelect={handleLocationSelect}
            isLoading={isLoading}
          />
          
          {lastUpdate && (
            <p className="text-white/40 text-xs mt-2">
              Actualizado: {lastUpdate.toLocaleTimeString('es-ES')}
            </p>
          )}
        </header>

        {/* Loading State */}
        {isLoading && !weatherData && (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" text="Obteniendo datos de ubicación..." />
          </div>
        )}

        {/* Error State */}
        {error && !weatherData && !isLoading && (
          <GlassCard variant="primary" className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-white text-xl font-semibold mb-2">
              {error.includes('Permite') || error.includes('Busca') 
                ? '¡Bienvenido!' 
                : 'Error'}
            </h2>
            <p className="text-white/70 mb-4">{error}</p>
            <p className="text-white/50 text-sm">
              Usa el buscador de arriba para encontrar tu ubicación
            </p>
          </GlassCard>
        )}

        {/* Main Content */}
        {weatherData && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            {/* UV Index - Full width on mobile, prominent display */}
            <UVIndexDisplay 
              uvIndex={weatherData.uvData.current}
              locationName={weatherData.location.name}
            />

            {/* Grid for secondary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Optimal Time */}
              <OptimalTimeCard 
                hourlyUV={weatherData.uvData.hourly}
                currentUV={weatherData.uvData.current}
              />

              {/* Sun Times */}
              <SunTimes sunTimes={weatherData.sunTimes} />
            </div>

            {/* UV Chart - Full width */}
            <UVChart hourlyUV={weatherData.uvData.hourly} />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-white/10">
          <p className="text-white/30 text-xs text-center">
            SunOptimizer · Datos proporcionados por Open-Meteo
          </p>
        </footer>
      </div>
    </main>
  )
}

