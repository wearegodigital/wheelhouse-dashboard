import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { deleteTask as deleteTaskApi } from "@/lib/api/wheelhouse"
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

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      description: string
      project_id?: string
      sprint_id?: string
      team_id?: string
      repo_url?: string
      status?: string
      mode?: string
    }) => {
      const supabase = createClient()
      const { data: task, error } = await supabase
        .from("tasks")
        .insert({ status: "pending", mode: "sequential", ...data } as never)
        .select()
        .single()
      if (error) throw error
      return task
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      if (variables.project_id) {
        queryClient.invalidateQueries({ queryKey: ["tasks", { projectId: variables.project_id }] })
      }
      if (variables.sprint_id) {
        queryClient.invalidateQueries({ queryKey: ["tasks", { sprintId: variables.sprint_id }] })
      }
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string
      description?: string
      status?: string
      mode?: string
      progress?: number
    }) => {
      const supabase = createClient()
      const { data: task, error } = await supabase
        .from("tasks")
        .update(data as never)
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return task
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Use Modal API for deletion to ensure JSONL sync
      const result = await deleteTaskApi(id)
      if (!result.success) {
        throw new Error(result.message || "Failed to delete task")
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}
