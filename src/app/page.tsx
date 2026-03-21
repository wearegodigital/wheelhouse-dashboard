"use client"

import { PageContainer } from "@/components/layout/PageContainer"
import { StatsOverview } from "@/components/dashboard/StatsOverview"
import { OpenProjects } from "@/components/dashboard/OpenProjects"
import { RecentNotionTasks } from "@/components/dashboard/RecentNotionTasks"

export default function HomePage() {
  return (
    <PageContainer title="Dashboard" description="Overview of your workspace">
      <StatsOverview />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <OpenProjects />
        </div>
        <div>
          <RecentNotionTasks />
        </div>
      </div>
    </PageContainer>
  )
}
