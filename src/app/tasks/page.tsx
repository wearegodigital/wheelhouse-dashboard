import Link from "next/link"
import { Plus } from "lucide-react"
import { PageContainer } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/button"
import { TasksPageContent } from "./TasksPageContent"

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
      <TasksPageContent />
    </PageContainer>
  )
}
