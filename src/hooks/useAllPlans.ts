"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { Plan } from "./usePlans"

export function useAllPlans(status?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ["all-plans", status],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from("plans")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
      if (status) {
        query = query.eq("status", status)
      }
      const { data, error } = await query
      if (error) throw error
      return (data || []) as Plan[]
    },
    refetchInterval: 3_000, // 3s for responsive updates (direct Supabase is fast)
  })
}

export function usePlanReviewCount() {
  const supabase = createClient()
  return useQuery({
    queryKey: ["plan-review-count"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count, error } = await (supabase as any)
        .from("plans")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending_review")
        .is("deleted_at", null)
      if (error) return 0
      return count || 0
    },
    refetchInterval: 10_000, // 10s for badge count
  })
}
