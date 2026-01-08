import {
  OpenWeatherOneCallResponse,
  OpenWeatherGeoResponse,
  NormalizedWeatherData,
} from "./types"
import { Location, LocationSearchResult } from "@/types"

// Use server-side env var (without NEXT_PUBLIC_ prefix) for API routes
const API_KEY = process.env.OPENWEATHER_API_KEY || ""
const BASE_URL = "https://api.openweathermap.org"

/**
 * Get weather data including UV from OpenWeatherMap One Call API 3.0
 */
export async function getWeatherData(
  lat: number,
  lon: number
): Promise<NormalizedWeatherData> {
  const url = `${BASE_URL}/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&appid=${API_KEY}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`OpenWeatherMap API error: ${response.status}`)
  }

  const data: OpenWeatherOneCallResponse = await response.json()

  // Get location name via reverse geocoding
  const locationName = await reverseGeocode(lat, lon)

  // Get timezone info from the response
  const timezone = data.timezone // IANA timezone e.g. "Europe/Madrid"
  const utcOffsetSeconds = data.timezone_offset // Offset from UTC in seconds

  // Get sunrise/sunset times - format with timezone offset
  const sunrise = new Date(data.current.sunrise * 1000)
  const sunset = new Date(data.current.sunset * 1000)
  const solarNoon = new Date((data.current.sunrise + data.current.sunset) * 500)
  const dayLength = data.current.sunset - data.current.sunrise

  // Format ISO strings with the location's timezone offset
  const formatWithOffset = (date: Date): string => {
    const offsetHours = Math.floor(Math.abs(utcOffsetSeconds) / 3600)
    const offsetMinutes = Math.floor((Math.abs(utcOffsetSeconds) % 3600) / 60)
    const sign = utcOffsetSeconds >= 0 ? "+" : "-"
    const offsetStr = `${sign}${String(offsetHours).padStart(2, "0")}:${String(
      offsetMinutes
    ).padStart(2, "0")}`

    // Get the local time in the target timezone
    const localTime = new Date(date.getTime() + utcOffsetSeconds * 1000)
    const isoBase = localTime.toISOString().slice(0, 19) // Remove 'Z'
    return `${isoBase}${offsetStr}`
  }

  // Extract hourly UV data (next 24 hours)
  const hourlyUV = data.hourly.slice(0, 24).map((hour) => {
    const date = new Date(hour.dt * 1000)
    // Calculate hour in the location's timezone
    const localDate = new Date(date.getTime() + utcOffsetSeconds * 1000)
    return {
      time: formatWithOffset(date),
      hour: localDate.getUTCHours(),
      uv: hour.uvi,
    }
  })

  return {
    lat,
    lon,
    locationName,
    currentUV: data.current.uvi,
    hourlyUV,
    sunrise: formatWithOffset(sunrise),
    sunset: formatWithOffset(sunset),
    solarNoon: formatWithOffset(solarNoon),
    dayLength,
    timezone,
    utcOffsetSeconds,
  }
}

/**
 * Geocode a location name to coordinates
 */
export async function geocodeLocation(
  query: string
): Promise<LocationSearchResult[]> {
  const url = `${BASE_URL}/geo/1.0/direct?q=${encodeURIComponent(
    query
  )}&limit=5&appid=${API_KEY}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.status}`)
  }

  const data: OpenWeatherGeoResponse[] = await response.json()

  return data.map((item) => ({
    name: item.name,
    lat: item.lat,
    lon: item.lon,
    country: item.country,
    state: item.state,
  }))
}

/**
 * Reverse geocode coordinates to location name
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string> {
  const url = `${BASE_URL}/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      return `${lat.toFixed(2)}, ${lon.toFixed(2)}`
    }

    const data: OpenWeatherGeoResponse[] = await response.json()

    if (data.length === 0) {
      return `${lat.toFixed(2)}, ${lon.toFixed(2)}`
    }

    const location = data[0]
    return location.state
      ? `${location.name}, ${location.state}`
      : `${location.name}, ${location.country}`
  } catch {
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`
  }
}

/**
 * Check if OpenWeatherMap API key is configured
 */
export function isOpenWeatherConfigured(): boolean {
  return Boolean(API_KEY)
}
