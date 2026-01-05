"use client"

import { Clock, Sparkles, AlertCircle } from "lucide-react"
import { GlassCard } from "./ui/GlassCard"
import {
  calculateOptimalTime,
  getRecommendedExposureTime,
} from "@/lib/utils/calculations"
import { formatTime } from "@/lib/utils/date"
import { HourlyUV } from "@/types"
import { cn } from "@/lib/utils/cn"

interface OptimalTimeCardProps {
  hourlyUV: HourlyUV[]
  currentUV: number
}

export function OptimalTimeCard({ hourlyUV, currentUV }: OptimalTimeCardProps) {
  const optimalTime = calculateOptimalTime(hourlyUV)
  const recommendedDuration = getRecommendedExposureTime(currentUV)

  if (!optimalTime) {
    return (
      <GlassCard variant="secondary" className="h-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gray-500/20">
            <AlertCircle className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <p className="text-white/60 text-sm">Hora Óptima</p>
            <p className="text-white font-medium">No disponible</p>
          </div>
        </div>
        <p className="text-white/60 text-sm">
          No hay datos suficientes para calcular el mejor momento de exposición
          solar hoy.
        </p>
      </GlassCard>
    )
  }

  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/cdd6a619-edec-4e95-b8fd-9dd4c9cc2c8a", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "OptimalTimeCard.tsx:42",
      message: "before formatTime",
      data: {
        startTimeISO: optimalTime.startTime,
        endTimeISO: optimalTime.endTime,
        clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        isClient: typeof window !== "undefined",
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "A",
    }),
  }).catch(() => {})
  // #endregion
  const startTime = formatTime(optimalTime.startTime)
  const endTime = formatTime(optimalTime.endTime)
  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/cdd6a619-edec-4e95-b8fd-9dd4c9cc2c8a", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "OptimalTimeCard.tsx:44",
      message: "after formatTime",
      data: { startTimeFormatted: startTime, endTimeFormatted: endTime },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "A",
    }),
  }).catch(() => {})
  // #endregion
  const isSameHour = startTime === endTime

  return (
    <GlassCard variant="secondary" className="h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            "p-2 rounded-xl",
            optimalTime.isGoodForVitaminD ? "bg-amber-500/20" : "bg-blue-500/20"
          )}
        >
          {optimalTime.isGoodForVitaminD ? (
            <Sparkles className="w-6 h-6 text-amber-400" />
          ) : (
            <Clock className="w-6 h-6 text-blue-400" />
          )}
        </div>
        <div>
          <p className="text-white/60 text-sm">Mejor Hora para el Sol</p>
          <p className="text-white font-medium text-lg">
            {optimalTime.isGoodForVitaminD
              ? "Vitamina D Óptima"
              : "Mejor Disponible"}
          </p>
        </div>
      </div>

      {/* Time display */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white">{startTime}</span>
          {!isSameHour && (
            <>
              <span className="text-white/40">-</span>
              <span className="text-4xl font-bold text-white">{endTime}</span>
            </>
          )}
        </div>
        <p className="text-white/60 text-sm mt-1">
          UV: {optimalTime.uvRange.min.toFixed(1)} -{" "}
          {optimalTime.uvRange.max.toFixed(1)}
        </p>
      </div>

      {/* Info */}
      <div className="space-y-2">
        <p className="text-white/70 text-sm">{optimalTime.reason}</p>
        <div className="flex gap-2 flex-wrap">
          <span className="text-white/80 text-xs bg-white/10 px-2 py-1 rounded">
            <Clock className="w-3 h-3 inline mr-1" />
            {recommendedDuration} min recomendados
          </span>
          {optimalTime.isGoodForVitaminD && (
            <span className="text-amber-400 text-xs bg-amber-500/20 px-2 py-1 rounded">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Ideal para Vitamina D
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
