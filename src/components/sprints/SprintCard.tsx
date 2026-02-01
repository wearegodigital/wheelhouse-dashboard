"use client"

import Link from "next/link"
import { Timer, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/ui/progress-bar"
import { getStatusBadgeVariant, pluralize } from "@/lib/status"
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
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate text-lg">
                Sprint {sprint.order_index + 1}: {sprint.name}
              </CardTitle>
              {sprint.description && (
                <CardDescription className="line-clamp-2 mt-1">
                  {sprint.description}
                </CardDescription>
              )}
            </div>
            <Badge variant={getStatusBadgeVariant(sprint.status)} className="shrink-0">
              {sprint.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span>
                  <span className="font-medium">{sprint.task_count}</span> {pluralize(sprint.task_count, "task")}
                </span>
              </div>
              {sprint.tasks_running > 0 && (
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-blue-500 animate-pulse" />
                  <span>
                    <span className="font-medium text-blue-500">{sprint.tasks_running}</span> running
                  </span>
                </div>
              )}
            </div>

            {sprint.task_count > 0 && (
              <>
                <ProgressBar
                  value={progress}
                  label="Progress"
                  sublabel={`${progress}%`}
                />
                <div className="text-xs text-muted-foreground">
                  {sprint.tasks_completed} of {sprint.task_count} completed
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
