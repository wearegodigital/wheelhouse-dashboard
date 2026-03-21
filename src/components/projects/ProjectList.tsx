"use client"

import { useState } from "react"
import Link from "next/link"
import { FolderGit2, GitBranch, CheckCircle2, Trash2, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { ProgressBar } from "@/components/ui/progress-bar"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useProjects, useDeleteProject } from "@/hooks/useProjects"
import { useClients } from "@/hooks/useClients"
import { useRepos } from "@/hooks/useRepos"
import { useQueryClient } from "@tanstack/react-query"
import { getStatusBadgeVariant, pluralize } from "@/lib/status"
import type { ProjectSummary, ProjectStatus, Client, Repo } from "@/lib/supabase/types"

interface ProjectListProps {
  filters?: {
    status?: ProjectStatus
    search?: string
  }
}

export function ProjectList({ filters }: ProjectListProps) {
  const { data: projects, isLoading, error } = useProjects(filters)
  const { data: clients } = useClients()
  const { data: repos } = useRepos()
  const clientMap = Object.fromEntries((clients ?? []).map((c) => [c.id, c]))
  const repoMap = Object.fromEntries((repos ?? []).map((r) => [r.id, r]))
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const deleteProject = useDeleteProject()
  const queryClient = useQueryClient()

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const completedCount = projects?.filter((p) => p.status === "completed").length ?? 0
  const filteredProjects = !showCompleted
    ? projects?.filter((p) => p.status !== "completed") ?? []
    : projects ?? []

  const allIds = filteredProjects.map((p) => p.id) ?? []
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id))
  const someSelected = allIds.some((id) => selectedIds.has(id))

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allIds))
    }
  }

  const handleDeleteSelected = async () => {
    setIsDeleting(true)
    try {
      for (const id of selectedIds) {
        await deleteProject.mutateAsync({ id })
      }
      await queryClient.invalidateQueries({ queryKey: ["projects"] })
      setSelectedIds(new Set())
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton count={3} />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        message="Failed to load projects. Please try again."
        icon={<FolderGit2 className="h-12 w-12 text-muted-foreground mx-auto" />}
      />
    )
  }

  if (!projects || (filteredProjects.length === 0 && !showCompleted && completedCount > 0)) {
    // Empty after filtering, but completed projects exist
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
          <span className="text-sm text-muted-foreground">
            {completedCount} {pluralize(completedCount, "completed project")} hidden
          </span>
          <button
            onClick={() => setShowCompleted(true)}
            className="text-sm font-medium text-primary hover:underline"
          >
            Show
          </button>
        </div>
      </div>
    )
  }

  if (!projects || filteredProjects.length === 0) {
    return (
      <EmptyState
        message={filters?.search ? "No projects found matching your search." : "No projects yet. Create one to get started."}
        icon={<FolderGit2 className="h-12 w-12 text-muted-foreground mx-auto" />}
      />
    )
  }

  return (
    <div className="relative">
      {/* Completed projects toggle */}
      {completedCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border mb-4">
          <span className="text-sm text-muted-foreground">
            {showCompleted
              ? `Showing ${completedCount} ${pluralize(completedCount, "completed project")}`
              : `${completedCount} ${pluralize(completedCount, "completed project")} hidden`}
          </span>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-sm font-medium text-primary hover:underline ml-auto"
          >
            {showCompleted ? "Hide completed" : "Show"}
          </button>
        </div>
      )}

      {/* Select All header */}
      <div className="flex items-center gap-2 mb-3">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected && !allSelected
          }}
          onChange={toggleSelectAll}
          className="h-4 w-4 rounded border-border cursor-pointer accent-primary"
          aria-label="Select all projects"
        />
        <span className="text-sm text-muted-foreground">Select all</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            selected={selectedIds.has(project.id)}
            onToggle={toggleSelection}
            clientName={project.client_id ? clientMap[project.client_id]?.name : undefined}
            repoName={project.repo_id ? repoMap[project.repo_id]?.name : undefined}
          />
        ))}
      </div>

      {/* Floating action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border bg-background px-4 py-3 shadow-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} {pluralize(selectedIds.size, "project")} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete Selected
          </Button>
        </div>
      )}

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Projects"
        description={`Are you sure you want to delete ${selectedIds.size} ${pluralize(selectedIds.size, "project")}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteSelected}
        isLoading={isDeleting}
      />
    </div>
  )
}

function ProjectCard({
  project,
  selected,
  onToggle,
  clientName,
  repoName,
}: {
  project: ProjectSummary
  selected: boolean
  onToggle: (id: string) => void
  clientName?: string
  repoName?: string
}) {
  const progress = project.task_count > 0
    ? Math.round((project.tasks_completed / project.task_count) * 100)
    : 0

  return (
    <div className="relative">
      {/* Checkbox overlay */}
      <div
        className="absolute top-3 left-3 z-10"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onToggle(project.id)
        }}
      >
        <input
          type="checkbox"
          checked={selected}
          readOnly
          className="h-4 w-4 rounded border-border cursor-pointer accent-primary pointer-events-none"
          aria-label={`Select ${project.name}`}
        />
      </div>

      <Link href={`/projects/${project.id}`}>
        <Card className={`hover:shadow-md transition-all duration-300 cursor-pointer h-full group [.cyberpunk_&]:hover:shadow-[0_0_12px_hsl(var(--primary)/0.4),0_0_24px_hsl(var(--primary)/0.2),inset_0_0_8px_hsl(var(--primary)/0.1)] [.cyberpunk_&]:hover:border-primary [.cyberpunk_&]:hover:scale-[1.02] ${selected ? "ring-2 ring-primary" : ""}`}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2 pl-6">
              <div className="flex-1 min-w-0">
                <CardTitle className="truncate [.cyberpunk_&]:group-hover:text-primary [.cyberpunk_&]:group-hover:drop-shadow-[0_0_4px_hsl(var(--primary)/0.5)] transition-all duration-300">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1">
                  {project.description}
                </CardDescription>
                {(clientName || repoName) && (
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {clientName && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> {clientName}
                      </span>
                    )}
                    {repoName && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <GitBranch className="h-3 w-3" /> {repoName}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Badge variant={getStatusBadgeVariant(project.status)} className="shrink-0">
                {project.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground [.cyberpunk_&]:group-hover:text-primary/70 transition-colors duration-300">
                <GitBranch className="h-4 w-4 [.cyberpunk_&]:group-hover:drop-shadow-[0_0_2px_hsl(var(--primary)/0.4)]" />
                <span className="truncate">{project.repo_url}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <FolderGit2 className="h-4 w-4 text-muted-foreground [.cyberpunk_&]:group-hover:text-primary/70 [.cyberpunk_&]:group-hover:drop-shadow-[0_0_2px_hsl(var(--primary)/0.4)] transition-all duration-300" />
                  <span>
                    <span className="font-medium [.cyberpunk_&]:group-hover:text-primary transition-colors duration-300">{project.sprint_count}</span> {pluralize(project.sprint_count, "sprint")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground [.cyberpunk_&]:group-hover:text-primary/70 [.cyberpunk_&]:group-hover:drop-shadow-[0_0_2px_hsl(var(--primary)/0.4)] transition-all duration-300" />
                  <span>
                    <span className="font-medium [.cyberpunk_&]:group-hover:text-primary transition-colors duration-300">{project.task_count}</span> {pluralize(project.task_count, "task")}
                  </span>
                </div>
              </div>

              {project.task_count > 0 && (
                <ProgressBar
                  value={progress}
                  label={`${project.tasks_completed} of ${project.task_count} completed`}
                  sublabel={`${progress}%`}
                  className="[.cyberpunk_&]:group-hover:drop-shadow-[0_0_4px_hsl(var(--primary)/0.3)]"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
