/**
 * Wheelhouse API Client
 *
 * Handles CRUD operations through the Next.js API routes which
 * proxy to Modal API for proper event sourcing and JSONL/Supabase sync.
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

export interface CreateResponse {
  success: boolean
  message: string
  id?: string  // Supabase UUID for navigation
  project_id?: string
  sprint_id?: string
  task_id?: string
  supabase_id?: string
  error?: string
}

type EntityType = "projects" | "sprints" | "tasks"

// =============================================================================
// DELETE Operations
// =============================================================================

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

// =============================================================================
// CREATE Operations
// =============================================================================

async function createEntity(
  entityType: EntityType,
  data: Record<string, unknown>
): Promise<CreateResponse> {
  const response = await fetch(`/api/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: entityType, ...data }),
  })

  const result = await response.json()

  if (!response.ok) {
    const error = new Error(result.message || `API error: ${response.status}`) as Error & {
      code?: string
      status?: number
    }
    error.code = result.error
    error.status = response.status
    throw error
  }

  return result
}

export const createProject = (data: {
  name: string
  description?: string
  repo_url?: string
}) => createEntity("projects", data)

export const createSprint = (data: {
  project_id: string
  name: string
  description?: string
  order_index?: number
}) => createEntity("sprints", data)

export const createTask = (data: {
  title: string
  description?: string
  repo_url: string
  sprint_id?: string
}) => createEntity("tasks", data)
