/**
 * Wheelhouse Modal API Client
 *
 * Handles deletion operations through the Modal API to ensure
 * proper event sourcing and JSONL/Supabase sync.
 */

const WHEELHOUSE_API_BASE = process.env.NEXT_PUBLIC_MODAL_API_URL || ""

export interface DeleteResponse {
  success: boolean
  message: string
  deleted?: {
    projects?: number
    sprints?: number
    tasks?: number
  }
  deleted_at?: string
  error?: string
  current_status?: string
}

async function callWheelhouseAPI(
  method: string,
  path: string
): Promise<DeleteResponse> {
  const url = `${WHEELHOUSE_API_BASE}${path}`

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  })

  const data = await response.json()

  if (!response.ok) {
    const error = new Error(data.message || `API error: ${response.status}`) as Error & {
      code?: string
      status?: number
    }
    error.code = data.error
    error.status = response.status
    throw error
  }

  return data
}

export async function deleteProject(
  projectId: string,
  cascade: boolean = true
): Promise<DeleteResponse> {
  const params = new URLSearchParams()
  if (cascade) params.append("cascade", "true")

  return callWheelhouseAPI("DELETE", `/projects/${projectId}?${params}`)
}

export async function deleteSprint(
  sprintId: string,
  cascade: boolean = true
): Promise<DeleteResponse> {
  const params = new URLSearchParams()
  if (cascade) params.append("cascade", "true")

  return callWheelhouseAPI("DELETE", `/sprints/${sprintId}?${params}`)
}

export async function deleteTask(taskId: string): Promise<DeleteResponse> {
  return callWheelhouseAPI("DELETE", `/tasks/${taskId}`)
}
