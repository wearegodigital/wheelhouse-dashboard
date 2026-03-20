import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchBlockers, resolveBlocker, dismissBlocker } from '@/lib/api/blockers'
import type { BlockerListItem, ResolveBlockerResponse } from '@/contract/wheelhouse-contract'

export function useBlockers(filters: {
  projectId?: string
  taskId?: string
  sprintId?: string
  status?: string
} = {}) {
  return useQuery<BlockerListItem[]>({
    queryKey: ['blockers', filters],
    queryFn: () => fetchBlockers(filters),
    enabled: !!(filters.projectId || filters.taskId || filters.sprintId),
  })
}

export function useOpenBlockers(projectId: string) {
  return useBlockers({ projectId, status: 'open' })
}

export function useResolveBlocker() {
  const queryClient = useQueryClient()
  return useMutation<ResolveBlockerResponse, Error, { blockerId: string; resolution: string }>({
    mutationFn: ({ blockerId, resolution }) => resolveBlocker(blockerId, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockers'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['sprints'] })
    },
  })
}

export function useDismissBlocker() {
  const queryClient = useQueryClient()
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (blockerId) => dismissBlocker(blockerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockers'] })
    },
  })
}
