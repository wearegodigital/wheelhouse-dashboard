"use client"

import { useEffect, useState } from "react"
import type { ProgressPhase } from "@/hooks/usePlanningChat"
import { cn } from "@/lib/utils"
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
  const [dots, setDots] = useState("")

  // Animate dots while waiting
  useEffect(() => {
    if (phase.phase === "complete") {
      setDots("")
      return
    }

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)

    return () => clearInterval(interval)
  }, [phase.phase])

  const IconComponent = iconMap[phase.icon] || Loader2
  const colorClass = phaseColors[phase.phase] || "text-muted-foreground"
  const isComplete = phase.phase === "complete"
  const shouldAnimate = !isComplete

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border bg-muted/30 transition-all duration-300",
        isComplete && "bg-emerald-500/10 border-emerald-500/30",
        className
      )}
    >
      <div className={cn("relative", colorClass)}>
        <IconComponent
          className={cn(
            "h-5 w-5 transition-transform",
            shouldAnimate && "animate-spin"
          )}
        />
        {!isComplete && (
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className={cn("font-medium text-sm", colorClass)}>
          {phase.message}
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
