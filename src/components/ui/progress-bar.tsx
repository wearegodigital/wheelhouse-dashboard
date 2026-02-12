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
  let barColor = "bg-primary [.cyberpunk_&]:shadow-[0_0_6px_hsl(var(--primary)/0.6),inset_0_0_4px_hsl(var(--primary)/0.4)]"
  if (status === "completed") {
    barColor = "bg-green-500 [.cyberpunk_&]:bg-[hsl(var(--success))] [.cyberpunk_&]:shadow-[0_0_6px_hsl(var(--success)/0.6),inset_0_0_4px_hsl(var(--success)/0.4)]"
  } else if (status === "failed") {
    barColor = "bg-red-500 [.cyberpunk_&]:bg-[hsl(var(--destructive))] [.cyberpunk_&]:shadow-[0_0_6px_hsl(var(--destructive)/0.6),inset_0_0_4px_hsl(var(--destructive)/0.4)]"
  }

  return (
    <div className={cn("space-y-1", className)}>
      {(label || sublabel) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {label && <span>{label}</span>}
          {sublabel && <span className="[.cyberpunk_&]:text-primary/80 [.cyberpunk_&]:font-mono">{sublabel}</span>}
        </div>
      )}
      <div
        className={cn(
          "bg-muted rounded-full overflow-hidden [.cyberpunk_&]:bg-muted/50 [.cyberpunk_&]:border [.cyberpunk_&]:border-primary/20 [.cyberpunk_&]:shadow-[inset_0_0_4px_hsl(var(--primary)/0.2)]",
          size === "sm" ? "h-2" : "h-1.5"
        )}
      >
        <div
          className={cn("h-full transition-all duration-300 [.cyberpunk_&]:relative [.cyberpunk_&]:overflow-hidden", barColor)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        >
          <div className="hidden [.cyberpunk_&]:block absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[scan-line_2s_linear_infinite]" />
        </div>
      </div>
    </div>
  )
}
