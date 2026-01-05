import { NextRequest, NextResponse } from "next/server"
import {
  getWeatherData as getOpenWeatherData,
  isOpenWeatherConfigured,
} from "@/lib/weather/openweather"
import { getWeatherData as getOpenMeteoData } from "@/lib/weather/openmeteo"
import { WeatherData, Location } from "@/types"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  // Validate parameters
  if (!lat || !lon) {
    return NextResponse.json(
      { success: false, error: "Missing lat or lon parameters" },
      { status: 400 }
    )
  }

  const latitude = parseFloat(lat)
  const longitude = parseFloat(lon)

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json(
      { success: false, error: "Invalid coordinates" },
      { status: 400 }
    )
  }

  // Validate coordinate ranges
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json(
      { success: false, error: "Coordinates out of range" },
      { status: 400 }
    )
  }

  try {
    let weatherData

    // Try OpenWeatherMap first if API key is configured
    if (isOpenWeatherConfigured()) {
      try {
        weatherData = await getOpenWeatherData(latitude, longitude)
      } catch (openWeatherError) {
        console.warn(
          "OpenWeatherMap failed, falling back to Open-Meteo:",
          openWeatherError
        )
        weatherData = await getOpenMeteoData(latitude, longitude)
      }
    } else {
      // Use Open-Meteo as default (free, no API key)
      weatherData = await getOpenMeteoData(latitude, longitude)
    }

    // Transform to WeatherData format
    const location: Location = {
      name: weatherData.locationName,
      lat: weatherData.lat,
      lon: weatherData.lon,
    }

    const response: WeatherData = {
      location,
      uvData: {
        current: weatherData.currentUV,
        hourly: weatherData.hourlyUV,
      },
      sunTimes: {
        sunrise: weatherData.sunrise,
        sunset: weatherData.sunset,
        solarNoon: weatherData.solarNoon,
        dayLength: weatherData.dayLength,
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({ success: true, data: response })
  } catch (error) {
    console.error("Weather API error:", error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch weather data",
      },
      { status: 500 }
    )
  }
}
