"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { PageContainer } from "@/components/layout/PageContainer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Play,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  GitBranch,
  Layers,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Users,
} from "lucide-react"
import { useJob } from "@/hooks/useJobs"
import type { Job } from "@/hooks/useJobs"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "pending")
    return (
      <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    )
  if (status === "running")
    return (
      <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/30 hover:bg-blue-500/20">
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
        Running
      </Badge>
    )
  if (status === "completed")
    return (
      <Badge className="bg-green-500/15 text-green-500 border-green-500/30 hover:bg-green-500/20">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Completed
      </Badge>
    )
  if (status === "failed")
    return (
      <Badge className="bg-red-500/15 text-red-500 border-red-500/30 hover:bg-red-500/20">
        <XCircle className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    )
  return <Badge variant="outline">{status}</Badge>
}

// ─── Task breakdown tree ──────────────────────────────────────────────────────

interface TaskEntry {
  title?: string
  name?: string
  description?: string
  complexity?: string
  estimated_minutes?: number
}

interface SprintEntry {
  name?: string
  description?: string
  tasks?: TaskEntry[]
}

function TaskBreakdownTree({
  breakdown,
}: {
  breakdown: Record<string, unknown>
}) {
  const sprints: SprintEntry[] = Array.isArray(breakdown.sprints)
    ? (breakdown.sprints as SprintEntry[])
    : []
  const standaloneTasks: TaskEntry[] = Array.isArray(breakdown.tasks)
    ? (breakdown.tasks as TaskEntry[])
    : []

  const [expandedSprints, setExpandedSprints] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {}
    if (sprints.length > 0) init[0] = true
    return init
  })

  function toggleSprint(i: number) {
    setExpandedSprints((prev) => ({ ...prev, [i]: !prev[i] }))
  }

  if (sprints.length === 0 && standaloneTasks.length === 0) {
    return (
      <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words">
        {JSON.stringify(breakdown, null, 2)}
      </pre>
    )
  }

  return (
    <div className="space-y-4">
      {sprints.length > 0 && (
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
                                {task.complexity && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {task.complexity}
                                  </Badge>
                                )}
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
      )}

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
                      {task.title ?? task.name ?? "Untitled Task"}
                    </span>
                    {task.complexity && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {task.complexity}
                      </Badge>
                    )}
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
    </div>
  )
}

// ─── Progress section ─────────────────────────────────────────────────────────

function ProgressSection({ progress }: { progress: Record<string, unknown> | null }) {
  if (!progress) {
    return (
      <Card className="border-border/60 bg-card/40">
        <CardContent className="pt-5 pb-5 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Waiting for progress updates…</span>
        </CardContent>
      </Card>
    )
  }

  const completed = typeof progress.completed_tasks === "number" ? progress.completed_tasks : null
  const total = typeof progress.total_tasks === "number" ? progress.total_tasks : null
  const currentTask = typeof progress.current_task === "string" ? progress.current_task : null
  const currentSprint = typeof progress.current_sprint === "string" ? progress.current_sprint : null
  const pct = completed !== null && total !== null ? Math.round((completed / Math.max(total, 1)) * 100) : null

  return (
    <Card className="border-blue-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          Execution Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pct !== null && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {completed} of {total} tasks
              </span>
              <span className="font-medium">{pct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
        {currentSprint && (
          <div className="flex items-center gap-2 text-sm">
            <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Sprint:</span>
            <span>{currentSprint}</span>
          </div>
        )}
        {currentTask && (
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Task:</span>
            <span className="truncate">{currentTask}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Config card ──────────────────────────────────────────────────────────────

function ConfigCard({ job }: { job: Job }) {
  return (
    <Card className="border-border/60 bg-card/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Repo:</span>
          <span className="truncate font-mono text-xs">{job.repo_url}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Zap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Pattern:</span>
          <Badge variant="outline" className="text-xs">{job.execution_pattern}</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Distribution:</span>
          <Badge variant="outline" className="text-xs">{job.distribution_mode}</Badge>
        </div>
        {job.workers > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Workers:</span>
            <span>{job.workers}</span>
          </div>
        )}
        {job.plan_id && (
          <div className="flex items-center gap-2 text-sm">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Plan:</span>
            <Link href={`/planning/${job.plan_id}`} className="text-primary hover:underline font-mono text-xs truncate">
              {job.plan_id.slice(0, 12)}…
            </Link>
          </div>
        )}
        {job.notion_task_id && (
          <div className="flex items-center gap-2 text-sm">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Notion Task:</span>
            <span className="font-mono text-xs truncate">{job.notion_task_id.slice(0, 12)}…</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Pattern selector ─────────────────────────────────────────────────────────

const PATTERNS = ["sequential", "tournament", "cascade"] as const
const DISTRIBUTIONS = ["single", "swarm"] as const

function PatternSelector({
  pattern,
  distribution,
  workers,
  onPatternChange,
  onDistributionChange,
  onWorkersChange,
}: {
  pattern: string
  distribution: string
  workers: number
  onPatternChange: (v: string) => void
  onDistributionChange: (v: string) => void
  onWorkersChange: (v: number) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Execution Pattern
        </label>
        <div className="flex gap-2 flex-wrap">
          {PATTERNS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPatternChange(p)}
              className={[
                "px-3 py-1.5 rounded-md text-sm border transition-colors",
                pattern === p
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              ].join(" ")}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Distribution Mode
        </label>
        <div className="flex gap-2 flex-wrap">
          {DISTRIBUTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDistributionChange(d)}
              className={[
                "px-3 py-1.5 rounded-md text-sm border transition-colors",
                distribution === d
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              ].join(" ")}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {distribution === "swarm" && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Workers
          </label>
          <div className="flex items-center gap-2">
            {[2, 3, 5].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => onWorkersChange(w)}
                className={[
                  "px-3 py-1.5 rounded-md text-sm border transition-colors",
                  workers === w
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                ].join(" ")}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string

  const { data: job, isLoading, isError } = useJob(jobId)

  // Pattern overrides for pending jobs
  const [pattern, setPattern] = useState<string>("")
  const [distribution, setDistribution] = useState<string>("")
  const [workers, setWorkers] = useState<number>(3)

  // Initialize from job once loaded
  const resolvedPattern = pattern || job?.execution_pattern || "sequential"
  const resolvedDistribution = distribution || job?.distribution_mode || "single"

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    )
  }

  if (isError || !job) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Job not found or failed to load.</p>
          <Button variant="outline" onClick={() => router.push("/jobs")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
      </PageContainer>
    )
  }

  const isPending = job.status === "pending"
  const isRunning = job.status === "running"
  const isCompleted = job.status === "completed"
  const isFailed = job.status === "failed"

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Jobs
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight font-mono">
                Job {jobId.slice(0, 8)}
              </h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <StatusBadge status={job.status} />
                <span className="text-xs text-muted-foreground">
                  Created {formatDate(job.created_at)}
                </span>
                {isRunning && job.started_at && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {elapsedLabel(job.started_at)} elapsed
                  </span>
                )}
                {isCompleted && job.completed_at && (
                  <span className="text-xs text-muted-foreground">
                    Completed {formatDate(job.completed_at)}
                  </span>
                )}
              </div>
            </div>

            {job.plan_id && (
              <Link href={`/planning/${job.plan_id}`}>
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Plan
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* ─── Pending ──────────────────────────────────────────────── */}
        {isPending && (
          <div className="space-y-6">
            {/* Task breakdown */}
            {job.task_breakdown && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Task Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <TaskBreakdownTree breakdown={job.task_breakdown} />
                </CardContent>
              </Card>
            )}

            {/* Pattern selector + run action */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Execution Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <PatternSelector
                  pattern={resolvedPattern}
                  distribution={resolvedDistribution}
                  workers={workers}
                  onPatternChange={setPattern}
                  onDistributionChange={setDistribution}
                  onWorkersChange={setWorkers}
                />
                <div className="flex items-center gap-3 pt-1 border-t border-border/40">
                  <Button className="gap-2">
                    <Play className="h-4 w-4" />
                    Run Job
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    This will execute the job using the settings above.
                  </p>
                </div>
              </CardContent>
            </Card>

            <ConfigCard job={job} />
          </div>
        )}

        {/* ─── Running ──────────────────────────────────────────────── */}
        {isRunning && (
          <div className="space-y-6">
            <ProgressSection progress={job.progress} />

            {job.task_breakdown && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-muted-foreground">Task Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <TaskBreakdownTree breakdown={job.task_breakdown} />
                </CardContent>
              </Card>
            )}

            <ConfigCard job={job} />
          </div>
        )}

        {/* ─── Completed ────────────────────────────────────────────── */}
        {isCompleted && (
          <div className="space-y-6">
            <Card className="border-green-500/20">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-600">Job completed successfully</p>
                    {job.completed_at && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Finished {formatDate(job.completed_at)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {job.plan_id && (
              <div className="flex items-center gap-3">
                <Link href={`/planning/${job.plan_id}`}>
                  <Button className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    View Plan
                  </Button>
                </Link>
              </div>
            )}

            {job.task_breakdown && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Executed Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <TaskBreakdownTree breakdown={job.task_breakdown} />
                </CardContent>
              </Card>
            )}

            <ConfigCard job={job} />
          </div>
        )}

        {/* ─── Failed ───────────────────────────────────────────────── */}
        {isFailed && (
          <div className="space-y-6">
            {job.error && (
              <Card className="border-red-500/20">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-500 mb-1">Error</p>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {job.error}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {job.task_breakdown && (
              <Card className="opacity-75">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-muted-foreground">Task Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <TaskBreakdownTree breakdown={job.task_breakdown} />
                </CardContent>
              </Card>
            )}

            <ConfigCard job={job} />
          </div>
        )}
      </div>
    </PageContainer>
  )
}
