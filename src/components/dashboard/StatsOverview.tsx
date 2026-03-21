"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { FolderOpen, CheckCircle2, Loader2, AlertTriangle, Inbox, BarChart3 } from "lucide-react"

async function fetchStats() {
  const res = await fetch("/api/stats/overview")
  if (!res.ok) throw new Error("Failed to fetch stats")
  return res.json()
}

const STAT_CARDS = [
  { key: "active_projects", label: "Active Projects", icon: FolderOpen, color: "text-amber-400" },
  { key: "tasks_completed", label: "Tasks Completed", icon: CheckCircle2, color: "text-green-400" },
  { key: "tasks_in_progress", label: "In Progress", icon: Loader2, color: "text-blue-400" },
  { key: "tasks_blocked", label: "Blocked", icon: AlertTriangle, color: "text-red-400" },
  { key: "notion_tasks_to_delegate", label: "To Delegate", icon: Inbox, color: "text-purple-400" },
  { key: "total_tasks", label: "Total Tasks", icon: BarChart3, color: "text-zinc-400" },
] as const

export function StatsOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["stats-overview"],
    queryFn: fetchStats,
    refetchInterval: 30000,
  })

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
        <Card key={key} className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">{data?.[key] ?? 0}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
