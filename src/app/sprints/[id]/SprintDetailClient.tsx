"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExecutionControls } from "@/components/execution/ExecutionControls";
import { TaskList } from "@/components/tasks/TaskList";
import type { SprintSummary } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface SprintDetailClientProps {
  sprint: SprintSummary;
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "completed":
      return "success";
    case "cancelled":
      return "destructive";
    case "running":
      return "default";
    case "paused":
      return "secondary";
    case "ready":
      return "outline";
    case "draft":
      return "outline";
    default:
      return "outline";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "running":
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    default:
      return null;
  }
}

export function SprintDetailClient({ sprint }: SprintDetailClientProps) {
  const completionRate =
    sprint.task_count > 0
      ? Math.round((sprint.tasks_completed / sprint.task_count) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href={`/projects/${sprint.project_id}`}
              className="hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              {sprint.project_name}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {getStatusIcon(sprint.status)}
            <h1 className="text-3xl font-bold tracking-tight">
              {sprint.name}
            </h1>
            <Badge variant={getStatusBadgeVariant(sprint.status)}>
              {sprint.status}
            </Badge>
          </div>
          {sprint.description && (
            <p className="text-muted-foreground">{sprint.description}</p>
          )}
        </div>

        <ExecutionControls
          level="sprint"
          id={sprint.id}
          status={sprint.status}
        />
      </div>

      {/* Sprint Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sprint Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{sprint.order_index + 1}</div>
            <p className="text-xs text-muted-foreground">
              Position in project
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sprint.task_count}</div>
            <p className="text-xs text-muted-foreground">
              {sprint.tasks_running} running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sprint.tasks_completed}</div>
            <p className="text-xs text-muted-foreground">
              of {sprint.task_count} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <div className="mt-2 w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  sprint.status === "completed"
                    ? "bg-green-500"
                    : "bg-primary"
                )}
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sprint Timeline */}
      {(sprint.created_at || sprint.completed_at) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {sprint.created_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Created
                  </p>
                  <p className="text-sm">
                    {new Date(sprint.created_at).toLocaleString()}
                  </p>
                </div>
              )}
              {sprint.updated_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </p>
                  <p className="text-sm">
                    {new Date(sprint.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
              {sprint.completed_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Completed
                  </p>
                  <p className="text-sm">
                    {new Date(sprint.completed_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repository Info */}
      <Card>
        <CardHeader>
          <CardTitle>Repository</CardTitle>
        </CardHeader>
        <CardContent>
          <a
            href={sprint.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline font-mono text-sm"
          >
            {sprint.repo_url}
          </a>
        </CardContent>
      </Card>

      {/* Tasks Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Tasks</h2>
        <TaskList filters={{ sprintId: sprint.id }} />
      </div>
    </div>
  );
}
