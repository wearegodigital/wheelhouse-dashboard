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
    format: (p) => `Tournament started with ${p.num_agents ?? "?"} agents (${p.selection_mode ?? "best_of"})`,
  },
  "tournament.solution_submitted": {
    icon: <Trophy className="h-4 w-4 text-blue-500" />,
    format: (p) => `Agent ${p.agent_id ?? "?"} submitted solution (score: ${p.score ?? "?"})`,
  },
  "tournament.winner_selected": {
    icon: <Trophy className="h-4 w-4 text-yellow-500" />,
    format: (p) => `Winner: Agent ${p.winner_agent_id ?? "?"} (score: ${p.score ?? "?"})`,
  },
  "tournament.completed": {
    icon: <Trophy className="h-4 w-4 text-green-500" />,
    format: (p) => `Tournament complete — ${p.total_solutions ?? "?"} solutions evaluated`,
  },
  "cascade.started": {
    icon: <ArrowUp className="h-4 w-4 text-blue-500" />,
    format: (p) => `Cascade started with tiers: ${Array.isArray(p.tiers) ? p.tiers.join(" → ") : "?"}`,
  },
  "cascade.tier_attempted": {
    icon: <ArrowUp className="h-4 w-4 text-orange-500" />,
    format: (p) => `Trying tier: ${p.tier ?? "?"} (attempt ${p.attempt ?? "?"})`,
  },
  "cascade.tier_failed": {
    icon: <ArrowUp className="h-4 w-4 text-red-500" />,
    format: (p) => `Tier ${p.tier ?? "?"} failed — escalating`,
  },
  "cascade.tier_succeeded": {
    icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    format: (p) => `Resolved at tier: ${p.tier ?? "?"}`,
  },
  "cascade.completed": {
    icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    format: (p) => `Cascade complete — resolved at ${p.successful_tier ?? "?"} (${p.tiers_attempted ?? "?"} tiers tried)`,
  },
  "ensemble.started": {
    icon: <Users className="h-4 w-4 text-blue-500" />,
    format: (p) => `Ensemble started with ${p.num_subtasks ?? "?"} subtasks`,
  },
  "ensemble.completed": {
    icon: <GitMerge className="h-4 w-4 text-green-500" />,
    format: (p) => `Ensemble complete — ${p.subtasks_merged ?? "?"} subtasks merged`,
  },
  "pattern.selected": {
    icon: <Activity className="h-4 w-4 text-purple-500" />,
    format: (p) => `Pattern selected: ${p.pattern ?? "?"} (${p.distribution ?? "single"}) — confidence: ${p.confidence ?? "?"}`,
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
