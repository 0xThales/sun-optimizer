import { 
  UVRiskLevel, 
  OptimalTimeRecommendation, 
  ProtectionRecommendation,
  HourlyUV 
} from '@/types'
import { 
  UV_THRESHOLDS, 
  OPTIMAL_UV_RANGE, 
  SPF_RECOMMENDATIONS, 
  PROTECTION_MESSAGES 
} from '@/lib/constants'

/**
 * Get UV risk level from UV index value
 */
export function getUVRiskLevel(uvIndex: number): UVRiskLevel {
  if (uvIndex <= UV_THRESHOLDS.LOW.max) return 'low'
  if (uvIndex <= UV_THRESHOLDS.MODERATE.max) return 'moderate'
  if (uvIndex <= UV_THRESHOLDS.HIGH.max) return 'high'
  if (uvIndex <= UV_THRESHOLDS.VERY_HIGH.max) return 'very-high'
  return 'extreme'
}

/**
 * Get UV level display name in Spanish
 */
export function getUVLevelName(level: UVRiskLevel): string {
  const names: Record<UVRiskLevel, string> = {
    'low': 'Bajo',
    'moderate': 'Moderado',
    'high': 'Alto',
    'very-high': 'Muy Alto',
    'extreme': 'Extremo',
  }
  return names[level]
}

/**
 * Get protection recommendations based on UV index
 */
export function getProtectionRecommendation(uvIndex: number): ProtectionRecommendation {
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
 * Looks for times when UV is between 3-7 (good for Vitamin D without extreme risk)
 */
export function calculateOptimalTime(hourlyUV: HourlyUV[]): OptimalTimeRecommendation | null {
  // Filter hours within optimal UV range
  const optimalHours = hourlyUV.filter(
    h => h.uv >= OPTIMAL_UV_RANGE.min && h.uv <= OPTIMAL_UV_RANGE.max
  )

  if (optimalHours.length === 0) {
    // Check if all UV values are below optimal (morning/evening/winter)
    const allLow = hourlyUV.every(h => h.uv < OPTIMAL_UV_RANGE.min)
    
    if (allLow && hourlyUV.length > 0) {
      // Find the hour with highest UV (best we can do)
      const bestHour = hourlyUV.reduce((prev, curr) => 
        prev.uv > curr.uv ? prev : curr
      )
      
      return {
        startTime: bestHour.time,
        endTime: bestHour.time,
        uvRange: { min: bestHour.uv, max: bestHour.uv },
        reason: 'UV bajo hoy. Esta es la mejor hora disponible.',
        duration: 30,
        isGoodForVitaminD: false,
      }
    }
    
    return null
  }

  // Find continuous windows of optimal UV
  const windows: { start: number; end: number }[] = []
  let windowStart = 0
  
  for (let i = 0; i < optimalHours.length; i++) {
    if (i === 0 || optimalHours[i].hour !== optimalHours[i-1].hour + 1) {
      if (i > 0) {
        windows.push({ start: windowStart, end: i - 1 })
      }
      windowStart = i
    }
  }
  windows.push({ start: windowStart, end: optimalHours.length - 1 })

  // Find the longest window
  const longestWindow = windows.reduce((prev, curr) => 
    (curr.end - curr.start) > (prev.end - prev.start) ? curr : prev
  )

  const startHour = optimalHours[longestWindow.start]
  const endHour = optimalHours[longestWindow.end]
  
  const uvValues = optimalHours
    .slice(longestWindow.start, longestWindow.end + 1)
    .map(h => h.uv)

  return {
    startTime: startHour.time,
    endTime: endHour.time,
    uvRange: {
      min: Math.min(...uvValues),
      max: Math.max(...uvValues),
    },
    reason: 'UV óptimo para síntesis de vitamina D sin riesgo excesivo.',
    duration: (longestWindow.end - longestWindow.start + 1) * 60,
    isGoodForVitaminD: true,
  }
}

/**
 * Calculate golden hour times (1 hour after sunrise, 1 hour before sunset)
 */
export function calculateGoldenHour(
  sunrise: string,
  sunset: string
): { morningStart: Date; morningEnd: Date; eveningStart: Date; eveningEnd: Date } {
  const sunriseDate = new Date(sunrise)
  const sunsetDate = new Date(sunset)

  return {
    morningStart: sunriseDate,
    morningEnd: new Date(sunriseDate.getTime() + 60 * 60 * 1000),
    eveningStart: new Date(sunsetDate.getTime() - 60 * 60 * 1000),
    eveningEnd: sunsetDate,
  }
}

/**
 * Format duration in hours and minutes
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours === 0) {
    return `${minutes}m`
  }
  
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

/**
 * Format time from Date or ISO string
 */
export function formatTime(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
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

