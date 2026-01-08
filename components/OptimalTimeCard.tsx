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
import { useLanguage } from "./LanguageContext"

interface OptimalTimeCardProps {
  hourlyUV: HourlyUV[]
  currentUV: number
  timezone: string // IANA timezone e.g. "Europe/Madrid"
}

/**
 * Format UV range for display
 * Shows single value if min ≈ max, otherwise shows range
 */
function formatUVRange(min: number, max: number): string {
  // Round to 1 decimal
  const minRounded = Math.round(min * 10) / 10
  const maxRounded = Math.round(max * 10) / 10
  
  // If values are very close, show single value
  if (Math.abs(maxRounded - minRounded) < 0.2) {
    return `~${((minRounded + maxRounded) / 2).toFixed(1)}`
  }
  
  return `${minRounded.toFixed(1)} - ${maxRounded.toFixed(1)}`
}

export function OptimalTimeCard({ hourlyUV, currentUV, timezone }: OptimalTimeCardProps) {
  const { t } = useLanguage()
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
            <p className="text-white/60 text-sm">{t.common.bestSunWindow}</p>
            <p className="text-white font-medium">{t.common.notAvailable}</p>
          </div>
        </div>
        <p className="text-white/60 text-sm">
          {t.common.insufficientData}
        </p>
      </GlassCard>
    )
  }

  const startTime = formatTime(optimalTime.startTime, timezone)
  const endTime = formatTime(optimalTime.endTime, timezone)
  
  // Calculate duration in hours for display
  const durationHours = Math.floor(optimalTime.duration / 60)
  const durationDisplay = durationHours > 1 
    ? `${durationHours} ${t.common.hoursOfWindow}`
    : durationHours === 1 
      ? t.common.hourOfWindow
      : `30 ${t.common.minutesOfWindow}`

  // Get localized reason text
  const getReason = () => {
    if (!optimalTime.reasonKey) return optimalTime.reason
    let text = t.reasons[optimalTime.reasonKey]
    if (optimalTime.reasonParams) {
      Object.entries(optimalTime.reasonParams).forEach(([key, value]) => {
        text = text.replace(`{${key}}`, String(value))
      })
    }
    return text
  }

  return (
    <GlassCard variant="secondary" className="h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            "icon-container",
            optimalTime.isGoodForVitaminD ? "icon-container-amber" : "icon-container-blue"
          )}
        >
          {optimalTime.isGoodForVitaminD ? (
            <Sparkles className="w-6 h-6 text-amber-300" />
          ) : (
            <Clock className="w-6 h-6 text-blue-300" />
          )}
        </div>
        <div>
          <p className="text-white/70 text-sm">{t.common.bestSunWindow}</p>
          <p className="text-white font-semibold text-lg text-shadow-sm">
            {optimalTime.isGoodForVitaminD
              ? t.common.optimalVitaminD
              : t.common.bestAvailable}
          </p>
        </div>
      </div>

      {/* Time display - always show range */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white text-shadow">{startTime}</span>
          <span className="text-white/50 text-2xl">→</span>
          <span className="text-4xl font-bold text-white text-shadow">{endTime}</span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <p className="text-white/70 text-sm font-medium">
            UV: {formatUVRange(optimalTime.uvRange.min, optimalTime.uvRange.max)}
          </p>
          <span className="text-white/40">•</span>
          <p className="text-white/70 text-sm">{durationDisplay}</p>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-3">
        <p className="text-white/80 text-sm">{getReason()}</p>
        <div className="flex gap-2 flex-wrap">
          <span className="text-white text-xs bg-slate-700/70 border border-white/10 px-2.5 py-1.5 rounded-md font-medium">
            <Clock className="w-3 h-3 inline mr-1.5 opacity-70" />
            {recommendedDuration} {t.common.minutesOfWindow} {t.common.recommendedExposure}
          </span>
          {optimalTime.isGoodForVitaminD && (
            <span className="text-amber-200 text-xs bg-amber-900/50 border border-amber-500/30 px-2.5 py-1.5 rounded-md font-medium">
              <Sparkles className="w-3 h-3 inline mr-1.5" />
              {t.common.idealForVitaminD}
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
