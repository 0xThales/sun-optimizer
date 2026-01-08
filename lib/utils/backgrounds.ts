/**
 * Dynamic background utilities using Unsplash API
 * Creates atmospheric, high-quality backgrounds based on location and time
 */

import { TimePeriod } from "./timeAwareness"

/**
 * Configuration for background image generation
 */
export interface BackgroundConfig {
  locationName?: string
  timePeriod: TimePeriod
}

/**
 * Response from our background API
 */
interface BackgroundApiResponse {
  success: boolean
  imageUrl?: string
  photographer?: string
  photographerUsername?: string
  error?: string
}

/**
 * Fallback gradient backgrounds for each time period
 * Used when API fails or images don't load
 */
const FALLBACK_GRADIENTS: Record<TimePeriod, string> = {
  night: `linear-gradient(180deg,
    #0a0a1a 0%,
    #0f1628 20%,
    #1a2744 45%,
    #1e3a5f 70%,
    #243b55 100%
  )`,
  sunrise: `linear-gradient(180deg,
    #1a1a2e 0%,
    #3d2c5e 15%,
    #7b4b94 30%,
    #d4778e 50%,
    #f5a97f 70%,
    #ffd89b 100%
  )`,
  day: `linear-gradient(180deg,
    #1e3a5f 0%,
    #2d5a87 15%,
    #4a90b8 35%,
    #7ab8d4 55%,
    #a8d4e8 75%,
    #d4e8f2 100%
  )`,
  sunset: `linear-gradient(180deg,
    #1a1a2e 0%,
    #2d3a5f 15%,
    #5c4b7a 30%,
    #c26b7a 50%,
    #e8a87c 70%,
    #ffd4a3 100%
  )`,
}

/**
 * Fetch a high-quality background image from our API
 * The API fetches from Unsplash with location and time-specific queries
 */
export async function fetchBackgroundImage(
  config: BackgroundConfig
): Promise<BackgroundApiResponse> {
  const { locationName, timePeriod } = config

  try {
    const params = new URLSearchParams({
      location: locationName || "",
      timePeriod: timePeriod,
    })

    const response = await fetch(`/api/background?${params}`)
    const data: BackgroundApiResponse = await response.json()

    return data
  } catch (error) {
    console.error("Error fetching background:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch",
    }
  }
}

/**
 * Get the fallback gradient for a time period
 */
export function getFallbackGradient(timePeriod: TimePeriod): string {
  return FALLBACK_GRADIENTS[timePeriod]
}

/**
 * Preload a background image and return a promise
 * Useful for smooth transitions between backgrounds
 */
export function preloadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(url)
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}

/**
 * Get background style object for React components
 * Includes the image URL with a dark overlay for text readability
 * Optimized for large screens with proper sizing and positioning
 */
export function getBackgroundStyle(
  imageUrl: string | null,
  fallbackGradient: string
): React.CSSProperties {
  if (imageUrl) {
    return {
      backgroundImage: `
        linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0.3) 0%,
          rgba(0, 0, 0, 0.2) 40%,
          rgba(0, 0, 0, 0.35) 100%
        ),
        url(${imageUrl})
      `,
      backgroundSize: "cover",
      backgroundPosition: "center center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed",
      // Ensure image fills the viewport properly on all screens
      minHeight: "100vh",
    }
  }

  return {
    background: fallbackGradient,
    backgroundAttachment: "fixed",
    minHeight: "100vh",
  }
}

// Re-export for backwards compatibility
export function getUnsplashBackgroundUrl(): string {
  // This is now deprecated - use fetchBackgroundImage instead
  return ""
}
