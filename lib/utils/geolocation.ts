import { Coordinates, GeolocationState } from "@/types"

export async function getUserLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalización no soportada en este navegador"))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        })
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Permiso de ubicación denegado"))
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Información de ubicación no disponible"))
            break
          case error.TIMEOUT:
            reject(new Error("Tiempo de espera agotado"))
            break
          default:
            reject(new Error("Error desconocido de geolocalización"))
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    )
  })
}

export function isGeolocationSupported(): boolean {
  return typeof window !== "undefined" && "geolocation" in navigator
}

export function formatCoordinates(coords: Coordinates): string {
  const latDir = coords.lat >= 0 ? "N" : "S"
  const lonDir = coords.lon >= 0 ? "E" : "W"
  return `${Math.abs(coords.lat).toFixed(4)}°${latDir}, ${Math.abs(
    coords.lon
  ).toFixed(4)}°${lonDir}`
}


