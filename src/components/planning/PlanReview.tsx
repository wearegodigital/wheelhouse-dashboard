"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, XCircle, Pencil, Save, MessageSquare, Loader2 } from "lucide-react"
import type { SprintRecommendation, TaskRecommendation } from "@/types"
import type { DecompositionRecommendation } from "@/types"

interface PlanReviewProps {
  plan: DecompositionRecommendation
  onApprove: (modifiedPlan: DecompositionRecommendation) => void
  onReject: (reason: string) => void
  onDiscuss?: () => void
  isApproving?: boolean
  conversationId?: string
}

function TaskDisplay({ task }: { task: TaskRecommendation }) {
  return (
    <div className="p-3 rounded-lg border bg-muted/30">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{task.title}</span>
        {task.complexity && (
          <Badge
            variant={
              task.complexity === "large"
                ? "destructive"
                : task.complexity === "medium"
                  ? "default"
                  : "secondary"
            }
            className="text-xs"
          >
            {task.complexity}
          </Badge>
        )}
        {task.estimated_minutes && (
          <span className="text-xs text-muted-foreground ml-auto">
            ~{task.estimated_minutes}m
          </span>
        )}
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
      )}
    </div>
  )
}

interface SprintDisplayProps {
  sprint: SprintRecommendation
  index: number
  onEdit: (updated: SprintRecommendation) => void
}

function SprintDisplay({ sprint, index, onEdit }: SprintDisplayProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(sprint.name)
  const [description, setDescription] = useState(sprint.description ?? "")

  const save = () => {
    onEdit({ ...sprint, name, description: description || undefined })
    setEditing(false)
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          {editing ? (
            <div className="flex-1">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mb-2 font-semibold"
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm"
                rows={2}
                placeholder="Sprint description (optional)"
              />
            </div>
          ) : (
            <div className="flex-1">
              <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="shrink-0">
                  Sprint {index + 1}
                </Badge>
                {sprint.name}
              </CardTitle>
              {sprint.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {sprint.description}
                </p>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => (editing ? save() : setEditing(true))}
            aria-label={editing ? "Save sprint" : "Edit sprint"}
          >
            {editing ? <Save className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sprint.tasks && sprint.tasks.length > 0 ? (
          <div className="space-y-2">
            {sprint.tasks.map((task, i) => (
              <TaskDisplay key={i} task={task} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No tasks defined</p>
        )}
      </CardContent>
    </Card>
  )
}

export function PlanReview({
  plan,
  onApprove,
  onReject,
  onDiscuss,
  isApproving,
  conversationId,
}: PlanReviewProps) {
  const [editedPlan, setEditedPlan] = useState<DecompositionRecommendation>(plan)
  const [rejectReason, setRejectReason] = useState("")
  const [showReject, setShowReject] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)

  const handleSprintEdit = (index: number, updated: SprintRecommendation) => {
    const newSprints = [...(editedPlan.sprints ?? [])]
    newSprints[index] = updated
    setEditedPlan({ ...editedPlan, sprints: newSprints })
  }

  const sprintCount = editedPlan.sprints?.length ?? 0
  const taskCount =
    (editedPlan.sprints?.reduce((sum, s) => sum + (s.tasks?.length ?? 0), 0) ?? 0) +
    (editedPlan.tasks?.length ?? 0)

  return (
    <div>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 flex-wrap text-base">
            Plan Summary
            {sprintCount > 0 && (
              <Badge variant="outline">{sprintCount} sprint{sprintCount !== 1 ? "s" : ""}</Badge>
            )}
            {taskCount > 0 && (
              <Badge variant="outline">{taskCount} task{taskCount !== 1 ? "s" : ""}</Badge>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {editedPlan.sprints?.map((sprint, i) => (
        <SprintDisplay
          key={i}
          sprint={sprint}
          index={i}
          onEdit={(updated) => handleSprintEdit(i, updated)}
        />
      ))}

      {editedPlan.tasks && editedPlan.tasks.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Standalone Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {editedPlan.tasks.map((task, i) => (
              <TaskDisplay key={i} task={task} />
            ))}
          </CardContent>
        </Card>
      )}

      {showReject ? (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-sm font-medium mb-2">Why are you rejecting this plan?</p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Describe what needs to change..."
              rows={3}
            />
            <div className="flex gap-2 mt-3">
              <Button
                variant="destructive"
                onClick={async () => {
                  const reason = rejectReason.trim()
                  if (!reason) return

                  if (conversationId) {
                    setIsDeclining(true)
                    try {
                      const resp = await fetch("/api/planning/decline", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ conversationId, feedback: reason }),
                      })
                      const data = await resp.json().catch(() => ({}))
                      if (data.regeneration_started) {
                        // Signal parent to re-enter generating phase
                        onReject(reason)
                        return
                      }
                    } catch (e) {
                      console.error("Decline failed:", e)
                    } finally {
                      setIsDeclining(false)
                    }
                  }
                  // Fallback: no conversationId or decline didn't start regeneration
                  onReject(reason)
                }}
                disabled={!rejectReason.trim() || isDeclining}
              >
                {isDeclining ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Submitting...</>
                ) : (
                  <><XCircle className="h-4 w-4 mr-1" /> Submit Rejection</>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowReject(false)} disabled={isDeclining}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-3 mt-6 flex-wrap">
          <Button onClick={() => onApprove(editedPlan)} disabled={isApproving} size="lg">
            {isApproving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Approve &amp; Create
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => setShowReject(true)}>
            <XCircle className="h-4 w-4 mr-2" /> Reject
          </Button>
          {onDiscuss && (
            <Button variant="ghost" onClick={onDiscuss}>
              <MessageSquare className="h-4 w-4 mr-2" /> Discuss More
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
