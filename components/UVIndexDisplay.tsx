'use client'

import { Sun, CloudSun, AlertTriangle, ShieldAlert, Skull } from 'lucide-react'
import { GlassCard } from './ui/GlassCard'
import { 
  getUVRiskLevel, 
  getUVLevelName, 
  getProtectionRecommendation 
} from '@/lib/utils/calculations'
import { UV_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils/cn'

interface UVIndexDisplayProps {
  uvIndex: number
  locationName: string
}

export function UVIndexDisplay({ uvIndex, locationName }: UVIndexDisplayProps) {
  const riskLevel = getUVRiskLevel(uvIndex)
  const levelName = getUVLevelName(riskLevel)
  const recommendation = getProtectionRecommendation(uvIndex)
  const colors = UV_COLORS[riskLevel]

  // Dynamic icon based on UV level
  const UVIcon = () => {
    switch (riskLevel) {
      case 'low':
        return <Sun className="w-12 h-12 sm:w-16 sm:h-16" />
      case 'moderate':
        return <CloudSun className="w-12 h-12 sm:w-16 sm:h-16" />
      case 'high':
        return <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16" />
      case 'very-high':
        return <ShieldAlert className="w-12 h-12 sm:w-16 sm:h-16" />
      case 'extreme':
        return <Skull className="w-12 h-12 sm:w-16 sm:h-16" />
    }
  }

  return (
    <GlassCard variant="primary" className="relative overflow-hidden">
      {/* Background accent based on UV level */}
      <div 
        className={cn(
          'absolute inset-0 opacity-20',
          colors.bg
        )}
        style={{
          background: `radial-gradient(circle at top right, var(--tw-gradient-stops))`,
        }}
      />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/60 text-sm uppercase tracking-wider mb-1">
              Índice UV Actual
            </p>
            <h2 className="text-white font-semibold text-lg truncate max-w-[200px]">
              {locationName}
            </h2>
          </div>
          <div className={cn('p-2 rounded-xl', colors.bgLight)}>
            <UVIcon />
          </div>
        </div>

        {/* UV Value */}
        <div className="flex items-end gap-3 mb-4">
          <span className={cn('text-6xl sm:text-7xl font-bold', colors.text)}>
            {uvIndex.toFixed(1)}
          </span>
          <div className="mb-2">
            <span className={cn(
              'px-3 py-1 rounded-full text-sm font-medium',
              colors.bgLight,
              colors.text
            )}>
              {levelName}
            </span>
          </div>
        </div>

        {/* Recommendation */}
        <div className={cn(
          'p-3 rounded-lg',
          colors.bgLight,
          colors.border,
          'border'
        )}>
          <p className="text-white/90 text-sm font-medium mb-2">
            {recommendation.message}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-white/70 text-xs bg-white/10 px-2 py-1 rounded">
              SPF {recommendation.spfNeeded}+
            </span>
            {recommendation.precautions.slice(0, 2).map((precaution, index) => (
              <span 
                key={index}
                className="text-white/70 text-xs bg-white/10 px-2 py-1 rounded"
              >
                {precaution}
              </span>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

