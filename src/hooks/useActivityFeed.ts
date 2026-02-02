import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { ActivityLog, User } from "@/lib/supabase/types"

export interface ActivityWithUser extends ActivityLog {
  user?: Pick<User, "id" | "email" | "display_name" | "avatar_url">
}

interface UseActivityFeedOptions {
  limit?: number
  entityType?: "project" | "sprint" | "task" | "comment"
  entityId?: string
}

export function useActivityFeed(options: UseActivityFeedOptions = {}) {
  const { limit = 50, entityType, entityId } = options

  return useQuery({
    queryKey: ["activity-feed", { limit, entityType, entityId }],
    queryFn: async () => {
      const supabase = createClient()

      // Get current user's team
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return []

      const { data: userData } = await supabase
        .from("users")
        .select("team_id")
        .eq("id", user.id)
        .single()

      const teamId = (userData as { team_id: string | null } | null)?.team_id

      // Build query
      let query = supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      // Filter by team if user has one
      if (teamId) {
        query = query.eq("team_id", teamId)
      }

      // Filter by entity type if provided
      if (entityType) {
        query = query.eq("entity_type", entityType)
      }

      // Filter by entity ID if provided
      if (entityId) {
        query = query.eq("entity_id", entityId)
      }

      const { data: activities, error } = await query

      if (error) throw error

      // Fetch user info for each activity
      const typedActivities = (activities || []) as ActivityLog[]
      const userIds = [...new Set(typedActivities.map((a) => a.user_id).filter(Boolean))] as string[]
      const { data: users } = await supabase
        .from("users")
        .select("id, email, display_name, avatar_url")
        .in("id", userIds)

      type UserInfo = Pick<User, "id" | "email" | "display_name" | "avatar_url">
      const userMap = new Map(((users || []) as UserInfo[]).map((u) => [u.id, u]))

      return typedActivities.map((activity) => ({
        ...activity,
        user: activity.user_id ? userMap.get(activity.user_id) : undefined,
      })) as ActivityWithUser[]
    },
  })
}

// Helper to get human-readable action descriptions
export function getActivityDescription(activity: ActivityWithUser): string {
  const userName = activity.user?.display_name || activity.user?.email || "Someone"
  const entityName = activity.entity_name || activity.entity_type

  switch (activity.action) {
    case "created":
      return `${userName} created ${activity.entity_type} "${entityName}"`
    case "updated":
      return `${userName} updated ${activity.entity_type} "${entityName}"`
    case "deleted":
      return `${userName} deleted ${activity.entity_type} "${entityName}"`
    case "started":
      return `${userName} started ${activity.entity_type} "${entityName}"`
    case "completed":
      return `${userName} completed ${activity.entity_type} "${entityName}"`
    case "failed":
      return `${activity.entity_type} "${entityName}" failed`
    case "commented":
      return `${userName} commented on ${activity.entity_type} "${entityName}"`
    default:
      return `${userName} performed action on ${activity.entity_type}`
  }
}

// Helper to get action icon name
export function getActivityIcon(
  action: ActivityLog["action"]
): "plus" | "pencil" | "trash" | "play" | "check" | "x" | "message-square" {
  switch (action) {
    case "created":
      return "plus"
    case "updated":
      return "pencil"
    case "deleted":
      return "trash"
    case "started":
      return "play"
    case "completed":
      return "check"
    case "failed":
      return "x"
    case "commented":
      return "message-square"
    default:
      return "pencil"
  }
}

// Helper to get action color
export function getActivityColor(action: ActivityLog["action"]): string {
  switch (action) {
    case "created":
      return "text-green-500"
    case "updated":
      return "text-blue-500"
    case "deleted":
      return "text-red-500"
    case "started":
      return "text-purple-500"
    case "completed":
      return "text-emerald-500"
    case "failed":
      return "text-red-500"
    case "commented":
      return "text-amber-500"
    default:
      return "text-gray-500"
  }
}
