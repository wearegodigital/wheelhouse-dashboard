import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { TaskSummary, TaskFilters } from "@/types"

export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      const supabase = createClient()

      // Determine sort column and order
      const sortBy = filters?.sortBy || "created_at"
      const sortOrder = filters?.sortOrder || "desc"

      let query = supabase
        .from("task_summary")
        .select("*")
        .order(sortBy, { ascending: sortOrder === "asc" })

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
      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom)
      }
      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo)
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
