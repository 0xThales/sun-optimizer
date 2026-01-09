"use client"

import { useState, useEffect, useCallback } from "react"
import { Sun, AlertCircle, RefreshCw } from "lucide-react"
import { LocationSearch } from "@/components/LocationSearch"
import { UVIndexDisplay } from "@/components/UVIndexDisplay"
import { OptimalTimeCard } from "@/components/OptimalTimeCard"
import { UVChart } from "@/components/UVChart"
import { SunTimes } from "@/components/SunTimes"
import { LocalTimeDisplay } from "@/components/LocalTimeDisplay"
import { SunCompass } from "@/components/SunCompass"
import { GlassCard } from "@/components/ui/GlassCard"
import { GlassButton } from "@/components/ui/GlassButton"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { useLanguage } from "@/components/LanguageContext"
import {
  getUserLocation,
  isGeolocationSupported,
} from "@/lib/utils/geolocation"
import { getTimeAwareness, TimePeriod } from "@/lib/utils/timeAwareness"
import {
  fetchBackgroundImage,
  getFallbackGradient,
  preloadImage,
  getBackgroundStyle,
} from "@/lib/utils/backgrounds"
import { WeatherData, Coordinates, LocationSearchResult } from "@/types"

export default function Home() {
  const { t, locale } = useLanguage()
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("day")
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false)

  // Fetch weather data for coordinates
  const fetchWeatherData = useCallback(
    async (coords: Coordinates) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/weather?lat=${coords.lat}&lon=${coords.lon}`
        )

        const result = await response.json()

        if (!result.success) {
          throw new Error(
            result.error ||
              (locale === "en"
                ? "Error fetching weather data"
                : "Error obteniendo datos del clima")
          )
        }

        setWeatherData(result.data)
        setLastUpdate(new Date())

        // Update background based on time period and location
        if (result.data?.sunTimes) {
          const timeData = getTimeAwareness(
            result.data.sunTimes.sunrise,
            result.data.sunTimes.sunset,
            result.data.sunTimes.timezone
          )
          setTimePeriod(timeData.timePeriod)

          // Fetch and preload the background image from Unsplash
          const locationName = result.data.location?.name
          setIsBackgroundLoading(true)

          fetchBackgroundImage({
            locationName,
            timePeriod: timeData.timePeriod,
          })
            .then(async (response) => {
              if (response.success && response.imageUrl) {
                // Preload the image before displaying
                const loadedUrl = await preloadImage(response.imageUrl)
                setBackgroundUrl(loadedUrl)
              } else {
                setBackgroundUrl(null)
              }
            })
            .catch(() => {
              // Silently fail - fallback gradient will be used
              setBackgroundUrl(null)
            })
            .finally(() => {
              setIsBackgroundLoading(false)
            })
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : locale === "en"
            ? "Unknown error"
            : "Error desconocido"
        )
        setWeatherData(null)
      } finally {
        setIsLoading(false)
      }
    },
    [locale]
  )

  // Handle location selection from search
  const handleLocationSelect = useCallback(
    (location: LocationSearchResult & Coordinates) => {
      fetchWeatherData({ lat: location.lat, lon: location.lon })
    },
    [fetchWeatherData]
  )

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
          setError(
            locale === "en"
              ? "Allow location access or search for a city"
              : "Permite el acceso a tu ubicación o busca una ciudad"
          )
        }
      } else {
        setIsLoading(false)
        setError(
          locale === "en"
            ? "Search for a location to start"
            : "Busca una ubicación para comenzar"
        )
      }
    }

    initLocation()
  }, [fetchWeatherData, locale])

  // Refresh data
  const handleRefresh = () => {
    if (weatherData?.location) {
      fetchWeatherData({
        lat: weatherData.location.lat,
        lon: weatherData.location.lon,
      })
    }
  }

  // Get background style based on current state
  const bgStyle = getBackgroundStyle(
    backgroundUrl,
    getFallbackGradient(timePeriod)
  )

  return (
    <main
      className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 bg-transition"
      style={{
        ...bgStyle,
        minHeight: "100vh",
      }}
    >
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="icon-container icon-container-amber shrink-0">
                <Sun className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300 icon-glow-amber" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl font-bold text-white text-shadow-lg truncate">
                  {t.common.sunOptimizer}
                </h1>
                <p className="text-white/70 text-xs sm:text-sm text-shadow-sm truncate">
                  {t.common.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <LanguageSwitcher />
              {weatherData && (
                <GlassButton
                  onClick={handleRefresh}
                  variant="icon"
                  disabled={isLoading}
                  title={t.common.refreshData}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full"
                >
                  <RefreshCw
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                </GlassButton>
              )}
            </div>
          </div>

          {/* Search */}
          <LocationSearch
            onLocationSelect={handleLocationSelect}
            isLoading={isLoading}
          />

          {lastUpdate && (
            <p className="text-white/40 text-xs mt-2">
              {t.common.updatedAt}:{" "}
              {lastUpdate.toLocaleTimeString(
                locale === "en" ? "en-US" : "es-ES"
              )}
            </p>
          )}
        </header>

        {/* Loading State */}
        {isLoading && !weatherData && (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner
              size="lg"
              text={
                locale === "en"
                  ? "Getting location data..."
                  : "Obteniendo datos de ubicación..."
              }
            />
          </div>
        )}

        {/* Error State */}
        {error && !weatherData && !isLoading && (
          <GlassCard variant="primary" className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-white text-xl font-semibold mb-2">
              {(locale === "es" &&
                (error.includes("Permite") || error.includes("Busca"))) ||
              (locale === "en" &&
                (error.includes("Allow") || error.includes("Search")))
                ? locale === "en"
                  ? "Welcome!"
                  : "¡Bienvenido!"
                : locale === "en"
                ? "Error"
                : "Error"}
            </h2>
            <p className="text-white/70 mb-4">{error}</p>
            <p className="text-white/50 text-sm">
              {locale === "en"
                ? "Use the search box above to find your location"
                : "Usa el buscador de arriba para encontrar tu ubicación"}
            </p>
          </GlassCard>
        )}

        {/* Main Content */}
        {weatherData && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            {/* Local Time Display */}
            <LocalTimeDisplay
              sunrise={weatherData.sunTimes.sunrise}
              sunset={weatherData.sunTimes.sunset}
              locationName={weatherData.location.name}
              timezone={weatherData.sunTimes.timezone}
            />

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
                timezone={weatherData.sunTimes.timezone}
              />

              {/* Sun Times */}
              <SunTimes sunTimes={weatherData.sunTimes} />
            </div>

            {/* Sun Compass */}
            <SunCompass
              lat={weatherData.location.lat}
              lon={weatherData.location.lon}
              timezone={weatherData.sunTimes.timezone}
            />

            {/* UV Chart - Full width */}
            <UVChart
              hourlyUV={weatherData.uvData.hourly}
              timezone={weatherData.sunTimes.timezone}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-white/10">
          <p className="text-white/30 text-xs text-center">
            SunOptimizer ·{" "}
            {locale === "en" ? "Data provided by" : "Datos proporcionados por"}{" "}
            Open-Meteo
          </p>
        </footer>
      </div>
    </main>
  )
}
