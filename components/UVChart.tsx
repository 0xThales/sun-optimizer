'use client'

import { useMemo } from 'react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  ReferenceLine,
  Tooltip
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { GlassCard } from './ui/GlassCard'
import { HourlyUV } from '@/types'
import { getUVRiskLevel } from '@/lib/utils/calculations'
import { OPTIMAL_UV_RANGE } from '@/lib/constants'

interface UVChartProps {
  hourlyUV: HourlyUV[]
}

// Custom tooltip component
function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { hour: number; uv: number } }> }) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload
  const level = getUVRiskLevel(data.uv)
  
  return (
    <div className="glass-card-primary p-3 !rounded-lg">
      <p className="text-white/60 text-xs mb-1">{data.hour}:00</p>
      <p className="text-white font-bold text-lg">UV: {data.uv.toFixed(1)}</p>
      <p className="text-white/70 text-xs capitalize">{level.replace('-', ' ')}</p>
    </div>
  )
}

export function UVChart({ hourlyUV }: UVChartProps) {
  // Process data for chart - filter daylight hours and format
  const chartData = useMemo(() => {
    const now = new Date()
    const currentHour = now.getHours()
    
    // Get next 12 hours of data, prioritizing daytime hours
    return hourlyUV
      .filter(h => h.hour >= 6 && h.hour <= 20) // Daylight hours only
      .slice(0, 15) // Limit data points
      .map(h => ({
        hour: h.hour,
        uv: h.uv,
        isCurrent: h.hour === currentHour,
        displayHour: `${h.hour}:00`,
      }))
  }, [hourlyUV])

  // Find max UV for scale
  const maxUV = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.uv), 5)
    return Math.ceil(max) + 1
  }, [chartData])

  // Get gradient stops based on UV values
  const gradientStops = useMemo(() => {
    return [
      { offset: '0%', color: 'rgba(34, 197, 94, 0.6)' },   // green - low
      { offset: '30%', color: 'rgba(250, 204, 21, 0.6)' }, // yellow - moderate
      { offset: '60%', color: 'rgba(249, 115, 22, 0.6)' }, // orange - high
      { offset: '80%', color: 'rgba(239, 68, 68, 0.6)' },  // red - very high
      { offset: '100%', color: 'rgba(168, 85, 247, 0.6)' }, // purple - extreme
    ]
  }, [])

  if (chartData.length === 0) {
    return (
      <GlassCard variant="secondary">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-white/60" />
          <h3 className="text-white font-medium">UV por Hora</h3>
        </div>
        <p className="text-white/60 text-sm">
          No hay datos de UV disponibles para las próximas horas.
        </p>
      </GlassCard>
    )
  }

  return (
    <GlassCard variant="secondary">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-white/60" />
          <h3 className="text-white font-medium">UV por Hora</h3>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="text-green-400">● Bajo</span>
          <span className="text-yellow-400">● Mod</span>
          <span className="text-orange-400">● Alto</span>
          <span className="text-red-400">● Muy Alto</span>
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
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickFormatter={(hour) => `${hour}h`}
            />
            
            <YAxis 
              domain={[0, maxUV]}
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickCount={5}
            />
            
            {/* Optimal zone reference */}
            <ReferenceLine 
              y={OPTIMAL_UV_RANGE.min} 
              stroke="rgba(250, 204, 21, 0.3)" 
              strokeDasharray="3 3"
            />
            <ReferenceLine 
              y={OPTIMAL_UV_RANGE.max} 
              stroke="rgba(250, 204, 21, 0.3)" 
              strokeDasharray="3 3"
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Area
              type="monotone"
              dataKey="uv"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth={2}
              fill="url(#uvGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <p className="text-white/50 text-xs text-center">
          Las líneas punteadas indican la zona óptima para síntesis de vitamina D (UV 3-7)
        </p>
      </div>
    </GlassCard>
  )
}

