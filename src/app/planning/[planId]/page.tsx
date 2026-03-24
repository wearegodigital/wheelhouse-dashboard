"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { PageContainer } from "@/components/layout/PageContainer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Check,
  X,
  Loader2,
  ExternalLink,
  Clock,
  AlertCircle,
  RotateCcw,
  RefreshCw,
  ClipboardList,
  GitBranch,
  Layers,
  Zap,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { usePlan, useUpdatePlan } from "@/hooks/usePlans"
import { PlanGenerationProgress } from "@/components/planning/PlanGenerationProgress"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "\u2014"
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatShortDate(iso: string | null): string {
  if (!iso) return "\u2014"
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ─── Status badge ─────────────────────────────────────────────────────────────

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

// ─── Complexity badge ─────────────────────────────────────────────────────────

function ComplexityBadge({ complexity }: { complexity?: string }) {
  if (!complexity) return null
  const colors: Record<string, string> = {
    small: "bg-green-500/15 text-green-600 border-green-500/30",
    medium: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
    large: "bg-red-500/15 text-red-500 border-red-500/30",
  }
  return (
    <Badge className={colors[complexity] ?? "bg-muted text-muted-foreground"}>
      {complexity}
    </Badge>
  )
}

// ─── Recommendation view ──────────────────────────────────────────────────────

interface TaskRec {
  title?: string
  name?: string
  description?: string
  complexity?: string
  estimated_minutes?: number
}

interface SprintRec {
  name?: string
  description?: string
  tasks?: TaskRec[]
}

function RenderSprints({
  sprints,
  expandedSprints,
  toggleSprint,
}: {
  sprints: SprintRec[]
  expandedSprints: Record<number, boolean>
  toggleSprint: (i: number) => void
}): React.JSX.Element {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <Layers className="h-4 w-4" />
        {sprints.length} Sprint{sprints.length !== 1 ? "s" : ""}
      </h4>
      {sprints.map((sprint, si) => {
        const isExpanded = expandedSprints[si] ?? false
        const taskCount = sprint.tasks?.length ?? 0
        return (
          <Card key={si} className="border-border/60 bg-card/40 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSprint(si)}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-accent/30 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                    Sprint {si + 1}
                  </Badge>
                  <span className="font-semibold text-sm truncate">
                    {sprint.name ?? "Untitled Sprint"}
                  </span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {taskCount} task{taskCount !== 1 ? "s" : ""}
              </span>
            </button>
            {isExpanded && (
              <div className="px-4 pb-3 pt-0">
                {sprint.description && (
                  <p className="text-xs text-muted-foreground mb-3 pl-7">
                    {sprint.description}
                  </p>
                )}
                {sprint.tasks && sprint.tasks.length > 0 && (
                  <div className="space-y-2 pl-7">
                    {sprint.tasks.map((task, ti) => (
                      <div
                        key={ti}
                        className="flex items-start gap-3 py-2 px-3 rounded-md bg-muted/30 border border-border/40"
                      >
                        <Zap className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">
                              {task.title ?? task.name ?? "Untitled Task"}
                            </span>
                            <ComplexityBadge complexity={task.complexity} />
                            {!!task.estimated_minutes && (
                              <span className="text-[10px] text-muted-foreground">
                                ~{task.estimated_minutes}m
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RecommendationView({ rec }: { rec: Record<string, any> }): React.JSX.Element {
  const project = rec.project as Record<string, unknown> | undefined
  const sprints: SprintRec[] = (
    Array.isArray(rec.sprints)
      ? rec.sprints
      : project && Array.isArray(project.sprints)
      ? project.sprints
      : []
  ) as SprintRec[]

  const projectName = (project?.name ?? rec.name ?? null) as string | null
  const projectDescription = (project?.description ?? rec.description ?? null) as string | null

  const [expandedSprints, setExpandedSprints] = useState<Record<number, boolean>>(() => {
    // Default first sprint expanded
    const init: Record<number, boolean> = {}
    if (sprints && sprints.length > 0) init[0] = true
    return init
  })

  function toggleSprint(index: number) {
    setExpandedSprints((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  // Standalone tasks (no sprints)
  const standaloneTasks: TaskRec[] = Array.isArray(rec.tasks) ? (rec.tasks as TaskRec[]) : []

  return (
    <div className="space-y-6">
      {/* Project overview */}
      {(projectName || projectDescription) && (
        <div>
          {projectName && (
            <h3 className="text-lg font-semibold mb-1">{projectName}</h3>
          )}
          {projectDescription && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {projectDescription}
            </p>
          )}
        </div>
      )}

      {/* Sprint breakdown */}
      {sprints.length > 0 && <RenderSprints sprints={sprints} expandedSprints={expandedSprints} toggleSprint={toggleSprint} />}

      {/* Standalone tasks (task-level granularity) */}
      {standaloneTasks.length > 0 && sprints.length === 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Zap className="h-4 w-4" />
            {standaloneTasks.length} Task{standaloneTasks.length !== 1 ? "s" : ""}
          </h4>
          <div className="space-y-2">
            {standaloneTasks.map((task, ti) => (
              <div
                key={ti}
                className="flex items-start gap-3 py-2.5 px-3 rounded-md bg-muted/30 border border-border/40"
              >
                <Zap className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {task.title || task.name}
                    </span>
                    <ComplexityBadge complexity={task.complexity} />
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blockers */}
      {rec.blockers && Array.isArray(rec.blockers) && (rec.blockers as Array<{ description?: string }>).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            Blockers
          </h4>
          <div className="space-y-1.5">
            {(rec.blockers as Array<{ description?: string; title?: string; type?: string }>).map((blocker, bi) => (
              <div
                key={bi}
                className="flex items-start gap-2 py-2 px-3 rounded-md bg-yellow-500/5 border border-yellow-500/20"
              >
                <AlertCircle className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
                <div className="text-sm">
                  {blocker.title && <span className="font-medium">{blocker.title}: </span>}
                  <span className="text-muted-foreground">{blocker.description}</span>
                  {blocker.type && (
                    <Badge variant="outline" className="ml-2 text-[10px]">{blocker.type}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback: raw JSON if no structured data found */}
      {sprints.length === 0 && standaloneTasks.length === 0 && (
        <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words">
          {JSON.stringify(rec, null, 2)}
        </pre>
      )}
    </div>
  )
}

// ─── Context card ─────────────────────────────────────────────────────────────

function ContextCard({
  plan,
}: {
  plan: { project_id: string | null; notion_task_id: string | null; repo_url: string | null }
}) {
  const hasContext = plan.project_id || plan.notion_task_id || plan.repo_url
  if (!hasContext) return null

  return (
    <Card className="border-border/60 bg-card/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {plan.project_id && (
          <div className="flex items-center gap-2 text-sm">
            <ClipboardList className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Job:</span>
            <Link
              href={`/jobs/${plan.project_id}`}
              className="text-primary hover:underline truncate"
            >
              {plan.project_id.slice(0, 8)}...
            </Link>
          </div>
        )}
        {plan.repo_url && (
          <div className="flex items-center gap-2 text-sm">
            <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Repo:</span>
            <span className="truncate font-mono text-xs">{plan.repo_url}</span>
          </div>
        )}
        {plan.notion_task_id && (
          <div className="flex items-center gap-2 text-sm">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Notion Task:</span>
            <span className="truncate font-mono text-xs">{plan.notion_task_id.slice(0, 12)}...</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const planId = params.planId as string

  const { data: plan, isLoading, isError } = usePlan(planId)
  const updatePlan = useUpdatePlan()

  // Decline state
  const [showDeclineForm, setShowDeclineForm] = useState(false)
  const [declineReason, setDeclineReason] = useState("")

  // Live elapsed timer for generating plans
  const computeElapsed = () => {
    if (plan?.status !== "generating" || !plan.created_at) return 0
    return Math.floor((Date.now() - new Date(plan.created_at).getTime()) / 1000)
  }
  const [elapsed, setElapsed] = useState(computeElapsed)
  useEffect(() => {
    if (plan?.status !== "generating" || !plan.created_at) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(plan.created_at!).getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [plan?.status, plan?.created_at])

  // Generation phase derived from elapsed time
  function getGenerationPhase(secs: number) {
    if (secs >= 60) return { phase: "planning", message: "Generating plan..." }
    if (secs >= 15) return { phase: "analyzing", message: "Planning decomposition..." }
    if (secs >= 5) return { phase: "thinking", message: "Analyzing codebase..." }
    return { phase: "starting", message: "Initializing container..." }
  }

  // Actions
  function handleApprove() {
    updatePlan.mutate(
      { planId, status: "approved" },
      {
        onSuccess: () => {
          // Redirect to project if linked
          if (plan?.project_id) {
            router.push(`/jobs/${plan.project_id}`)
          }
        },
      }
    )
  }

  function handleDecline() {
    if (!declineReason.trim()) return
    updatePlan.mutate(
      { planId, status: "declined", decline_reason: declineReason },
      {
        onSuccess: () => {
          setShowDeclineForm(false)
          setDeclineReason("")
        },
      }
    )
  }

  function handleResubmit() {
    updatePlan.mutate({ planId, status: "pending_review" })
  }

  // Loading state
  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    )
  }

  // Error state
  if (isError || !plan) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Plan not found or failed to load.</p>
          <Button variant="outline" onClick={() => router.push("/planning")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Planning Hub
          </Button>
        </div>
      </PageContainer>
    )
  }

  const isGenerating = plan.status === "generating"
  const isPendingReview = plan.status === "pending_review"
  const isApproved = plan.status === "approved"
  const isDeclined = plan.status === "declined"

  // Derive a title from the recommendation or context
  const recProject = plan.recommendation?.project as Record<string, unknown> | undefined
  const planTitle =
    (recProject?.name as string) ||
    (plan.recommendation?.name as string) ||
    (plan.notion_task_id ? `Notion Task ${plan.notion_task_id.slice(0, 8)}` : null) ||
    `Plan ${planId.slice(0, 8)}`

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/planning"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Planning Hub
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight truncate">
                {planTitle}
              </h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <StatusBadge status={plan.status} />
                <span className="text-xs text-muted-foreground">
                  Created {formatShortDate(plan.created_at)}
                </span>
                {isApproved && plan.approved_at && (
                  <span className="text-xs text-muted-foreground">
                    Approved {formatDate(plan.approved_at)}
                  </span>
                )}
                {isGenerating && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {elapsed}s elapsed
                  </span>
                )}
              </div>
            </div>

            {plan.project_id && (
              <Link href={`/jobs/${plan.project_id}`}>
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Job
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* ─── Generating ──────────────────────────────────────────────── */}
        {isGenerating && (
          <div className="space-y-6">
            <PlanGenerationProgress
              phase={getGenerationPhase(elapsed).phase}
              message={getGenerationPhase(elapsed).message}
              elapsed={elapsed}
              isActive
            />

            <Card className="border-border/60 bg-card/40">
              <CardContent className="pt-5 pb-5">
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  Your plan is being generated. This usually takes 2&ndash;3 minutes.
                  <br />
                  You can safely leave this page &mdash; generation continues in the background.
                </p>
              </CardContent>
            </Card>

            <ContextCard plan={plan} />
          </div>
        )}

        {/* ─── Pending Review ──────────────────────────────────────────── */}
        {isPendingReview && (
          <div className="space-y-6">
            {/* Recommendation */}
            {plan.recommendation && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Recommendation</CardTitle>
                </CardHeader>
                <CardContent>
                  <RecommendationView rec={plan.recommendation} />
                </CardContent>
              </Card>
            )}

            {/* Collaborative mode placeholder */}
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Guided questions for collaborative planning will appear here in a future update.
              </p>
            </div>

            {/* Action bar */}
            <Card className="border-primary/20">
              <CardContent className="pt-5 pb-5">
                {!showDeclineForm ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      onClick={handleApprove}
                      disabled={updatePlan.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {updatePlan.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Approve Plan
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeclineForm(true)}
                      disabled={updatePlan.isPending}
                      className="border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10"
                    >
                      Request Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDeclineReason("")
                        setShowDeclineForm(true)
                      }}
                      disabled={updatePlan.isPending}
                      className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">
                      Provide feedback or reason for declining:
                    </p>
                    <textarea
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      rows={3}
                      placeholder="What would you like changed?"
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDecline}
                        disabled={!declineReason.trim() || updatePlan.isPending}
                      >
                        {updatePlan.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : null}
                        Confirm Decline
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowDeclineForm(false)
                          setDeclineReason("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {updatePlan.isError && (
                  <p className="text-xs text-red-500 mt-2">{updatePlan.error?.message}</p>
                )}
              </CardContent>
            </Card>

            <ContextCard plan={plan} />
          </div>
        )}

        {/* ─── Approved ────────────────────────────────────────────────── */}
        {isApproved && (
          <div className="space-y-6">
            {plan.recommendation && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    Approved Recommendation
                    <Check className="h-4 w-4 text-green-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RecommendationView rec={plan.recommendation} />
                </CardContent>
              </Card>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              {plan.project_id && (
                <Link href={`/jobs/${plan.project_id}`}>
                  <Button className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    View Job
                  </Button>
                </Link>
              )}
            </div>

            <ContextCard plan={plan} />
          </div>
        )}

        {/* ─── Declined ────────────────────────────────────────────────── */}
        {isDeclined && (
          <div className="space-y-6">
            {/* Decline reason */}
            {plan.decline_reason && (
              <Card className="border-red-500/20">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-3">
                    <X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-500 mb-1">
                        Decline Reason
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {plan.decline_reason}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {plan.recommendation && (
              <Card className="opacity-75">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-muted-foreground">
                    Declined Recommendation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RecommendationView rec={plan.recommendation} />
                </CardContent>
              </Card>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <Button
                onClick={handleResubmit}
                disabled={updatePlan.isPending}
                className="gap-2"
              >
                {updatePlan.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Resubmit for Review
              </Button>
              {plan.project_id && (
                <Link href={`/jobs/${plan.project_id}`}>
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    View Job
                  </Button>
                </Link>
              )}
            </div>

            {updatePlan.isError && (
              <p className="text-xs text-red-500">{updatePlan.error?.message}</p>
            )}

            <ContextCard plan={plan} />
          </div>
        )}
      </div>
    </PageContainer>
  )
}
