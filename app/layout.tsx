import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "SunOptimizer - Best Time for Sun Exposure",
  description:
    "Find the optimal time to get sun exposure based on your location. Track UV index, sunrise, sunset, and get personalized recommendations.",
  keywords: ["sun exposure", "UV index", "vitamin D", "biohacking", "health"],
  authors: [{ name: "SunOptimizer" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div
          className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat"
          style={{ backgroundImage: "url('/weather.avif')" }}
        >
          <div className="min-h-screen bg-black/20">{children}</div>
        </div>
      </body>
    </html>
  )
}
