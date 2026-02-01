import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layout/PageContainer";
import { SprintDetailClient } from "./SprintDetailClient";
import type { SprintSummary } from "@/lib/supabase/types";

interface SprintPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getSprint(id: string): Promise<SprintSummary | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sprint_summary")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching sprint:", error);
    return null;
  }

  return data;
}

export default async function SprintPage({ params }: SprintPageProps) {
  const { id } = await params;
  const sprint = await getSprint(id);

  if (!sprint) {
    notFound();
  }

  return (
    <PageContainer>
      <SprintDetailClient sprint={sprint} />
    </PageContainer>
  );
}
