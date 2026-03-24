"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2, RotateCcw, GitBranch, CheckSquare, Clock, AlertCircle } from "lucide-react"
import { PageContainer } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

type EntityType = "sprints" | "tasks"

interface TrashedItem {
  id: string
  name: string
  deleted_at: string
  status: string
  entity_type: EntityType
  description?: string | null
}

async function fetchTrashed(): Promise<{ sprints: TrashedItem[]; tasks: TrashedItem[] }> {
  const supabase = createClient()

  const [sprintsRes, tasksRes] = await Promise.all([
    supabase
      .from("sprints")
      .select("id, name, deleted_at, status, description")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("id, title, deleted_at, status, description")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
  ])

  if (sprintsRes.error) throw sprintsRes.error
  if (tasksRes.error) throw tasksRes.error

  function toTrashedItem(
    row: { id: string; deleted_at: string | null; status: string; description?: string | null },
    displayName: string,
    entityType: EntityType
  ): TrashedItem {
    return {
      id: row.id,
      name: displayName,
      deleted_at: row.deleted_at ?? new Date().toISOString(),
      status: row.status,
      entity_type: entityType,
      description: row.description,
    }
  }

  return {
    sprints: (sprintsRes.data ?? []).map((s) => toTrashedItem(s, s.name, "sprints")),
    tasks: (tasksRes.data ?? []).map((t) => toTrashedItem(t, t.title, "tasks")),
  }
}

async function restoreItem(item: TrashedItem): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from(item.entity_type)
    .update({ deleted_at: null, status: "draft" })
    .eq("id", item.id)
  if (error) throw error
}

function formatDeletedAt(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Deleted today"
  if (diffDays === 1) return "Deleted yesterday"
  if (diffDays < 30) return `Deleted ${diffDays} days ago`
  return `Deleted ${date.toLocaleDateString()}`
}

function daysUntilPermanent(dateStr: string): number {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(0, 30 - diffDays)
}

const TAB_CONFIG: { id: EntityType; label: string; icon: React.ReactNode }[] = [
  { id: "sprints", label: "Sprints", icon: <GitBranch className="h-4 w-4" /> },
  { id: "tasks", label: "Tasks", icon: <CheckSquare className="h-4 w-4" /> },
]

function TrashedItemCard({
  item,
  onRestore,
  isRestoring,
}: {
  item: TrashedItem
  onRestore: (item: TrashedItem) => void
  isRestoring: boolean
}) {
  const remaining = daysUntilPermanent(item.deleted_at)
  const isUrgent = remaining <= 3

  return (
    <Card className="group transition-all duration-200 hover:shadow-md [.cyberpunk_&]:hover:shadow-[0_0_12px_hsl(var(--primary)/0.3)] [.cyberpunk_&]:hover:border-primary/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{item.name}</CardTitle>
            {item.description && (
              <CardDescription className="line-clamp-1 mt-0.5">{item.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                isUrgent
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isUrgent ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {remaining}d left
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{formatDeletedAt(item.deleted_at)}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRestore(item)}
              disabled={isRestoring}
              className="h-7 text-xs gap-1.5 [.cyberpunk_&]:hover:border-primary [.cyberpunk_&]:hover:text-primary [.cyberpunk_&]:hover:shadow-[0_0_6px_hsl(var(--primary)/0.3)]"
            >
              <RotateCcw className="h-3 w-3" />
              Restore
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled
              title="Coming soon"
              className="h-7 text-xs gap-1.5 text-destructive/40 hover:text-destructive/40 hover:bg-transparent cursor-not-allowed"
            >
              <Trash2 className="h-3 w-3" />
              Delete forever
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyTrash({ type }: { type: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Trash2 className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-sm">No deleted {type.toLowerCase()}</p>
    </div>
  )
}

export default function TrashPage() {
  const [activeTab, setActiveTab] = useState<EntityType>("sprints")
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ["trash"],
    queryFn: fetchTrashed,
  })

  const restoreMutation = useMutation({
    mutationFn: restoreItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash"] })
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      queryClient.invalidateQueries({ queryKey: ["sprints"] })
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })

  const counts = {
    sprints: data?.sprints.length ?? 0,
    tasks: data?.tasks.length ?? 0,
  }

  const activeItems = data?.[activeTab] ?? []

  return (
    <PageContainer
      title="Trash"
      description="Deleted items are permanently removed after 30 days"
    >
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-6">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm [.cyberpunk_&]:shadow-[0_0_8px_hsl(var(--primary)/0.3)] [.cyberpunk_&]:border [.cyberpunk_&]:border-primary/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
            {counts[tab.id] > 0 && (
              <span
                className={`ml-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "bg-muted-foreground/20 text-muted-foreground"
                }`}
              >
                {counts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2 mt-1" />
              </CardHeader>
              <CardContent>
                <div className="h-7 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mb-3" />
          <p className="text-sm text-muted-foreground">Failed to load trash. Please try again.</p>
        </div>
      ) : activeItems.length === 0 ? (
        <EmptyTrash type={TAB_CONFIG.find((t) => t.id === activeTab)?.label ?? activeTab} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {activeItems.map((item) => (
            <TrashedItemCard
              key={item.id}
              item={item}
              onRestore={(i) => restoreMutation.mutate(i)}
              isRestoring={restoreMutation.isPending}
            />
          ))}
        </div>
      )}
    </PageContainer>
  )
}
