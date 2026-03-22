import { useQuery } from "@tanstack/react-query"
import type { Plan } from "./usePlans"

export function useAllPlans(status?: string) {
  return useQuery({
    queryKey: ["all-plans", status],
    queryFn: async () => {
      const url = status ? `/api/plans/all?status=${status}` : "/api/plans/all"
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch plans")
      const data = await res.json()
      return data.plans as Plan[]
    },
    refetchInterval: 10_000,
  })
}

export function usePlanReviewCount() {
  return useQuery({
    queryKey: ["plan-review-count"],
    queryFn: async () => {
      const res = await fetch("/api/plans/count?status=pending_review")
      if (!res.ok) return 0
      const data = await res.json()
      return data.count as number
    },
    refetchInterval: 30_000,
  })
}


