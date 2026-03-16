"use client"

import { useEffect, useMemo, useState } from "react"
import type { ProgressPhase } from "@/hooks/usePlanningChat"
import { cn } from "@/lib/utils"
import { getStatusMessage, shouldEnhanceMessage } from "@/lib/status-messages"
import {
  Loader2,
  Server,
  GitBranch,
  FolderSearch,
  Code,
  Lightbulb,
  ListTree,
  MessageSquare,
  CheckCircle2,
} from "lucide-react"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  spinner: Loader2,
  server: Server,
  "git-branch": GitBranch,
  "folder-search": FolderSearch,
  code: Code,
  lightbulb: Lightbulb,
  "list-tree": ListTree,
  "message-square": MessageSquare,
  "check-circle": CheckCircle2,
}

const phaseColors: Record<string, string> = {
  starting: "text-blue-500",
  cloning: "text-purple-500",
  analyzing: "text-amber-500",
  thinking: "text-green-500",
  complete: "text-emerald-500",
}

interface ProgressIndicatorProps {
  phase: ProgressPhase
  className?: string
}

export function ProgressIndicator({ phase, className }: ProgressIndicatorProps) {
  const [dotCount, setDotCount] = useState(0)
  const [tick, setTick] = useState(0)
  const isComplete = phase.phase === "completed"

  // Cycle message tick every 5 seconds and animate dots
  useEffect(() => {
    if (isComplete) return

    const messageInterval = setInterval(() => setTick((prev) => prev + 1), 5000)
    const dotInterval = setInterval(() => setDotCount((prev) => (prev >= 3 ? 0 : prev + 1)), 500)

    return () => {
      clearInterval(messageInterval)
      clearInterval(dotInterval)
    }
  }, [isComplete, phase.phase])

  // Pure derivation: compute display message from props + tick state
  const displayMessage = useMemo(() => {
    if (shouldEnhanceMessage(phase.phase, phase.message)) {
      return getStatusMessage(phase.phase, tick * 5000)
    }
    return phase.message
  }, [phase.phase, phase.message, tick])

  // Derive dots string from count
  const dots = isComplete ? "" : ".".repeat(dotCount)

  const IconComponent = iconMap[phase.icon] || Loader2
  const colorClass = phaseColors[phase.phase] || "text-muted-foreground"
  const shouldAnimate = !isComplete

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border bg-muted/30 transition-all duration-300",
        isComplete && "bg-emerald-500/10 border-emerald-500/30",
        "cyberpunk:bg-gradient-to-r cyberpunk:from-primary/5 cyberpunk:via-accent/5 cyberpunk:to-primary/5",
        "cyberpunk:border-primary/30 cyberpunk:shadow-[0_0_10px_hsl(var(--primary)/0.2)]",
        isComplete && "cyberpunk:border-success/50 cyberpunk:shadow-[0_0_15px_hsl(var(--success)/0.4)]",
        className
      )}
    >
      <div className={cn("relative", colorClass)}>
        <IconComponent
          className={cn(
            "h-5 w-5 transition-transform",
            shouldAnimate && "animate-spin",
            "cyberpunk:drop-shadow-[0_0_6px_currentColor]"
          )}
        />
        {!isComplete && (
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75 cyberpunk:opacity-90" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-current cyberpunk:shadow-[0_0_4px_currentColor]" />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className={cn("font-medium text-sm", colorClass)}>
          {displayMessage}
          {!isComplete && <span className="inline-block w-6">{dots}</span>}
        </div>
        {phase.elapsed !== undefined && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {phase.elapsed.toFixed(1)}s elapsed
          </div>
        )}
      </div>

      {!isComplete && (
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full bg-current opacity-30",
                colorClass
              )}
              style={{
                animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
