import { 
  OpenWeatherOneCallResponse, 
  OpenWeatherGeoResponse,
  NormalizedWeatherData 
} from './types'
import { Location, LocationSearchResult } from '@/types'

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || ''
const BASE_URL = 'https://api.openweathermap.org'

/**
 * Get weather data including UV from OpenWeatherMap One Call API 3.0
 */
export async function getWeatherData(lat: number, lon: number): Promise<NormalizedWeatherData> {
  const url = `${BASE_URL}/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&appid=${API_KEY}`
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`OpenWeatherMap API error: ${response.status}`)
  }
  
  const data: OpenWeatherOneCallResponse = await response.json()
  
  // Get location name via reverse geocoding
  const locationName = await reverseGeocode(lat, lon)
  
  // Get sunrise/sunset times
  const sunrise = new Date(data.current.sunrise * 1000)
  const sunset = new Date(data.current.sunset * 1000)
  const solarNoon = new Date((data.current.sunrise + data.current.sunset) * 500)
  const dayLength = data.current.sunset - data.current.sunrise
  
  // Extract hourly UV data (next 24 hours)
  const hourlyUV = data.hourly.slice(0, 24).map(hour => {
    const date = new Date(hour.dt * 1000)
    return {
      time: date.toISOString(),
      hour: date.getHours(),
      uv: hour.uvi,
    }
  })
  
  return {
    lat,
    lon,
    locationName,
    currentUV: data.current.uvi,
    hourlyUV,
    sunrise: sunrise.toISOString(),
    sunset: sunset.toISOString(),
    solarNoon: solarNoon.toISOString(),
    dayLength,
  }
}

/**
 * Geocode a location name to coordinates
 */
export async function geocodeLocation(query: string): Promise<LocationSearchResult[]> {
  const url = `${BASE_URL}/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.status}`)
  }
  
  const data: OpenWeatherGeoResponse[] = await response.json()
  
  return data.map(item => ({
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
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
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

