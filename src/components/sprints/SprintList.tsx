"use client"

import { Timer } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { useSprints } from "@/hooks/useSprints"
import { SprintCard } from "./SprintCard"

interface SprintListProps {
  projectId: string
}

export function SprintList({ projectId }: SprintListProps) {
  const { data: sprints, isLoading, error } = useSprints(projectId)

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <CardSkeleton count={2} />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        message="Failed to load sprints. Please try again."
        icon={<Timer className="h-12 w-12 text-muted-foreground mx-auto" />}
      />
    )
  }

  if (!sprints || sprints.length === 0) {
    return (
      <EmptyState
        message="No sprints yet. Sprints will appear here after planning is complete."
        icon={<Timer className="h-12 w-12 text-muted-foreground mx-auto" />}
      />
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sprints.map((sprint) => (
        <SprintCard key={sprint.id} sprint={sprint} />
      ))}
    </div>
  )
}
