"use client"

import Link from "next/link"
import { FolderGit2, GitBranch, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { ProgressBar } from "@/components/ui/progress-bar"
import { useProjects } from "@/hooks/useProjects"
import { getStatusBadgeVariant, pluralize } from "@/lib/status"
import type { ProjectSummary, ProjectStatus } from "@/lib/supabase/types"

interface ProjectListProps {
  filters?: {
    status?: ProjectStatus
    search?: string
  }
}

export function ProjectList({ filters }: ProjectListProps) {
  const { data: projects, isLoading, error } = useProjects(filters)

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

  if (!projects || projects.length === 0) {
    return (
      <EmptyState
        message={filters?.search ? "No projects found matching your search." : "No projects yet. Create one to get started."}
        icon={<FolderGit2 className="h-12 w-12 text-muted-foreground mx-auto" />}
      />
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

function ProjectCard({ project }: { project: ProjectSummary }) {
  const progress = project.task_count > 0
    ? Math.round((project.tasks_completed / project.task_count) * 100)
    : 0

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-all duration-300 cursor-pointer h-full group [.cyberpunk_&]:hover:shadow-[0_0_12px_hsl(var(--primary)/0.4),0_0_24px_hsl(var(--primary)/0.2),inset_0_0_8px_hsl(var(--primary)/0.1)] [.cyberpunk_&]:hover:border-primary [.cyberpunk_&]:hover:scale-[1.02]">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate [.cyberpunk_&]:group-hover:text-primary [.cyberpunk_&]:group-hover:drop-shadow-[0_0_4px_hsl(var(--primary)/0.5)] transition-all duration-300">{project.name}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {project.description}
              </CardDescription>
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
  )
}
