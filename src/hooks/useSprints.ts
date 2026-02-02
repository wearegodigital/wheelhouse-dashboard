import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { SprintSummary } from '@/lib/supabase/types'

export function useSprints(projectId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sprint_summary')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index')

      if (error) throw error
      return data as SprintSummary[]
    },
    enabled: !!projectId,
  })
}

export function useSprint(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['sprint', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('id', id)
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
    mutationFn: async (id: string) => {
      const supabase = createClient()
      // Get project_id before delete for cache invalidation
      const { data: sprint } = await supabase
        .from("sprints")
        .select("project_id")
        .eq("id", id)
        .single<{ project_id: string }>()
      const { error } = await supabase
        .from("sprints")
        .delete()
        .eq("id", id)
      if (error) throw error
      return sprint?.project_id
    },
    onSuccess: (projectId) => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["sprints", projectId] })
      }
    },
  })
}
