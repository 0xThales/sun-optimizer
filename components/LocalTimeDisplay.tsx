"use client"

import { useEffect, useState } from "react"
import { Clock, MapPin } from "lucide-react"
import { GlassCard } from "./ui/GlassCard"
import { getTimeAwareness, TimeAwarenessData } from "@/lib/utils/timeAwareness"
import { cn } from "@/lib/utils/cn"

interface LocalTimeDisplayProps {
  sunrise: string
  sunset: string
  locationName: string
  timezone: string // IANA timezone e.g. "Europe/Madrid"
}

export function LocalTimeDisplay({
  sunrise,
  sunset,
  locationName,
  timezone,
}: LocalTimeDisplayProps) {
  const [timeData, setTimeData] = useState<TimeAwarenessData | null>(null)

  useEffect(() => {
    // Initial calculation
    const updateTime = () => {
      const data = getTimeAwareness(sunrise, sunset, timezone)
      setTimeData(data)
    }

    updateTime()

    // Update every minute
    const interval = setInterval(updateTime, 60000)

    return () => clearInterval(interval)
  }, [sunrise, sunset, timezone])

  if (!timeData) return null

  return (
    <GlassCard
      variant="secondary"
      className={cn(
        "transition-all duration-500",
        timeData.isDayTime
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-indigo-500/30 bg-indigo-500/5"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Location and time */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-white/70" />
            <span className="text-white text-sm font-medium text-shadow-sm">{locationName}</span>
          </div>

          <div className="flex items-baseline gap-3">
            <Clock
              className={cn(
                "w-6 h-6",
                timeData.isDayTime ? "text-amber-400 icon-glow-amber" : "text-indigo-400 icon-glow-blue"
              )}
            />
            <div>
              <p
                className={cn(
                  "text-3xl font-bold text-shadow",
                  timeData.isDayTime ? "text-amber-200" : "text-indigo-200"
                )}
              >
                {timeData.localTime}
              </p>
              <p className="text-white/70 text-xs mt-1">Hora local</p>
            </div>
          </div>
        </div>

        {/* Day/Night indicator */}
        <div
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium",
            timeData.isDayTime
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
          )}
        >
          {timeData.isDayTime ? "☀️ Día" : "🌙 Noche"}
        </div>
      </div>

      {/* Sunrise/Sunset info */}
      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs">
        <div>
          <span className="text-white/50">Amanecer:</span>
          <span className="text-white/80 ml-2 font-medium">
            {timeData.sunriseTime}
          </span>
        </div>
        <div>
          <span className="text-white/50">Atardecer:</span>
          <span className="text-white/80 ml-2 font-medium">
            {timeData.sunsetTime}
          </span>
        </div>
      </div>
    </GlassCard>
  )
}


