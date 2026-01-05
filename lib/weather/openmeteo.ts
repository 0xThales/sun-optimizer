import { OpenMeteoResponse, NormalizedWeatherData } from "./types"

const BASE_URL = "https://api.open-meteo.com/v1"

/**
 * Get weather data from Open-Meteo (free, no API key required)
 */
export async function getWeatherData(
  lat: number,
  lon: number
): Promise<NormalizedWeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: "uv_index",
    hourly: "uv_index",
    daily: "sunrise,sunset,uv_index_max",
    timezone: "auto",
    forecast_days: "1",
  })

  const url = `${BASE_URL}/forecast?${params}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`)
  }

  const data: OpenMeteoResponse = await response.json()

  // Get location name via reverse geocoding (Open-Meteo doesn't provide this)
  const locationName = await reverseGeocode(lat, lon)

  // Parse sunrise/sunset from daily data
  const sunrise = data.daily?.sunrise?.[0] || ""
  const sunset = data.daily?.sunset?.[0] || ""

  // Calculate solar noon and day length
  const sunriseDate = new Date(sunrise)
  const sunsetDate = new Date(sunset)
  const solarNoon = new Date((sunriseDate.getTime() + sunsetDate.getTime()) / 2)
  const dayLength = Math.floor(
    (sunsetDate.getTime() - sunriseDate.getTime()) / 1000
  )

  // Extract hourly UV data
  // Note: Open-Meteo returns times in the location's timezone when using timezone: "auto"
  // We preserve the ISO string and extract hour from the original timezone, not server timezone
  const hourlyUV = (data.hourly?.time || []).map((time, index) => {
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/cdd6a619-edec-4e95-b8fd-9dd4c9cc2c8a", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "openmeteo.ts:48",
        message: "parsing hourly time",
        data: {
          timeString: time,
          serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "B,C",
      }),
    }).catch(() => {})
    // #endregion
    const date = new Date(time)
    // Extract hour from the ISO string directly (preserves original timezone)
    // Format: "2024-01-05T14:00:00+01:00" -> extract "14"
    const hourMatch = time.match(/T(\d{2}):/)
    const hour = hourMatch ? parseInt(hourMatch[1], 10) : date.getUTCHours()
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/cdd6a619-edec-4e95-b8fd-9dd4c9cc2c8a", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "openmeteo.ts:50",
        message: "date parsed and hour extracted",
        data: {
          dateISO: date.toISOString(),
          hourUTC: date.getUTCHours(),
          hourLocal: date.getHours(),
          hourFromString: hour,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "B,C",
      }),
    }).catch(() => {})
    // #endregion
    return {
      time: date.toISOString(),
      hour: hour,
      uv: data.hourly?.uv_index?.[index] || 0,
    }
  })

  return {
    lat,
    lon,
    locationName,
    currentUV: data.current?.uv_index || 0,
    hourlyUV,
    sunrise: sunriseDate.toISOString(),
    sunset: sunsetDate.toISOString(),
    solarNoon: solarNoon.toISOString(),
    dayLength,
  }
}

/**
 * Reverse geocode using Open-Meteo Geocoding API (free)
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string> {
  try {
    // Use Nominatim (OpenStreetMap) for reverse geocoding - free
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`

    const response = await fetch(url, {
      headers: {
        "User-Agent": "SunOptimizer/1.0",
      },
    })

    if (!response.ok) {
      return `${lat.toFixed(2)}, ${lon.toFixed(2)}`
    }

    const data = await response.json()

    // Extract city/town name
    const address = data.address || {}
    const cityName =
      address.city || address.town || address.village || address.municipality
    const country = address.country_code?.toUpperCase() || ""

    if (cityName) {
      return `${cityName}, ${country}`
    }

    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`
  } catch {
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`
  }
}

/**
 * Geocode a location name using Open-Meteo Geocoding API
 */
export async function geocodeLocation(query: string): Promise<
  Array<{
    name: string
    lat: number
    lon: number
    country: string
    admin1?: string
  }>
> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query
  )}&count=5&language=es&format=json`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.status}`)
  }

  const data = await response.json()

  return (data.results || []).map(
    (item: {
      name: string
      latitude: number
      longitude: number
      country_code: string
      admin1?: string
    }) => ({
      name: item.name,
      lat: item.latitude,
      lon: item.longitude,
      country: item.country_code,
      admin1: item.admin1,
    })
  )
}
