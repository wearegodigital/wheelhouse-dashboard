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

type EntityType = "projects" | "sprints" | "tasks"

async function deleteEntity(
  entityType: EntityType,
  id: string,
  cascade: boolean = false
): Promise<DeleteResponse> {
  const params = new URLSearchParams()
  if (cascade) params.append("cascade", "true")
  const query = params.toString()
  return callWheelhouseAPI("DELETE", `/${entityType}/${id}${query ? `?${query}` : ""}`)
}

export const deleteProject = (id: string, cascade = true) => deleteEntity("projects", id, cascade)
export const deleteSprint = (id: string, cascade = true) => deleteEntity("sprints", id, cascade)
export const deleteTask = (id: string) => deleteEntity("tasks", id)
