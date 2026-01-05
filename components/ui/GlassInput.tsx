'use client'

import { cn } from '@/lib/utils/cn'
import { InputHTMLAttributes, forwardRef, ReactNode } from 'react'

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, icon, iconPosition = 'left', ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 text-white/60">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'glass-input w-full py-3',
            icon && iconPosition === 'left' && 'pl-10 pr-4',
            icon && iconPosition === 'right' && 'pl-4 pr-10',
            !icon && 'px-4',
            className
          )}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 text-white/60">
            {icon}
          </div>
        )}
      </div>
    )
  }
)

GlassInput.displayName = 'GlassInput'

