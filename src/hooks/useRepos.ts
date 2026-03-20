import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { createRepo as createRepoApi, deleteRepo as deleteRepoApi, updateEntity } from "@/lib/api/wheelhouse"
import type { Repo } from "@/lib/supabase/types"

export interface RepoFilters {
  client_id?: string
  search?: string
}

export function useRepos(filters?: RepoFilters) {
  return useQuery({
    queryKey: ["repos", filters],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from("repos")
        .select("*")
        .is("deleted_at", null)
        .order("name", { ascending: true })
      if (filters?.client_id) query = query.eq("client_id", filters.client_id)
      if (filters?.search) query = query.ilike("name", `%${filters.search}%`)
      const { data, error } = await query
      if (error) throw error
      return data as Repo[]
    },
  })
}

export function useRepo(id: string) {
  return useQuery({
    queryKey: ["repo", id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("repos")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single()
      if (error) throw error
      return data as Repo
    },
    enabled: !!id,
  })
}

export function useCreateRepo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; client_id?: string; github_org?: string; github_repo?: string; default_branch?: string; repo_url?: string; description?: string }) => {
      const result = await createRepoApi(data)
      if (!result.success) throw new Error(result.message || "Failed to create repo")
      return result
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["repos"] }) },
  })
}

export function useUpdateRepo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; client_id?: string; github_org?: string; github_repo?: string; default_branch?: string; repo_url?: string; description?: string }) => {
      return updateEntity("repos", id, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["repos"] })
      queryClient.invalidateQueries({ queryKey: ["repo", variables.id] })
    },
  })
}

export function useDeleteRepo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const result = await deleteRepoApi(id)
      if (!result.success) throw new Error(result.message || "Failed to delete repo")
      return result
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["repos"] }) },
  })
}
