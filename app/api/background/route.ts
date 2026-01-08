import { NextRequest, NextResponse } from "next/server"

/**
 * API route to fetch high-quality background images
 * Supports Unsplash (with API key) or Pexels (with API key) as fallback
 * Falls back to curated Picsum images if no API keys are configured
 */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || ""
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || ""

// Cache for storing fetched images (in-memory, resets on server restart)
const imageCache = new Map<string, { url: string; timestamp: number }>()
const CACHE_DURATION = 1000 * 60 * 60 // 1 hour cache

interface UnsplashPhoto {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
  }
  user: {
    name: string
    username: string
  }
  location?: {
    city?: string
    country?: string
  }
}

interface UnsplashSearchResponse {
  total: number
  total_pages: number
  results: UnsplashPhoto[]
}

interface PexelsPhoto {
  id: number
  src: {
    original: string
    large2x: string
    large: string
  }
  photographer: string
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[]
  total_results: number
}

/**
 * Try to fetch from Unsplash API
 * Uses raw URL with custom dimensions for maximum quality
 */
async function fetchFromUnsplash(
  query: string
): Promise<{ url: string; photographer?: string } | null> {
  if (!UNSPLASH_ACCESS_KEY) return null

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query
      )}&per_page=15&orientation=landscape&content_filter=high&order_by=relevant`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          "Accept-Version": "v1",
        },
      }
    )

    if (!response.ok) return null

    const data: UnsplashSearchResponse = await response.json()
    if (data.results.length === 0) return null

    // Pick from top 5 most relevant results
    const randomIndex = Math.floor(
      Math.random() * Math.min(data.results.length, 5)
    )
    const photo = data.results[randomIndex]

    // Use raw URL with high-quality parameters for large screens
    // w=2560 for 2K+ displays, q=90 for high quality, fm=jpg for compatibility
    const imageUrl = `${photo.urls.raw}&w=2560&h=1440&fit=crop&q=90&fm=jpg&auto=format`

    return {
      url: imageUrl,
      photographer: photo.user.name,
    }
  } catch {
    return null
  }
}

/**
 * Try to fetch from Pexels API
 * Uses original or large2x for maximum quality
 */
async function fetchFromPexels(
  query: string
): Promise<{ url: string; photographer?: string } | null> {
  if (!PEXELS_API_KEY) return null

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(
        query
      )}&per_page=15&orientation=landscape&size=large`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    )

    if (!response.ok) return null

    const data: PexelsSearchResponse = await response.json()
    if (data.photos.length === 0) return null

    // Pick from top 5 most relevant results
    const randomIndex = Math.floor(
      Math.random() * Math.min(data.photos.length, 5)
    )
    const photo = data.photos[randomIndex]

    // Use large2x (1880px) or original for highest quality
    return {
      url: photo.src.large2x || photo.src.original,
      photographer: photo.photographer,
    }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const location = searchParams.get("location") || ""
  const timePeriod = searchParams.get("timePeriod") || "day"

  // Create cache key from location and time period
  const cacheKey = `${location.toLowerCase()}-${timePeriod}`

  // Check cache first
  const cached = imageCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({ success: true, imageUrl: cached.url })
  }

  // Build search queries - simpler is better for Unsplash
  // Overly specific queries return poor results
  const timeModifiers: Record<string, string> = {
    night: "night skyline",
    sunrise: "sunrise",
    day: "cityscape",
    sunset: "sunset",
  }

  // Extract city name (before comma if present)
  const cityName = location.split(",")[0].trim()
  const timeModifier = timeModifiers[timePeriod] || timeModifiers.day

  // Build query variations from most specific to least
  const queries: string[] = []

  if (cityName) {
    // Most specific: "Tokyo sunset"
    queries.push(`${cityName} ${timeModifier}`)
    // Fallback: just city name for location-specific imagery
    queries.push(`${cityName} city`)
    // Just the city
    queries.push(cityName)
  }
  // Generic time-based fallback
  queries.push(`${timeModifier} city skyline`)

  let result: { url: string; photographer?: string } | null = null

  // Try each query in order until we get a result
  for (const query of queries) {
    result = await fetchFromUnsplash(query)
    if (result) {
      console.log(`[Background] Found image with query: "${query}"`)
      break
    }
  }

  // Try Pexels as fallback with same query progression
  if (!result) {
    for (const query of queries) {
      result = await fetchFromPexels(query)
      if (result) {
        console.log(`[Background] Found Pexels image with query: "${query}"`)
        break
      }
    }
  }

  // No API keys configured or no results found
  if (!result) {
    // Check if any API keys are configured
    if (!UNSPLASH_ACCESS_KEY && !PEXELS_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No image API keys configured. Add UNSPLASH_ACCESS_KEY or PEXELS_API_KEY to your .env file.",
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, error: "No images found for this location" },
      { status: 404 }
    )
  }

  // Cache the result
  imageCache.set(cacheKey, { url: result.url, timestamp: Date.now() })

  return NextResponse.json({
    success: true,
    imageUrl: result.url,
    photographer: result.photographer,
  })
}
