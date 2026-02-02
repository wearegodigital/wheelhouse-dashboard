/**
 * Wheelhouse API Client
 *
 * Handles deletion operations through the Next.js API route which
 * proxies to Modal API for proper event sourcing and JSONL/Supabase sync.
 */

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

type EntityType = "projects" | "sprints" | "tasks"

async function deleteEntity(
  entityType: EntityType,
  id: string,
  cascade: boolean = false
): Promise<DeleteResponse> {
  const params = new URLSearchParams({
    type: entityType,
    id: id,
  })
  if (cascade) params.append("cascade", "true")

  const response = await fetch(`/api/delete?${params.toString()}`, {
    method: "DELETE",
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

export const deleteProject = (id: string, cascade = true) => deleteEntity("projects", id, cascade)
export const deleteSprint = (id: string, cascade = true) => deleteEntity("sprints", id, cascade)
export const deleteTask = (id: string) => deleteEntity("tasks", id)
