import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  label?: string
  sublabel?: string
  status?: string
  size?: "sm" | "md"
  className?: string
}

const CYBERPUNK_GLOW = "[.cyberpunk_&]:shadow-[0_0_8px_var(--glow)/0.8,0_0_12px_var(--glow)/0.4,inset_0_0_6px_var(--glow)/0.6]"

export function ProgressBar({
  value,
  label,
  sublabel,
  status,
  size = "sm",
  className,
}: ProgressBarProps) {
  const getBarColor = () => {
    if (status === "completed") {
      return `bg-green-500 [.cyberpunk_&]:bg-[hsl(var(--success))] ${CYBERPUNK_GLOW.replace(/--glow/g, "--success")}`
    }
    if (status === "failed") {
      return `bg-red-500 [.cyberpunk_&]:bg-[hsl(var(--destructive))] ${CYBERPUNK_GLOW.replace(/--glow/g, "--destructive")} [.cyberpunk_&]:animate-pulse`
    }
    return `bg-primary ${CYBERPUNK_GLOW.replace(/--glow/g, "--primary")}`
  }

  return (
    <div className={cn("space-y-1", className)}>
      {(label || sublabel) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {label && <span className="[.cyberpunk_&]:text-foreground/80">{label}</span>}
          {sublabel && <span className="[.cyberpunk_&]:text-primary [.cyberpunk_&]:font-mono [.cyberpunk_&]:drop-shadow-[0_0_2px_hsl(var(--primary)/0.8)]">{sublabel}</span>}
        </div>
      )}
      <div
        className={cn(
          "bg-muted rounded-full overflow-hidden",
          "[.cyberpunk_&]:bg-muted/30 [.cyberpunk_&]:border [.cyberpunk_&]:border-primary/30",
          "[.cyberpunk_&]:shadow-[inset_0_0_8px_hsl(var(--primary)/0.3),0_0_2px_hsl(var(--primary)/0.2)]",
          size === "sm" ? "h-2" : "h-1.5"
        )}
      >
        <div
          className={cn(
            "h-full transition-all duration-300 rounded-full relative overflow-hidden",
            getBarColor()
          )}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        >
          <div className="hidden [.cyberpunk_&]:block absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[scan-line_2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  )
}
