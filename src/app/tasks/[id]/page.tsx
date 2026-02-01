import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { TaskDetailContent } from "./TaskDetailContent";
import type { TaskSummary, Agent, Event } from "@/lib/supabase/types";

interface TaskPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TaskPage({ params }: TaskPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch task summary
  const { data: task, error: taskError } = await supabase
    .from("task_summary")
    .select("*")
    .eq("id", id)
    .single<TaskSummary>();

  if (taskError || !task) {
    notFound();
  }

  // Fetch agents for this task
  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .eq("task_id", id)
    .order("created_at", { ascending: true });

  // Fetch recent events for this task (last 50)
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("task_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const backLink = task.sprint_id
    ? `/sprints/${task.sprint_id}`
    : task.project_id
    ? `/projects/${task.project_id}`
    : "/tasks";

  const backLabel = task.sprint_id
    ? task.sprint_name || "Sprint"
    : task.project_id
    ? task.project_name || "Project"
    : "Tasks";

  return (
    <PageContainer
      title={`Task #${task.order_index}`}
      description={task.description}
      action={
        <Link href={backLink}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {backLabel}
          </Button>
        </Link>
      }
    >
      <TaskDetailContent
        task={task}
        agents={(agents as Agent[]) || []}
        events={(events as Event[]) || []}
      />
    </PageContainer>
  );
}
