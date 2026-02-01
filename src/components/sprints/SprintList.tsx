"use client"

import { Timer } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-full" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
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
