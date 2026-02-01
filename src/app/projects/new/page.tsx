import { PageContainer } from "@/components/layout/PageContainer"

export default function NewProjectPage() {
  return (
    <PageContainer
      title="New Project"
      description="Start a planning conversation with the Orchestrator"
    >
      <div className="max-w-3xl mx-auto">
        <div className="rounded-lg border p-4 mb-4">
          <label className="block text-sm font-medium mb-2">Repository URL</label>
          <input
            type="text"
            placeholder="https://github.com/owner/repo"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Planning chat will appear here
        </div>
      </div>
    </PageContainer>
  )
}
