import { PageContainer } from "@/components/layout/PageContainer"

export default function TasksPage() {
  return (
    <PageContainer
      title="Tasks"
      description="All tasks across projects"
    >
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          No tasks yet.
        </p>
      </div>
    </PageContainer>
  )
}
