import {
  UVRiskLevel,
  OptimalTimeRecommendation,
  ProtectionRecommendation,
  HourlyUV,
} from "@/types"
import {
  UV_THRESHOLDS,
  OPTIMAL_UV_RANGE,
  SPF_RECOMMENDATIONS,
} from "@/lib/constants"
import {
  formatDuration,
  getTimeDifferenceInMinutes,
  parseISOString,
} from "@/lib/utils/date"
import { addHours } from "date-fns"

// ==========================================
// Sun Position Calculations (Azimuth & Elevation)
// ==========================================

export interface SunPosition {
  azimuth: number // Degrees from North (0-360), clockwise
  elevation: number // Degrees above horizon (-90 to 90)
  isAboveHorizon: boolean
}

/**
 * Calculate the sun's position (azimuth and elevation) for a given location and time.
 * Uses standard astronomical formulas.
 */
export function getSunPosition(
  lat: number,
  lon: number,
  date: Date = new Date()
): SunPosition {
  // Convert latitude to radians
  const latRad = (lat * Math.PI) / 180

  // Calculate Julian Day
  const JD = getJulianDay(date)

  // Calculate Julian Century
  const T = (JD - 2451545.0) / 36525

  // Calculate geometric mean longitude of the sun (degrees)
  let L0 = 280.46646 + T * (36000.76983 + 0.0003032 * T)
  L0 = L0 % 360
  if (L0 < 0) L0 += 360

  // Calculate geometric mean anomaly of the sun (degrees)
  let M = 357.52911 + T * (35999.05029 - 0.0001537 * T)
  M = M % 360

  // Calculate eccentricity of Earth's orbit
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T)

  // Calculate sun's equation of center
  const Mrad = (M * Math.PI) / 180
  const C =
    (1.914602 - T * (0.004817 + 0.000014 * T)) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad)

  // Calculate sun's true longitude
  const sunLong = L0 + C

  // Calculate sun's apparent longitude
  const omega = 125.04 - 1934.136 * T
  const lambda = sunLong - 0.00569 - 0.00478 * Math.sin((omega * Math.PI) / 180)

  // Calculate mean obliquity of the ecliptic
  const epsilon0 =
    23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60

  // Calculate corrected obliquity
  const epsilon = epsilon0 + 0.00256 * Math.cos((omega * Math.PI) / 180)
  const epsilonRad = (epsilon * Math.PI) / 180

  // Calculate sun's right ascension
  const lambdaRad = (lambda * Math.PI) / 180
  let RA = Math.atan2(
    Math.cos(epsilonRad) * Math.sin(lambdaRad),
    Math.cos(lambdaRad)
  )
  RA = (RA * 180) / Math.PI
  if (RA < 0) RA += 360

  // Calculate sun's declination
  const declination = Math.asin(Math.sin(epsilonRad) * Math.sin(lambdaRad))

  // Calculate equation of time (minutes)
  const y = Math.tan(epsilonRad / 2) * Math.tan(epsilonRad / 2)
  const L0rad = (L0 * Math.PI) / 180
  const eqTime =
    4 *
    (180 / Math.PI) *
    (y * Math.sin(2 * L0rad) -
      2 * e * Math.sin(Mrad) +
      4 * e * y * Math.sin(Mrad) * Math.cos(2 * L0rad) -
      0.5 * y * y * Math.sin(4 * L0rad) -
      1.25 * e * e * Math.sin(2 * Mrad))

  // Calculate solar time
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  const solarTime = hours * 60 + eqTime + 4 * lon

  // Calculate hour angle
  let hourAngle = solarTime / 4 - 180
  const hourAngleRad = (hourAngle * Math.PI) / 180

  // Calculate solar zenith angle
  const cosZenith =
    Math.sin(latRad) * Math.sin(declination) +
    Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngleRad)
  const zenithRad = Math.acos(Math.max(-1, Math.min(1, cosZenith)))
  const zenith = (zenithRad * 180) / Math.PI

  // Calculate elevation (altitude)
  const elevation = 90 - zenith

  // Calculate azimuth
  let azimuth: number
  const cosAzimuth =
    (Math.sin(declination) - Math.sin(latRad) * cosZenith) /
    (Math.cos(latRad) * Math.sin(zenithRad))

  if (Math.abs(Math.sin(zenithRad)) < 0.0001) {
    // Sun is at zenith or nadir
    azimuth = 0
  } else {
    azimuth = (Math.acos(Math.max(-1, Math.min(1, cosAzimuth))) * 180) / Math.PI
    if (hourAngle > 0) {
      azimuth = 360 - azimuth
    }
  }

  return {
    azimuth,
    elevation,
    isAboveHorizon: elevation > 0,
  }
}

/**
 * Get Julian Day from a Date object
 */
function getJulianDay(date: Date): number {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600

  let y = year
  let m = month

  if (m <= 2) {
    y -= 1
    m += 12
  }

  const A = Math.floor(y / 100)
  const B = 2 - A + Math.floor(A / 4)

  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    hours / 24 +
    B -
    1524.5
  )
}

/**
 * Get cardinal direction name from azimuth angle
 */
export function getCardinalDirection(azimuth: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  const index = Math.round(azimuth / 45) % 8
  return directions[index]
}

/**
 * Calculate sun positions for multiple hours (for path visualization)
 */
export function getSunPath(
  lat: number,
  lon: number,
  date: Date = new Date(),
  hoursRange: number = 12
): Array<{ hour: number; position: SunPosition }> {
  const path: Array<{ hour: number; position: SunPosition }> = []
  const baseDate = new Date(date)
  baseDate.setUTCHours(0, 0, 0, 0)

  for (let hour = 0; hour < 24; hour++) {
    const hourDate = new Date(baseDate)
    hourDate.setUTCHours(hour)
    const position = getSunPosition(lat, lon, hourDate)
    path.push({ hour, position })
  }

  return path
}

/**
 * Get UV risk level from UV index value
 */
export function getUVRiskLevel(uvIndex: number): UVRiskLevel {
  if (uvIndex < UV_THRESHOLDS.LOW.max) return "low" // UV < 3
  if (uvIndex < UV_THRESHOLDS.MODERATE.max) return "moderate" // 3 <= UV < 6
  if (uvIndex < UV_THRESHOLDS.HIGH.max) return "high" // 6 <= UV < 8
  if (uvIndex < UV_THRESHOLDS.VERY_HIGH.max) return "very-high" // 8 <= UV < 11
  return "extreme" // UV >= 11
}

/**
 * Get UV level display name in current language
 * This is now a helper that returns the Spanish name as fallback
 * Better to use dictionary from useLanguage in components
 */
export function getUVLevelName(level: UVRiskLevel): string {
  const names: Record<UVRiskLevel, string> = {
    low: "Bajo",
    moderate: "Moderado",
    high: "Alto",
    "very-high": "Muy Alto",
    extreme: "Extremo",
  }
  return names[level]
}

/**
 * Get protection recommendations based on UV index
 * This is now handled primarily in the component using dictionaries
 */
export function getProtectionRecommendation(
  uvIndex: number
): ProtectionRecommendation {
  const level = getUVRiskLevel(uvIndex)

  // We return a structured recommendation that components can translate
  return {
    level,
    spfNeeded: SPF_RECOMMENDATIONS[level],
    message: "", // To be filled by component
    precautions: [], // To be filled by component
  }
}

/**
 * Calculate optimal time window for sun exposure
 */
export function calculateOptimalTime(
  hourlyUV: HourlyUV[]
): OptimalTimeRecommendation | null {
  const daylightHours = hourlyUV.filter((h) => h.hour >= 6 && h.hour <= 20)

  if (daylightHours.length === 0) {
    return null
  }

  const peakHour = daylightHours.reduce((prev, curr) =>
    curr.uv > prev.uv ? curr : prev
  )

  const optimalHours = daylightHours.filter(
    (h) => h.uv >= OPTIMAL_UV_RANGE.min && h.uv <= OPTIMAL_UV_RANGE.max
  )

  if (optimalHours.length > 0) {
    const windows = findContiguousWindows(optimalHours)
    const longestWindow = windows.reduce((prev, curr) =>
      curr.hours.length > prev.hours.length ? curr : prev
    )

    const uvValues = longestWindow.hours.map((h) => h.uv)
    const lastHourTime =
      longestWindow.hours[longestWindow.hours.length - 1].time
    const windowEndTime = addHourToTimeString(lastHourTime)

    return {
      startTime: longestWindow.hours[0].time,
      endTime: windowEndTime,
      uvRange: {
        min: Math.min(...uvValues),
        max: Math.max(...uvValues),
      },
      reason: "UV óptimo para síntesis de vitamina D sin riesgo excesivo.",
      reasonKey: "optimalUV",
      duration: longestWindow.hours.length * 60,
      isGoodForVitaminD: true,
    }
  }

  const allLow = daylightHours.every((h) => h.uv < OPTIMAL_UV_RANGE.min)

  if (allLow) {
    const meaningfulHours = daylightHours
      .filter((h) => h.uv >= 1.0)
      .sort((a, b) => a.hour - b.hour)

    if (meaningfulHours.length === 0) {
      const windowEndTime = addHourToTimeString(peakHour.time)
      return {
        startTime: peakHour.time,
        endTime: windowEndTime,
        uvRange: { min: peakHour.uv, max: peakHour.uv },
        reason: `UV muy bajo hoy (máx ${peakHour.uv.toFixed(
          1
        )}). Maximiza tu tiempo al sol.`,
        reasonKey: "veryLowUVToday",
        reasonParams: { uv: peakHour.uv.toFixed(1) },
        duration: 60,
        isGoodForVitaminD: false,
      }
    }

    const windows = findContiguousWindows(meaningfulHours)
    const windowWithPeak =
      windows.find((w) => w.hours.some((h) => h.hour === peakHour.hour)) ||
      windows[0]

    let selectedHours = windowWithPeak.hours
    if (selectedHours.length > 4) {
      const peakIdx = selectedHours.findIndex((h) => h.hour === peakHour.hour)
      const start = Math.max(0, peakIdx - 2)
      const end = Math.min(selectedHours.length, start + 4)
      selectedHours = selectedHours.slice(start, end)
    }

    const uvValues = selectedHours.map((h) => h.uv)
    const lastHourTime = selectedHours[selectedHours.length - 1].time
    const windowEndTime = addHourToTimeString(lastHourTime)

    return {
      startTime: selectedHours[0].time,
      endTime: windowEndTime,
      uvRange: {
        min: Math.min(...uvValues),
        max: Math.max(...uvValues),
      },
      reason: `UV bajo hoy (máx ${peakHour.uv.toFixed(
        1
      )}). Esta es la mejor ventana.`,
      reasonKey: "lowUVToday",
      reasonParams: { uv: peakHour.uv.toFixed(1) },
      duration: selectedHours.length * 60,
      isGoodForVitaminD: false,
    }
  }

  const safeHours = daylightHours.filter(
    (h) => h.uv >= 2 && h.uv <= OPTIMAL_UV_RANGE.max
  )

  if (safeHours.length > 0) {
    const windows = findContiguousWindows(safeHours)
    const morningWindow = windows.find((w) => w.hours[0].hour < 12)
    const bestWindow = morningWindow || windows[0]

    const uvValues = bestWindow.hours.map((h) => h.uv)
    const lastHourTime = bestWindow.hours[bestWindow.hours.length - 1].time
    const windowEndTime = addHourToTimeString(lastHourTime)

    return {
      startTime: bestWindow.hours[0].time,
      endTime: windowEndTime,
      uvRange: {
        min: Math.min(...uvValues),
        max: Math.max(...uvValues),
      },
      reason: `UV alto hoy (pico ${peakHour.uv.toFixed(
        1
      )}). Evita horas centrales.`,
      reasonKey: "highUVToday",
      reasonParams: { uv: peakHour.uv.toFixed(1) },
      duration: bestWindow.hours.length * 60,
      isGoodForVitaminD: true,
    }
  }

  const earlyHours = daylightHours.filter((h) => h.hour >= 7 && h.hour <= 9)
  if (earlyHours.length > 0) {
    const uvValues = earlyHours.map((h) => h.uv)
    const lastHourTime = earlyHours[earlyHours.length - 1].time
    const windowEndTime = addHourToTimeString(lastHourTime)

    return {
      startTime: earlyHours[0].time,
      endTime: windowEndTime,
      uvRange: {
        min: Math.min(...uvValues),
        max: Math.max(...uvValues),
      },
      reason: `UV extremo hoy (pico ${peakHour.uv.toFixed(
        1
      )}). Solo temprano en la mañana.`,
      reasonKey: "extremeUVToday",
      reasonParams: { uv: peakHour.uv.toFixed(1) },
      duration: earlyHours.length * 60,
      isGoodForVitaminD: false,
    }
  }

  return null
}

function addHourToTimeString(timeStr: string): string {
  const match = timeStr.match(/^(.+T)(\d{2}):(\d{2})(.*)$/)
  if (match) {
    const [, prefix, hourStr, minutes, suffix] = match
    const newHour = (parseInt(hourStr, 10) + 1) % 24
    return `${prefix}${String(newHour).padStart(2, "0")}:${minutes}${suffix}`
  }
  return addHours(parseISOString(timeStr), 1).toISOString()
}

function findContiguousWindows(hours: HourlyUV[]): { hours: HourlyUV[] }[] {
  if (hours.length === 0) return []

  const sortedHours = [...hours].sort((a, b) => a.hour - b.hour)
  const windows: { hours: HourlyUV[] }[] = []
  let currentWindow: HourlyUV[] = [sortedHours[0]]

  for (let i = 1; i < sortedHours.length; i++) {
    if (sortedHours[i].hour === sortedHours[i - 1].hour + 1) {
      currentWindow.push(sortedHours[i])
    } else {
      windows.push({ hours: currentWindow })
      currentWindow = [sortedHours[i]]
    }
  }
  windows.push({ hours: currentWindow })

  return windows
}

export function calculateGoldenHour(
  sunrise: string,
  sunset: string
): {
  morningStart: string
  morningEnd: string
  eveningStart: string
  eveningEnd: string
} {
  const extractTime = (isoString: string): { hour: number; minute: number } => {
    const match = isoString.match(/T(\d{2}):(\d{2})/)
    if (match) {
      return { hour: parseInt(match[1], 10), minute: parseInt(match[2], 10) }
    }
    return { hour: 0, minute: 0 }
  }

  const sunriseTime = extractTime(sunrise)
  const sunsetTime = extractTime(sunset)

  const formatTimeWithOffset = (
    time: { hour: number; minute: number },
    offsetHours: number
  ): string => {
    let hour = time.hour + offsetHours
    if (hour < 0) hour += 24
    if (hour >= 24) hour -= 24
    return `${String(hour).padStart(2, "0")}:${String(time.minute).padStart(
      2,
      "0"
    )}`
  }

  const dateBase =
    sunrise.split("T")[0] || new Date().toISOString().split("T")[0]

  return {
    morningStart: `${dateBase}T${formatTimeWithOffset(sunriseTime, 0)}`,
    morningEnd: `${dateBase}T${formatTimeWithOffset(sunriseTime, 1)}`,
    eveningStart: `${dateBase}T${formatTimeWithOffset(sunsetTime, -1)}`,
    eveningEnd: `${dateBase}T${formatTimeWithOffset(sunsetTime, 0)}`,
  }
}

export function formatDurationSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  return formatDuration(minutes)
}

export function getRecommendedExposureTime(uvIndex: number): number {
  if (uvIndex <= 2) return 60
  if (uvIndex <= 5) return 30
  if (uvIndex <= 7) return 20
  if (uvIndex <= 10) return 15
  return 10
}
