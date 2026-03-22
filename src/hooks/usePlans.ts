import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

const MODAL_API_URL = process.env.NEXT_PUBLIC_MODAL_API_URL || ""

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { createClient } = await import("@/lib/supabase/client")
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  })
}

export function usePlans(projectId: string) {
  return useQuery({
    queryKey: ["plans", projectId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${MODAL_API_URL}/projects/${projectId}/plans`)
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
      const res = await fetchWithAuth(`${MODAL_API_URL}/plans/${planId}`, {
        method: "PATCH",
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
