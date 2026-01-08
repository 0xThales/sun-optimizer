import { OpenMeteoResponse, NormalizedWeatherData } from "./types"
import { extractHourFromISOString } from "@/lib/utils/date"
import { fromZonedTime } from "date-fns-tz"

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

  // Get timezone from Open-Meteo response
  const timezone = data.timezone // e.g. "America/Argentina/Buenos_Aires"

  // Parse sunrise/sunset from daily data
  // Open-Meteo returns local times like "2026-01-08T05:50" (no timezone offset)
  const sunrise = data.daily?.sunrise?.[0] || ""
  const sunset = data.daily?.sunset?.[0] || ""

  // Convert local times to UTC Date objects using the correct timezone
  // fromZonedTime interprets the string as being in the specified timezone
  const sunriseDate = fromZonedTime(sunrise, timezone)
  const sunsetDate = fromZonedTime(sunset, timezone)
  const solarNoon = new Date((sunriseDate.getTime() + sunsetDate.getTime()) / 2)
  const dayLength = Math.floor(
    (sunsetDate.getTime() - sunriseDate.getTime()) / 1000
  )

  // Extract hourly UV data
  // IMPORTANT: Open-Meteo returns times in the location's local timezone (e.g., "2026-01-08T09:00")
  // We keep the original time strings since they're already in local time
  // The `hour` field contains the local hour for easy calculations
  const hourlyUV = (data.hourly?.time || []).map((time, index) => {
    // Extract hour directly from the local time string
    const hour = extractHourFromISOString(time)

    return {
      time: time, // Keep original local time string (e.g., "2026-01-08T09:00")
      hour: hour, // Local hour (e.g., 9 for 9:00 AM Buenos Aires)
      uv: data.hourly?.uv_index?.[index] || 0,
    }
  })

  return {
    lat,
    lon,
    locationName,
    currentUV: data.current?.uv_index || 0,
    hourlyUV,
    sunrise, // Local time string (e.g., "2026-01-08T05:50")
    sunset, // Local time string (e.g., "2026-01-08T20:10")
    solarNoon: solarNoon.toISOString(),
    dayLength,
    timezone, // IANA timezone e.g. "America/Argentina/Buenos_Aires"
    utcOffsetSeconds: data.utc_offset_seconds,
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
