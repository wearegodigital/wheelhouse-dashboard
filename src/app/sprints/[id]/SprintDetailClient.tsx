"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ExecutionControls } from "@/components/execution/ExecutionControls";
import { TaskList } from "@/components/tasks/TaskList";
import type { SprintSummary } from "@/lib/supabase/types";
import { useDeleteSprint } from "@/hooks/useSprints";
import { getStatusBadgeVariant } from "@/lib/status";
import { cn } from "@/lib/utils";

interface SprintDetailClientProps {
  sprint: SprintSummary;
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

  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteSprint = useDeleteSprint();

  const handleDelete = async () => {
    try {
      await deleteSprint.mutateAsync({ id: sprint.id, projectId: sprint.project_id });
      router.push(`/projects/${sprint.project_id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("conflict") || message.includes("running")) {
        alert("Cannot delete a running sprint. Please cancel execution first.");
      } else {
        console.error("Failed to delete sprint:", error);
      }
    }
  };

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

        <div className="flex items-center gap-2">
          <ExecutionControls
            level="sprint"
            id={sprint.id}
            status={sprint.status}
          />
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

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Sprint"
        description={`Are you sure you want to delete "${sprint.name}"? This will also delete all tasks in this sprint. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteSprint.isPending}
      />
    </div>
  );
}
