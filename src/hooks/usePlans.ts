import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export interface Plan {
  id: string
  project_id: string | null
  conversation_id: string | null
  status: string
  recommendation: Record<string, unknown> | null
  decline_reason: string | null
  notion_task_id: string | null
  repo_url: string | null
  created_at: string | null
  updated_at: string | null
  approved_at: string | null
  deleted_at: string | null
}

export function usePlans(projectId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ["plans", projectId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("plans")
        .select("*")
        .eq("project_id", projectId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data || []) as Plan[]
    },
    enabled: !!projectId,
    refetchInterval: 5_000,
  })
}

export function useUpdatePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      planId,
      ...body
    }: {
      planId: string
      status?: string
      decline_reason?: string
    }) => {
      const res = await fetch(`/api/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { detail?: string }).detail || "Failed to update plan")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] })
      queryClient.invalidateQueries({ queryKey: ["all-plans"] })
      queryClient.invalidateQueries({ queryKey: ["plan-review-count"] })
    },
  })
}
