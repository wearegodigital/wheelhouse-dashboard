"use client"

import Link from "next/link"
import { FolderGit2, GitBranch, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { useProjects } from "@/hooks/useProjects"
import type { ProjectSummary, ProjectStatus } from "@/lib/supabase/types"

interface ProjectListProps {
  filters?: {
    status?: ProjectStatus
    search?: string
  }
}

const statusVariants: Record<ProjectStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  planning: "outline",
  ready: "default",
  running: "default",
  paused: "secondary",
  completed: "default",
  cancelled: "destructive",
}

export function ProjectList({ filters }: ProjectListProps) {
  const { data: projects, isLoading, error } = useProjects(filters)

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-full" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
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
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate">{project.name}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {project.description}
              </CardDescription>
            </div>
            <Badge variant={statusVariants[project.status]} className="shrink-0">
              {project.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GitBranch className="h-4 w-4" />
              <span className="truncate">{project.repo_url}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <FolderGit2 className="h-4 w-4 text-muted-foreground" />
                <span>
                  <span className="font-medium">{project.sprint_count}</span> sprint{project.sprint_count !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span>
                  <span className="font-medium">{project.task_count}</span> task{project.task_count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {project.task_count > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {project.tasks_completed} of {project.task_count} completed
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
