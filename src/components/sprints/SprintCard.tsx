"use client"

import Link from "next/link"
import { Timer, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/ui/progress-bar"
import { getStatusBadgeVariant, getPatternBadgeText, getPatternBadgeVariant, pluralize } from "@/lib/status"
import type { SprintSummary } from "@/lib/supabase/types"

interface SprintCardProps {
  sprint: SprintSummary
}

export function SprintCard({ sprint }: SprintCardProps) {
  const progress = sprint.task_count > 0
    ? Math.round((sprint.tasks_completed / sprint.task_count) * 100)
    : 0

  return (
    <Link href={`/sprints/${sprint.id}`}>
      <Card className="hover:shadow-md transition-all duration-300 cursor-pointer h-full group [.cyberpunk_&]:hover:shadow-[0_0_12px_hsl(var(--primary)/0.4),0_0_24px_hsl(var(--primary)/0.2),inset_0_0_8px_hsl(var(--primary)/0.1)] [.cyberpunk_&]:hover:border-primary [.cyberpunk_&]:hover:scale-[1.02]">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate text-lg [.cyberpunk_&]:group-hover:text-primary [.cyberpunk_&]:group-hover:drop-shadow-[0_0_4px_hsl(var(--primary)/0.5)] transition-all duration-300">
                Sprint {sprint.order_index + 1}: {sprint.name}
              </CardTitle>
              {sprint.description && (
                <CardDescription className="line-clamp-2 mt-1">
                  {sprint.description}
                </CardDescription>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Badge variant={getStatusBadgeVariant(sprint.status)}>
                {sprint.status}
              </Badge>
              {sprint.pattern && (
                <Badge variant={getPatternBadgeVariant(sprint.pattern)} className="text-xs">
                  {getPatternBadgeText(sprint.pattern)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground [.cyberpunk_&]:group-hover:text-primary/70 [.cyberpunk_&]:group-hover:drop-shadow-[0_0_2px_hsl(var(--primary)/0.4)] transition-all duration-300" />
                <span>
                  <span className="font-medium [.cyberpunk_&]:group-hover:text-primary transition-colors duration-300">{sprint.task_count}</span> {pluralize(sprint.task_count, "task")}
                </span>
              </div>
              {sprint.tasks_running > 0 && (
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-blue-500 animate-pulse [.cyberpunk_&]:text-primary [.cyberpunk_&]:drop-shadow-[0_0_4px_hsl(var(--primary)/0.8),0_0_8px_hsl(var(--primary)/0.6),0_0_12px_hsl(var(--primary)/0.4)] [.cyberpunk_&]:animate-[pulse_1s_ease-in-out_infinite]" />
                  <span>
                    <span className="font-medium text-blue-500 [.cyberpunk_&]:text-primary [.cyberpunk_&]:drop-shadow-[0_0_3px_hsl(var(--primary)/0.7)] [.cyberpunk_&]:animate-[pulse_1s_ease-in-out_infinite]">{sprint.tasks_running}</span> running
                  </span>
                </div>
              )}
            </div>

            {sprint.task_count > 0 && (
              <ProgressBar
                value={progress}
                label={`${sprint.tasks_completed} of ${sprint.task_count} completed`}
                sublabel={`${progress}%`}
                className="[.cyberpunk_&]:group-hover:drop-shadow-[0_0_4px_hsl(var(--primary)/0.3)]"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
