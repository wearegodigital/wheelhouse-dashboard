import { PageContainer } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/button"
import { ProjectList } from "@/components/projects"
import { ActivityFeed } from "@/components/activity"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function ProjectsPage() {
  return (
    <PageContainer
      title="Projects"
      description="Manage your agent orchestration projects"
      action={
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProjectList />
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed limit={20} />
        </div>
      </div>
    </PageContainer>
  )
}
