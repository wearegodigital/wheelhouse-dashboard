import type { User } from "./types"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * User info subset commonly needed for display (avatar, name).
 */
export type UserInfo = Pick<User, "id" | "email" | "display_name" | "avatar_url">

/**
 * Fetch user info for a list of user IDs and return as a Map.
 * Deduplicates IDs and handles empty arrays gracefully.
 */
export async function fetchUserMap(
  supabase: SupabaseClient,
  userIds: (string | null | undefined)[]
): Promise<Map<string, UserInfo>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))] as string[]

  if (uniqueIds.length === 0) {
    return new Map()
  }

  const { data: users } = await supabase
    .from("users")
    .select("id, email, display_name, avatar_url")
    .in("id", uniqueIds)

  return new Map(((users || []) as UserInfo[]).map((u) => [u.id, u]))
}
