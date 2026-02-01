"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Calendar, GitBranch } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExecutionControls } from "@/components/execution/ExecutionControls";
import { SprintList } from "@/components/sprints";
import { PlanningChat } from "@/components/planning";
import type { ProjectSummary } from "@/lib/supabase/types";

interface ProjectDetailClientProps {
  project: ProjectSummary;
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  draft: "outline",
  planning: "secondary",
  ready: "warning",
  running: "default",
  paused: "warning",
  completed: "success",
  cancelled: "destructive",
};

export function ProjectDetailClient({ project: initialProject }: ProjectDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "sprints" | "planning">("overview");

  const handleStatusChange = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{initialProject.name}</h1>
            <Badge variant={STATUS_VARIANTS[initialProject.status] || "outline"}>
              {initialProject.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{initialProject.description}</p>
        </div>
        <ExecutionControls
          level="project"
          id={initialProject.id}
          status={initialProject.status}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === "overview"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("sprints")}
            className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === "sprints"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
          >
            Sprints ({initialProject.sprint_count})
          </button>
          <button
            onClick={() => setActiveTab("planning")}
            className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === "planning"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
          >
            Planning
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
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
      )}

      {activeTab === "sprints" && (
        <SprintList projectId={initialProject.id} />
      )}

      {activeTab === "planning" && (
        <PlanningChat projectId={initialProject.id} />
      )}
    </div>
  );
}
