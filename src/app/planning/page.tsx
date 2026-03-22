"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PageContainer } from "@/components/layout/PageContainer"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Check,
  X,
  Loader2,
  ClipboardList,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
} from "lucide-react"
import { useAllPlans } from "@/hooks/useAllPlans"
import { useUpdatePlan } from "@/hooks/usePlans"
import type { Plan } from "@/hooks/usePlans"
import { PlanGenerationProgress } from "@/components/planning/PlanGenerationProgress"

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function elapsedLabel(iso: string | null): string {
  if (!iso) return ""
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}


// ─── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "generating")
    return (
      <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/30 hover:bg-blue-500/20">
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
        Generating
      </Badge>
    )
  if (status === "pending_review")
    return (
      <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20">
        <AlertCircle className="h-3 w-3 mr-1" />
        Pending Review
      </Badge>
    )
  if (status === "approved")
    return (
      <Badge className="bg-green-500/15 text-green-500 border-green-500/30 hover:bg-green-500/20">
        <Check className="h-3 w-3 mr-1" />
        Approved
      </Badge>
    )
  if (status === "declined")
    return (
      <Badge className="bg-red-500/15 text-red-500 border-red-500/30 hover:bg-red-500/20">
        <X className="h-3 w-3 mr-1" />
        Declined
      </Badge>
    )
  return <Badge variant="outline">{status}</Badge>
}

// ─── Recommendation tree ─────────────────────────────────────────────────────

function RecommendationTree({ rec }: { rec: Record<string, unknown> }) {
  const sprints = Array.isArray(rec.sprints)
    ? (rec.sprints as Array<{
        name?: string
        description?: string
        tasks?: Array<{ name?: string; description?: string }>
      }>)
    : null

  if (sprints) {
    return (
      <div className="space-y-3 mt-3">
        {sprints.map((sprint, si) => (
          <div key={si} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sprint {si + 1}
              </span>
              <span className="text-sm font-semibold">{sprint.name}</span>
            </div>
            {sprint.description && (
              <p className="text-xs text-muted-foreground pl-4">{sprint.description}</p>
            )}
            {Array.isArray(sprint.tasks) && sprint.tasks.length > 0 && (
              <ul className="pl-4 space-y-1">
                {sprint.tasks.map((task, ti) => (
                  <li key={ti} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground mt-0.5 shrink-0">•</span>
                    <span>
                      <span className="font-medium">{task.name}</span>
                      {task.description && (
                        <span className="text-muted-foreground"> — {task.description}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <pre className="text-xs bg-muted rounded-md p-3 mt-3 overflow-x-auto whitespace-pre-wrap break-words">
      {JSON.stringify(rec, null, 2)}
    </pre>
  )
}

// ─── Plan card ───────────────────────────────────────────────────────────────

function PlanCard({ plan }: { plan: Plan }) {
  const [expanded, setExpanded] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [declineReason, setDeclineReason] = useState("")
  const updatePlan = useUpdatePlan()

  // Live elapsed time for generating plans
  const [elapsed, setElapsed] = useState(() => {
    if (plan.status !== "generating" || !plan.created_at) return 0
    return Math.floor((Date.now() - new Date(plan.created_at).getTime()) / 1000)
  })

  useEffect(() => {
    if (plan.status !== "generating" || !plan.created_at) return
    const interval = setInterval(() => {
      setElapsed(
        Math.floor(
          (Date.now() - new Date(plan.created_at!).getTime()) / 1000
        )
      )
    }, 1000)
    return () => clearInterval(interval)
  }, [plan.status, plan.created_at])

  const handleApprove = () => {
    updatePlan.mutate({ planId: plan.id, status: "approved" })
  }

  const handleDecline = () => {
    if (!declineReason.trim()) return
    updatePlan.mutate(
      { planId: plan.id, status: "declined", decline_reason: declineReason },
      {
        onSuccess: () => {
          setDeclining(false)
          setDeclineReason("")
        },
      }
    )
  }

  const handleResubmit = () => {
    updatePlan.mutate({ planId: plan.id, status: "pending_review" })
  }

  const isGenerating = plan.status === "generating"
  const isPendingReview = plan.status === "pending_review"
  const isApproved = plan.status === "approved"
  const isDeclined = plan.status === "declined"

  return (
    <Card
      className={
        isPendingReview
          ? "border-yellow-500/30"
          : isGenerating
          ? "border-blue-500/20"
          : undefined
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={plan.status} />
            <span className="text-xs text-muted-foreground">
              Created {formatDate(plan.created_at)}
            </span>
            {isApproved && plan.approved_at && (
              <span className="text-xs text-muted-foreground">
                · Approved {formatDate(plan.approved_at)}
              </span>
            )}
            {isGenerating && plan.created_at && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {elapsedLabel(plan.created_at)} elapsed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {plan.project_id && (
              <Link href={`/projects/${plan.project_id}`}>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Project
                </Button>
              </Link>
            )}
            {plan.recommendation && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                {expanded ? "Hide" : "View"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Generating — animated progress indicator */}
        {isGenerating && (() => {
          let phase = "starting"
          let message = "Initializing container..."
          if (elapsed >= 60) { phase = "planning";  message = "Generating plan..." }
          else if (elapsed >= 15) { phase = "analyzing"; message = "Planning decomposition..." }
          else if (elapsed >= 5)  { phase = "thinking";  message = "Analyzing codebase..." }
          return (
            <PlanGenerationProgress
              phase={phase}
              message={message}
              elapsed={elapsed}
              isActive
            />
          )
        })()}

        {/* Pending review — approve/decline actions */}
        {isPendingReview && !declining && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={updatePlan.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {updatePlan.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Check className="h-3 w-3 mr-1" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDeclining(true)}
              disabled={updatePlan.isPending}
              className="border-red-500/30 text-red-500 hover:bg-red-500/10"
            >
              <X className="h-3 w-3 mr-1" />
              Decline
            </Button>
          </div>
        )}

        {isPendingReview && declining && (
          <div className="space-y-2">
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={2}
              placeholder="Reason for declining..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDecline}
                disabled={!declineReason.trim() || updatePlan.isPending}
              >
                {updatePlan.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                Confirm Decline
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDeclining(false)
                  setDeclineReason("")
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Approved — Plan Again */}
        {isApproved && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              This plan has been approved and implemented.
            </span>
            {plan.project_id && (
              <Link href={`/projects/${plan.project_id}`}>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  Plan Again
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Declined — reason + resubmit */}
        {isDeclined && (
          <div className="space-y-2">
            {plan.decline_reason && (
              <p className="text-sm text-muted-foreground bg-red-500/5 border border-red-500/20 rounded-md px-3 py-2">
                {plan.decline_reason}
              </p>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleResubmit}
              disabled={updatePlan.isPending}
              className="gap-1"
            >
              {updatePlan.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              Resubmit for Review
            </Button>
          </div>
        )}

        {/* Expanded recommendation */}
        {expanded && plan.recommendation && (
          <RecommendationTree rec={plan.recommendation} />
        )}

        {updatePlan.isError && (
          <p className="text-xs text-red-500">{updatePlan.error?.message}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Tab panel ───────────────────────────────────────────────────────────────

function PlanTabPanel({
  status,
  emptyMessage,
  emptyDetail,
}: {
  status: string
  emptyMessage: string
  emptyDetail: string
}) {
  const { data: plans, isLoading, isError } = useAllPlans(status)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">Failed to load plans.</p>
      </div>
    )
  }

  if (!plans || plans.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
          <div className="rounded-full bg-muted p-4">
            <ClipboardList className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-base">{emptyMessage}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">{emptyDetail}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PlanningPage() {
  return (
    <PageContainer
      title="Planning Hub"
      description="All plans across your projects"
    >
      <Tabs defaultValue="review">
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <PlanTabPanel
            status="generating"
            emptyMessage="No active generations"
            emptyDetail="Plans currently being generated will appear here."
          />
        </TabsContent>

        <TabsContent value="review">
          <PlanTabPanel
            status="pending_review"
            emptyMessage="No plans awaiting review"
            emptyDetail="Plans ready for your approval will appear here."
          />
        </TabsContent>

        <TabsContent value="approved">
          <PlanTabPanel
            status="approved"
            emptyMessage="No approved plans yet"
            emptyDetail="Plans you've approved and implemented will appear here."
          />
        </TabsContent>

        <TabsContent value="declined">
          <PlanTabPanel
            status="declined"
            emptyMessage="No declined plans"
            emptyDetail="Plans you've declined will appear here with their reasons."
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
