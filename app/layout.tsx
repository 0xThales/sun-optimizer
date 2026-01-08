import type { Metadata, Viewport } from "next"
import "./globals.css"
import { LanguageProvider } from "@/components/LanguageContext"

export const metadata: Metadata = {
  title: "SunOptimizer - Best Time for Sun Exposure",
  description:
    "Find the optimal time to get sun exposure based on your location. Track UV index, sunrise, sunset, and get personalized recommendations.",
  keywords: ["sun exposure", "UV index", "vitamin D", "biohacking", "health"],
  authors: [{ name: "SunOptimizer" }],
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-slate-900">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
