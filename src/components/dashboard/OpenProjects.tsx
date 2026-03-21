"use client"

import Link from "next/link"
import { useProjects } from "@/hooks/useProjects"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getStatusBadgeVariant } from "@/lib/status"
import { ArrowRight, GitBranch } from "lucide-react"

const OPEN_STATUSES = new Set(["draft", "planning", "ready", "running", "paused"])

export function OpenProjects() {
  const { data: allProjects, isLoading } = useProjects()
  const projects = allProjects?.filter((p) => OPEN_STATUSES.has(p.status ?? ""))

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Open Projects</CardTitle>
        <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : !projects?.length ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No active projects</p>
        ) : (
          projects.slice(0, 8).map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/30 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{p.name}</span>
                    <Badge variant={getStatusBadgeVariant(p.status ?? "")}>{p.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {p.repo_url && (
                      <span className="flex items-center gap-1 truncate">
                        <GitBranch className="h-3 w-3 shrink-0" />
                        <span className="truncate">{p.repo_url.replace(/^https?:\/\/(www\.)?github\.com\//, "")}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground ml-4">
                  <span>{p.tasks_completed ?? 0}/{p.task_count ?? 0} tasks</span>
                  {(p.task_count ?? 0) > 0 && (
                    <div className="w-16 h-1.5 bg-muted rounded-full mt-1">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.round(((p.tasks_completed ?? 0) / (p.task_count ?? 1)) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}
