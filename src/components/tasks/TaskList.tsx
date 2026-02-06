"use client"

import Link from "next/link"
import { useTasks } from "@/hooks/useTasks"
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription"
import type { TaskFilters, TaskSummary } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  Loader2,
  XCircle,
  Ban,
  PlayCircle,
  ShieldCheck,
} from "lucide-react"
import { getStatusBadgeVariant, getPatternBadgeText, getPatternBadgeVariant } from "@/lib/status"

interface TaskListProps {
  filters?: TaskFilters
  className?: string
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4" />
    case "failed":
      return <XCircle className="h-4 w-4" />
    case "cancelled":
      return <Ban className="h-4 w-4" />
    case "running":
      return <PlayCircle className="h-4 w-4" />
    case "validating":
      return <ShieldCheck className="h-4 w-4" />
    case "queued":
      return <Clock className="h-4 w-4" />
    case "pending":
      return <Circle className="h-4 w-4" />
    default:
      return <Circle className="h-4 w-4" />
  }
}

export function TaskList({ filters, className }: TaskListProps) {
  const { data: tasks, isLoading, error } = useTasks(filters)

  // Subscribe to real-time updates on tasks table
  useRealtimeSubscription("tasks", ["tasks", JSON.stringify(filters)])

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        message="Failed to load tasks"
        icon={<XCircle className="h-12 w-12 text-destructive mx-auto" />}
        className={className}
      />
    )
  }

  if (!tasks || tasks.length === 0) {
    return (
      <EmptyState
        message="No tasks found"
        icon={<Circle className="h-12 w-12 text-muted-foreground mx-auto" />}
        className={className}
      />
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {tasks.map((task: TaskSummary) => (
        <Link href={`/tasks/${task.id}`} key={task.id} className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {getStatusIcon(task.status)}
                  <Badge variant={getStatusBadgeVariant(task.status)}>
                    {task.status}
                  </Badge>
                  <Badge variant={getPatternBadgeVariant(task.pattern)}>
                    {getPatternBadgeText(task.pattern)}
                  </Badge>
                  {task.distribution === "swarm" && (
                    <Badge variant="secondary">Swarm</Badge>
                  )}
                  {task.agent_count > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {task.agent_count} agent{task.agent_count !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium mb-1 line-clamp-2">
                  {task.description}
                </p>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {task.project_name && (
                    <span className="flex items-center gap-1">
                      Project: {task.project_name}
                    </span>
                  )}
                  {task.sprint_name && (
                    <span className="flex items-center gap-1">
                      Sprint: {task.sprint_name}
                    </span>
                  )}
                  {task.branch && (
                    <span className="flex items-center gap-1">
                      Branch: {task.branch}
                    </span>
                  )}
                </div>

                {task.pr_url && (
                  <a
                    href={task.pr_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    View Pull Request
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="text-right">
                  <div className="text-sm font-semibold">{task.progress}%</div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                </div>
                {task.event_count > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {task.event_count} event{task.event_count !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 w-full bg-secondary rounded-full h-1.5 overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  task.status === "completed"
                    ? "bg-green-500"
                    : task.status === "failed"
                    ? "bg-red-500"
                    : "bg-primary"
                )}
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
        </Link>
      ))}
    </div>
  )
}
