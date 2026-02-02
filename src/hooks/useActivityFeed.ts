import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { fetchUserMap, type UserInfo } from "@/lib/supabase/users"
import type { ActivityLog } from "@/lib/supabase/types"

export interface ActivityWithUser extends ActivityLog {
  user?: UserInfo
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

      let query = supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (teamId) {
        query = query.eq("team_id", teamId)
      }
      if (entityType) {
        query = query.eq("entity_type", entityType)
      }
      if (entityId) {
        query = query.eq("entity_id", entityId)
      }

      const { data: activities, error } = await query

      if (error) throw error

      const typedActivities = (activities || []) as ActivityLog[]
      const userMap = await fetchUserMap(
        supabase,
        typedActivities.map((a) => a.user_id)
      )

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

// Helper to get action color
export function getActivityColor(action: ActivityLog["action"]): string {
  switch (action) {
    case "created":
      return "text-green-500"
    case "updated":
      return "text-blue-500"
    case "deleted":
    case "failed":
      return "text-red-500"
    case "started":
      return "text-purple-500"
    case "completed":
      return "text-emerald-500"
    case "commented":
      return "text-amber-500"
    default:
      return "text-gray-500"
  }
}
