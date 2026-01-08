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
  PROTECTION_MESSAGES,
} from "@/lib/constants"
import {
  formatTime,
  formatDuration,
  getTimeDifferenceInMinutes,
  parseISOString,
} from "@/lib/utils/date"
import { addHours } from "date-fns"

/**
 * Get UV risk level from UV index value
 */
export function getUVRiskLevel(uvIndex: number): UVRiskLevel {
  if (uvIndex <= UV_THRESHOLDS.LOW.max) return "low"
  if (uvIndex <= UV_THRESHOLDS.MODERATE.max) return "moderate"
  if (uvIndex <= UV_THRESHOLDS.HIGH.max) return "high"
  if (uvIndex <= UV_THRESHOLDS.VERY_HIGH.max) return "very-high"
  return "extreme"
}

/**
 * Get UV level display name in Spanish
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
 */
export function getProtectionRecommendation(
  uvIndex: number
): ProtectionRecommendation {
  const level = getUVRiskLevel(uvIndex)
  const message = PROTECTION_MESSAGES[level]

  return {
    level,
    spfNeeded: SPF_RECOMMENDATIONS[level],
    message: message.message,
    precautions: [...message.precautions],
  }
}

/**
 * Calculate optimal time window for sun exposure
 * 
 * CRITERIA:
 * - Optimal UV range for Vitamin D: 3-7 (good synthesis without excessive risk)
 * - Low UV day (winter/cloudy): UV < 3 all day → recommend peak 2-3 hours
 * - High UV day: UV > 7 during peak → recommend morning or evening
 * 
 * The window shows START to END of the recommended period
 */
export function calculateOptimalTime(
  hourlyUV: HourlyUV[]
): OptimalTimeRecommendation | null {
  // Filter daylight hours (6am - 8pm) for practical recommendations
  const daylightHours = hourlyUV.filter((h) => h.hour >= 6 && h.hour <= 20)
  
  if (daylightHours.length === 0) {
    return null
  }

  // Find peak UV and its hour
  const peakHour = daylightHours.reduce((prev, curr) => 
    curr.uv > prev.uv ? curr : prev
  )

  // CASE 1: Optimal UV available (UV 3-7)
  const optimalHours = daylightHours.filter(
    (h) => h.uv >= OPTIMAL_UV_RANGE.min && h.uv <= OPTIMAL_UV_RANGE.max
  )
  
  if (optimalHours.length > 0) {
    // Find contiguous windows of optimal UV
    const windows = findContiguousWindows(optimalHours)
    const longestWindow = windows.reduce((prev, curr) =>
      curr.hours.length > prev.hours.length ? curr : prev
    )

    const uvValues = longestWindow.hours.map((h) => h.uv)
    const lastHourTime = longestWindow.hours[longestWindow.hours.length - 1].time
    const windowEndTime = addHourToTimeString(lastHourTime)

    return {
      startTime: longestWindow.hours[0].time,
      endTime: windowEndTime,
      uvRange: {
        min: Math.min(...uvValues),
        max: Math.max(...uvValues),
      },
      reason: "UV óptimo para síntesis de vitamina D sin riesgo excesivo.",
      duration: longestWindow.hours.length * 60,
      isGoodForVitaminD: true,
    }
  }

  // CASE 2: Low UV day (all UV < 3) - winter or very cloudy
  const allLow = daylightHours.every((h) => h.uv < OPTIMAL_UV_RANGE.min)
  
  if (allLow) {
    // For low UV days, select the 2-3 hours with highest UV (centered on peak)
    // Only include hours with meaningful UV (> 1.0)
    const meaningfulHours = daylightHours
      .filter((h) => h.uv >= 1.0)
      .sort((a, b) => a.hour - b.hour)
    
    if (meaningfulHours.length === 0) {
      // Very low UV - just recommend peak hour
      const windowEndTime = addHourToTimeString(peakHour.time)
      return {
        startTime: peakHour.time,
        endTime: windowEndTime,
        uvRange: { min: peakHour.uv, max: peakHour.uv },
        reason: `UV muy bajo hoy (máx ${peakHour.uv.toFixed(1)}). Maximiza tu tiempo al sol.`,
        duration: 60,
        isGoodForVitaminD: false,
      }
    }
    
    // Find contiguous windows and pick the one containing the peak
    const windows = findContiguousWindows(meaningfulHours)
    const windowWithPeak = windows.find(w => 
      w.hours.some(h => h.hour === peakHour.hour)
    ) || windows[0]
    
    // Limit to max 4 hours centered around the highest UV
    let selectedHours = windowWithPeak.hours
    if (selectedHours.length > 4) {
      // Find index of peak in this window
      const peakIdx = selectedHours.findIndex(h => h.hour === peakHour.hour)
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
      reason: `UV bajo hoy (máx ${peakHour.uv.toFixed(1)}). Esta es la mejor ventana.`,
      duration: selectedHours.length * 60,
      isGoodForVitaminD: false,
    }
  }

  // CASE 3: High UV day (peak UV > 7) - recommend safer times
  const safeHours = daylightHours.filter(
    (h) => h.uv >= 2 && h.uv <= OPTIMAL_UV_RANGE.max
  )
  
  if (safeHours.length > 0) {
    const windows = findContiguousWindows(safeHours)
    // Prefer morning window if available
    const morningWindow = windows.find(w => w.hours[0].hour < 12)
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
      reason: `UV alto hoy (pico ${peakHour.uv.toFixed(1)}). Evita horas centrales.`,
      duration: bestWindow.hours.length * 60,
      isGoodForVitaminD: true,
    }
  }

  // Fallback: recommend early morning
  const earlyHours = daylightHours.filter(h => h.hour >= 7 && h.hour <= 9)
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
      reason: `UV extremo hoy (pico ${peakHour.uv.toFixed(1)}). Solo temprano en la mañana.`,
      duration: earlyHours.length * 60,
      isGoodForVitaminD: false,
    }
  }

  return null
}

/**
 * Add 1 hour to a time string like "2026-01-08T14:00" → "2026-01-08T15:00"
 */
function addHourToTimeString(timeStr: string): string {
  const match = timeStr.match(/^(.+T)(\d{2}):(\d{2})(.*)$/)
  if (match) {
    const [, prefix, hourStr, minutes, suffix] = match
    const newHour = (parseInt(hourStr, 10) + 1) % 24
    return `${prefix}${String(newHour).padStart(2, '0')}:${minutes}${suffix}`
  }
  // Fallback: use date-fns
  return addHours(parseISOString(timeStr), 1).toISOString()
}

/**
 * Find contiguous windows of hours (hours that are consecutive)
 */
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

/**
 * Calculate golden hour times (1 hour after sunrise, 1 hour before sunset)
 * Returns ISO strings that can be formatted with timezone
 */
export function calculateGoldenHour(
  sunrise: string,
  sunset: string
): {
  morningStart: string
  morningEnd: string
  eveningStart: string
  eveningEnd: string
} {
  // Extract hours and minutes from sunrise/sunset ISO strings
  // These strings may or may not have timezone offset
  const extractTime = (isoString: string): { hour: number; minute: number } => {
    const match = isoString.match(/T(\d{2}):(\d{2})/)
    if (match) {
      return { hour: parseInt(match[1], 10), minute: parseInt(match[2], 10) }
    }
    return { hour: 0, minute: 0 }
  }

  const sunriseTime = extractTime(sunrise)
  const sunsetTime = extractTime(sunset)

  // Format time as HH:mm, adding/subtracting an hour
  const formatTimeWithOffset = (time: { hour: number; minute: number }, offsetHours: number): string => {
    let hour = time.hour + offsetHours
    if (hour < 0) hour += 24
    if (hour >= 24) hour -= 24
    return `${String(hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`
  }

  // Return ISO-like strings that preservethe time portion
  // These can be passed to formatTime which will extract HH:mm
  const dateBase = sunrise.split('T')[0] || new Date().toISOString().split('T')[0]
  
  return {
    morningStart: `${dateBase}T${formatTimeWithOffset(sunriseTime, 0)}`,
    morningEnd: `${dateBase}T${formatTimeWithOffset(sunriseTime, 1)}`,
    eveningStart: `${dateBase}T${formatTimeWithOffset(sunsetTime, -1)}`,
    eveningEnd: `${dateBase}T${formatTimeWithOffset(sunsetTime, 0)}`,
  }
}

/**
 * Format duration in hours and minutes (seconds version for backward compatibility)
 */
export function formatDurationSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  return formatDuration(minutes)
}

/**
 * Get recommended exposure time based on UV and skin type (simplified)
 */
export function getRecommendedExposureTime(uvIndex: number): number {
  // Simplified calculation: minutes for moderate skin type (Type III)
  // This is a rough estimate, proper calculation would need skin type input
  if (uvIndex <= 2) return 60
  if (uvIndex <= 5) return 30
  if (uvIndex <= 7) return 20
  if (uvIndex <= 10) return 15
  return 10
}
