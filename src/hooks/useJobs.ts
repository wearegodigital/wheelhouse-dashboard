"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export interface Job {
  id: string
  plan_id: string | null
  project_id: string | null
  notion_task_id: string | null
  repo_url: string
  status: string
  execution_pattern: string
  distribution_mode: string
  workers: number
  task_breakdown: Record<string, unknown> | null
  progress: Record<string, unknown> | null
  error: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export function useJobs(status?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ["jobs", status],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from("jobs")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
      if (status) query = query.eq("status", status)
      const { data, error } = await query
      if (error) throw error
      return (data || []) as Job[]
    },
    refetchInterval: 5_000,
  })
}

export function useJob(jobId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single()
      if (error) throw error
      return data as Job
    },
    refetchInterval: (query) => {
      const job = query.state.data as Job | undefined
      return job?.status === "running" ? 3_000 : 10_000
    },
  })
}
