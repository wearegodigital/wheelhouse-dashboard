import Link from "next/link"
import { Plus } from "lucide-react"
import { PageContainer } from "@/components/layout/PageContainer"
import { TaskList } from "@/components/tasks"
import { Button } from "@/components/ui/button"

export default function TasksPage() {
  return (
    <PageContainer
      title="Tasks"
      description="All tasks across projects"
      action={
        <Link href="/tasks/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </Link>
      }
    >
      <TaskList />
    </PageContainer>
  )
}
