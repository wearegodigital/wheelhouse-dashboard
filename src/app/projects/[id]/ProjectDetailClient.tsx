"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ExternalLink,
  Calendar,
  GitBranch,
  Trash2,
  CheckSquare,
  Pencil,
  Check,
  X,
  Terminal,
  Plus,
  Bot,
  Loader2,
  RefreshCw,
  Users,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ExecutionControls } from "@/components/execution/ExecutionControls";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SprintList } from "@/components/sprints";
import { PlanningChat } from "@/components/planning";
import { PlanReview } from "@/components/planning/PlanReview";
import { ProjectAssistant } from "@/components/planning/ProjectAssistant";
import { NotionImport } from "@/components/planning/NotionImport";
import { AttachmentUpload } from "@/components/attachments/AttachmentUpload";
import { BlockerQueue } from "@/components/blockers";
import { useDeleteProject, useUpdateProject } from "@/hooks/useProjects";
import { useClient } from "@/hooks/useClients";
import { useRepo } from "@/hooks/useRepos";
import { useExecutionStatus } from "@/hooks/useExecutionStatus";
import { usePlans, useUpdatePlan } from "@/hooks/usePlans";
import type { Plan } from "@/hooks/usePlans";
import { useToast } from "@/components/ui/toast";
import { getStatusBadgeVariant } from "@/lib/status";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ProjectSummary } from "@/lib/supabase/types";
import type { DecompositionRecommendation } from "@/types";

interface ProjectDetailClientProps {
  project: ProjectSummary;
}

export function ProjectDetailClient({ project: initialProject }: ProjectDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "sprints" | "planning" | "attachments" | "blockers" | "plans">("overview");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notionMarked, setNotionMarked] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Inline edit state — name
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(initialProject.name);

  // Inline edit state — description
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(initialProject.description ?? "");

  // Add Sprint dialog
  const [showAddSprint, setShowAddSprint] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintDescription, setNewSprintDescription] = useState("");
  const [addSprintPending, setAddSprintPending] = useState(false);

  // Plans tab state
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)
  const [decliningPlanId, setDecliningPlanId] = useState<string | null>(null)
  const [declineReasonValue, setDeclineReasonValue] = useState("")

  // Saved plan state (for Planning tab)
  const [savedPlan, setSavedPlan] = useState<{ id: string; recommendation: DecompositionRecommendation; status: string } | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [isApprovingSaved, setIsApprovingSaved] = useState(false)

  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();
  const updatePlan = useUpdatePlan();
  const { addToast } = useToast();

  // Plans data
  const { data: plans, isLoading: plansLoading } = usePlans(initialProject.id)
  const pendingPlan = plans?.find((p) => p.status === "pending_review") ?? null

  const isRunning = initialProject.status === "running";
  const isCompleted = initialProject.status === "completed";
  const hasNoSprints = initialProject.sprint_count === 0;

  const { data: executionStatus } = useExecutionStatus(initialProject.id, isRunning);

  // Load saved plan when Planning tab becomes active
  useEffect(() => {
    if (activeTab !== "planning") return
    let cancelled = false
    setLoadingPlan(true)
    const run = async () => {
      try {
        const supabase = createClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from("planning_conversations")
          .select("id, recommendation, status")
          .eq("project_id", initialProject.id)
          .not("recommendation", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
        if (cancelled) return
        const row = (data as Array<{ id: string; recommendation: unknown; status: string }> | null)?.[0]
        if (row?.recommendation) {
          setSavedPlan({
            id: row.id,
            recommendation: row.recommendation as DecompositionRecommendation,
            status: row.status,
          })
        } else {
          setSavedPlan(null)
        }
      } catch (e) {
        console.error("Failed to load saved plan:", e)
        if (!cancelled) setSavedPlan(null)
      } finally {
        if (!cancelled) setLoadingPlan(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [activeTab, initialProject.id])

  // Client and repo data
  const { data: client } = useClient(initialProject.client_id ?? "");
  const { data: repo } = useRepo(initialProject.repo_id ?? "");

  // Resolve notion page ID — from project field or from legacy description
  const notionPageId = useMemo(() => {
    if (initialProject.notion_id) return initialProject.notion_id
    // Fallback: extract from "Delegated from Notion page {uuid}" description
    const match = initialProject.description?.match(
      /Notion page ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
    )
    return match?.[1] || null
  }, [initialProject.notion_id, initialProject.description])

  // Notion task context (for planning auto-start)
  const { data: notionTask } = useQuery({
    queryKey: ["notion-task", notionPageId],
    queryFn: async () => {
      if (!notionPageId) return null
      const supabase = createClient()
      const { data } = await supabase
        .from("notion_tasks" as unknown as string)
        .select("*")
        .eq("notion_page_id", notionPageId)
        .single()
      return data as unknown as {
        title?: string
        priority?: string
        task_type?: string
        estimated_time?: number | null
        due_date?: string
      } | null
    },
    enabled: !!notionPageId,
  })

  // Notion tasks (only when completed)
  const { data: notionTasks } = useQuery({
    queryKey: ["tasks-notion", initialProject.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tasks")
        .select("id, notion_id")
        .eq("project_id", initialProject.id)
        .not("notion_id", "is", null);
      if (error) throw error;
      return (data ?? []) as { id: string; notion_id: string }[];
    },
    enabled: isCompleted,
  });

  const hasNotionTasks = (notionTasks?.length ?? 0) > 0;

  const markNotionComplete = useMutation({
    mutationFn: async () => {
      const tasks = notionTasks ?? [];
      await Promise.all(
        tasks.map((task) =>
          fetch(`/api/notion/${task.notion_id}/complete`, {
            method: "POST",
          }).then((res) => {
            if (!res.ok) throw new Error(`Failed for task ${task.id}`);
          })
        )
      );
    },
    onSuccess: () => {
      setNotionMarked(true);
      addToast("All tasks marked complete in Notion.", "success");
    },
    onError: () => {
      addToast("Failed to mark some tasks complete in Notion.", "error");
    },
  });

  const handleStatusChange = () => {
    router.refresh();
  };

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync({ id: initialProject.id });
      router.push("/projects");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("conflict") || message.includes("running")) {
        addToast("Cannot delete a running project. Please cancel execution first.", "error");
      } else {
        addToast("Failed to delete project.", "error");
        console.error("Failed to delete project:", error);
      }
    }
  };

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === initialProject.name) {
      setNameValue(initialProject.name);
      setEditingName(false);
      return;
    }
    try {
      await updateProject.mutateAsync({ id: initialProject.id, name: trimmed });
      addToast("Project name updated.", "success");
      setEditingName(false);
    } catch {
      addToast("Failed to update name.", "error");
    }
  };

  const handleCancelName = () => {
    setNameValue(initialProject.name);
    setEditingName(false);
  };

  const handleSaveDescription = async () => {
    const trimmed = descriptionValue.trim();
    if (trimmed === (initialProject.description ?? "")) {
      setEditingDescription(false);
      return;
    }
    try {
      await updateProject.mutateAsync({ id: initialProject.id, description: trimmed });
      addToast("Description updated.", "success");
      setEditingDescription(false);
    } catch {
      addToast("Failed to update description.", "error");
    }
  };

  const handleCancelDescription = () => {
    setDescriptionValue(initialProject.description ?? "");
    setEditingDescription(false);
  };

  const handleAddSprint = async () => {
    const name = newSprintName.trim();
    if (!name) return;
    setAddSprintPending(true);
    try {
      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "sprints",
          name,
          description: newSprintDescription.trim() || undefined,
          project_id: initialProject.id,
          order_index: initialProject.sprint_count + 1,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || "Failed to create sprint");
      }
      queryClient.invalidateQueries({ queryKey: ["sprints", initialProject.id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      addToast("Sprint added.", "success");
      setShowAddSprint(false);
      setNewSprintName("");
      setNewSprintDescription("");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to add sprint.", "error");
    } finally {
      setAddSprintPending(false);
    }
  };

  const githubUrl =
    repo?.github_org && repo?.github_repo
      ? `https://github.com/${repo.github_org}/${repo.github_repo}`
      : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {client && initialProject.client_id ? (
          <Link href={`/clients/${initialProject.client_id}`} className="hover:text-foreground transition-colors">
            {client.name}
          </Link>
        ) : (
          <Link href="/clients" className="hover:text-foreground transition-colors">
            Clients
          </Link>
        )}
        <span>/</span>
        {repo && initialProject.repo_id ? (
          <Link href={`/repos/${initialProject.repo_id}`} className="hover:text-foreground transition-colors">
            {repo.name}
          </Link>
        ) : (
          <span>Project</span>
        )}
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">{initialProject.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-3 flex-wrap">
            {editingName ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") handleCancelName();
                  }}
                  className="text-2xl font-bold h-auto py-1 px-2 max-w-md"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveName}
                  disabled={updateProject.isPending}
                  className="shrink-0"
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelName}
                  className="shrink-0"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold tracking-tight">{initialProject.name}</h1>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingName(true)}
                  className="text-muted-foreground hover:text-foreground h-7 w-7 p-0 shrink-0"
                  aria-label="Edit project name"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            <Badge variant={getStatusBadgeVariant(initialProject.status)}>
              {initialProject.status}
            </Badge>
            {initialProject.sprint_count > 0 && (
              <Badge variant="outline" className="text-xs font-mono">
                {initialProject.sprint_count} sprint{initialProject.sprint_count !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {/* Meta badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            {client && initialProject.client_id && (
              <Link href={`/clients/${initialProject.client_id}`}>
                <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer text-xs flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {client.name}
                </Badge>
              </Link>
            )}
            {repo && initialProject.repo_id && (
              <Link href={`/repos/${initialProject.repo_id}`}>
                <Badge variant="outline" className="hover:bg-muted cursor-pointer text-xs flex items-center gap-1">
                  <GitBranch className="h-3 w-3" />
                  {repo.name}
                </Badge>
              </Link>
            )}
            {repo && githubUrl && (
              <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                <Badge variant="outline" className="hover:bg-muted cursor-pointer text-xs flex items-center gap-1">
                  GitHub
                  <ExternalLink className="h-3 w-3" />
                </Badge>
              </a>
            )}
            {notionPageId && (
              <a
                href={`https://notion.so/${notionPageId.replace(/-/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Badge variant="outline" className="hover:bg-muted cursor-pointer text-xs flex items-center gap-1">
                  View in Notion
                  <ExternalLink className="h-3 w-3" />
                </Badge>
              </a>
            )}
            {initialProject.planning_rigor && (
              <span className="px-2 py-0.5 text-xs rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                {initialProject.planning_rigor === "delegate"
                  ? "Autonomous"
                  : initialProject.planning_rigor === "review"
                  ? "Review"
                  : "Collaborative"}
              </span>
            )}
            {initialProject.task_granularity && (
              <span className="px-2 py-0.5 text-xs rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                {initialProject.task_granularity === "coarse"
                  ? "Broad strokes"
                  : initialProject.task_granularity === "standard"
                  ? "Standard tasks"
                  : initialProject.task_granularity === "fine"
                  ? "Fine-grained"
                  : initialProject.task_granularity === "atomic"
                  ? "Very atomic"
                  : initialProject.task_granularity}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isCompleted && hasNotionTasks && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markNotionComplete.mutate()}
              disabled={markNotionComplete.isPending || notionMarked}
            >
              <CheckSquare className="h-4 w-4 mr-1.5" />
              {markNotionComplete.isPending
                ? "Marking..."
                : notionMarked
                ? "Marked in Notion"
                : "Mark Complete in Notion"}
            </Button>
          )}
          {!hasNoSprints && (
            <ExecutionControls
              level="project"
              id={initialProject.id}
              status={initialProject.status}
              onStatusChange={handleStatusChange}
            />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Description card */}
      <Card>
        <CardContent className="pt-4 pb-4">
          {editingDescription ? (
            <div className="space-y-2">
              <textarea
                value={descriptionValue}
                onChange={(e) => setDescriptionValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") handleCancelDescription();
                }}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                placeholder="Project description..."
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveDescription}
                  disabled={updateProject.isPending}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelDescription}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3 group">
              <div className="flex-1 min-w-0">
                {initialProject.description ? (
                  <p className="text-sm leading-relaxed">{initialProject.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No description yet. Run planning to generate project details.
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingDescription(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground h-7 w-7 p-0 shrink-0"
                aria-label="Edit description"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending plan banner — T10 */}
      {pendingPlan && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
            <div>
              <p className="text-sm font-medium">Plan awaiting review</p>
              <p className="text-xs text-muted-foreground">
                Created{" "}
                {pendingPlan.created_at
                  ? new Date(pendingPlan.created_at).toLocaleDateString()
                  : "recently"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setActiveTab("plans")}
          >
            Review Plan
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-6">
          {(["overview", "sprints", "planning", "attachments", "blockers", "plans"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              }`}
            >
              {tab === "sprints"
                ? `Sprints (${initialProject.sprint_count})`
                : tab === "attachments"
                ? "Attachments"
                : tab === "blockers"
                ? "Blockers"
                : tab === "plans"
                ? `Plans${plans && plans.length > 0 ? ` (${plans.length})` : ""}`
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Planning-first CTA */}
          {hasNoSprints && (
            <Card className="border-dashed border-2">
              <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
                <div className="rounded-full bg-muted p-4">
                  <Terminal className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">Planning Required</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    This project needs planning before execution. Run planning in Claude Code to
                    decompose into sprints and tasks.
                  </p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setActiveTab("planning")}
                >
                  Go to Planning
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Execution Progress */}
          {isRunning && executionStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Execution Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{executionStatus.progress ?? 0}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${executionStatus.progress ?? 0}%` }}
                    />
                  </div>
                </div>
                {executionStatus.total_tasks != null && (
                  <div className="text-sm text-muted-foreground">
                    {executionStatus.completed_tasks ?? 0} / {executionStatus.total_tasks} tasks complete
                  </div>
                )}
                {executionStatus.sprints && executionStatus.sprints.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Sprints</h4>
                    {executionStatus.sprints.map(
                      (sprint: { id: string; name: string; status: string; pattern?: string }) => (
                        <div key={sprint.id} className="flex items-center justify-between text-sm py-1">
                          <span>{sprint.name}</span>
                          <Badge
                            variant={
                              sprint.status === "completed"
                                ? "default"
                                : sprint.status === "running"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {sprint.status}
                          </Badge>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="mt-4">
            <NotionImport projectId={initialProject.id} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>Repository and metadata</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={initialProject.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {initialProject.repo_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Created {new Date(initialProject.created_at).toLocaleDateString()}
                </div>
                {initialProject.completed_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Completed {new Date(initialProject.completed_at).toLocaleDateString()}
                  </div>
                )}
                {initialProject.created_by_email && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Created by: </span>
                    <span className="font-medium">
                      {initialProject.created_by_name || initialProject.created_by_email}
                    </span>
                  </div>
                )}
                {(initialProject.branch || initialProject.pr_url) && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {initialProject.branch && (
                      <div className="flex items-center gap-1.5">
                        <GitBranch className="h-4 w-4" />
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {initialProject.branch}
                        </code>
                      </div>
                    )}
                    {initialProject.pr_url && (
                      <a
                        href={initialProject.pr_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Pull Request
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
                <CardDescription>Sprint and task completion</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Sprints</span>
                    <span className="font-medium">
                      {initialProject.sprints_completed} / {initialProject.sprint_count}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          initialProject.sprint_count > 0
                            ? (initialProject.sprints_completed / initialProject.sprint_count) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Tasks</span>
                    <span className="font-medium">
                      {initialProject.tasks_completed} / {initialProject.task_count}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          initialProject.task_count > 0
                            ? (initialProject.tasks_completed / initialProject.task_count) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "sprints" && (
        <ErrorBoundary>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setShowAddSprint(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Add Sprint
              </Button>
            </div>
            <SprintList projectId={initialProject.id} />
          </div>
        </ErrorBoundary>
      )}

      {activeTab === "planning" && (
        <ErrorBoundary>
          <div className="space-y-6">
            {loadingPlan ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : savedPlan ? (
              <>
                {/* Project already has sprints (approved) */}
                {initialProject.sprint_count > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between gap-2">
                        <span>Plan Approved</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSavedPlan(null)
                          }}
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                          Re-generate Plan
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        This plan has been approved and{" "}
                        {initialProject.sprint_count} sprint{initialProject.sprint_count !== 1 ? "s" : ""}{" "}
                        {initialProject.sprint_count !== 1 ? "have" : "has"} been created. View them in the Sprints tab.
                      </p>
                      <PlanReview
                        plan={savedPlan.recommendation}
                        onApprove={() => {}}
                        onReject={() => {}}
                        conversationId={savedPlan.id}
                        isApproving={false}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  /* Draft/planning state — show actionable PlanReview */
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        A plan was generated for this project. Review and approve to create sprints and tasks.
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSavedPlan(null)}
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Re-generate
                      </Button>
                    </div>
                    <PlanReview
                      plan={savedPlan.recommendation}
                      conversationId={savedPlan.id}
                      isApproving={isApprovingSaved}
                      onApprove={async (modifiedPlan) => {
                        setIsApprovingSaved(true)
                        try {
                          const resp = await fetch("/api/planning/approve", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              supabaseConversationId: savedPlan.id,
                              projectId: initialProject.id,
                              recommendation: modifiedPlan,
                            }),
                          })
                          if (!resp.ok) throw new Error("Approval failed")
                          addToast("Plan approved. Sprints and tasks created.", "success")
                          router.refresh()
                        } catch (e) {
                          console.error("Approval error:", e)
                          addToast("Failed to approve plan.", "error")
                        } finally {
                          setIsApprovingSaved(false)
                        }
                      }}
                      onReject={() => {
                        setSavedPlan(null)
                      }}
                    />
                  </>
                )}
              </>
            ) : (
              /* No saved plan — show PlanningChat */
              <PlanningChat
                projectId={initialProject.id}
                autoStartContext={(initialProject.description || notionPageId) ? {
                  projectName: initialProject.name,
                  projectDescription: initialProject.description ?? "",
                  hasNotionTask: !!notionPageId,
                  notionTitle: notionTask?.title || "",
                  notionPriority: notionTask?.priority || "",
                  notionTaskType: notionTask?.task_type || "",
                  notionEstimatedTime: notionTask?.estimated_time || null,
                  notionDueDate: notionTask?.due_date || "",
                } : undefined}
              />
            )}
          </div>
        </ErrorBoundary>
      )}

      {activeTab === "attachments" && (
        <ErrorBoundary>
          <AttachmentUpload parentType="project" parentId={initialProject.id} />
        </ErrorBoundary>
      )}

      {activeTab === "blockers" && (
        <ErrorBoundary>
          <BlockerQueue projectId={initialProject.id} />
        </ErrorBoundary>
      )}

      {/* Plans tab — T8, T9, T10 */}
      {activeTab === "plans" && (
        <ErrorBoundary>
          <div className="space-y-4">
            {plansLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !plans || plans.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
                  <div className="rounded-full bg-muted p-4">
                    <ClipboardList className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-base">No plans yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Plans are generated during the planning process. Go to the Planning tab to
                      start a conversation with the Orchestrator.
                    </p>
                  </div>
                  <Button variant="default" size="sm" onClick={() => setActiveTab("planning")}>
                    Go to Planning
                  </Button>
                </CardContent>
              </Card>
            ) : (
              plans.map((plan: Plan) => {
                const isExpanded = expandedPlanId === plan.id
                const isDeclining = decliningPlanId === plan.id

                const statusBadge = (status: string) => {
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
                  if (status === "pending_review")
                    return (
                      <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20">
                        Pending Review
                      </Badge>
                    )
                  return <Badge variant="outline">{status}</Badge>
                }

                const renderRecommendation = (rec: Record<string, unknown>) => {
                  // Try to render as a sprint/task tree
                  const sprints = Array.isArray(rec.sprints) ? rec.sprints as Array<{
                    name?: string
                    description?: string
                    tasks?: Array<{ name?: string; description?: string }>
                  }> : null

                  if (sprints) {
                    return (
                      <div className="space-y-3">
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

                  // Fallback: formatted JSON
                  return (
                    <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words">
                      {JSON.stringify(rec, null, 2)}
                    </pre>
                  )
                }

                return (
                  <Card key={plan.id} className={plan.status === "pending_review" ? "border-yellow-500/30" : undefined}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          {statusBadge(plan.status)}
                          <span className="text-xs text-muted-foreground">
                            Created{" "}
                            {plan.created_at
                              ? new Date(plan.created_at).toLocaleDateString()
                              : "—"}
                          </span>
                          {plan.approved_at && (
                            <span className="text-xs text-muted-foreground">
                              Approved{" "}
                              {new Date(plan.approved_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          aria-label={isExpanded ? "Collapse plan" : "Expand plan"}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* Action buttons — T9 */}
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {plan.status === "pending_review" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={updatePlan.isPending}
                              onClick={async () => {
                                try {
                                  await updatePlan.mutateAsync({ planId: plan.id, status: "approved" })
                                  addToast("Plan approved.", "success")
                                } catch (e) {
                                  addToast(
                                    e instanceof Error ? e.message : "Failed to approve plan.",
                                    "error"
                                  )
                                }
                              }}
                            >
                              <Check className="h-3.5 w-3.5 mr-1.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                              onClick={() => {
                                setDecliningPlanId(isDeclining ? null : plan.id)
                                setDeclineReasonValue("")
                              }}
                            >
                              <X className="h-3.5 w-3.5 mr-1.5" />
                              Decline
                            </Button>
                          </>
                        )}
                        {plan.status === "declined" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatePlan.isPending}
                            onClick={async () => {
                              try {
                                await updatePlan.mutateAsync({
                                  planId: plan.id,
                                  status: "pending_review",
                                })
                                addToast("Plan resubmitted for review.", "success")
                              } catch (e) {
                                addToast(
                                  e instanceof Error ? e.message : "Failed to resubmit plan.",
                                  "error"
                                )
                              }
                            }}
                          >
                            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                            Resubmit
                          </Button>
                        )}
                      </div>

                      {/* Decline reason input */}
                      {isDeclining && (
                        <div className="space-y-2 pt-2">
                          <textarea
                            value={declineReasonValue}
                            onChange={(e) => setDeclineReasonValue(e.target.value)}
                            rows={3}
                            placeholder="Reason for declining (optional)..."
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={updatePlan.isPending}
                              onClick={async () => {
                                try {
                                  await updatePlan.mutateAsync({
                                    planId: plan.id,
                                    status: "declined",
                                    decline_reason: declineReasonValue.trim() || undefined,
                                  })
                                  setDecliningPlanId(null)
                                  setDeclineReasonValue("")
                                  addToast("Plan declined.", "success")
                                } catch (e) {
                                  addToast(
                                    e instanceof Error ? e.message : "Failed to decline plan.",
                                    "error"
                                  )
                                }
                              }}
                            >
                              Confirm Decline
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setDecliningPlanId(null)
                                setDeclineReasonValue("")
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Declined reason display */}
                      {plan.status === "declined" && plan.decline_reason && (
                        <p className="text-xs text-muted-foreground bg-red-500/5 border border-red-500/20 rounded px-3 py-2 mt-2">
                          <span className="font-medium text-red-400">Decline reason: </span>
                          {plan.decline_reason}
                        </p>
                      )}
                    </CardHeader>

                    {isExpanded && plan.recommendation && (
                      <CardContent className="pt-0 pb-4">
                        <div className="border-t pt-4">
                          {renderRecommendation(plan.recommendation)}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })
            )}
          </div>
        </ErrorBoundary>
      )}

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Project"
        description={`Are you sure you want to delete "${initialProject.name}"? This will also delete all sprints and tasks. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteProject.isPending}
      />

      {/* Project Assistant floating button */}
      <Button
        onClick={() => setAssistantOpen(!assistantOpen)}
        className="fixed bottom-6 right-6 z-40 rounded-full h-12 w-12 shadow-lg"
        size="icon"
      >
        <Bot className="h-5 w-5" />
      </Button>
      <ProjectAssistant
        projectId={initialProject.id}
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />

      {/* Add Sprint dialog */}
      {showAddSprint && (
        <Dialog open={showAddSprint} onOpenChange={setShowAddSprint}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Sprint</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="sprint-name">
                  Name
                </label>
                <Input
                  id="sprint-name"
                  placeholder="Sprint name"
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSprintName.trim()) handleAddSprint();
                  }}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="sprint-desc">
                  Description{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  id="sprint-desc"
                  placeholder="What will this sprint accomplish?"
                  value={newSprintDescription}
                  onChange={(e) => setNewSprintDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowAddSprint(false)} disabled={addSprintPending}>
                Cancel
              </Button>
              <Button
                onClick={handleAddSprint}
                disabled={!newSprintName.trim() || addSprintPending}
                loading={addSprintPending}
              >
                Add Sprint
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
