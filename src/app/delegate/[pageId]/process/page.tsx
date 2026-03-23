"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery, useMutation } from "@tanstack/react-query"
import { PageContainer } from "@/components/layout/PageContainer"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Zap,
  Layers,
  FolderOpen,
  Loader2,
  FileText,
  X,
  ClipboardList,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useGuidedPlanning } from "@/hooks/useGuidedPlanning"
import { GuidedWizard } from "@/components/planning/GuidedWizard"
import { PlanReview } from "@/components/planning/PlanReview"
import { NotionTaskAccordion } from "@/components/planning/NotionTaskAccordion"
import { PlanGenerationProgress } from "@/components/planning/PlanGenerationProgress"
import type { DecompositionRecommendation } from "@/types"
import { useToast } from "@/components/ui/toast"
import { createProject as createProjectApi } from "@/lib/api/wheelhouse"
import { GitHubRepoPicker, type GitHubRepoSelection } from "@/components/repos/GitHubRepoPicker"

// ─── Types ─────────────────────────────────────────────────────────────────────

type Granularity = "task" | "sprint" | "project"
type PlanningRigor = "delegate" | "review" | "collaborate"
type TaskGranularityLevel = "coarse" | "standard" | "fine" | "atomic" | "custom"

interface NotionTaskData {
  title?: string
  description?: string
  client_name?: string
  priority?: string
  status?: string
  task_type?: string
  due_date?: string
  estimated_time?: number | string
}

// ─── Step indicator ────────────────────────────────────────────────────────────

const STEP_LABELS = ["Task Details", "Granularity", "Target", "Confirm"]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={step} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                  !done && !active && "bg-muted text-muted-foreground"
                )}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : step}
              </div>
              <span
                className={cn(
                  "text-sm hidden sm:block",
                  active ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={cn(
                  "h-px w-6 sm:w-12 transition-colors",
                  done ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Nav buttons ───────────────────────────────────────────────────────────────

function NavButtons({
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
  nextLoading = false,
}: {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  nextLoading?: boolean
}) {
  return (
    <div className="flex justify-between mt-6 pt-6 border-t">
      {onBack ? (
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      ) : (
        <div />
      )}
      {onNext && (
        <Button onClick={onNext} disabled={nextDisabled || nextLoading}>
          {nextLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          {nextLabel}
          {!nextLoading && <ArrowRight className="h-4 w-4 ml-2" />}
        </Button>
      )}
    </div>
  )
}

// ─── Step 1: Task Details ──────────────────────────────────────────────────────

function StepTaskDetails({
  pageId,
  imageUrls,
  onImageUrlsChange,
  onNotionData,
  onNext,
}: {
  pageId: string
  imageUrls: string[]
  onImageUrlsChange: (urls: string[]) => void
  onNotionData: (data: NotionTaskData) => void
  onNext: () => void
}) {
  const { data: notionTask, isLoading } = useQuery({
    queryKey: ["notion-task-detail", pageId],
    queryFn: async () => {
      const supabase = createClient()
      const { data: task, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("notion_tasks" as any)
        .select("*")
        .eq("notion_page_id", pageId)
        .single()
      if (error || !task) return null
      return task as NotionTaskData
    },
    retry: false,
  })

  useEffect(() => {
    if (notionTask) {
      onNotionData(notionTask)
    }
  }, [notionTask, onNotionData])

  return (
    <div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Notion Task
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-5 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ) : notionTask?.title ? (
            <div className="space-y-3">
              <p className="font-semibold text-lg leading-snug">{notionTask.title}</p>
              <div className="flex flex-wrap gap-2">
                {notionTask.client_name && (
                  <Badge variant="secondary">{notionTask.client_name}</Badge>
                )}
                {notionTask.priority && (
                  <Badge variant="outline">{notionTask.priority}</Badge>
                )}
                {notionTask.status && (
                  <Badge variant="outline">{notionTask.status}</Badge>
                )}
              </div>
              {notionTask.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {notionTask.description}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-mono text-sm text-muted-foreground">
                Page ID: <span className="text-foreground">{pageId}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Task details will load from Notion once the content endpoint is available.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4">
        <NotionTaskAccordion notionPageId={pageId} defaultExpanded />
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Attachments</h3>
        <ImageUpload onUpload={onImageUrlsChange} existingUrls={imageUrls} />
      </div>

      <NavButtons onNext={onNext} />
    </div>
  )
}

// ─── Granularity option ────────────────────────────────────────────────────────

interface GranularityOption {
  value: Granularity
  label: string
  description: string
  icon: React.ReactNode
  badge: string
}

const GRANULARITY_OPTIONS: GranularityOption[] = [
  {
    value: "task",
    label: "Task",
    description: "A single, atomic unit of work. One agent implements it end-to-end.",
    icon: <Zap className="h-5 w-5" />,
    badge: "Simple",
  },
  {
    value: "sprint",
    label: "Sprint",
    description: "A focused work period with multiple tasks. Agents coordinate across tasks.",
    icon: <Layers className="h-5 w-5" />,
    badge: "Medium",
  },
  {
    value: "project",
    label: "Project",
    description: "A full initiative spanning multiple sprints. Full orchestration lifecycle.",
    icon: <FolderOpen className="h-5 w-5" />,
    badge: "Complex",
  },
]

function StepGranularity({
  value,
  onChange,
  onBack,
  onNext,
}: {
  value: Granularity
  onChange: (v: Granularity) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        How should this task be structured for execution?
      </p>
      <div className="space-y-3">
        {GRANULARITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "w-full text-left rounded-lg border p-4 transition-all",
              "hover:border-primary/50 hover:bg-accent/30",
              value === opt.value
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border bg-card"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 rounded-md p-1.5 transition-colors",
                  value === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {opt.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{opt.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {opt.badge}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{opt.description}</p>
              </div>
              {value === opt.value && (
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              )}
            </div>
          </button>
        ))}
      </div>
      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  )
}

// ─── Inline create project form ─────────────────────────────────────────────────

function InlineCreateProject({
  initialName,
  initialDescription,
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onCancel,
}: {
  initialName: string
  initialDescription: string
  name: string
  description: string
  onNameChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onCancel: () => void
}) {
  return (
    <div className="mt-2 rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-primary">New Project</p>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Project name</label>
          <Input
            placeholder={initialName || "Project name"}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            autoFocus
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Description</label>
          <Textarea
            placeholder={initialDescription || "What is this project about?"}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="text-sm resize-none"
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Target ────────────────────────────────────────────────────────────

function StepTarget({
  granularity,
  repoUrl,
  newProjectName,
  newProjectDescription,
  onRepoUrlChange,
  onBranchChange,
  onNewProjectNameChange,
  onNewProjectDescriptionChange,
  onBack,
  onNext,
}: {
  granularity: Granularity
  repoUrl: string
  newProjectName: string
  newProjectDescription: string
  onRepoUrlChange: (v: string) => void
  onBranchChange?: (v: string) => void
  onNewProjectNameChange: (v: string) => void
  onNewProjectDescriptionChange: (v: string) => void
  onBack: () => void
  onNext: () => void
}) {
  const canProceed = !!repoUrl.trim()

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Where should this work land?
      </p>

      <div className="space-y-4">
        {/* GitHub Repository */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            GitHub Repository <span className="text-destructive">*</span>
          </label>
          <GitHubRepoPicker
            onSelect={(selection) => {
              onRepoUrlChange(selection.repoUrl)
              if (onBranchChange) onBranchChange(selection.defaultBranch || selection.branch)
            }}
          />
        </div>

        {/* Project (sprint or project granularity) */}
        {(granularity === "sprint" || granularity === "project") && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Project details</label>
            <InlineCreateProject
              initialName={newProjectName}
              initialDescription={newProjectDescription}
              name={newProjectName}
              description={newProjectDescription}
              onNameChange={onNewProjectNameChange}
              onDescriptionChange={onNewProjectDescriptionChange}
              onCancel={() => {}}
            />
          </div>
        )}
      </div>

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!canProceed}
      />
    </div>
  )
}

// ─── Planning rigor options ─────────────────────────────────────────────────────

const PLANNING_RIGOR_OPTIONS: { value: PlanningRigor; label: string; description: string }[] = [
  {
    value: "delegate",
    label: "Autonomous",
    description: "AI plans and executes, you review the result",
  },
  {
    value: "review",
    label: "Review",
    description: "AI proposes a plan, you approve before execution",
  },
  {
    value: "collaborate",
    label: "Collaborative",
    description: "Interactive planning chat before decomposition",
  },
]

// ─── Task granularity options ───────────────────────────────────────────────────

const TASK_GRANULARITY_OPTIONS: { value: TaskGranularityLevel; label: string; description: string }[] = [
  {
    value: "coarse",
    label: "Broad strokes",
    description: "3–5 large tasks per sprint",
  },
  {
    value: "standard",
    label: "Standard",
    description: "5–10 tasks per sprint",
  },
  {
    value: "fine",
    label: "Fine-grained",
    description: "10–20 small tasks per sprint",
  },
  {
    value: "atomic",
    label: "Very atomic",
    description: "20+ single-concern tasks",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Specify your own instructions",
  },
]

// ─── Summary row ───────────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}

// ─── Step 4: Confirm ───────────────────────────────────────────────────────────

function StepConfirm({
  pageId,
  granularity,
  repoUrl,
  defaultBranch,
  newProjectName,
  newProjectDescription,
  imageUrls,
  planningRigor,
  taskGranularityLevel,
  taskGranularityCustom,
  onPlanningRigorChange,
  onTaskGranularityLevelChange,
  onTaskGranularityCustomChange,
  onBack,
  onProjectCreated,
}: {
  pageId: string
  granularity: Granularity
  repoUrl: string
  defaultBranch?: string
  newProjectName: string
  newProjectDescription: string
  imageUrls: string[]
  planningRigor: PlanningRigor
  taskGranularityLevel: TaskGranularityLevel
  taskGranularityCustom: string
  onPlanningRigorChange: (v: PlanningRigor) => void
  onTaskGranularityLevelChange: (v: TaskGranularityLevel) => void
  onTaskGranularityCustomChange: (v: string) => void
  onBack: () => void
  onProjectCreated?: (projectId: string) => void
}) {
  const router = useRouter()
  const { addToast } = useToast()
  const isSubmittingRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createAndPlanMutation = useMutation({
    mutationFn: async () => {
      if (isSubmittingRef.current) throw new Error("Already submitting")
      isSubmittingRef.current = true
      setIsSubmitting(true)

      const taskGranularityValue =
        taskGranularityLevel === "custom" ? taskGranularityCustom.trim() || "custom" : taskGranularityLevel

      let targetProjectId = ""

      if (granularity === "sprint" || granularity === "project") {
        const result = await createProjectApi({
          name: newProjectName.trim() || `Notion Task ${pageId.slice(0, 8)}`,
          description: newProjectDescription.trim() || undefined,
          repo_url: repoUrl || undefined,
          default_branch: defaultBranch || undefined,
          notion_id: pageId,
          planning_rigor: planningRigor,
          task_granularity: taskGranularityValue,
        })
        if (!result.success) throw new Error(result.message || "Failed to create project")
        if (result.id) {
          targetProjectId = result.id
        }
      }

      // Mark as delegated via Notion API
      const delegateRes = await fetch(`/api/notion/${pageId}/delegate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          granularity,
          repo_url: repoUrl || null,
          project_id: targetProjectId || null,
          planning_rigor: planningRigor,
          task_granularity: taskGranularityValue,
          metadata: {
            ...(imageUrls.length > 0 ? { image_urls: imageUrls } : {}),
          },
        }),
      })

      if (!delegateRes.ok) {
        // Non-fatal — proceed, delegation will be retried
        console.warn("Failed to mark Notion task as delegated")
      }

      return { projectId: targetProjectId }
    },
    onSuccess: ({ projectId: pid }) => {
      addToast("Plan submitted successfully", "success")
      if (onProjectCreated) {
        onProjectCreated(pid || "")
      } else if (pid) {
        router.push(`/projects/${pid}`)
      } else {
        router.push("/planning")
      }
    },
    onError: () => {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    },
  })

  return (
    <div>
      {/* Planning rigor */}
      <div className="mb-5">
        <p className="text-sm font-medium">Planning Rigor</p>
        <p className="text-xs text-muted-foreground mb-3">How much oversight you want over the planning phase</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PLANNING_RIGOR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPlanningRigorChange(opt.value)}
              className={cn(
                "text-left rounded-lg border p-3 transition-all",
                "hover:border-primary/50 hover:bg-accent/30",
                planningRigor === opt.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-semibold">{opt.label}</span>
                {planningRigor === opt.value && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary ml-auto" />
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-snug">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Task granularity */}
      <div className="mb-5">
        <p className="text-sm font-medium">Task Granularity</p>
        <p className="text-xs text-muted-foreground mb-3">How finely the AI should decompose work into tasks</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TASK_GRANULARITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onTaskGranularityLevelChange(opt.value)}
              className={cn(
                "text-left rounded-lg border p-3 transition-all",
                "hover:border-primary/50 hover:bg-accent/30",
                taskGranularityLevel === opt.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-semibold">{opt.label}</span>
                {taskGranularityLevel === opt.value && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary ml-auto" />
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-snug">{opt.description}</p>
            </button>
          ))}
        </div>
        {taskGranularityLevel === "custom" && (
          <div className="mt-3">
            <Input
              placeholder="e.g. Each task should be completable in under 30 minutes"
              value={taskGranularityCustom}
              onChange={(e) => onTaskGranularityCustomChange(e.target.value)}
              className="text-sm"
            />
          </div>
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <SummaryRow label="Granularity" value={granularity.charAt(0).toUpperCase() + granularity.slice(1)} />
          <SummaryRow label="Repository" value={repoUrl || "None"} />
          {(granularity === "sprint" || granularity === "project") && (
            <SummaryRow label="Project" value={newProjectName || "Auto-named"} />
          )}
          <SummaryRow
            label="Planning Rigor"
            value={
              planningRigor === "delegate"
                ? "Autonomous"
                : planningRigor === "review"
                ? "Review"
                : "Collaborative"
            }
          />
          <SummaryRow
            label="Task Granularity"
            value={
              taskGranularityLevel === "custom"
                ? taskGranularityCustom.trim() || "Custom"
                : TASK_GRANULARITY_OPTIONS.find((o) => o.value === taskGranularityLevel)?.label ?? taskGranularityLevel
            }
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between mt-6 pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={() => createAndPlanMutation.mutate()}
          disabled={createAndPlanMutation.isPending || createAndPlanMutation.isSuccess || isSubmitting}
        >
          {createAndPlanMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : createAndPlanMutation.isSuccess ? (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          ) : null}
          {createAndPlanMutation.isPending
            ? "Creating..."
            : createAndPlanMutation.isSuccess
            ? "Created!"
            : "Create & Plan"}
          {!createAndPlanMutation.isPending && !createAndPlanMutation.isSuccess && (
            <ArrowRight className="h-4 w-4 ml-2" />
          )}
        </Button>
      </div>

      {createAndPlanMutation.isError && (
        <p className="text-sm text-destructive mt-3 text-center">
          {(createAndPlanMutation.error as Error)?.message ?? "Something went wrong. Please try again."}
        </p>
      )}
    </div>
  )
}

// ─── Step descriptions ─────────────────────────────────────────────────────────

const STEP_DESCRIPTIONS: Record<number, string> = {
  1: "Review the Notion task you're about to delegate",
  2: "Choose how to structure this work for execution",
  3: "Select where this work belongs",
  4: "Review settings and confirm",
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ProcessTaskPage() {
  const params = useParams()
  const router = useRouter()
  const pageId = params.pageId as string

  // Wizard state
  const [step, setStep] = useState(1)
  const [granularity, setGranularity] = useState<Granularity>("task")
  const [repoUrl, setRepoUrl] = useState("")
  const [defaultBranch, setDefaultBranch] = useState("")
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")
  const [planningRigor, setPlanningRigor] = useState<PlanningRigor>("review")
  const [taskGranularityLevel, setTaskGranularityLevel] = useState<TaskGranularityLevel>("standard")
  const [taskGranularityCustom, setTaskGranularityCustom] = useState("")
  const [imageUrls, setImageUrls] = useState<string[]>([])
  // Captured from Notion data in Step 1 to pre-populate later steps
  const [notionTaskData, setNotionTaskData] = useState<NotionTaskData | null>(null)

  // Planning phase state
  const [planningPhase, setPlanningPhase] = useState<"wizard" | "generating" | "guided" | "review" | "done">("wizard")
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)
  const [showFallback, setShowFallback] = useState(false)

  const guidedPlanning = useGuidedPlanning({
    notionTaskId: pageId,
    repoUrl: repoUrl,
    goal: newProjectName,
    context: {
      notion_title: notionTaskData?.title || newProjectName,
      notion_description: notionTaskData?.description || newProjectDescription,
      notion_priority: notionTaskData?.priority || "",
      notion_task_type: notionTaskData?.task_type || "",
      notion_estimated_time: notionTaskData?.estimated_time || null,
      notion_due_date: notionTaskData?.due_date || "",
      client_name: notionTaskData?.client_name || "",
      repo_url: repoUrl,
      project_id: createdProjectId ?? undefined,
    },
  })

  // Redirect to plan detail page when plan_id is received during generation
  useEffect(() => {
    if (guidedPlanning.planId && planningPhase === "generating") {
      router.push(`/planning/${guidedPlanning.planId}`)
    }
  }, [guidedPlanning.planId, planningPhase, router])

  // Show fallback link after 10s if planId hasn't arrived yet
  useEffect(() => {
    if (planningPhase === "generating" && !guidedPlanning.planId) {
      const timer = setTimeout(() => setShowFallback(true), 10_000)
      return () => clearTimeout(timer)
    }
    setShowFallback(false)
  }, [planningPhase, guidedPlanning.planId])

  // Start guided planning when entering "guided" or "generating" phase
  useEffect(() => {
    if ((planningPhase === "guided" || planningPhase === "generating") && guidedPlanning.status === "idle") {
      guidedPlanning.startPlanning()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planningPhase, guidedPlanning.status, guidedPlanning.startPlanning])

  // In "generating" phase: once session token is ready, generate immediately
  useEffect(() => {
    if (
      planningPhase === "generating" &&
      (guidedPlanning.status === "step_ready") &&
      guidedPlanning.sessionToken
    ) {
      guidedPlanning.generatePlan()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planningPhase, guidedPlanning.status, guidedPlanning.sessionToken, guidedPlanning.generatePlan])

  // Transition to review when plan is ready (collaborate + review rigor)
  // For "delegate" rigor, auto-approve instead
  useEffect(() => {
    if (guidedPlanning.status === "plan_ready") {
      if (planningRigor === "delegate") {
        // Auto-approve: call the approve API and redirect
        void (async () => {
          try {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            await fetch("/api/planning/approve", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
              },
              body: JSON.stringify({
                conversationId: guidedPlanning.conversationId,
                recommendation: guidedPlanning.plan,
                projectId: createdProjectId,
              }),
            })
          } catch (e) {
            console.error("Auto-approve failed:", e)
          } finally {
            router.push(createdProjectId ? `/projects/${createdProjectId}` : "/projects")
          }
        })()
      } else {
        setPlanningPhase("review")
      }
    }
  }, [guidedPlanning.status, planningRigor, guidedPlanning.conversationId, guidedPlanning.plan, createdProjectId, router])

  function handleNotionData(data: NotionTaskData) {
    setNotionTaskData(data)
    if (data.title && !newProjectName) {
      // Strip "(X Hrs) " or "(X Hr) " prefix from Notion title
      const cleanTitle = data.title.replace(/^\(\d+\.?\d*\s*Hrs?\)\s*/i, "").trim()
      setNewProjectName(cleanTitle || data.title)
    }
    if (data.description && !newProjectDescription) {
      setNewProjectDescription(data.description)
    }
  }

  function handleProjectCreated(pid: string) {
    setCreatedProjectId(pid || null)
    if (planningRigor === "delegate" || planningRigor === "review") {
      // Skip guided questions — go straight to plan generation
      setPlanningPhase("generating")
    } else {
      // "collaborate" — guided questions first
      setPlanningPhase("guided")
    }
  }

  const pageDescription =
    planningPhase === "generating"
      ? "Generating plan…"
      : planningPhase === "guided"
      ? "AI-guided planning — answer a few questions to generate a plan"
      : planningPhase === "review"
      ? "Review the generated plan before approving"
      : STEP_DESCRIPTIONS[step]

  return (
    <PageContainer
      title="Process Task"
      description={pageDescription}
    >
      <div className="max-w-2xl mx-auto">
        {planningPhase === "wizard" && (
          <>
            <StepIndicator current={step} />

            {step === 1 && (
              <StepTaskDetails
                pageId={pageId}
                imageUrls={imageUrls}
                onImageUrlsChange={setImageUrls}
                onNotionData={handleNotionData}
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <StepGranularity
                value={granularity}
                onChange={setGranularity}
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            )}

            {step === 3 && (
              <StepTarget
                granularity={granularity}
                repoUrl={repoUrl}
                newProjectName={newProjectName}
                newProjectDescription={newProjectDescription}
                onRepoUrlChange={setRepoUrl}
                onBranchChange={(v) => setDefaultBranch(v)}
                onNewProjectNameChange={setNewProjectName}
                onNewProjectDescriptionChange={setNewProjectDescription}
                onBack={() => setStep(2)}
                onNext={() => setStep(4)}
              />
            )}

            {step === 4 && (
              <StepConfirm
                pageId={pageId}
                granularity={granularity}
                repoUrl={repoUrl}
                defaultBranch={defaultBranch}
                newProjectName={newProjectName}
                newProjectDescription={newProjectDescription}
                imageUrls={imageUrls}
                planningRigor={planningRigor}
                taskGranularityLevel={taskGranularityLevel}
                taskGranularityCustom={taskGranularityCustom}
                onPlanningRigorChange={setPlanningRigor}
                onTaskGranularityLevelChange={setTaskGranularityLevel}
                onTaskGranularityCustomChange={setTaskGranularityCustom}
                onBack={() => setStep(3)}
                onProjectCreated={handleProjectCreated}
              />
            )}
          </>
        )}

        {planningPhase === "generating" && (
          <div className="flex flex-col items-center justify-center py-24 gap-6 max-w-sm mx-auto w-full">
            <PlanGenerationProgress
              phase={guidedPlanning.currentPhase?.phase ?? "starting"}
              message={guidedPlanning.currentPhase?.message ?? "Initializing container..."}
              icon={guidedPlanning.currentPhase?.icon}
              elapsed={guidedPlanning.currentPhase?.elapsed ?? 0}
              isActive
            />
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                You can safely leave this page — generation continues in the background.
              </p>
              <Button variant="outline" size="sm" onClick={() => router.push("/planning")}>
                <ClipboardList className="h-4 w-4 mr-2" />
                Go to Planning Hub
              </Button>
            </div>
            {showFallback && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">Taking longer than expected.</p>
                <Link href="/planning" className="text-primary underline text-sm">
                  View all plans in Planning Hub →
                </Link>
              </div>
            )}
          </div>
        )}

        {planningPhase === "guided" && createdProjectId !== null && (
          <div>
            <NotionTaskAccordion notionPageId={pageId} />
            <div className="mt-4">
              <GuidedWizard
                step={guidedPlanning.currentStep}
                totalSteps={guidedPlanning.totalSteps}
                answers={guidedPlanning.accumulatedAnswers}
                status={guidedPlanning.status}
                error={guidedPlanning.error}
                onAnswer={guidedPlanning.answerQuestion}
                onNext={guidedPlanning.nextStep}
                onBack={guidedPlanning.goBack}
                onGenerate={() => {
                  guidedPlanning.generatePlan()
                }}
              />
            </div>
          </div>
        )}

        {planningPhase === "review" && !!guidedPlanning.plan && (
          <div>
            <NotionTaskAccordion notionPageId={pageId} />
            <div className="mt-4">
              <PlanReview
                plan={guidedPlanning.plan as DecompositionRecommendation}
                conversationId={guidedPlanning.conversationId ?? undefined}
                onReject={() => {
                  // Re-enter generating phase to trigger regeneration
                  setPlanningPhase("generating")
                }}
                onApprove={async (plan) => {
                  try {
                    const supabase = createClient()
                    const { data: { session } } = await supabase.auth.getSession()

                    const resp = await fetch("/api/planning/approve", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                      },
                      body: JSON.stringify({
                        conversationId: guidedPlanning.conversationId,
                        recommendation: plan,
                        projectId: createdProjectId,
                      }),
                    })

                    if (!resp.ok) {
                      const err = await resp.json().catch(() => ({}))
                      throw new Error((err as { error?: string }).error || "Failed to create sprints")
                    }

                    router.push(createdProjectId ? `/projects/${createdProjectId}` : "/projects")
                  } catch (e) {
                    console.error("Approve failed:", e)
                    router.push(createdProjectId ? `/projects/${createdProjectId}` : "/projects")
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
