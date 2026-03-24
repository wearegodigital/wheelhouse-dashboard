"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { PageContainer } from "@/components/layout/PageContainer"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
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
} from "lucide-react"
import { useJobs } from "@/hooks/useJobs"
import type { Job } from "@/hooks/useJobs"

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function taskBreakdownSummary(breakdown: Record<string, unknown> | null): string {
  if (!breakdown) return ""
  const sprints = Array.isArray(breakdown.sprints) ? breakdown.sprints : []
  if (sprints.length > 0) {
    const taskCount = sprints.reduce((acc: number, s: unknown) => {
      const sprint = s as Record<string, unknown>
      return acc + (Array.isArray(sprint.tasks) ? sprint.tasks.length : 0)
    }, 0)
    return `${sprints.length} sprint${sprints.length !== 1 ? "s" : ""}, ${taskCount} task${taskCount !== 1 ? "s" : ""}`
  }
  const tasks = Array.isArray(breakdown.tasks) ? breakdown.tasks : []
  if (tasks.length > 0) {
    return `${tasks.length} task${tasks.length !== 1 ? "s" : ""}`
  }
  return ""
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

// ─── Progress display ─────────────────────────────────────────────────────────

function ProgressDisplay({ progress }: { progress: Record<string, unknown> | null }) {
  if (!progress) return null
  const completed = typeof progress.completed_tasks === "number" ? progress.completed_tasks : null
  const total = typeof progress.total_tasks === "number" ? progress.total_tasks : null
  const currentTask = typeof progress.current_task === "string" ? progress.current_task : null

  if (completed === null && total === null && !currentTask) return null

  return (
    <div className="space-y-1.5 mt-2">
      {completed !== null && total !== null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{completed} / {total} tasks</span>
            <span>{Math.round((completed / Math.max(total, 1)) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${(completed / Math.max(total, 1)) * 100}%` }}
            />
          </div>
        </div>
      )}
      {currentTask && (
        <p className="text-xs text-muted-foreground truncate">
          <span className="text-foreground/70">Running:</span> {currentTask}
        </p>
      )}
    </div>
  )
}

// ─── Job card ─────────────────────────────────────────────────────────────────

function JobCard({ job }: { job: Job }) {
  const router = useRouter()
  const summary = taskBreakdownSummary(job.task_breakdown)

  return (
    <Card
      className="cursor-pointer transition-colors hover:border-primary/40"
      onClick={() => router.push(`/jobs/${job.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <StatusBadge status={job.status} />
            <span className="text-xs text-muted-foreground">
              Created {formatDate(job.created_at)}
            </span>
            {job.status === "running" && job.started_at && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {elapsedLabel(job.started_at)} elapsed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2" onClick={(e) => e.stopPropagation()}>
        {/* Repo */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GitBranch className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-mono text-xs">{job.repo_url}</span>
        </div>

        {/* Pattern + distribution */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            {job.execution_pattern}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Layers className="h-3 w-3 mr-1" />
            {job.distribution_mode}
          </Badge>
          {job.workers > 1 && (
            <Badge variant="outline" className="text-xs">
              {job.workers} workers
            </Badge>
          )}
          {summary && (
            <span className="text-xs text-muted-foreground">{summary}</span>
          )}
        </div>

        {/* Pending: run button */}
        {job.status === "pending" && (
          <div className="pt-1">
            <Link href={`/jobs/${job.id}`}>
              <Button size="sm" className="gap-1.5 h-8">
                <Play className="h-3.5 w-3.5" />
                Run
              </Button>
            </Link>
          </div>
        )}

        {/* Running: progress */}
        {job.status === "running" && (
          <ProgressDisplay progress={job.progress} />
        )}

        {/* Completed: results summary */}
        {job.status === "completed" && job.completed_at && (
          <p className="text-xs text-muted-foreground">
            Completed {formatDate(job.completed_at)}
          </p>
        )}

        {/* Failed: error preview */}
        {job.status === "failed" && job.error && (
          <div className="flex items-start gap-2 rounded-md bg-red-500/5 border border-red-500/20 px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-500 line-clamp-2">{job.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Tab panel ────────────────────────────────────────────────────────────────

function JobTabPanel({
  status,
  emptyMessage,
  emptyDetail,
}: {
  status: string
  emptyMessage: string
  emptyDetail: string
}) {
  const { data: jobs, isLoading, isError } = useJobs(status)

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
        <p className="text-sm text-muted-foreground">Failed to load jobs.</p>
      </div>
    )
  }

  if (!jobs || jobs.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
          <div className="rounded-full bg-muted p-4">
            <Play className="h-7 w-7 text-muted-foreground" />
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
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobsPage() {
  return (
    <PageContainer
      title="Jobs"
      description="All execution jobs"
    >
      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="running">Running</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <JobTabPanel
            status="pending"
            emptyMessage="No pending jobs"
            emptyDetail="Jobs awaiting execution will appear here."
          />
        </TabsContent>

        <TabsContent value="running">
          <JobTabPanel
            status="running"
            emptyMessage="No running jobs"
            emptyDetail="Jobs currently executing will appear here."
          />
        </TabsContent>

        <TabsContent value="completed">
          <JobTabPanel
            status="completed"
            emptyMessage="No completed jobs"
            emptyDetail="Successfully completed jobs will appear here."
          />
        </TabsContent>

        <TabsContent value="failed">
          <JobTabPanel
            status="failed"
            emptyMessage="No failed jobs"
            emptyDetail="Jobs that encountered errors will appear here."
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
