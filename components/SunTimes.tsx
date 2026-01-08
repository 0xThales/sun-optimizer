'use client'

import { Sunrise, Sunset, Sun, Clock } from 'lucide-react'
import { GlassCard } from './ui/GlassCard'
import { formatDurationSeconds, calculateGoldenHour } from '@/lib/utils/calculations'
import { formatTime } from '@/lib/utils/date'
import { SunTimes as SunTimesType } from '@/types'

interface SunTimesProps {
  sunTimes: SunTimesType
}

export function SunTimes({ sunTimes }: SunTimesProps) {
  const goldenHour = calculateGoldenHour(sunTimes.sunrise, sunTimes.sunset)
  const tz = sunTimes.timezone
  
  return (
    <GlassCard variant="secondary" className="h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="icon-container icon-container-amber">
          <Sun className="w-5 h-5 text-amber-300" />
        </div>
        <h3 className="text-white font-semibold text-shadow-sm">Horarios Solares</h3>
      </div>

      {/* Sun times grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Sunrise */}
        <div className="flex items-center gap-3">
          <div className="icon-container icon-container-orange">
            <Sunrise className="w-6 h-6 text-orange-300" />
          </div>
          <div>
            <p className="text-white/70 text-xs">Amanecer</p>
            <p className="text-white font-semibold text-lg text-shadow-sm">
              {formatTime(sunTimes.sunrise, tz)}
            </p>
          </div>
        </div>

        {/* Sunset */}
        <div className="flex items-center gap-3">
          <div className="icon-container icon-container-purple">
            <Sunset className="w-6 h-6 text-purple-300" />
          </div>
          <div>
            <p className="text-white/70 text-xs">Atardecer</p>
            <p className="text-white font-semibold text-lg text-shadow-sm">
              {formatTime(sunTimes.sunset, tz)}
            </p>
          </div>
        </div>
      </div>

      {/* Day length */}
      <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg mb-3 border border-white/5">
        <Clock className="w-4 h-4 text-white/70" />
        <span className="text-white/70 text-sm">Duración del día:</span>
        <span className="text-white font-semibold text-sm">
          {formatDurationSeconds(sunTimes.dayLength)}
        </span>
      </div>

      {/* Golden hour */}
      <div className="p-3 bg-amber-900/30 rounded-lg border border-amber-500/30">
        <p className="text-amber-300 text-xs font-semibold mb-2 uppercase tracking-wider">
          Golden Hour
        </p>
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-white/70 text-xs">Mañana</p>
            <p className="text-white font-medium">
              {formatTime(goldenHour.morningStart, tz)} - {formatTime(goldenHour.morningEnd, tz)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs">Tarde</p>
            <p className="text-white font-medium">
              {formatTime(goldenHour.eveningStart, tz)} - {formatTime(goldenHour.eveningEnd, tz)}
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

