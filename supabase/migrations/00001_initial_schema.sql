-- Wheelhouse Database Schema
-- Migration: 00001_initial_schema
-- Description: Initial schema for Wheelhouse v3 - projects, sprints, tasks, agents, events, and planning

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE project_status AS ENUM (
  'draft',
  'planning',
  'ready',
  'running',
  'paused',
  'completed',
  'cancelled'
);

CREATE TYPE sprint_status AS ENUM (
  'draft',
  'ready',
  'running',
  'paused',
  'completed',
  'cancelled'
);

CREATE TYPE task_status AS ENUM (
  'pending',
  'queued',
  'running',
  'validating',
  'completed',
  'failed',
  'cancelled'
);

CREATE TYPE execution_mode AS ENUM (
  'sequential',
  'parallel',
  'swarm',
  'competitive'
);

CREATE TYPE agent_type AS ENUM (
  'orchestrator',
  'maker',
  'checker',
  'joiner',
  'documenter'
);

CREATE TYPE agent_status AS ENUM (
  'spawned',
  'running',
  'completed',
  'failed'
);

CREATE TYPE user_role AS ENUM (
  'owner',
  'admin',
  'member',
  'viewer'
);

CREATE TYPE planning_conversation_status AS ENUM (
  'active',
  'approved',
  'cancelled'
);

CREATE TYPE planning_message_role AS ENUM (
  'user',
  'orchestrator',
  'system'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  role user_role NOT NULL DEFAULT 'member',
  display_name TEXT,
  avatar_url TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API Keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  default_branch TEXT NOT NULL DEFAULT 'main',
  status project_status NOT NULL DEFAULT 'draft',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Sprints table
CREATE TABLE sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  status sprint_status NOT NULL DEFAULT 'draft',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  repo_url TEXT NOT NULL,
  branch TEXT,
  description TEXT NOT NULL,
  mode execution_mode NOT NULL DEFAULT 'sequential',
  agent_count INTEGER NOT NULL DEFAULT 1,
  status task_status NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,
  pr_url TEXT,
  pr_number INTEGER,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type agent_type NOT NULL,
  status agent_status NOT NULL DEFAULT 'spawned',
  worker_index INTEGER,
  current_step TEXT,
  steps_completed INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  output JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Events table (append-only audit log)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  source_cursor BIGINT,
  source_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Planning Conversations table
CREATE TABLE planning_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES sprints(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  status planning_conversation_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Planning Messages table (append-only)
CREATE TABLE planning_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES planning_conversations(id) ON DELETE CASCADE,
  role planning_message_role NOT NULL,
  content TEXT NOT NULL,
  recommendations JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Teams
CREATE INDEX idx_teams_slug ON teams(slug);

-- Users
CREATE INDEX idx_users_team_id ON users(team_id);
CREATE INDEX idx_users_email ON users(email);

-- API Keys
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

-- Projects
CREATE INDEX idx_projects_team_id ON projects(team_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Sprints
CREATE INDEX idx_sprints_project_id ON sprints(project_id);
CREATE INDEX idx_sprints_status ON sprints(status);
CREATE INDEX idx_sprints_order_index ON sprints(project_id, order_index);

-- Tasks
CREATE INDEX idx_tasks_team_id ON tasks(team_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_sprint_id ON tasks(sprint_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_order_index ON tasks(sprint_id, order_index);

-- Agents
CREATE INDEX idx_agents_task_id ON agents(task_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_type ON agents(type);

-- Events
CREATE INDEX idx_events_task_id ON events(task_id);
CREATE INDEX idx_events_agent_id ON events(agent_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_source_cursor ON events(source_cursor);

-- Planning Conversations
CREATE INDEX idx_planning_conversations_project_id ON planning_conversations(project_id);
CREATE INDEX idx_planning_conversations_sprint_id ON planning_conversations(sprint_id);
CREATE INDEX idx_planning_conversations_task_id ON planning_conversations(task_id);
CREATE INDEX idx_planning_conversations_status ON planning_conversations(status);

-- Planning Messages
CREATE INDEX idx_planning_messages_conversation_id ON planning_messages(conversation_id);
CREATE INDEX idx_planning_messages_created_at ON planning_messages(created_at);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Project Summary View
CREATE VIEW project_summary AS
SELECT
  p.id,
  p.team_id,
  p.name,
  p.description,
  p.repo_url,
  p.status,
  p.created_at,
  p.updated_at,
  p.completed_at,
  u.email AS created_by_email,
  u.display_name AS created_by_name,
  COALESCE(sprint_counts.total, 0)::INTEGER AS sprint_count,
  COALESCE(sprint_counts.completed, 0)::INTEGER AS sprints_completed,
  COALESCE(task_counts.total, 0)::INTEGER AS task_count,
  COALESCE(task_counts.completed, 0)::INTEGER AS tasks_completed
FROM projects p
LEFT JOIN users u ON p.created_by = u.id
LEFT JOIN (
  SELECT
    project_id,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed
  FROM sprints
  GROUP BY project_id
) sprint_counts ON p.id = sprint_counts.project_id
LEFT JOIN (
  SELECT
    project_id,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed
  FROM tasks
  GROUP BY project_id
) task_counts ON p.id = task_counts.project_id;

-- Sprint Summary View
CREATE VIEW sprint_summary AS
SELECT
  s.id,
  s.project_id,
  s.name,
  s.description,
  s.order_index,
  s.status,
  s.created_at,
  s.updated_at,
  s.completed_at,
  p.name AS project_name,
  p.repo_url,
  COALESCE(task_counts.total, 0)::INTEGER AS task_count,
  COALESCE(task_counts.completed, 0)::INTEGER AS tasks_completed,
  COALESCE(task_counts.running, 0)::INTEGER AS tasks_running
FROM sprints s
LEFT JOIN projects p ON s.project_id = p.id
LEFT JOIN (
  SELECT
    sprint_id,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed,
    COUNT(*) FILTER (WHERE status = 'running') AS running
  FROM tasks
  GROUP BY sprint_id
) task_counts ON s.id = task_counts.sprint_id;

-- Task Summary View
CREATE VIEW task_summary AS
SELECT
  t.id,
  t.team_id,
  t.project_id,
  t.sprint_id,
  t.order_index,
  t.repo_url,
  t.branch,
  t.description,
  t.mode,
  t.status,
  t.progress,
  t.pr_url,
  t.created_at,
  t.completed_at,
  u.email AS created_by_email,
  u.display_name AS created_by_name,
  p.name AS project_name,
  s.name AS sprint_name,
  COALESCE(agent_count.total, 0)::INTEGER AS agent_count,
  COALESCE(event_count.total, 0)::INTEGER AS event_count
FROM tasks t
LEFT JOIN users u ON t.created_by = u.id
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN sprints s ON t.sprint_id = s.id
LEFT JOIN (
  SELECT task_id, COUNT(*) AS total
  FROM agents
  GROUP BY task_id
) agent_count ON t.id = agent_count.task_id
LEFT JOIN (
  SELECT task_id, COUNT(*) AS total
  FROM events
  GROUP BY task_id
) event_count ON t.id = event_count.task_id;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sprints_updated_at
  BEFORE UPDATE ON sprints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planning_conversations_updated_at
  BEFORE UPDATE ON planning_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_messages ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Users can read teams they belong to"
  ON teams FOR SELECT
  USING (
    id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Team owners can update their team"
  ON teams FOR UPDATE
  USING (
    id IN (
      SELECT team_id FROM users
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Authenticated users can create teams"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users policies
CREATE POLICY "Users can read all users in their team"
  ON users FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
    OR id = auth.uid()
  );

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Authenticated users can create user profiles"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- API Keys policies
CREATE POLICY "Users can read their own API keys"
  ON api_keys FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own API keys"
  ON api_keys FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own API keys"
  ON api_keys FOR DELETE
  USING (user_id = auth.uid());

-- Projects policies
CREATE POLICY "Users can read projects in their team"
  ON projects FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
    OR team_id IS NULL
  );

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
    OR team_id IS NULL
  );

CREATE POLICY "Users can update projects in their team"
  ON projects FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
    OR team_id IS NULL
  );

-- Sprints policies
CREATE POLICY "Users can read sprints in their team's projects"
  ON sprints FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE team_id IN (
        SELECT team_id FROM users WHERE id = auth.uid()
      )
      OR team_id IS NULL
    )
  );

CREATE POLICY "Users can create sprints in their team's projects"
  ON sprints FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects
      WHERE team_id IN (
        SELECT team_id FROM users WHERE id = auth.uid()
      )
      OR team_id IS NULL
    )
  );

CREATE POLICY "Users can update sprints in their team's projects"
  ON sprints FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE team_id IN (
        SELECT team_id FROM users WHERE id = auth.uid()
      )
      OR team_id IS NULL
    )
  );

-- Tasks policies
CREATE POLICY "Users can read tasks in their team"
  ON tasks FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
    OR team_id IS NULL
  );

CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
    OR team_id IS NULL
  );

CREATE POLICY "Users can update tasks in their team"
  ON tasks FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
    OR team_id IS NULL
  );

-- Agents policies
CREATE POLICY "Users can read agents for tasks in their team"
  ON agents FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE team_id IN (
        SELECT team_id FROM users WHERE id = auth.uid()
      )
      OR team_id IS NULL
    )
  );

CREATE POLICY "System can create agents"
  ON agents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update agents"
  ON agents FOR UPDATE
  USING (true);

-- Events policies
CREATE POLICY "Users can read events for tasks in their team"
  ON events FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE team_id IN (
        SELECT team_id FROM users WHERE id = auth.uid()
      )
      OR team_id IS NULL
    )
    OR task_id IS NULL
  );

CREATE POLICY "System can create events"
  ON events FOR INSERT
  WITH CHECK (true);

-- Planning Conversations policies
CREATE POLICY "Users can read planning conversations in their team"
  ON planning_conversations FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE team_id IN (
        SELECT team_id FROM users WHERE id = auth.uid()
      )
      OR team_id IS NULL
    )
    OR sprint_id IN (
      SELECT s.id FROM sprints s
      JOIN projects p ON s.project_id = p.id
      WHERE p.team_id IN (
        SELECT team_id FROM users WHERE id = auth.uid()
      )
      OR p.team_id IS NULL
    )
    OR task_id IN (
      SELECT id FROM tasks
      WHERE team_id IN (
        SELECT team_id FROM users WHERE id = auth.uid()
      )
      OR team_id IS NULL
    )
  );

CREATE POLICY "Users can create planning conversations"
  ON planning_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update planning conversations"
  ON planning_conversations FOR UPDATE
  USING (true);

-- Planning Messages policies
CREATE POLICY "Users can read planning messages for conversations in their team"
  ON planning_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM planning_conversations
      WHERE project_id IN (
        SELECT id FROM projects
        WHERE team_id IN (
          SELECT team_id FROM users WHERE id = auth.uid()
        )
        OR team_id IS NULL
      )
    )
  );

CREATE POLICY "Users can create planning messages"
  ON planning_messages FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE teams IS 'Organizations that own projects and users';
COMMENT ON TABLE users IS 'User profiles (extends auth.users)';
COMMENT ON TABLE api_keys IS 'API keys for CLI and external integrations';
COMMENT ON TABLE projects IS 'Multi-sprint initiatives';
COMMENT ON TABLE sprints IS 'Work periods within projects';
COMMENT ON TABLE tasks IS 'Atomic units of work';
COMMENT ON TABLE agents IS 'Agent execution tracking';
COMMENT ON TABLE events IS 'Append-only audit log synced from JSONL';
COMMENT ON TABLE planning_conversations IS 'Planning chat sessions with Orchestrator';
COMMENT ON TABLE planning_messages IS 'Messages in planning conversations';

COMMENT ON VIEW project_summary IS 'Project list with sprint/task counts and creator info';
COMMENT ON VIEW sprint_summary IS 'Sprint list with task counts and project info';
COMMENT ON VIEW task_summary IS 'Task list with agent/event counts and related entities';
