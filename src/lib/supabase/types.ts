// Database types - will be generated from Supabase schema
// Run: pnpm supabase:gen to regenerate

// Shared contract types — single source of truth from backend
export type {
  ExecutionPattern,
  DistributionMode,
  ModelTier,
  TournamentConfig,
  CascadeConfig,
  EnsembleConfig,
} from "@/contract/wheelhouse-contract"

// Local import for use within this file's Database interface
import type {
  ExecutionPattern,
  DistributionMode,
  TournamentConfig,
  CascadeConfig,
  EnsembleConfig,
} from "@/contract/wheelhouse-contract"

// Dashboard-specific status types (Supabase vocabulary, may differ from backend)
export type ProjectStatus =
  | "draft"
  | "planning"
  | "ready"
  | "running"
  | "paused"
  | "completed"
  | "cancelled"
  | "failed"
  | "deleted"

export type SprintStatus =
  | "draft"
  | "ready"
  | "running"
  | "paused"
  | "completed"
  | "cancelled"
  | "failed"
  | "deleted"

export type TaskStatus =
  | "pending"
  | "queued"
  | "running"
  | "validating"
  | "completed"
  | "failed"
  | "cancelled"
  | "deleted"

export type ExecutionMode = "sequential" | "parallel" | "swarm" | "competitive"

export type PatternConfig = TournamentConfig | CascadeConfig | EnsembleConfig | Record<string, unknown>

export type AgentType =
  | "orchestrator"
  | "maker"
  | "checker"
  | "joiner"
  | "documenter"

export type AgentStatus = "spawned" | "running" | "completed" | "failed"

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          slug: string
          settings: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["teams"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Database["public"]["Tables"]["teams"]["Row"], "id">>
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          team_id: string | null
          role: "owner" | "admin" | "member" | "viewer"
          display_name: string | null
          avatar_url: string | null
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "created_at" | "updated_at">
        Update: Partial<Omit<Database["public"]["Tables"]["users"]["Row"], "id">>
        Relationships: []
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          key_hash: string
          key_prefix: string
          scopes: string[]
          last_used_at: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["api_keys"]["Row"], "id" | "created_at">
        Update: Partial<Omit<Database["public"]["Tables"]["api_keys"]["Row"], "id" | "user_id">>
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          source_id: string | null  // Original Modal ID for API calls
          team_id: string | null
          created_by: string | null
          name: string
          description: string
          repo_url: string
          default_branch: string
          status: ProjectStatus
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
          started_at: string | null
          completed_at: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          team_id?: string | null
          created_by?: string | null
          name: string
          description: string
          repo_url: string
          default_branch: string
          status: ProjectStatus
          metadata: Record<string, unknown>
          started_at?: string | null
          completed_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          team_id?: string | null
          created_by?: string | null
          name?: string
          description?: string
          repo_url?: string
          default_branch?: string
          status?: ProjectStatus
          metadata?: Record<string, unknown>
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: []
      }
      sprints: {
        Row: {
          id: string
          source_id: string | null  // Original Modal ID for API calls
          project_id: string
          name: string
          description: string | null
          order_index: number
          status: SprintStatus
          pattern: ExecutionPattern | null
          distribution: DistributionMode
          pattern_config: PatternConfig
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
          started_at: string | null
          completed_at: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          project_id: string
          name: string
          description?: string | null
          order_index?: number
          status?: SprintStatus
          metadata?: Record<string, unknown>
          started_at?: string | null
          completed_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          source_id?: string | null
          pattern?: ExecutionPattern | null
          distribution?: DistributionMode
          pattern_config?: PatternConfig
        }
        Update: Partial<Omit<Database["public"]["Tables"]["sprints"]["Row"], "id">>
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          source_id: string | null  // Original Modal ID for API calls
          team_id: string | null
          created_by: string | null
          project_id: string | null
          sprint_id: string | null
          order_index: number
          repo_url: string
          branch: string | null
          title: string
          description: string
          mode: ExecutionMode
          agent_count: number
          status: TaskStatus
          progress: number
          pr_url: string | null
          pr_number: number | null
          error: string | null
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
          started_at: string | null
          completed_at: string | null
          pattern: ExecutionPattern | null
          distribution: DistributionMode
          pattern_config: PatternConfig
          model_tier: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          team_id?: string | null
          created_by?: string | null
          project_id?: string | null
          sprint_id?: string | null
          order_index?: number
          repo_url: string
          branch?: string | null
          title?: string
          description: string
          mode?: ExecutionMode
          agent_count?: number
          status?: TaskStatus
          progress?: number
          pr_url?: string | null
          pr_number?: number | null
          error?: string | null
          metadata?: Record<string, unknown>
          started_at?: string | null
          completed_at?: string | null
          source_id?: string | null
          pattern?: ExecutionPattern | null
          distribution?: DistributionMode
          pattern_config?: PatternConfig
          model_tier?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: Partial<Omit<Database["public"]["Tables"]["tasks"]["Row"], "id">>
        Relationships: []
      }
      agents: {
        Row: {
          id: string
          task_id: string
          type: AgentType
          status: AgentStatus
          worker_index: number | null
          current_step: string | null
          steps_completed: number
          error: string | null
          output: Record<string, unknown>
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
          started_at: string | null
          completed_at: string | null
        }
        Insert: Omit<Database["public"]["Tables"]["agents"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Database["public"]["Tables"]["agents"]["Row"], "id">>
        Relationships: []
      }
      events: {
        Row: {
          id: string
          task_id: string | null
          agent_id: string | null
          type: string
          payload: Record<string, unknown>
          source_cursor: number | null
          source_hash: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["events"]["Row"], "id" | "created_at">
        Update: never
        Relationships: []
      }
      planning_conversations: {
        Row: {
          id: string
          project_id: string | null
          sprint_id: string | null
          task_id: string | null
          status: "active" | "approved" | "cancelled"
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: Omit<Database["public"]["Tables"]["planning_conversations"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Database["public"]["Tables"]["planning_conversations"]["Row"], "id">>
        Relationships: []
      }
      planning_messages: {
        Row: {
          id: string
          conversation_id: string
          role: "user" | "orchestrator" | "system"
          content: string
          recommendations: Record<string, unknown> | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["planning_messages"]["Row"], "id" | "created_at">
        Update: never
        Relationships: []
      }
      team_invites: {
        Row: {
          id: string
          team_id: string
          email: string
          role: "admin" | "member" | "viewer"
          invited_by: string
          status: "pending" | "accepted" | "expired" | "revoked"
          token: string
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["team_invites"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Database["public"]["Tables"]["team_invites"]["Row"], "id" | "team_id" | "token">>
        Relationships: []
      }
      task_comments: {
        Row: {
          id: string
          task_id: string
          user_id: string
          parent_id: string | null
          content: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["task_comments"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Database["public"]["Tables"]["task_comments"]["Row"], "id" | "task_id" | "user_id">>
        Relationships: []
      }
      activity_log: {
        Row: {
          id: string
          team_id: string | null
          user_id: string | null
          action: "created" | "updated" | "deleted" | "started" | "completed" | "failed" | "commented"
          entity_type: "project" | "sprint" | "task" | "comment"
          entity_id: string
          entity_name: string | null
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["activity_log"]["Row"], "id" | "created_at">
        Update: never
        Relationships: []
      }
    }
    Views: {
      project_summary: {
        Row: {
          id: string
          team_id: string | null
          name: string
          description: string
          repo_url: string
          status: ProjectStatus
          created_at: string
          updated_at: string
          completed_at: string | null
          created_by_email: string | null
          created_by_name: string | null
          sprint_count: number
          sprints_completed: number
          task_count: number
          tasks_completed: number
          deleted_at: string | null
          deleted_by: string | null
        }
        Relationships: []
      }
      sprint_summary: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          order_index: number
          status: SprintStatus
          created_at: string
          updated_at: string
          completed_at: string | null
          project_name: string
          repo_url: string
          task_count: number
          tasks_completed: number
          tasks_running: number
          pattern: ExecutionPattern | null
          distribution: DistributionMode
          pattern_config: PatternConfig
        }
        Relationships: []
      }
      task_summary: {
        Row: {
          id: string
          team_id: string | null
          project_id: string | null
          sprint_id: string | null
          order_index: number
          repo_url: string
          branch: string | null
          title: string
          description: string
          mode: ExecutionMode
          status: TaskStatus
          progress: number
          pr_url: string | null
          created_at: string
          completed_at: string | null
          created_by_email: string | null
          created_by_name: string | null
          project_name: string | null
          sprint_name: string | null
          agent_count: number
          event_count: number
          pattern: ExecutionPattern | null
          distribution: DistributionMode
          pattern_config: PatternConfig
        }
        Relationships: []
      }
    }
    Functions: Record<string, never>
  }
}

// Convenience types
export type Project = Database["public"]["Tables"]["projects"]["Row"]
export type ProjectSummary = Database["public"]["Views"]["project_summary"]["Row"]
export type Sprint = Database["public"]["Tables"]["sprints"]["Row"]
export type SprintSummary = Database["public"]["Views"]["sprint_summary"]["Row"]
export type Task = Database["public"]["Tables"]["tasks"]["Row"]
export type TaskSummary = Database["public"]["Views"]["task_summary"]["Row"]
export type Agent = Database["public"]["Tables"]["agents"]["Row"]
export type Event = Database["public"]["Tables"]["events"]["Row"]
export type PlanningConversation = Database["public"]["Tables"]["planning_conversations"]["Row"]
export type PlanningMessage = Database["public"]["Tables"]["planning_messages"]["Row"]
export type User = Database["public"]["Tables"]["users"]["Row"]
export type Team = Database["public"]["Tables"]["teams"]["Row"]
export type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"]
export type TeamInvite = Database["public"]["Tables"]["team_invites"]["Row"]
export type TaskComment = Database["public"]["Tables"]["task_comments"]["Row"]
export type ActivityLog = Database["public"]["Tables"]["activity_log"]["Row"]
export type UserRole = "owner" | "admin" | "member" | "viewer"
export type ActivityAction = "created" | "updated" | "deleted" | "started" | "completed" | "failed" | "commented"
export type ActivityEntityType = "project" | "sprint" | "task" | "comment"
