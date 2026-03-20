"use client"

import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { useBlockers } from "@/hooks/useBlockers"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import { BlockerCard } from "./BlockerCard"

interface BlockerQueueProps {
  projectId?: string
  sprintId?: string
  taskId?: string
  className?: string
}

export function BlockerQueue({ projectId, sprintId, taskId, className }: BlockerQueueProps) {
  const { data: blockers, isLoading, error } = useBlockers({
    projectId,
    sprintId,
    taskId,
    status: "open",
  })

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        message="Failed to load blockers"
        icon={<AlertTriangle className="h-10 w-10 text-destructive mx-auto" />}
        className={className}
      />
    )
  }

  if (!blockers?.length) {
    return (
      <EmptyState
        message="No blockers — everything's running smoothly"
        icon={<CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto" />}
        className={className}
      />
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">Action Items</h3>
        <Badge variant="warning" className="text-xs px-2 py-0.5 rounded-full">
          {blockers.length} pending
        </Badge>
      </div>
      {blockers.map((blocker) => (
        <BlockerCard key={blocker.id} blocker={blocker} />
      ))}
    </div>
  )
}
