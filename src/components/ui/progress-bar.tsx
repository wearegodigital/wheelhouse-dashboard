import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  label?: string
  sublabel?: string
  status?: string
  size?: "sm" | "md"
  className?: string
}

/**
 * Reusable progress bar component.
 * Consolidates the repeated progress bar markup used across the codebase.
 */
export function ProgressBar({
  value,
  label,
  sublabel,
  status,
  size = "sm",
  className,
}: ProgressBarProps) {
  const barColor =
    status === "completed"
      ? "bg-green-500"
      : status === "failed"
        ? "bg-red-500"
        : "bg-primary"

  return (
    <div className={cn("space-y-1", className)}>
      {(label || sublabel) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {label && <span>{label}</span>}
          {sublabel && <span>{sublabel}</span>}
        </div>
      )}
      <div
        className={cn(
          "bg-muted rounded-full overflow-hidden",
          size === "sm" ? "h-2" : "h-1.5"
        )}
      >
        <div
          className={cn("h-full transition-all duration-300", barColor)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}
