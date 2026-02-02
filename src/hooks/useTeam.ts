import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { User, Team, TeamInvite, UserRole } from "@/lib/supabase/types"

// Helper to get team_id from current user
async function getCurrentUserTeamId(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("users")
    .select("team_id")
    .eq("id", user.id)
    .single()

  return (data as { team_id: string | null } | null)?.team_id ?? null
}

export function useTeam() {
  return useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const supabase = createClient()
      const teamId = await getCurrentUserTeamId(supabase)
      if (!teamId) return null

      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .single()

      if (error) throw error
      return data as Team
    },
  })
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const supabase = createClient()
      const teamId = await getCurrentUserTeamId(supabase)
      if (!teamId) return []

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: true })

      if (error) throw error
      return data as User[]
    },
  })
}

export function useTeamInvites() {
  return useQuery({
    queryKey: ["team-invites"],
    queryFn: async () => {
      const supabase = createClient()
      const teamId = await getCurrentUserTeamId(supabase)
      if (!teamId) return []

      const { data, error } = await supabase
        .from("team_invites")
        .select("*")
        .eq("team_id", teamId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (error) throw error
      return (data ?? []) as TeamInvite[]
    },
  })
}

export function useCurrentUserRole() {
  return useQuery({
    queryKey: ["current-user-role"],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      if (error) throw error
      return (data as { role: UserRole } | null)?.role ?? null
    },
  })
}

export function useInviteTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: UserRole }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const teamId = await getCurrentUserTeamId(supabase)
      if (!teamId) throw new Error("No team found")

      // Generate a random token for the invite
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 day expiry

      const inviteData = {
        team_id: teamId,
        email: email.toLowerCase(),
        role,
        invited_by: user.id,
        status: "pending" as const,
        token,
        expires_at: expiresAt.toISOString(),
      }

      const { data, error } = await supabase
        .from("team_invites")
        .insert(inviteData as never)
        .select()
        .single()

      if (error) throw error
      return data as TeamInvite
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-invites"] })
    },
  })
}

export function useRevokeInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from("team_invites")
        .update({ status: "revoked" } as never)
        .eq("id", inviteId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-invites"] })
    },
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from("users")
        .update({ role } as never)
        .eq("id", userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] })
    },
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from("users")
        .update({ team_id: null, role: "member" } as never)
        .eq("id", userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] })
    },
  })
}
