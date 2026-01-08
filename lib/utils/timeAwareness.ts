/**
 * Time awareness utilities for day/night detection and timezone handling
 */

import { parseISO, format } from "date-fns"
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz"

/**
 * Time periods for atmospheric backgrounds
 * - night: Dark hours (after sunset + golden hour, before sunrise - golden hour)
 * - sunrise: Golden hour around sunrise (~45 mins before/after)
 * - day: Bright daylight hours
 * - sunset: Golden hour around sunset (~45 mins before/after)
 */
export type TimePeriod = "night" | "sunrise" | "day" | "sunset"

export interface TimeAwarenessData {
  isDayTime: boolean
  isNightTime: boolean
  timePeriod: TimePeriod
  localTime: string // HH:mm format
  localDate: string // Full date string
  timeZone: string
  sunriseTime: string
  sunsetTime: string
}

/**
 * Parse an ISO string that may or may not have timezone info
 * If no timezone offset is present, interprets it as being in the specified timezone
 */
function parseTimeInTimezone(isoString: string, timezone: string): Date {
  const hasTimezoneOffset =
    /[+-]\d{2}:\d{2}$/.test(isoString) || isoString.endsWith("Z")

  if (hasTimezoneOffset) {
    // Has timezone info, parse directly
    return parseISO(isoString)
  }

  // No timezone info - the string represents a time in the target timezone
  // Use fromZonedTime to convert from local timezone to UTC
  return fromZonedTime(isoString, timezone)
}

/**
 * Extract time string from ISO format (handles both with and without timezone)
 */
function extractTimeFromISO(isoString: string, timezone: string): string {
  const hasTimezoneOffset =
    /[+-]\d{2}:\d{2}$/.test(isoString) || isoString.endsWith("Z")

  if (!hasTimezoneOffset) {
    // The time is already in local format, extract directly
    const timeMatch = isoString.match(/T(\d{2}:\d{2})/)
    if (timeMatch) {
      return timeMatch[1]
    }
  }

  // Has timezone info or couldn't extract, format properly
  const date = parseISO(isoString)
  return formatInTimeZone(date, timezone, "HH:mm")
}

/**
 * Golden hour duration in milliseconds (45 minutes)
 */
const GOLDEN_HOUR_MS = 45 * 60 * 1000

/**
 * Determine the current time period based on sun position
 */
function getTimePeriod(
  now: Date,
  sunriseDate: Date,
  sunsetDate: Date
): TimePeriod {
  const nowMs = now.getTime()
  const sunriseMs = sunriseDate.getTime()
  const sunsetMs = sunsetDate.getTime()

  // Sunrise golden hour: 45 mins before to 45 mins after sunrise
  const sunriseStart = sunriseMs - GOLDEN_HOUR_MS
  const sunriseEnd = sunriseMs + GOLDEN_HOUR_MS

  // Sunset golden hour: 45 mins before to 45 mins after sunset
  const sunsetStart = sunsetMs - GOLDEN_HOUR_MS
  const sunsetEnd = sunsetMs + GOLDEN_HOUR_MS

  if (nowMs >= sunriseStart && nowMs <= sunriseEnd) {
    return "sunrise"
  }

  if (nowMs >= sunsetStart && nowMs <= sunsetEnd) {
    return "sunset"
  }

  if (nowMs > sunriseEnd && nowMs < sunsetStart) {
    return "day"
  }

  return "night"
}

/**
 * Determine if it's currently day or night at a location based on sunrise/sunset
 * Now uses the IANA timezone for accurate time calculations
 *
 * @param sunrise - Sunrise time (ISO string, may be local time without offset)
 * @param sunset - Sunset time (ISO string, may be local time without offset)
 * @param timezone - IANA timezone (e.g., "Europe/Madrid")
 * @param currentTime - Optional current time (defaults to now)
 * @returns Object with day/night status and local time information
 */
export function getTimeAwareness(
  sunrise: string,
  sunset: string,
  timezone?: string,
  currentTime?: Date
): TimeAwarenessData {
  const now = currentTime || new Date()
  const tz = timezone || "UTC"

  // Parse sunrise/sunset - handle both formats (with and without timezone offset)
  const sunriseDate = parseTimeInTimezone(sunrise, tz)
  const sunsetDate = parseTimeInTimezone(sunset, tz)

  // Compare using UTC timestamps
  const isDayTime = now >= sunriseDate && now <= sunsetDate
  const isNightTime = !isDayTime

  // Determine the specific time period
  const timePeriod = getTimePeriod(now, sunriseDate, sunsetDate)

  // Format times in the target timezone
  const localTime = formatInTimeZone(now, tz, "HH:mm")
  const localDate = formatInTimeZone(now, tz, "EEEE, d MMMM yyyy")

  // Extract sunrise/sunset times
  const sunriseTime = extractTimeFromISO(sunrise, tz)
  const sunsetTime = extractTimeFromISO(sunset, tz)

  return {
    isDayTime,
    isNightTime,
    timePeriod,
    localTime,
    localDate,
    timeZone: tz,
    sunriseTime,
    sunsetTime,
  }
}

/**
 * Determine background based on time of day
 * Returns CSS gradient for beautiful, consistent backgrounds
 *
 * @param isDayTime - Whether it's currently daytime
 * @returns CSS background value
 */
export function getBackgroundImage(isDayTime: boolean): string {
  if (isDayTime) {
    // Beautiful day sky gradient with subtle clouds effect
    return `
      linear-gradient(180deg, 
        #1e3a5f 0%, 
        #2d5a87 15%,
        #4a90b8 35%,
        #7ab8d4 55%,
        #a8d4e8 75%,
        #d4e8f2 100%
      )
    `
  }
  // Beautiful night sky with stars feel
  return `
    linear-gradient(180deg,
      #0a0a1a 0%,
      #0f1628 20%,
      #1a2744 45%,
      #1e3a5f 70%,
      #243b55 100%
    )
  `
}
