import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { TaskSummary, TaskFilters } from "@/types"

export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from("task_summary")
        .select("*")
        .order("created_at", { ascending: false })

      if (filters?.status) {
        query = query.eq("status", filters.status)
      }
      if (filters?.projectId) {
        query = query.eq("project_id", filters.projectId)
      }
      if (filters?.sprintId) {
        query = query.eq("sprint_id", filters.sprintId)
      }
      if (filters?.search) {
        query = query.ilike("description", `%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as TaskSummary[]
    },
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}
