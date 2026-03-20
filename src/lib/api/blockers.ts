import type { BlockerListItem, ResolveBlockerResponse } from "@/contract/wheelhouse-contract"

export async function fetchBlockers(filters: {
  projectId?: string
  sprintId?: string
  taskId?: string
  status?: string
}): Promise<BlockerListItem[]> {
  const params = new URLSearchParams()
  if (filters.projectId) params.set("project_id", filters.projectId)
  if (filters.sprintId) params.set("sprint_id", filters.sprintId)
  if (filters.taskId) params.set("task_id", filters.taskId)
  if (filters.status) params.set("status", filters.status)

  const res = await fetch(`/api/blockers?${params.toString()}`)
  if (!res.ok) throw new Error("Failed to fetch blockers")
  const data = await res.json()
  return data.blockers ?? []
}

export async function resolveBlocker(
  blockerId: string,
  resolution: string
): Promise<ResolveBlockerResponse> {
  const res = await fetch(`/api/blockers/${blockerId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolution }),
  })
  if (!res.ok) throw new Error("Failed to resolve blocker")
  return res.json()
}

export async function dismissBlocker(
  blockerId: string
): Promise<{ success: boolean }> {
  const res = await fetch(`/api/blockers/${blockerId}/dismiss`, {
    method: "POST",
  })
  if (!res.ok) throw new Error("Failed to dismiss blocker")
  return res.json()
}
