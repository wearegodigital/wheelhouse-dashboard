"use client"

import { Cpu, Brain, Lightbulb, MessageSquare, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

// ─── Phase config ─────────────────────────────────────────────────────────────

const PHASE_CONFIG: Record<string, { icon: typeof Cpu; color: string; label: string; dotColor: string }> = {
  starting:  { icon: Cpu,          color: "text-blue-400",   label: "Initializing", dotColor: "bg-blue-400"    },
  thinking:  { icon: Brain,        color: "text-purple-400", label: "Thinking",     dotColor: "bg-purple-400"  },
  analyzing: { icon: Lightbulb,    color: "text-yellow-400", label: "Analyzing",    dotColor: "bg-yellow-400"  },
  planning:  { icon: MessageSquare,color: "text-emerald-400",label: "Planning",     dotColor: "bg-emerald-400" },
  complete:  { icon: CheckCircle2, color: "text-green-400",  label: "Complete",     dotColor: "bg-green-400"   },
  error:     { icon: AlertCircle,  color: "text-red-400",    label: "Error",        dotColor: "bg-red-400"     },
  timeout:   { icon: AlertCircle,  color: "text-orange-400", label: "Timed Out",    dotColor: "bg-orange-400"  },
}

const PHASE_ORDER = ["starting", "thinking", "analyzing", "planning", "complete"]

// ─── Elapsed formatting ───────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface PlanGenerationProgressProps {
  phase?: string
  message?: string
  icon?: string
  elapsed?: number
  isActive?: boolean
}

export function PlanGenerationProgress({
  phase = "starting",
  message,
  elapsed = 0,
  isActive = true,
}: PlanGenerationProgressProps) {
  const cfg = PHASE_CONFIG[phase] ?? PHASE_CONFIG.starting
  const Icon = cfg.icon

  const isTerminal = phase === "complete" || phase === "error" || phase === "timeout"
  const currentDotIndex = PHASE_ORDER.indexOf(phase)

  return (
    <div className="rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm px-4 py-3">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`shrink-0 ${cfg.color}`}>
          {isActive && !isTerminal ? (
            <div className="relative">
              <Icon className="h-5 w-5 opacity-20" />
              <Loader2 className={`h-5 w-5 animate-spin absolute inset-0 ${cfg.color}`} />
            </div>
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          {message && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">{message}</p>
          )}
        </div>

        {/* Elapsed time */}
        {elapsed > 0 && (
          <div className="shrink-0 text-xs text-muted-foreground tabular-nums font-mono">
            {formatElapsed(elapsed)}
          </div>
        )}
      </div>

      {/* Step dots */}
      <div className="flex items-center gap-1.5 mt-3 pl-8">
        {PHASE_ORDER.filter(p => p !== "complete").map((p, i) => {
          const isCompleted = currentDotIndex > i
          const isCurrent = currentDotIndex === i
          const dotCfg = PHASE_CONFIG[p]

          return (
            <div
              key={p}
              className={[
                "h-1.5 rounded-full transition-all duration-500",
                isCurrent
                  ? `w-4 ${dotCfg.dotColor} ${isActive ? "animate-pulse shadow-[0_0_6px_2px_currentColor] opacity-90" : "opacity-90"}`
                  : isCompleted
                  ? `w-1.5 ${dotCfg.dotColor} opacity-60`
                  : "w-1.5 bg-border opacity-40",
              ].join(" ")}
            />
          )
        })}
      </div>
    </div>
  )
}
