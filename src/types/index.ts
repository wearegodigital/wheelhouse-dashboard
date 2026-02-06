// Re-export database types
export * from "@/lib/supabase/types"

// Import specific types for use in this file
import type { ExecutionPattern, DistributionMode, PatternConfig, ModelTier } from "@/lib/supabase/types"

// Planning Chat types
export interface DecompositionRecommendation {
  sprints?: SprintRecommendation[]
  tasks?: TaskRecommendation[]
}

export interface SprintRecommendation {
  name: string
  description: string
  tasks: TaskRecommendation[]
}

export interface TaskRecommendation {
  description: string
  estimatedComplexity: "low" | "medium" | "high"
  successCriteria?: string[]
  suggestedFiles?: string[]
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
  patternConfig?: PatternConfig
  modelTier?: ModelTier
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
  status?: string
  projectId?: string
  sprintId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: "created_at" | "updated_at" | "status" | "progress"
  sortOrder?: "asc" | "desc"
}

export interface ProjectFilters {
  status?: string
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
