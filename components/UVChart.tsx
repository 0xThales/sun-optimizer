"use client"

import { useMemo } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts"
import { TrendingUp } from "lucide-react"
import { GlassCard } from "./ui/GlassCard"
import { HourlyUV, UVRiskLevel } from "@/types"
import { getUVRiskLevel, getUVLevelName } from "@/lib/utils/calculations"
import { OPTIMAL_UV_RANGE, UV_THRESHOLDS } from "@/lib/constants"
import { formatInTimeZone } from "date-fns-tz"
import { useLanguage } from "./LanguageContext"

interface UVChartProps {
  hourlyUV: HourlyUV[]
  timezone: string // IANA timezone e.g. "Europe/Madrid"
}

interface UVLevelConfig {
  name: UVRiskLevel
  label: string
  min: number
  legendColor: string
  gradientColor: string
}

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { hour: number; uv: number } }>
}) {
  const { t } = useLanguage()
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload
  const level = getUVRiskLevel(data.uv)

  return (
    <div className="glass-card-primary p-3 !rounded-lg">
      <p className="text-white/60 text-xs mb-1">{data.hour}:00</p>
      <p className="text-white font-bold text-lg">UV: {data.uv.toFixed(1)}</p>
      <p className="text-white/70 text-xs">{getUVLevelName(level)}</p>
    </div>
  )
}

export function UVChart({ hourlyUV, timezone }: UVChartProps) {
  const { t } = useLanguage()

  // UV level configuration - uses thresholds from constants for consistency
  const UV_LEVELS: UVLevelConfig[] = [
    {
      name: "extreme",
      label: t.uvLevels.extreme,
      min: UV_THRESHOLDS.EXTREME.min,
      legendColor: "text-purple-300",
      gradientColor: "rgba(168, 85, 247, 0.6)",
    },
    {
      name: "very-high",
      label: t.uvLevels.veryHigh,
      min: UV_THRESHOLDS.VERY_HIGH.min,
      legendColor: "text-red-300",
      gradientColor: "rgba(239, 68, 68, 0.6)",
    },
    {
      name: "high",
      label: t.uvLevels.high,
      min: UV_THRESHOLDS.HIGH.min,
      legendColor: "text-orange-300",
      gradientColor: "rgba(249, 115, 22, 0.6)",
    },
    {
      name: "moderate",
      label: t.uvLevels.moderate,
      min: UV_THRESHOLDS.MODERATE.min,
      legendColor: "text-yellow-300",
      gradientColor: "rgba(250, 204, 21, 0.6)",
    },
    {
      name: "low",
      label: t.uvLevels.low,
      min: UV_THRESHOLDS.LOW.min,
      legendColor: "text-green-300",
      gradientColor: "rgba(34, 197, 94, 0.6)",
    },
  ]

  // Process data for chart - filter daylight hours and format
  const chartData = useMemo(() => {
    const now = new Date()
    // Get current hour in the target timezone
    const currentHour = parseInt(formatInTimeZone(now, timezone, "H"), 10)

    // Get next 12 hours of data, prioritizing daytime hours
    return hourlyUV
      .filter((h) => h.hour >= 6 && h.hour <= 20) // Daylight hours only
      .slice(0, 15) // Limit data points
      .map((h) => ({
        hour: h.hour,
        uv: h.uv,
        isCurrent: h.hour === currentHour,
        displayHour: `${h.hour}:00`,
      }))
  }, [hourlyUV, timezone])

  // Find max UV for Y-axis scale (at least 4 to show the optimal zone line at UV 3)
  const maxUV = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.uv), 4)
    return Math.ceil(max) + 1
  }, [chartData])

  // Get gradient stops based on the Y-axis range (0 to maxUV)
  const gradientStops = useMemo(() => {
    const stops = []
    const sortedLevels = [...UV_LEVELS].sort((a, b) => a.min - b.min)

    for (const level of sortedLevels) {
      if (level.min <= maxUV) {
        const offset = 100 - (level.min / maxUV) * 100
        stops.push({
          offset: `${Math.max(0, Math.min(100, offset))}%`,
          color: level.gradientColor,
        })
      }
    }

    if (!stops.length) {
      return [{ offset: "100%", color: "rgba(34, 197, 94, 0.6)" }]
    }

    const topStop = stops.find((s) => s.offset === "0%")
    if (!topStop) {
      const highestLevel = sortedLevels.filter((l) => l.min <= maxUV).pop()
      if (highestLevel) {
        stops.push({ offset: "0%", color: highestLevel.gradientColor })
      }
    }

    return stops.sort((a, b) => parseFloat(a.offset) - parseFloat(b.offset))
  }, [maxUV, t.uvLevels])

  // Determine which UV categories are actually present in the data
  const visibleCategories = useMemo(() => {
    const activeLevels = new Set(
      chartData.map((data) => getUVRiskLevel(data.uv))
    )
    return UV_LEVELS.filter((level) => activeLevels.has(level.name))
  }, [chartData, t.uvLevels])

  if (chartData.length === 0) {
    return (
      <GlassCard variant="secondary">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-white/60" />
          <h3 className="text-white font-medium">{t.common.uvByHour}</h3>
        </div>
        <p className="text-white/60 text-sm">{t.common.noDataAvailable}</p>
      </GlassCard>
    )
  }

  return (
    <GlassCard variant="secondary">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="icon-container icon-container-indigo">
            <TrendingUp className="w-5 h-5 text-indigo-300" />
          </div>
          <h3 className="text-white font-semibold text-shadow-sm">
            {t.common.uvByHour}
          </h3>
        </div>
        <div className="flex gap-3 text-xs font-medium">
          {visibleCategories.map((category) => (
            <span key={category.name} className={category.legendColor}>
              ● {category.label}
            </span>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 sm:h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="uvGradient" x1="0" y1="0" x2="0" y2="1">
                {gradientStops.map((stop, index) => (
                  <stop
                    key={index}
                    offset={stop.offset}
                    stopColor={stop.color}
                  />
                ))}
              </linearGradient>
            </defs>

            <XAxis
              dataKey="hour"
              tick={{
                fill: "rgba(255,255,255,0.7)",
                fontSize: 11,
                fontWeight: 500,
              }}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
              tickFormatter={(hour) => `${hour}h`}
            />

            <YAxis
              domain={[0, maxUV]}
              tick={{
                fill: "rgba(255,255,255,0.7)",
                fontSize: 11,
                fontWeight: 500,
              }}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
              tickCount={5}
            />

            {/* Optimal zone reference */}
            <ReferenceLine
              y={OPTIMAL_UV_RANGE.min}
              stroke="rgba(250, 204, 21, 0.5)"
              strokeDasharray="3 3"
            />
            <ReferenceLine
              y={OPTIMAL_UV_RANGE.max}
              stroke="rgba(250, 204, 21, 0.5)"
              strokeDasharray="3 3"
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="uv"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={2}
              fill="url(#uvGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-white/15">
        <p className="text-white/60 text-xs text-center">
          {t.common.optimalZoneLegend}
        </p>
      </div>
    </GlassCard>
  )
}
