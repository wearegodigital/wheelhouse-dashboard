"use client"

import { Badge } from "@/components/ui/badge"
import { Trophy, ArrowUp, CheckCircle, Users, GitMerge, Activity } from "lucide-react"
import type { Event } from "@/lib/supabase/types"

interface PatternEventRendererProps {
  event: Event
}

const PATTERN_EVENT_RENDERERS: Record<string, {
  icon: React.ReactNode
  format: (payload: Record<string, unknown>) => string
}> = {
  "tournament.started": {
    icon: <Trophy className="h-4 w-4 text-yellow-500" />,
    format: (p) => `Tournament started with ${Array.isArray(p.agent_ids) ? p.agent_ids.length : "?"} agents`,
  },
  "tournament.solution_submitted": {
    icon: <Trophy className="h-4 w-4 text-blue-500" />,
    format: (p) => `Agent ${p.agent_id ?? "?"} submitted solution: ${p.solution_summary ?? ""}`,
  },
  "tournament.winner_selected": {
    icon: <Trophy className="h-4 w-4 text-yellow-500" />,
    format: (p) => {
      const scores = p.scores as Record<string, number> | undefined
      const winnerId = p.winner_agent_id as string | undefined
      const score = scores && winnerId ? scores[winnerId] : "?"
      return `Winner: Agent ${winnerId ?? "?"} (score: ${score})`
    },
  },
  "tournament.failed": {
    icon: <Trophy className="h-4 w-4 text-red-500" />,
    format: (p) => `Tournament failed: ${p.reason ?? "no valid solutions"}`,
  },
  "cascade.started": {
    icon: <ArrowUp className="h-4 w-4 text-blue-500" />,
    format: (p) => `Cascade started with tiers: ${Array.isArray(p.tiers) ? p.tiers.join(" → ") : "?"}`,
  },
  "cascade.tier_attempt": {
    icon: <ArrowUp className="h-4 w-4 text-orange-500" />,
    format: (p) => `Trying tier: ${p.tier ?? "?"} (attempt ${p.attempt_number ?? "?"})`,
  },
  "cascade.tier_result": {
    icon: <ArrowUp className="h-4 w-4" />,
    format: (p) => p.success ? `Tier ${p.tier ?? "?"} succeeded` : `Tier ${p.tier ?? "?"} failed: ${p.reason ?? ""}`,
  },
  "cascade.escalated": {
    icon: <ArrowUp className="h-4 w-4 text-red-500" />,
    format: (p) => `Escalating: ${p.from_tier ?? "?"} → ${p.to_tier ?? "?"}`,
  },
  "ensemble.started": {
    icon: <Users className="h-4 w-4 text-blue-500" />,
    format: (p) => `Ensemble started with ${Array.isArray(p.subtask_ids) ? p.subtask_ids.length : "?"} subtasks (${p.decomposition_strategy ?? "?"})`,
  },
  "ensemble.subtask_complete": {
    icon: <Users className="h-4 w-4" />,
    format: (p) => `Subtask ${p.subtask_id ?? "?"} ${p.success ? "completed" : "failed"}`,
  },
  "ensemble.merged": {
    icon: <GitMerge className="h-4 w-4 text-green-500" />,
    format: (p) => `Ensemble merged — ${p.subtasks_merged ?? "?"} subtasks${p.conflicts_resolved ? `, ${p.conflicts_resolved} conflicts resolved` : ""}`,
  },
  "execution.pattern_selected": {
    icon: <Activity className="h-4 w-4 text-purple-500" />,
    format: (p) => `Pattern selected: ${p.execution_pattern ?? "?"} (${p.distribution_mode ?? "single"}) — confidence: ${p.confidence ?? "?"}`,
  },
}

export function PatternEventRenderer({ event }: PatternEventRendererProps) {
  const renderer = PATTERN_EVENT_RENDERERS[event.type]

  if (renderer) {
    return (
      <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded">
        <div className="mt-0.5">{renderer.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {event.type}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(event.created_at).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm mt-1">
            {renderer.format(event.payload as Record<string, unknown>)}
          </p>
        </div>
      </div>
    )
  }

  // Default: generic rendering (same as current inline rendering)
  return (
    <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {event.type}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(event.created_at).toLocaleTimeString()}
          </span>
        </div>
        {event.payload && Object.keys(event.payload).length > 0 && (
          <pre className="text-xs mt-1 text-muted-foreground overflow-x-auto">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}
