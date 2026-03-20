"use client"

import { useParams } from "next/navigation"
import { PageContainer } from "@/components/layout/PageContainer"
import { PlanningChat } from "@/components/planning/PlanningChat"

export default function PlanPage() {
  const { id } = useParams()
  return (
    <PageContainer title="Plan Project" description="Decompose this project into sprints and tasks with AI">
      <PlanningChat projectId={id as string} />
    </PageContainer>
  )
}
