/**
 * Wheelhouse API Client
 *
 * Handles CRUD operations through the Next.js API routes which
 * proxy to Modal API for proper event sourcing and JSONL/Supabase sync.
 */

export interface DeleteResponse {
  success: boolean
  message: string
  cascade_deleted?: Record<string, number>
  deleted_at?: string
  error?: string
}

export interface CreateResponse {
  success: boolean
  message: string
  id: string  // Supabase UUID for navigation (primary identifier)
  job_id?: string
  sprint_id?: string
  task_id?: string
  supabase_id?: string
  error?: string
}

type EntityType = "sprints" | "tasks" | "plans" | "jobs"

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

export const deleteJob = (id: string, cascade = true) => deleteEntity("jobs", id, cascade)
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

// =============================================================================
// UPDATE Operations
// =============================================================================

export async function updateEntity(type: EntityType, id: string, data: Record<string, unknown>) {
  const response = await fetch("/api/update", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, id, ...data }),
  })
  const result = await response.json()
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Update failed")
  }
  return result
}

// =============================================================================
// CREATE Operations (entity-specific)
// =============================================================================

export const createJob = (data: {
  name: string
  description?: string
  repo_url?: string
  default_branch?: string
  plan_id?: string
  planning_rigor?: string
  task_granularity?: string
  notion_id?: string
}) => createEntity("jobs", data)

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
