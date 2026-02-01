import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProjectDetailClient } from "./ProjectDetailClient";
import type { ProjectSummary } from "@/lib/supabase/types";

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getProject(id: string): Promise<ProjectSummary | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_summary")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching project:", error);
    return null;
  }

  return data;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return (
    <PageContainer>
      <ProjectDetailClient project={project} />
    </PageContainer>
  );
}
