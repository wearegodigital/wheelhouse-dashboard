"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { PageContainer } from "@/components/layout/PageContainer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { createProject } from "@/lib/api/wheelhouse"
import { GitHubRepoPicker } from "@/components/repos/GitHubRepoPicker"
import type { GitHubRepoSelection } from "@/components/repos/GitHubRepoPicker"
import { cn } from "@/lib/utils"
import { CheckCircle2 } from "lucide-react"

type PlanningRigor = "delegate" | "review" | "collaborate"
type TaskGranularityLevel = "coarse" | "standard" | "fine" | "atomic" | "custom"

const PLANNING_RIGOR_OPTIONS: { value: PlanningRigor; label: string; description: string }[] = [
  { value: "delegate", label: "Autonomous", description: "AI plans and executes, you review the result" },
  { value: "review", label: "Review", description: "AI proposes a plan, you approve before execution" },
  { value: "collaborate", label: "Collaborative", description: "Interactive planning chat before decomposition" },
]

const TASK_GRANULARITY_OPTIONS: { value: TaskGranularityLevel; label: string; description: string }[] = [
  { value: "coarse", label: "Broad strokes", description: "3–5 large tasks per sprint" },
  { value: "standard", label: "Standard", description: "5–10 tasks per sprint" },
  { value: "fine", label: "Fine-grained", description: "10–20 small tasks per sprint" },
  { value: "atomic", label: "Very atomic", description: "20+ single-concern tasks" },
  { value: "custom", label: "Custom", description: "Specify your own instructions" },
]

interface ProjectFormData {
  name: string
  description: string
  repo_url: string
  default_branch: string
  planning_rigor: PlanningRigor
  task_granularity: TaskGranularityLevel
  task_granularity_custom: string
}

export default function NewProjectPage() {
  const router = useRouter()

  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    repo_url: "",
    default_branch: "main",
    planning_rigor: "review",
    task_granularity: "standard",
    task_granularity_custom: "",
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({})
  const [repoId, setRepoId] = useState<string>("")

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProjectFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.repo_url.trim()) {
      newErrors.repo_url = "Repository URL is required"
    } else if (!formData.repo_url.match(/^https?:\/\/.+/)) {
      newErrors.repo_url = "Must be a valid URL"
    }

    if (!formData.default_branch.trim()) {
      newErrors.default_branch = "Default branch is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const taskGranularity =
        data.task_granularity === "custom"
          ? data.task_granularity_custom.trim() || "custom"
          : data.task_granularity
      const result = await createProject({
        name: data.name,
        description: data.description || "",
        repo_url: data.repo_url,
        planning_rigor: data.planning_rigor,
        task_granularity: taskGranularity,
      })
      if (!result.success) {
        throw new Error(result.message || "Failed to create project")
      }
      // id is the Supabase UUID returned by the create route
      return result as { success: boolean; id: string }
    },
    onSuccess: (result) => {
      router.push(`/projects/${result.id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    createProjectMutation.mutate(formData)
  }

  const handleCancel = () => {
    router.push("/projects")
  }

  return (
    <PageContainer
      title="New Project"
      description="Create a new project to start planning and execution"
    >
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Enter the details for your new project. You&apos;ll be able to start planning after creation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Auth System Overhaul"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Complete overhaul of authentication system with OAuth2 support..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Repository <span className="text-destructive">*</span>
                </Label>
                <GitHubRepoPicker
                  onSelect={(selection: GitHubRepoSelection) => {
                    setFormData((prev) => ({
                      ...prev,
                      repo_url: selection.repoUrl,
                      default_branch: selection.defaultBranch || prev.default_branch,
                    }))
                    setRepoId("")
                  }}
                />
                {/* Fallback manual URL (shown below picker for reference / override) */}
                {formData.repo_url && (
                  <p className="text-xs text-muted-foreground break-all">
                    Selected: {formData.repo_url}
                  </p>
                )}
                {errors.repo_url && (
                  <p className="text-sm text-destructive">{errors.repo_url}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_branch">Default Branch</Label>
                <Input
                  id="default_branch"
                  type="text"
                  placeholder="main"
                  value={formData.default_branch}
                  onChange={(e) => setFormData({ ...formData, default_branch: e.target.value })}
                  className={errors.default_branch ? "border-destructive" : ""}
                />
                {errors.default_branch && (
                  <p className="text-sm text-destructive">{errors.default_branch}</p>
                )}
              </div>

              {/* Planning Rigor */}
              <div className="space-y-2">
                <Label>Planning Rigor</Label>
                <p className="text-xs text-muted-foreground">How much oversight you want over the planning phase</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PLANNING_RIGOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, planning_rigor: opt.value })}
                      className={cn(
                        "text-left rounded-lg border p-3 transition-all",
                        "hover:border-primary/50 hover:bg-accent/30",
                        formData.planning_rigor === opt.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border bg-card"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{opt.label}</span>
                        {formData.planning_rigor === opt.value && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary ml-auto" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">{opt.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Task Granularity */}
              <div className="space-y-2">
                <Label>Task Granularity</Label>
                <p className="text-xs text-muted-foreground">How finely the AI should decompose work into tasks</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TASK_GRANULARITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, task_granularity: opt.value })}
                      className={cn(
                        "text-left rounded-lg border p-3 transition-all",
                        "hover:border-primary/50 hover:bg-accent/30",
                        formData.task_granularity === opt.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border bg-card"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{opt.label}</span>
                        {formData.task_granularity === opt.value && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary ml-auto" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">{opt.description}</p>
                    </button>
                  ))}
                </div>
                {formData.task_granularity === "custom" && (
                  <Input
                    placeholder="e.g. Each task should be completable in under 30 minutes"
                    value={formData.task_granularity_custom}
                    onChange={(e) => setFormData({ ...formData, task_granularity_custom: e.target.value })}
                    className="text-sm"
                  />
                )}
              </div>

              {createProjectMutation.isError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  Failed to create project: {(createProjectMutation.error as Error).message}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={createProjectMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                >
                  {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
