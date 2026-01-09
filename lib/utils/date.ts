/**
 * Date utilities using date-fns for robust date/time handling
 * This module handles timezone-aware date operations to ensure consistency
 * between server (Vercel UTC) and client (user's timezone)
 */

import {
  format,
  parseISO,
  getHours,
  addHours,
  differenceInMinutes,
} from "date-fns"
import { formatInTimeZone, toZonedTime } from "date-fns-tz"

/**
 * Parse an ISO string and extract the hour in the original timezone
 * This is crucial for handling Open-Meteo data which includes timezone info
 *
 * Example: "2024-01-05T14:00:00+01:00" -> 14 (not affected by server timezone)
 */
export function extractHourFromISOString(isoString: string): number {
  // Extract hour from ISO string directly using regex
  // Format: "2024-01-05T14:00:00" or "2024-01-05T14:00:00+01:00"
  const hourMatch = isoString.match(/T(\d{2}):/)
  if (hourMatch) {
    return parseInt(hourMatch[1], 10)
  }

  // Fallback: parse and get UTC hour
  const date = parseISO(isoString)
  return date.getUTCHours()
}

/**
 * Format a date/time for display in HH:mm format
 * If timezone is provided, formats in that timezone
 * Otherwise uses browser's local timezone
 *
 * @param dateInput - Date object or ISO string (may or may not have timezone offset)
 * @param timezone - Optional IANA timezone (e.g., "Europe/Madrid")
 * @returns Formatted time string in HH:mm format (e.g., "14:30")
 */
export function formatTime(
  dateInput: Date | string,
  timezone?: string
): string {
  if (typeof dateInput === "string") {
    // Check if the ISO string already includes the time part with HH:mm
    // Open-Meteo returns strings like "2024-01-08T05:50" which are already in local time
    // If no timezone offset is present and we have a timezone, we should extract the time directly
    const hasTimezoneOffset =
      /[+-]\d{2}:\d{2}$/.test(dateInput) || dateInput.endsWith("Z")

    if (!hasTimezoneOffset && timezone) {
      // The time is already in local format, extract it directly
      const timeMatch = dateInput.match(/T(\d{2}:\d{2})/)
      if (timeMatch) {
        return timeMatch[1]
      }
    }

    // Parse and format with timezone
    const date = parseISO(dateInput)
    if (timezone) {
      return formatInTimeZone(date, timezone, "HH:mm")
    }
    return format(date, "HH:mm")
  }

  // Date object
  if (timezone) {
    return formatInTimeZone(dateInput, timezone, "HH:mm")
  }
  return format(dateInput, "HH:mm")
}

/**
 * Format a date/time with explicit timezone
 * Useful for server-side rendering where we want to show time in a specific timezone
 *
 * @param dateInput - Date object or ISO string
 * @param timeZone - IANA timezone (e.g., "Europe/Madrid", "America/New_York")
 * @returns Formatted time string in HH:mm format
 */
export function formatTimeInTimezone(
  dateInput: Date | string,
  timeZone: string
): string {
  const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput
  return formatInTimeZone(date, timeZone, "HH:mm")
}

/**
 * Format duration in a human-readable format
 *
 * @param minutes - Duration in minutes
 * @returns Formatted duration (e.g., "1h 30min", "45min")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`
  }

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (mins === 0) {
    return `${hours}h`
  }

  return `${hours}h ${mins}min`
}

/**
 * Calculate the difference between two times in minutes
 *
 * @param startTime - Start time (Date or ISO string)
 * @param endTime - End time (Date or ISO string)
 * @returns Difference in minutes
 */
export function getTimeDifferenceInMinutes(
  startTime: Date | string,
  endTime: Date | string
): number {
  const start = typeof startTime === "string" ? parseISO(startTime) : startTime
  const end = typeof endTime === "string" ? parseISO(endTime) : endTime
  return differenceInMinutes(end, start)
}

/**
 * Get the hour from a Date or ISO string
 * This respects the timezone embedded in the ISO string
 *
 * @param dateInput - Date object or ISO string
 * @returns Hour (0-23)
 */
export function getHourFromDate(dateInput: Date | string): number {
  if (typeof dateInput === "string") {
    // For ISO strings, extract hour directly to preserve timezone
    return extractHourFromISOString(dateInput)
  }
  return getHours(dateInput)
}

/**
 * Check if a time is within a range
 *
 * @param time - Time to check (Date or ISO string)
 * @param startTime - Start of range (Date or ISO string)
 * @param endTime - End of range (Date or ISO string)
 * @returns True if time is within range
 */
export function isTimeInRange(
  time: Date | string,
  startTime: Date | string,
  endTime: Date | string
): boolean {
  const t = typeof time === "string" ? parseISO(time) : time
  const start = typeof startTime === "string" ? parseISO(startTime) : startTime
  const end = typeof endTime === "string" ? parseISO(endTime) : endTime

  return t >= start && t <= end
}

/**
 * Parse ISO string to Date object
 * Wrapper around date-fns parseISO for consistency
 */
export function parseISOString(isoString: string): Date {
  return parseISO(isoString)
}
