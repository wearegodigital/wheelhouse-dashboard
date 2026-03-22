"use client"

import Link from "next/link"
import { PageContainer } from "@/components/layout/PageContainer"
import { StatsOverview } from "@/components/dashboard/StatsOverview"
import { OpenProjects } from "@/components/dashboard/OpenProjects"
import { RecentNotionTasks } from "@/components/dashboard/RecentNotionTasks"

export default function HomePage() {
  return (
    <PageContainer title="Dashboard" description="Overview of your workspace">
      <StatsOverview />

      {/* Tasks to Delegate — most prominent section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Tasks to Delegate</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Notion tasks ready to hand off to Wheelhouse</p>
          </div>
          <Link
            href="/delegate"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 transition-colors"
          >
            View All Tasks
          </Link>
        </div>
        <RecentNotionTasks />
      </div>

      {/* Open Projects */}
      <div className="mt-8">
        <OpenProjects />
      </div>
    </PageContainer>
  )
}
