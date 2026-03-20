import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { deleteProject as deleteProjectApi, createProject as createProjectApi, updateEntity } from "@/lib/api/wheelhouse"
import { sanitizeSearch } from "@/lib/utils"
import type { ProjectSummary, ProjectFilters } from "@/types"


export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: ["projects", filters],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from("project_summary")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      if (filters?.status) {
        query = query.eq("status", filters.status)
      }
      if (filters?.search) {
        const search = sanitizeSearch(filters.search)
        if (search) {
          query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
        }
      }
      if (filters?.client_id) {
        query = query.eq("client_id", filters.client_id)
      }
      if (filters?.repo_id) {
        query = query.eq("repo_id", filters.repo_id)
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
        .is("deleted_at", null)
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
    mutationFn: async (data: { name: string; description?: string; repo_url?: string; client_id?: string; repo_id?: string; notion_id?: string; default_branch?: string; planning_rigor?: string; task_granularity?: string }) => {
      const result = await createProjectApi(data)
      if (!result.success) {
        throw new Error(result.message || "Failed to create project")
      }
      return result
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
      return updateEntity("projects", id, data)
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
    mutationFn: async ({ id }: { id: string }) => {
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
