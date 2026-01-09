// OpenWeatherMap API types
export interface OpenWeatherUVResponse {
  lat: number
  lon: number
  date_iso: string
  date: number
  value: number
}

export interface OpenWeatherGeoResponse {
  name: string
  local_names?: Record<string, string>
  lat: number
  lon: number
  country: string
  state?: string
}

export interface OpenWeatherOneCallResponse {
  lat: number
  lon: number
  timezone: string
  timezone_offset: number
  current: {
    dt: number
    sunrise: number
    sunset: number
    temp: number
    uvi: number
    clouds: number
    weather: Array<{
      id: number
      main: string
      description: string
      icon: string
    }>
  }
  hourly: Array<{
    dt: number
    temp: number
    uvi: number
    clouds: number
    weather: Array<{
      id: number
      main: string
      description: string
      icon: string
    }>
  }>
  daily?: Array<{
    dt: number
    sunrise: number
    sunset: number
    uvi: number
  }>
}

// Open-Meteo API types
export interface OpenMeteoResponse {
  latitude: number
  longitude: number
  generationtime_ms: number
  utc_offset_seconds: number
  timezone: string
  timezone_abbreviation: string
  elevation: number
  current?: {
    time: string
    interval: number
    uv_index?: number
  }
  hourly?: {
    time: string[]
    uv_index?: number[]
  }
  daily?: {
    time: string[]
    sunrise?: string[]
    sunset?: string[]
    uv_index_max?: number[]
  }
}

// Sunrise-Sunset API types (backup)
export interface SunriseSunsetResponse {
  results: {
    sunrise: string
    sunset: string
    solar_noon: string
    day_length: number
    civil_twilight_begin: string
    civil_twilight_end: string
    nautical_twilight_begin: string
    nautical_twilight_end: string
    astronomical_twilight_begin: string
    astronomical_twilight_end: string
  }
  status: string
}

// Normalized internal types
export interface NormalizedWeatherData {
  lat: number
  lon: number
  locationName: string
  currentUV: number
  hourlyUV: Array<{
    time: string
    hour: number
    uv: number
  }>
  sunrise: string
  sunset: string
  solarNoon: string
  dayLength: number
  timezone: string // IANA timezone e.g. "Europe/Madrid"
  utcOffsetSeconds: number // Offset from UTC in seconds
}
