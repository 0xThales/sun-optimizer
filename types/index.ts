// Location types
export interface Coordinates {
  lat: number
  lon: number
}

export interface Location extends Coordinates {
  name: string
  country?: string
  state?: string
}

// UV Index types
export type UVRiskLevel = "low" | "moderate" | "high" | "very-high" | "extreme"

export interface UVData {
  current: number
  hourly: HourlyUV[]
}

export interface HourlyUV {
  time: string // ISO string or "HH:mm"
  hour: number
  uv: number
}

// Sun times types
export interface SunTimes {
  sunrise: string // ISO string
  sunset: string // ISO string
  solarNoon: string // ISO string
  dayLength: number // seconds
  timezone: string // IANA timezone e.g. "Europe/Madrid"
  utcOffsetSeconds: number // Offset from UTC in seconds
}

// Weather data combined
export interface WeatherData {
  location: Location
  uvData: UVData
  sunTimes: SunTimes
  timestamp: string
}

// Optimal time recommendation
export interface OptimalTimeRecommendation {
  startTime: string
  endTime: string
  uvRange: {
    min: number
    max: number
  }
  reason: string
  reasonKey?:
    | "optimalUV"
    | "lowUVToday"
    | "veryLowUVToday"
    | "highUVToday"
    | "extremeUVToday"
  reasonParams?: Record<string, string | number>
  duration: number // minutes
  isGoodForVitaminD: boolean
}

// Protection recommendation
export interface ProtectionRecommendation {
  level: UVRiskLevel
  spfNeeded: number
  message: string
  precautions: string[]
}

// API Response types
export interface WeatherAPIResponse {
  success: boolean
  data?: WeatherData
  error?: string
}

// Component prop types
export interface LocationSearchResult {
  name: string
  lat: number
  lon: number
  country: string
  state?: string
}

// Geolocation types
export interface GeolocationState {
  loading: boolean
  error: string | null
  coordinates: Coordinates | null
}
