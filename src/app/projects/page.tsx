import { PageContainer } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/button"
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
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          No projects yet. Create your first project to get started.
        </p>
      </div>
    </PageContainer>
  )
}
