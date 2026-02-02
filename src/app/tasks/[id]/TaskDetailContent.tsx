"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Clock, GitBranch, Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExecutionControls } from "@/components/execution/ExecutionControls";
import { TaskComments } from "@/components/tasks";
import type { TaskSummary, Agent, Event } from "@/lib/supabase/types";

interface TaskDetailContentProps {
  task: TaskSummary;
  agents: Agent[];
  events: Event[];
}

export function TaskDetailContent({ task, agents: initialAgents, events: initialEvents }: TaskDetailContentProps) {
  const [currentStatus, setCurrentStatus] = useState(task.status);
  const [agents, setAgents] = useState(initialAgents);
  const [events, setEvents] = useState(initialEvents);
  const queryClient = useQueryClient();

  // Real-time subscriptions for agents and events
  useEffect(() => {
    const supabase = createClient();

    // Subscribe to agent changes for this task
    const agentsChannel = supabase
      .channel(`agents_${task.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agents",
          filter: `task_id=eq.${task.id}`,
        },
        async () => {
          // Refetch agents when changes occur
          const { data } = await supabase
            .from("agents")
            .select("*")
            .eq("task_id", task.id)
            .order("created_at", { ascending: true });
          if (data) setAgents(data as Agent[]);
        }
      )
      .subscribe();

    // Subscribe to event changes for this task
    const eventsChannel = supabase
      .channel(`events_${task.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
          filter: `task_id=eq.${task.id}`,
        },
        async () => {
          // Refetch events when changes occur
          const { data } = await supabase
            .from("events")
            .select("*")
            .eq("task_id", task.id)
            .order("created_at", { ascending: false })
            .limit(50);
          if (data) setEvents(data as Event[]);
        }
      )
      .subscribe();

    // Subscribe to task status changes
    const taskChannel = supabase
      .channel(`task_${task.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tasks",
          filter: `id=eq.${task.id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object" && "status" in payload.new) {
            setCurrentStatus(payload.new.status as typeof currentStatus);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(agentsChannel);
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(taskChannel);
    };
  }, [task.id, queryClient]);

  const handleStatusChange = () => {
    // Real-time subscription will automatically update the UI
  };

  return (
    <div className="space-y-6">
      {/* Task Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Task Details</CardTitle>
              <CardDescription>
                Created {new Date(task.created_at).toLocaleDateString()}
                {task.created_by_name && ` by ${task.created_by_name}`}
              </CardDescription>
            </div>
            <ExecutionControls
              level="task"
              id={task.id}
              status={currentStatus}
              onStatusChange={handleStatusChange}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={getStatusVariant(task.status)} className="mt-1">
                {task.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Mode</p>
              <Badge variant="outline" className="mt-1">
                {task.mode}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Progress</p>
              <div className="mt-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{task.progress}%</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Repository</p>
              <a
                href={task.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline mt-1 flex items-center gap-1"
              >
                {task.repo_url.split("/").slice(-2).join("/")}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {task.branch && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Branch</p>
              <div className="flex items-center gap-2 text-sm">
                <GitBranch className="h-4 w-4" />
                <code className="bg-muted px-2 py-1 rounded">{task.branch}</code>
              </div>
            </div>
          )}

          {task.pr_url && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pull Request</p>
              <a
                href={task.pr_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                View PR #{task.pr_url.split("/").pop()}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {task.completed_at && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Completed</p>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                {new Date(task.completed_at).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Agent Activity
          </CardTitle>
          <CardDescription>
            {agents.length} {agents.length === 1 ? "agent" : "agents"} working on this task
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No agents have been spawned yet
            </p>
          ) : (
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-start gap-4 p-3 border rounded-lg"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{agent.type}</Badge>
                      <Badge variant={getAgentStatusVariant(agent.status)}>
                        {agent.status}
                      </Badge>
                      {agent.worker_index !== null && (
                        <Badge variant="secondary">Worker {agent.worker_index}</Badge>
                      )}
                    </div>
                    {agent.current_step && (
                      <p className="text-sm text-muted-foreground">
                        Current step: {agent.current_step}
                      </p>
                    )}
                    {agent.steps_completed > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Steps completed: {agent.steps_completed}
                      </p>
                    )}
                    {agent.error && (
                      <p className="text-sm text-red-600 font-mono bg-red-50 p-2 rounded">
                        {agent.error}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {agent.completed_at
                      ? `Completed ${new Date(agent.completed_at).toLocaleTimeString()}`
                      : `Started ${new Date(agent.started_at || agent.created_at).toLocaleTimeString()}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Log Card */}
      <Card>
        <CardHeader>
          <CardTitle>Event Log</CardTitle>
          <CardDescription>
            Recent events (showing last 50 of {task.event_count} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No events recorded yet
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {event.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    {Object.keys(event.payload).length > 0 && (
                      <pre className="text-xs mt-1 text-muted-foreground overflow-x-auto">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <TaskComments taskId={task.id} />
    </div>
  );
}

function getStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "running":
    case "validating":
      return "secondary";
    case "failed":
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

function getAgentStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "running":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}
