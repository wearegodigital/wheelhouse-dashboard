import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export function usePlans(projectId: string) {
  return useQuery({
    queryKey: ["plans", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/plans?projectId=${projectId}`)
      if (!res.ok) throw new Error("Failed to fetch plans")
      const data = await res.json()
      return data.plans as Plan[]
    },
    enabled: !!projectId,
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

export interface Plan {
  id: string
  project_id: string
  status: string
  conversation_id: string | null
  recommendation: Record<string, unknown> | null
  decline_reason: string | null
  created_at: string | null
  updated_at: string | null
  approved_at: string | null
}
