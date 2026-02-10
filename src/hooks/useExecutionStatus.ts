import { useQuery } from "@tanstack/react-query"
import type { ExecutionStatusResponse } from "@/contract/wheelhouse-contract"

const TERMINAL_STATUSES = ["completed", "failed", "cancelled", "complete"]
const POLL_INTERVAL_MS = 3000

export function useExecutionStatus(entityId: string | null, enabled = false) {
  return useQuery<ExecutionStatusResponse>({
    queryKey: ["execution-status", entityId],
    queryFn: async () => {
      const response = await fetch(`/api/execute/status/${entityId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch execution status")
      }
      return response.json()
    },
    enabled: enabled && !!entityId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (data && TERMINAL_STATUSES.includes(data.status)) {
        return false
      }
      return POLL_INTERVAL_MS
    },
    refetchIntervalInBackground: false,
    staleTime: 1000,
  })
}
