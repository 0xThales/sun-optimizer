"use client"

import { cn } from "@/lib/utils/cn"
import { ReactNode } from "react"

interface GlassCardProps {
  children: ReactNode
  className?: string
  variant?: "primary" | "secondary" | "default"
  animate?: boolean
}

export function GlassCard({
  children,
  className,
  variant = "default",
  animate = true,
}: GlassCardProps) {
  const variants = {
    default: "glass-card",
    primary: "glass-card-primary",
    secondary: "glass-card-secondary",
  }

  return (
    <div
      className={cn(
        variants[variant],
        animate && "animate-fade-in",
        "p-4 sm:p-6",
        className
      )}
    >
      {children}
    </div>
  )
}
