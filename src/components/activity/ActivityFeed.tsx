"use client"

import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import Link from "next/link"
import {
  Plus,
  Pencil,
  Trash2,
  Play,
  Check,
  X,
  MessageSquare,
  User,
  Loader2,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CyberpunkSpinner } from "@/components/ui/cyberpunk-spinner"
import {
  useActivityFeed,
  getActivityDescription,
  getActivityColor,
  type ActivityWithUser,
} from "@/hooks/useActivityFeed"
import { cn } from "@/lib/utils"
import type { ActivityLog } from "@/lib/supabase/types"

function ActivityIcon({ action, className }: { action: ActivityLog["action"]; className?: string }) {
  switch (action) {
    case "created":
      return <Plus className={className} />
    case "updated":
      return <Pencil className={className} />
    case "deleted":
      return <Trash2 className={className} />
    case "started":
      return <Play className={className} />
    case "completed":
      return <Check className={className} />
    case "failed":
      return <X className={className} />
    case "commented":
      return <MessageSquare className={className} />
    default:
      return <Pencil className={className} />
  }
}

interface ActivityFeedProps {
  limit?: number
  entityType?: "project" | "sprint" | "task" | "comment"
  entityId?: string
  showHeader?: boolean
  className?: string
}

export function ActivityFeed({
  limit = 50,
  entityType,
  entityId,
  showHeader = true,
  className,
}: ActivityFeedProps) {
  const { data: activities = [], isLoading } = useActivityFeed({
    limit,
    entityType,
    entityId,
  })

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            {activities.length > 0
              ? `Showing ${activities.length} recent activities`
              : "Team activity will appear here"}
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={cn(!showHeader && "pt-6")}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <CyberpunkSpinner size="md" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </p>
        ) : (
          <div className="space-y-1">
            {activities.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                isLast={index === activities.length - 1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ActivityItemProps {
  activity: ActivityWithUser
  isLast?: boolean
}

function ActivityItem({ activity, isLast }: ActivityItemProps) {
  const colorClass = getActivityColor(activity.action)
  const description = getActivityDescription(activity)

  const entityLink = getEntityLink(activity)

  return (
    <div className="flex gap-3 py-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            "bg-muted"
          )}
        >
          {activity.user?.avatar_url ? (
            <Image
              src={activity.user.avatar_url}
              alt=""
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <User className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-muted mt-2" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-start gap-2">
          <div className={cn("mt-1", colorClass)}>
            <ActivityIcon action={activity.action} className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              {entityLink ? (
                <Link href={entityLink} className="hover:underline">
                  {description}
                </Link>
              ) : (
                description
              )}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </span>
              <Badge variant="outline" className="text-xs">
                {activity.entity_type}
              </Badge>
            </div>
            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                {formatMetadata(activity.metadata)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getEntityLink(activity: ActivityWithUser): string | null {
  switch (activity.entity_type) {
    case "project":
      return `/projects/${activity.entity_id}`
    case "sprint":
      return `/sprints/${activity.entity_id}`
    case "task":
      return `/tasks/${activity.entity_id}`
    default:
      return null
  }
}

function formatMetadata(metadata: Record<string, unknown>): string | null {
  const parts: string[] = []

  if (metadata.old_status && metadata.new_status) {
    parts.push(`Status: ${metadata.old_status} → ${metadata.new_status}`)
  }

  if (metadata.changes && Array.isArray(metadata.changes)) {
    parts.push(`Changed: ${metadata.changes.join(", ")}`)
  }

  return parts.length > 0 ? parts.join(" | ") : null
}

// Compact version for sidebars or smaller spaces
export function ActivityFeedCompact({
  limit = 10,
  className,
}: {
  limit?: number
  className?: string
}) {
  const { data: activities = [], isLoading } = useActivityFeed({ limit })

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-4", className)}>
        <CyberpunkSpinner size="sm" />
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <p className={cn("text-xs text-muted-foreground text-center py-4", className)}>
        No recent activity
      </p>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {activities.map((activity) => {
        const colorClass = getActivityColor(activity.action)
        const entityLink = getEntityLink(activity)

        return (
          <div key={activity.id} className="flex items-start gap-2 text-xs">
            <div className={cn("mt-0.5", colorClass)}>
              <ActivityIcon action={activity.action} className="h-3 w-3" />
            </div>
            <div className="flex-1 min-w-0">
              {entityLink ? (
                <Link href={entityLink} className="hover:underline truncate block">
                  {activity.entity_name || activity.entity_type}
                </Link>
              ) : (
                <span className="truncate block">
                  {activity.entity_name || activity.entity_type}
                </span>
              )}
              <span className="text-muted-foreground">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
