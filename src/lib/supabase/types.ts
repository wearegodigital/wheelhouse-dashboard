// Database types - will be generated from Supabase schema
// Run: pnpm supabase:gen to regenerate

export type ProjectStatus =
  | "draft"
  | "planning"
  | "ready"
  | "running"
  | "paused"
  | "completed"
  | "cancelled"

export type SprintStatus =
  | "draft"
  | "ready"
  | "running"
  | "paused"
  | "completed"
  | "cancelled"

export type TaskStatus =
  | "pending"
  | "queued"
  | "running"
  | "validating"
  | "completed"
  | "failed"
  | "cancelled"

export type ExecutionMode = "sequential" | "parallel" | "swarm" | "competitive"

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
      }
      projects: {
        Row: {
          id: string
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
          started_at?: string | null
          completed_at?: string | null
        }
      }
      sprints: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          order_index: number
          status: SprintStatus
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
          started_at: string | null
          completed_at: string | null
        }
        Insert: Omit<Database["public"]["Tables"]["sprints"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Database["public"]["Tables"]["sprints"]["Row"], "id">>
      }
      tasks: {
        Row: {
          id: string
          team_id: string | null
          created_by: string | null
          project_id: string | null
          sprint_id: string | null
          order_index: number
          repo_url: string
          branch: string | null
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
        }
        Insert: Omit<Database["public"]["Tables"]["tasks"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Database["public"]["Tables"]["tasks"]["Row"], "id">>
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
        }
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
        }
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
        }
      }
    }
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
export type UserRole = "owner" | "admin" | "member" | "viewer"
