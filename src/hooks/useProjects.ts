import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { deleteProject as deleteProjectApi } from "@/lib/api/wheelhouse"
import type { ProjectSummary, ProjectFilters } from "@/types"

export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: ["projects", filters],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from("project_summary")
        .select("*")
        .order("created_at", { ascending: false })

      if (filters?.status) {
        query = query.eq("status", filters.status)
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as ProjectSummary[]
    },
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; repo_url?: string; team_id?: string }) => {
      const supabase = createClient()
      const { data: project, error } = await supabase
        .from("projects")
        .insert(data as never)
        .select()
        .single()
      if (error) throw error
      return project
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; status?: string; repo_url?: string }) => {
      const supabase = createClient()
      const { data: project, error } = await supabase
        .from("projects")
        .update(data as never)
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return project
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["project", variables.id] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Use Modal API for deletion to ensure JSONL sync
      const result = await deleteProjectApi(id, true)
      if (!result.success) {
        throw new Error(result.message || "Failed to delete project")
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}
