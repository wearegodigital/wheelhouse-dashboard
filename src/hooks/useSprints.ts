import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { deleteSprint as deleteSprintApi } from '@/lib/api/wheelhouse'
import type { SprintSummary } from '@/lib/supabase/types'

export function useSprints(projectId: string) {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('sprint_summary')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('order_index')

      if (error) throw error
      return data as SprintSummary[]
    },
    enabled: !!projectId,
  })
}

export function useSprint(id: string) {
  return useQuery({
    queryKey: ['sprint', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateSprint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { project_id: string; name: string; description?: string; order_index?: number }) => {
      const supabase = createClient()
      const { data: sprint, error } = await supabase
        .from("sprints")
        .insert(data as never)
        .select()
        .single()
      if (error) throw error
      return sprint
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sprints", variables.project_id] })
    },
  })
}

export function useUpdateSprint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; status?: string; order_index?: number }) => {
      const supabase = createClient()
      const { data: sprint, error } = await supabase
        .from("sprints")
        .update(data as never)
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return sprint
    },
    onSuccess: async (_, variables) => {
      // Get the sprint to find its project_id for cache invalidation
      const supabase = createClient()
      const { data: sprint } = await supabase
        .from("sprints")
        .select("project_id")
        .eq("id", variables.id)
        .single<{ project_id: string }>()
      if (sprint) {
        queryClient.invalidateQueries({ queryKey: ["sprints", sprint.project_id] })
      }
      queryClient.invalidateQueries({ queryKey: ["sprint", variables.id] })
    },
  })
}

export function useDeleteSprint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      // Use Modal API for deletion to ensure JSONL sync
      const result = await deleteSprintApi(id, true)
      if (!result.success) {
        throw new Error(result.message || "Failed to delete sprint")
      }
      return { result, projectId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sprints", data.projectId] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}
