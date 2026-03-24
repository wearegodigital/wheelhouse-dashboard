"use client"

import { useState, useMemo } from "react"
import { PageContainer } from "@/components/layout/PageContainer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useNotionTasks, type NotionTask } from "@/hooks/useNotionTasks"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Calendar, Clock, ArrowRight, Loader2, CheckCircle2, BarChart3, Send, FolderOpen, Search, ArrowUpDown, RefreshCw } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isOverdue(due_date: string | null, todayStart: Date): boolean {
  if (!due_date) return false
  return new Date(due_date) < todayStart
}

function sortByDueDate(tasks: NotionTask[]): NotionTask[] {
  return [...tasks].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1   // nulls last
    if (!b.due_date) return -1
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })
}

// ─── Sort types + logic ────────────────────────────────────────────────────────

type DelegateSortBy =
  | "due_date_asc"
  | "due_date_desc"
  | "priority_desc"
  | "estimated_asc"
  | "estimated_desc"
  | "title_asc"
  | "added_desc"

type ReviewSortBy =
  | "updated_desc"
  | "updated_asc"
  | "priority_desc"
  | "title_asc"

const DELEGATE_SORT_OPTIONS: { value: DelegateSortBy; label: string }[] = [
  { value: "due_date_asc",   label: "Due Date (nearest first)" },
  { value: "due_date_desc",  label: "Due Date (furthest first)" },
  { value: "priority_desc",  label: "Priority (High → Low)" },
  { value: "estimated_asc",  label: "Estimated Time (shortest first)" },
  { value: "estimated_desc", label: "Estimated Time (longest first)" },
  { value: "title_asc",      label: "Title (A-Z)" },
  { value: "added_desc",     label: "Recently Added" },
]

const REVIEW_SORT_OPTIONS: { value: ReviewSortBy; label: string }[] = [
  { value: "updated_desc",  label: "Last Updated (newest first)" },
  { value: "updated_asc",   label: "Last Updated (oldest first)" },
  { value: "priority_desc", label: "Priority (High → Low)" },
  { value: "title_asc",     label: "Title (A-Z)" },
]

const PRIORITY_WEIGHT: Record<string, number> = {
  high:   3,
  medium: 2,
  low:    1,
}

function priorityWeight(p: string | null | undefined): number {
  return PRIORITY_WEIGHT[(p ?? "").toLowerCase()] ?? 0
}

function applyDelegateSort(tasks: NotionTask[], sortBy: DelegateSortBy): NotionTask[] {
  return [...tasks].sort((a, b) => {
    switch (sortBy) {
      case "due_date_asc": {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }
      case "due_date_desc": {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
      }
      case "priority_desc":
        return priorityWeight(b.priority) - priorityWeight(a.priority)
      case "estimated_asc": {
        if (a.estimated_time == null && b.estimated_time == null) return 0
        if (a.estimated_time == null) return 1
        if (b.estimated_time == null) return -1
        return a.estimated_time - b.estimated_time
      }
      case "estimated_desc": {
        if (a.estimated_time == null && b.estimated_time == null) return 0
        if (a.estimated_time == null) return 1
        if (b.estimated_time == null) return -1
        return b.estimated_time - a.estimated_time
      }
      case "title_asc":
        return (a.title ?? "").localeCompare(b.title ?? "")
      case "added_desc":
        return (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0)
      default:
        return 0
    }
  })
}

function applyReviewSort(tasks: NotionTask[], sortBy: ReviewSortBy): NotionTask[] {
  return [...tasks].sort((a, b) => {
    switch (sortBy) {
      case "updated_desc": {
        const aT = (a.notion_last_edited ?? a.updated_at) ? new Date(a.notion_last_edited ?? a.updated_at).getTime() : 0
        const bT = (b.notion_last_edited ?? b.updated_at) ? new Date(b.notion_last_edited ?? b.updated_at).getTime() : 0
        return bT - aT
      }
      case "updated_asc": {
        const aT = (a.notion_last_edited ?? a.updated_at) ? new Date(a.notion_last_edited ?? a.updated_at).getTime() : 0
        const bT = (b.notion_last_edited ?? b.updated_at) ? new Date(b.notion_last_edited ?? b.updated_at).getTime() : 0
        return aT - bT
      }
      case "priority_desc":
        return priorityWeight(b.priority) - priorityWeight(a.priority)
      case "title_asc":
        return (a.title ?? "").localeCompare(b.title ?? "")
      default:
        return 0
    }
  })
}

// ─── Priority badge ────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const p = priority?.toLowerCase()
  if (p === "high") return <Badge variant="destructive">High</Badge>
  if (p === "medium") return <Badge variant="warning">Medium</Badge>
  if (p === "low") return <Badge variant="success">Low</Badge>
  return <Badge variant="outline">{priority || "None"}</Badge>
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────

function TaskCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="h-5 bg-muted rounded w-3/4 mb-2" />
        <div className="flex gap-2">
          <div className="h-5 bg-muted rounded-full w-20" />
          <div className="h-5 bg-muted rounded-full w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-20" />
        </div>
        <div className="h-9 bg-muted rounded w-full" />
      </CardContent>
    </Card>
  )
}

// ─── Task card ─────────────────────────────────────────────────────────────────

function TaskCard({ task, actionLabel, actionHref }: {
  task: NotionTask
  actionLabel: string
  actionHref: string
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold leading-snug line-clamp-2">
          {task.title}
        </CardTitle>
        <div className="flex flex-wrap gap-2 pt-1">
          {task.client_name && (
            <Badge variant="secondary">{task.client_name}</Badge>
          )}
          <PriorityBadge priority={task.priority} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 flex-1 justify-between">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {task.due_date && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {new Date(task.due_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
          {task.estimated_time != null && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {task.estimated_time}h
            </span>
          )}
        </div>
        <Link href={actionHref}>
          <Button className="w-full" size="sm">
            {actionLabel}
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

// ─── Search + filter bar ────────────────────────────────────────────────────────

type Priority = "all" | "high" | "medium" | "low"

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "all",    label: "All" },
  { value: "high",   label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low",    label: "Low" },
]

function SearchFilterBar<S extends string>({
  search,
  onSearch,
  priority,
  onPriority,
  sortBy,
  onSortBy,
  sortOptions,
}: {
  search: string
  onSearch: (v: string) => void
  priority: Priority
  onPriority: (v: Priority) => void
  sortBy?: S
  onSortBy?: (v: S) => void
  sortOptions?: { value: S; label: string }[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-5">
      <div className="relative flex-1 min-w-[180px] max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-8 h-9"
        />
      </div>
      <div className="flex items-center gap-1.5">
        {PRIORITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onPriority(opt.value)}
            className={[
              "px-3 py-1 rounded-full text-sm font-medium transition-colors",
              priority === opt.value
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {sortOptions && onSortBy && sortBy !== undefined && (
        <div className="flex items-center gap-1.5 ml-auto">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Select value={sortBy} onValueChange={(v) => onSortBy(v as S)}>
            <SelectTrigger className="h-9 text-sm w-auto min-w-[200px] border-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

function applySearchFilter(tasks: NotionTask[], search: string, priority: Priority): NotionTask[] {
  let result = tasks
  if (search.trim()) {
    const q = search.toLowerCase()
    result = result.filter((t) => t.title?.toLowerCase().includes(q))
  }
  if (priority !== "all") {
    result = result.filter((t) => t.priority?.toLowerCase() === priority)
  }
  return result
}

// ─── Task grid (sorted + filtered) ─────────────────────────────────────────────

function TaskGrid({
  tasks,
  actionLabel,
  hrefBuilder,
  emptyMessage,
}: {
  tasks: NotionTask[]
  actionLabel: string
  hrefBuilder: (task: NotionTask) => string
  emptyMessage: string
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.notion_page_id}
          task={task}
          actionLabel={actionLabel}
          actionHref={hrefBuilder(task)}
        />
      ))}
    </div>
  )
}

// ─── To Delegate tab (with Main / Overdue sub-tabs) ────────────────────────────

function ToDelegateTab() {
  const { data: rawTasks, isLoading } = useNotionTasks("to_delegate")
  const [subTab, setSubTab] = useState<"main" | "overdue">("main")
  const [search, setSearch] = useState("")
  const [priority, setPriority] = useState<Priority>("all")
  const [sortBy, setSortBy] = useState<DelegateSortBy>("due_date_asc")

  const todayStart = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Split overdue/main first (using default due-date sort for the split boundary)
  const baseSorted = sortByDueDate(rawTasks ?? [])
  const mainTasks   = baseSorted.filter((t) => !isOverdue(t.due_date, todayStart))
  const overdueTasks = baseSorted.filter((t) => isOverdue(t.due_date, todayStart))

  const activeTasks = subTab === "main" ? mainTasks : overdueTasks
  const filtered = applySearchFilter(activeTasks, search, priority)
  const sorted = applyDelegateSort(filtered, sortBy)

  return (
    <div>
      {/* Sub-tab toggle */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setSubTab("main")}
          className={[
            "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
            subTab === "main"
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-muted/70",
          ].join(" ")}
        >
          Main
          <span className={[
            "ml-1.5 px-1.5 py-0.5 rounded-full text-xs",
            subTab === "main"
              ? "bg-background/20 text-background"
              : "bg-background text-foreground",
          ].join(" ")}>
            {mainTasks.length}
          </span>
        </button>
        <button
          onClick={() => setSubTab("overdue")}
          className={[
            "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
            subTab === "overdue"
              ? "bg-destructive text-destructive-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/70",
          ].join(" ")}
        >
          Overdue
          <span className={[
            "ml-1.5 px-1.5 py-0.5 rounded-full text-xs",
            subTab === "overdue"
              ? "bg-destructive-foreground/20 text-destructive-foreground"
              : overdueTasks.length > 0
                ? "bg-destructive text-destructive-foreground"
                : "bg-background text-foreground",
          ].join(" ")}>
            {overdueTasks.length}
          </span>
        </button>
      </div>

      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        priority={priority}
        onPriority={setPriority}
        sortBy={sortBy}
        onSortBy={setSortBy}
        sortOptions={DELEGATE_SORT_OPTIONS}
      />

      <TaskGrid
        tasks={sorted}
        actionLabel="Process"
        hrefBuilder={(task) => `/delegate/${task.notion_page_id}/process`}
        emptyMessage={
          search || priority !== "all"
            ? "No tasks match your filters"
            : subTab === "overdue"
              ? "No overdue tasks"
              : "No tasks to delegate"
        }
      />
    </div>
  )
}

// ─── To Review tab ─────────────────────────────────────────────────────────────

function ToReviewTab() {
  const { data: rawTasks, isLoading } = useNotionTasks("to_review")
  const [search, setSearch] = useState("")
  const [priority, setPriority] = useState<Priority>("all")
  const [sortBy, setSortBy] = useState<ReviewSortBy>("updated_desc")

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const filtered = applySearchFilter(rawTasks ?? [], search, priority)
  const sorted = applyReviewSort(filtered, sortBy)

  return (
    <div>
      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        priority={priority}
        onPriority={setPriority}
        sortBy={sortBy}
        onSortBy={setSortBy}
        sortOptions={REVIEW_SORT_OPTIONS}
      />
      <TaskGrid
        tasks={sorted}
        actionLabel="Review"
        hrefBuilder={(task) => `/delegate/${task.notion_page_id}/review`}
        emptyMessage={search || priority !== "all" ? "No tasks match your filters" : "No tasks to review"}
      />
    </div>
  )
}

// ─── In Progress tab ───────────────────────────────────────────────────────────

function InProgressTab() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", "running"],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, created_at, updated_at")
        .eq("status", "running")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Loader2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground text-sm">No projects currently running</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <Card key={project.id} className="flex flex-col hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold leading-snug line-clamp-2">
              {project.name}
            </CardTitle>
            <div className="flex gap-2 pt-1">
              <Badge variant="default">Running</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 flex-1 justify-between">
            <p className="text-sm text-muted-foreground">
              Started{" "}
              {new Date(project.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <Link href={`/jobs/${project.id}`}>
              <Button className="w-full" size="sm" variant="outline">
                View Job
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Stats tab ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:     { label: "Draft",     color: "bg-muted" },
  assigned:  { label: "Assigned",  color: "bg-blue-500" },
  running:   { label: "Running",   color: "bg-yellow-500" },
  completed: { label: "Completed", color: "bg-green-500" },
  failed:    { label: "Failed",    color: "bg-red-500" },
}

function StatCard({
  value,
  label,
  icon: Icon,
  loading,
}: {
  value: number | undefined
  label: string
  icon: React.ElementType
  loading: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-6 pb-5 flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <span className="text-4xl font-bold tabular-nums">
            {loading ? (
              <span className="inline-block h-10 w-12 bg-muted animate-pulse rounded" />
            ) : (
              (value ?? 0)
            )}
          </span>
          <Icon className="h-5 w-5 text-muted-foreground mt-1" />
        </div>
        <p className="text-sm text-muted-foreground leading-snug">{label}</p>
      </CardContent>
    </Card>
  )
}

function StatsTab() {
  const now = new Date()

  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1)
  startOfWeek.setHours(0, 0, 0, 0)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const sowISO = startOfWeek.toISOString()
  const somISO = startOfMonth.toISOString()

  const { data: delegatedThisWeek, isLoading: l1 } = useQuery({
    queryKey: ["stats", "delegated_week", sowISO],
    queryFn: async () => {
      const supabase = createClient()
      const { count, error } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .not("notion_id", "is", null)
        .gt("created_at", sowISO)
        .is("deleted_at", null)
      if (error) throw error
      return count ?? 0
    },
  })

  const { data: completedThisWeek, isLoading: l2 } = useQuery({
    queryKey: ["stats", "completed_week", sowISO],
    queryFn: async () => {
      const supabase = createClient()
      const { count, error } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .gt("updated_at", sowISO)
        .is("deleted_at", null)
      if (error) throw error
      return count ?? 0
    },
  })

  const { data: delegatedThisMonth, isLoading: l3 } = useQuery({
    queryKey: ["stats", "delegated_month", somISO],
    queryFn: async () => {
      const supabase = createClient()
      const { count, error } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .not("notion_id", "is", null)
        .gt("created_at", somISO)
        .is("deleted_at", null)
      if (error) throw error
      return count ?? 0
    },
  })

  const { data: activeProjects, isLoading: l4 } = useQuery({
    queryKey: ["stats", "active_projects"],
    queryFn: async () => {
      const supabase = createClient()
      const { count, error } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("status", "running")
        .is("deleted_at", null)
      if (error) throw error
      return count ?? 0
    },
  })

  const { data: tasksByStatus, isLoading: l5 } = useQuery({
    queryKey: ["stats", "tasks_by_status"],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("tasks")
        .select("status")
        .is("deleted_at", null)
      if (error) throw error
      const counts: Record<string, number> = {}
      for (const row of data ?? []) {
        const s = row.status ?? "draft"
        counts[s] = (counts[s] ?? 0) + 1
      }
      return counts
    },
  })

  const totalTasks = Object.values(tasksByStatus ?? {}).reduce((a, b) => a + b, 0)
  const statusOrder = ["draft", "assigned", "running", "completed", "failed"]

  return (
    <div className="space-y-8">
      {/* Stat cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          value={delegatedThisWeek}
          label="Delegated This Week"
          icon={Send}
          loading={l1}
        />
        <StatCard
          value={completedThisWeek}
          label="Completed This Week"
          icon={CheckCircle2}
          loading={l2}
        />
        <StatCard
          value={delegatedThisMonth}
          label="Delegated This Month"
          icon={Calendar}
          loading={l3}
        />
        <StatCard
          value={activeProjects}
          label="Active Projects"
          icon={FolderOpen}
          loading={l4}
        />
      </div>

      {/* Tasks by status */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Tasks by Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {l5 ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-20 h-4 bg-muted animate-pulse rounded" />
                  <div className="flex-1 h-6 bg-muted animate-pulse rounded" />
                  <div className="w-8 h-4 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : totalTasks === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No tasks yet</p>
          ) : (
            <div className="space-y-3">
              {statusOrder.map((status) => {
                const count = tasksByStatus?.[status] ?? 0
                const pct = totalTasks > 0 ? (count / totalTasks) * 100 : 0
                const cfg = STATUS_CONFIG[status] ?? { label: status, color: "bg-muted" }
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-muted-foreground text-right shrink-0">
                      {cfg.label}
                    </span>
                    <div className="flex-1 h-6 bg-muted/40 rounded overflow-hidden">
                      {pct > 0 && (
                        <div
                          className={`h-full rounded ${cfg.color} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      )}
                    </div>
                    <span className="w-8 text-xs tabular-nums text-right shrink-0">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Sync button ───────────────────────────────────────────────────────────────

function SyncButton() {
  const queryClient = useQueryClient()
  const syncMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const resp = await fetch("/api/notion/sync", {
        method: "POST",
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      })
      if (!resp.ok) throw new Error("Sync failed")
      return resp.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notion-tasks"] })
    },
  })

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => syncMutation.mutate()}
      disabled={syncMutation.isPending}
    >
      <RefreshCw className={`h-4 w-4 mr-1 ${syncMutation.isPending ? "animate-spin" : ""}`} />
      {syncMutation.isPending
        ? "Syncing..."
        : syncMutation.isSuccess && (syncMutation.data as { synced?: number })?.synced != null
          ? `Synced ${(syncMutation.data as { synced: number }).synced} tasks`
          : "Sync Now"}
    </Button>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DelegatePage() {
  return (
    <PageContainer
      title="Delegate"
      description="Process tasks from Notion"
      action={<SyncButton />}
    >
      <Tabs defaultValue="to_delegate">
        <TabsList className="mb-6">
          <TabsTrigger value="to_delegate">To Delegate</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="to_review">To Review</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="to_delegate">
          <ToDelegateTab />
        </TabsContent>

        <TabsContent value="in_progress">
          <InProgressTab />
        </TabsContent>

        <TabsContent value="to_review">
          <ToReviewTab />
        </TabsContent>

        <TabsContent value="stats">
          <StatsTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
