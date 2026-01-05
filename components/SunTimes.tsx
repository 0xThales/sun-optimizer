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
  
  return (
    <GlassCard variant="secondary" className="h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sun className="w-5 h-5 text-amber-400" />
        <h3 className="text-white font-medium">Horarios Solares</h3>
      </div>

      {/* Sun times grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Sunrise */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/20">
            <Sunrise className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <p className="text-white/60 text-xs">Amanecer</p>
            <p className="text-white font-semibold text-lg">
              {formatTime(sunTimes.sunrise)}
            </p>
          </div>
        </div>

        {/* Sunset */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/20">
            <Sunset className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-white/60 text-xs">Atardecer</p>
            <p className="text-white font-semibold text-lg">
              {formatTime(sunTimes.sunset)}
            </p>
          </div>
        </div>
      </div>

      {/* Day length */}
      <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg mb-3">
        <Clock className="w-4 h-4 text-white/60" />
        <span className="text-white/60 text-sm">Duración del día:</span>
        <span className="text-white font-medium text-sm">
          {formatDurationSeconds(sunTimes.dayLength)}
        </span>
      </div>

      {/* Golden hour */}
      <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
        <p className="text-amber-400 text-xs font-medium mb-2 uppercase tracking-wider">
          Golden Hour
        </p>
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-white/60 text-xs">Mañana</p>
            <p className="text-white">
              {formatTime(goldenHour.morningStart)} - {formatTime(goldenHour.morningEnd)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs">Tarde</p>
            <p className="text-white">
              {formatTime(goldenHour.eveningStart)} - {formatTime(goldenHour.eveningEnd)}
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

