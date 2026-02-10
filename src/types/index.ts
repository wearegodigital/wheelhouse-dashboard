// Re-export database types
export * from "@/lib/supabase/types"

// Re-export contract types used by components
export type {
  TaskRecommendation,
  SprintRecommendation,
  ProjectRecommendation,
  ExecutionConfig,
  SwarmConfig,
  ActionTaken,
  PlanningSessionSummary,
  TaskStatusDetail,
  SprintStatusDetail,
  ExecutionStatusResponse,
} from "@/contract/wheelhouse-contract"

// Import specific types for use in this file
import type { ExecutionPattern, DistributionMode } from "@/lib/supabase/types"
import type { SprintRecommendation, TaskRecommendation } from "@/contract/wheelhouse-contract"

// Planning Chat types (UI wrapper — not in contract)
export interface DecompositionRecommendation {
  sprints?: SprintRecommendation[]
  tasks?: TaskRecommendation[]
}

export interface ChatMessage {
  id: string
  role: "user" | "orchestrator" | "system"
  content: string
  recommendations?: DecompositionRecommendation
  createdAt: string
}

// Execution types
export interface ExecutionRequest {
  level: "project" | "sprint" | "task"
  id: string
  action: "run" | "pause" | "cancel"
  pattern?: ExecutionPattern
  distribution?: DistributionMode
  workers?: number
  patternConfig?: Record<string, unknown>
}

export interface ExecutionStatus {
  id: string
  level: "project" | "sprint" | "task"
  status: "pending" | "running" | "paused" | "completed" | "failed" | "cancelled"
  progress: number
  startedAt: string | null
  completedAt: string | null
  error: string | null
}

// Filter types
export interface TaskFilters {
  status?: import("@/lib/supabase/types").TaskStatus
  projectId?: string
  sprintId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: "created_at" | "updated_at" | "status" | "progress"
  sortOrder?: "asc" | "desc"
}

export interface ProjectFilters {
  status?: import("@/lib/supabase/types").ProjectStatus
  search?: string
}

// Pagination
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
