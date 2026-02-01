import { PageContainer } from "@/components/layout/PageContainer"
import { TaskList } from "@/components/tasks"

export default function TasksPage() {
  return (
    <PageContainer
      title="Tasks"
      description="All tasks across projects"
    >
      <TaskList />
    </PageContainer>
  )
}
