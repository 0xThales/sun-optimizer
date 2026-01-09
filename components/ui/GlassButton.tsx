"use client"

import { cn } from "@/lib/utils/cn"
import { ButtonHTMLAttributes, ReactNode } from "react"

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: "primary" | "secondary" | "icon"
  size?: "sm" | "md" | "lg"
}

export function GlassButton({
  children,
  className,
  variant = "primary",
  size = "md",
  disabled,
  ...props
}: GlassButtonProps) {
  const variants = {
    primary: "glass-button-primary",
    secondary: "glass-button",
    icon: "glass-button p-2 rounded-full",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  }

  return (
    <button
      className={cn(
        variants[variant],
        variant !== "icon" && sizes[size],
        disabled && "opacity-50 cursor-not-allowed",
        "flex items-center justify-center gap-2",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
