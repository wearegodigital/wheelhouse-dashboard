import { PageContainer } from "@/components/layout/PageContainer"

export default function SettingsPage() {
  return (
    <PageContainer
      title="Settings"
      description="Manage API keys and preferences"
    >
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">API Keys</h2>
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            API key management coming soon
          </div>
        </section>
      </div>
    </PageContainer>
  )
}
