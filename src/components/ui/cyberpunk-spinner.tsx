import { cn } from "@/lib/utils"

interface CyberpunkSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

/**
 * Cyberpunk-themed loading spinner with rotating neon rings and glitch effects.
 * Features multiple concentric rings with staggered rotation and pulsing glow.
 */
export function CyberpunkSpinner({ size = "md", className }: CyberpunkSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  }

  return (
    <div className={cn("relative", sizeClasses[size], className)} role="status" aria-label="Loading">
      {/* Outer ring - rotates clockwise */}
      <div className="cyber-spinner-ring cyber-spinner-outer" />

      {/* Middle ring - rotates counter-clockwise */}
      <div className="cyber-spinner-ring cyber-spinner-middle" />

      {/* Inner ring - rotates clockwise fast */}
      <div className="cyber-spinner-ring cyber-spinner-inner" />

      {/* Center core with pulse */}
      <div className="cyber-spinner-core" />

      {/* Glitch overlay */}
      <div className="cyber-spinner-glitch" />

      <span className="sr-only">Loading...</span>
    </div>
  )
}

interface CyberpunkSpinnerTextProps {
  text?: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

/**
 * Cyberpunk spinner with accompanying text label.
 */
export function CyberpunkSpinnerText({
  text = "Loading...",
  size = "md",
  className
}: CyberpunkSpinnerTextProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <CyberpunkSpinner size={size} />
      <p className="text-sm font-medium text-primary uppercase tracking-wider animate-pulse">
        {text}
      </p>
    </div>
  )
}

/**
 * Inline cyberpunk spinner for buttons and small spaces.
 */
export function CyberpunkSpinnerInline({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <CyberpunkSpinner size="sm" />
      <span className="text-sm animate-pulse">Loading...</span>
    </div>
  )
}
