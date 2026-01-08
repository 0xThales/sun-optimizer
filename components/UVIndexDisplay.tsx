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

  // Dynamic icon based on UV level - always use light colors for visibility
  const iconColors: Record<string, string> = {
    'low': 'text-green-300',
    'moderate': 'text-yellow-300',
    'high': 'text-orange-300',
    'very-high': 'text-red-300',
    'extreme': 'text-purple-300',
  }
  
  const UVIcon = () => {
    const iconClass = `w-10 h-10 sm:w-12 sm:h-12 ${iconColors[riskLevel]}`
    switch (riskLevel) {
      case 'low':
        return <Sun className={iconClass} />
      case 'moderate':
        return <CloudSun className={iconClass} />
      case 'high':
        return <AlertTriangle className={iconClass} />
      case 'very-high':
        return <ShieldAlert className={iconClass} />
      case 'extreme':
        return <Skull className={iconClass} />
    }
  }

  return (
    <GlassCard variant="primary" className="relative overflow-hidden">
      {/* Background accent based on UV level */}
      <div 
        className={cn(
          'absolute inset-0 opacity-15',
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
            <p className="text-white/70 text-sm uppercase tracking-wider mb-1 font-medium">
              Índice UV Actual
            </p>
            <h2 className="text-white font-semibold text-lg truncate max-w-[200px] text-shadow-sm">
              {locationName}
            </h2>
          </div>
          <div className={cn(
            'icon-container',
            riskLevel === 'low' && 'icon-container-green',
            riskLevel === 'moderate' && 'icon-container-yellow',
            riskLevel === 'high' && 'icon-container-orange',
            riskLevel === 'very-high' && 'icon-container-red',
            riskLevel === 'extreme' && 'icon-container-purple'
          )}>
            <UVIcon />
          </div>
        </div>

        {/* UV Value - always white for readability */}
        <div className="flex items-end gap-3 mb-4">
          <span className="text-6xl sm:text-7xl font-bold text-white text-shadow-lg">
            {uvIndex.toFixed(1)}
          </span>
          <div className="mb-2">
            <span className={cn(
              'px-3 py-1.5 rounded-full text-sm font-semibold border',
              riskLevel === 'low' && 'bg-green-500/30 text-green-200 border-green-400/50',
              riskLevel === 'moderate' && 'bg-yellow-500/30 text-yellow-200 border-yellow-400/50',
              riskLevel === 'high' && 'bg-orange-500/30 text-orange-200 border-orange-400/50',
              riskLevel === 'very-high' && 'bg-red-500/30 text-red-200 border-red-400/50',
              riskLevel === 'extreme' && 'bg-purple-500/30 text-purple-200 border-purple-400/50'
            )}>
              {levelName}
            </span>
          </div>
        </div>

        {/* Recommendation */}
        <div className={cn(
          'p-3 rounded-xl border backdrop-blur-sm',
          riskLevel === 'low' && 'bg-green-500/15 border-green-400/30',
          riskLevel === 'moderate' && 'bg-yellow-500/15 border-yellow-400/30',
          riskLevel === 'high' && 'bg-orange-500/15 border-orange-400/30',
          riskLevel === 'very-high' && 'bg-red-500/15 border-red-400/30',
          riskLevel === 'extreme' && 'bg-purple-500/15 border-purple-400/30'
        )}>
          <p className="text-white text-sm font-medium mb-2 text-shadow-sm">
            {recommendation.message}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-white text-xs bg-white/10 border border-white/15 px-2.5 py-1 rounded-md font-medium">
              SPF {recommendation.spfNeeded}+
            </span>
            {recommendation.precautions.slice(0, 2).map((precaution, index) => (
              <span 
                key={index}
                className="text-white/90 text-xs bg-white/10 border border-white/15 px-2.5 py-1 rounded-md"
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


