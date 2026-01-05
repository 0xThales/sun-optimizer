/**
 * Time awareness utilities for day/night detection and timezone handling
 */

import { parseISO, format, addMinutes } from "date-fns"
import { formatInTimeZone, toZonedTime } from "date-fns-tz"

export interface TimeAwarenessData {
  isDayTime: boolean
  isNightTime: boolean
  localTime: string // HH:mm format
  localDate: string // Full date string
  timeZone: string
  sunriseTime: string
  sunsetTime: string
}

/**
 * Determine if it's currently day or night at a location based on sunrise/sunset
 * 
 * @param sunrise - Sunrise time (ISO string with timezone offset)
 * @param sunset - Sunset time (ISO string with timezone offset)
 * @param currentTime - Optional current time (defaults to now)
 * @returns Object with day/night status and local time information
 */
export function getTimeAwareness(
  sunrise: string,
  sunset: string,
  currentTime?: Date
): TimeAwarenessData {
  const now = currentTime || new Date()
  const sunriseDate = parseISO(sunrise)
  const sunsetDate = parseISO(sunset)
  
  // Check if current time is between sunrise and sunset
  const isDayTime = now >= sunriseDate && now <= sunsetDate
  const isNightTime = !isDayTime
  
  // Extract timezone offset from the ISO string
  // Format: "2024-01-05T07:30:00+01:00" -> "+01:00" or "-03:00"
  const offset = extractOffsetMinutesFromISO(sunrise)
  const timeZone = extractTimezoneFromISO(sunrise) || "UTC"
  
  // Calculate local time by applying the offset to UTC
  // The Date object parsed from ISO string is in UTC, so we add the offset
  const localTime = getLocalTimeString(now, offset)
  const localDate = getLocalDateString(now, offset)
  
  const sunriseTime = getLocalTimeString(sunriseDate, offset)
  const sunsetTime = getLocalTimeString(sunsetDate, offset)
  
  return {
    isDayTime,
    isNightTime,
    localTime,
    localDate,
    timeZone,
    sunriseTime,
    sunsetTime,
  }
}

/**
 * Extract timezone offset in minutes from an ISO string
 * Example: "2024-01-05T20:25:00-03:00" -> -180 (minutes)
 * Example: "2024-01-05T07:30:00+01:00" -> 60 (minutes)
 */
function extractOffsetMinutesFromISO(isoString: string): number {
  // Match timezone offset pattern: +HH:MM or -HH:MM
  const offsetMatch = isoString.match(/([+-])(\d{2}):(\d{2})$/)
  if (!offsetMatch) return 0
  
  const sign = offsetMatch[1] === '+' ? 1 : -1
  const hours = parseInt(offsetMatch[2], 10)
  const minutes = parseInt(offsetMatch[3], 10)
  
  return sign * (hours * 60 + minutes)
}

/**
 * Get local time string by applying offset to a UTC date
 */
function getLocalTimeString(date: Date, offsetMinutes: number): string {
  const localDate = addMinutes(date, offsetMinutes)
  return format(localDate, 'HH:mm')
}

/**
 * Get local date string by applying offset to a UTC date
 */
function getLocalDateString(date: Date, offsetMinutes: number): string {
  const localDate = addMinutes(date, offsetMinutes)
  return format(localDate, 'EEEE, d MMMM yyyy')
}

/**
 * Extract IANA timezone from an ISO string with offset
 * Note: This is a simplified version. For production, you'd want a proper
 * timezone database lookup based on coordinates.
 * 
 * @param isoString - ISO string with timezone offset (e.g., "2024-01-05T07:30:00+01:00")
 * @returns IANA timezone string or "UTC"
 */
function extractTimezoneFromISO(isoString: string): string {
  // For now, we'll use UTC as the base and rely on the ISO string's offset
  // A more robust solution would use the coordinates to lookup the IANA timezone
  // via a library like @vvo/tzdb or similar
  
  // Extract offset from ISO string
  const offsetMatch = isoString.match(/([+-]\d{2}:\d{2})$/)
  if (!offsetMatch) return "UTC"
  
  // For simplicity, return UTC. The formatInTimeZone will handle the offset
  // when we pass the Date object created from the ISO string
  return "UTC"
}

/**
 * Get timezone from coordinates using a simple lookup
 * This is a placeholder - in production you'd use a proper timezone lookup library
 * 
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns IANA timezone string
 */
export function getTimezoneFromCoordinates(lat: number, lon: number): string {
  // Simplified timezone detection based on longitude
  // This is NOT accurate for production use - use a proper library like geo-tz
  
  // Rough approximation: each 15 degrees of longitude = 1 hour
  const offset = Math.round(lon / 15)
  
  // Common timezone mappings (very simplified)
  const timezoneMap: Record<number, string> = {
    "-8": "America/Los_Angeles",
    "-7": "America/Denver",
    "-6": "America/Chicago",
    "-5": "America/New_York",
    "-4": "America/Caracas",
    "-3": "America/Sao_Paulo",
    "0": "Europe/London",
    "1": "Europe/Madrid",
    "2": "Europe/Athens",
    "3": "Europe/Moscow",
    "8": "Asia/Shanghai",
    "9": "Asia/Tokyo",
    "10": "Australia/Sydney",
  }
  
  return timezoneMap[offset] || "UTC"
}

/**
 * Determine background image based on time of day
 * 
 * @param isDayTime - Whether it's currently daytime
 * @returns Path to background image
 */
export function getBackgroundImage(isDayTime: boolean): string {
  return isDayTime ? "/weather.avif" : "/night.avif"
}

