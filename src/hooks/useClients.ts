import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { createClient as createClientApi, deleteClient as deleteClientApi, updateEntity } from "@/lib/api/wheelhouse"
import type { Client } from "@/lib/supabase/types"

export interface ClientFilters {
  status?: string
  search?: string
}

export function useClients(filters?: ClientFilters) {
  return useQuery({
    queryKey: ["clients", filters],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from("clients")
        .select("*")
        .is("deleted_at", null)
        .order("name", { ascending: true })
      if (filters?.status) query = query.eq("status", filters.status)
      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`)
      }
      const { data, error } = await query
      if (error) throw error
      return data as Client[]
    },
  })
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single()
      if (error) throw error
      return data as Client
    },
    enabled: !!id,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; status?: string; client_type?: string; notion_id?: string; contact_email?: string; contact_phone?: string }) => {
      const result = await createClientApi(data)
      if (!result.success) throw new Error(result.message || "Failed to create client")
      return result
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["clients"] }) },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; status?: string; client_type?: string; notion_id?: string; contact_email?: string; contact_phone?: string }) => {
      return updateEntity("clients", id, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      queryClient.invalidateQueries({ queryKey: ["client", variables.id] })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const result = await deleteClientApi(id, true)
      if (!result.success) throw new Error(result.message || "Failed to delete client")
      return result
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["clients"] }) },
  })
}
