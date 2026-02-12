-- Migration: 20260212000012_dashboard_features
-- Description: Consolidate dashboard-specific features:
--   - Security hardening (search_path, security_invoker)
--   - RLS recursion fix (get_current_user_team_id helper)
--   - Dashboard tables (activity_log, task_comments, team_invites)
--   - Execution pattern enums + view updates
-- All statements are idempotent (safe to re-run).

-- ============================================================================
-- 1. SECURITY: Fix handle_new_user with SET search_path
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Fix update_updated_at_column with SET search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. RLS RECURSION FIX: get_current_user_team_id helper
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_current_user_team_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT team_id FROM public.users WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_team_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_team_id() TO service_role;

-- ============================================================================
-- 3. RLS POLICY FIXES (use helper to avoid recursion)
-- ============================================================================

-- Teams
DROP POLICY IF EXISTS "Users can read teams they belong to" ON teams;
CREATE POLICY "Users can read teams they belong to"
  ON teams FOR SELECT
  USING (id = public.get_current_user_team_id());

DROP POLICY IF EXISTS "Team owners can update their team" ON teams;
CREATE POLICY "Team owners can update their team"
  ON teams FOR UPDATE
  USING (
    id = public.get_current_user_team_id()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Users
DROP POLICY IF EXISTS "Users can read all users in their team" ON users;
CREATE POLICY "Users can read all users in their team"
  ON users FOR SELECT
  USING (
    id = auth.uid()
    OR team_id = public.get_current_user_team_id()
  );

-- Projects
DROP POLICY IF EXISTS "Users can read projects in their team" ON projects;
CREATE POLICY "Users can read projects in their team"
  ON projects FOR SELECT
  USING (
    team_id = public.get_current_user_team_id()
    OR team_id IS NULL
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create projects" ON projects;
CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    team_id = public.get_current_user_team_id()
    OR team_id IS NULL
  );

DROP POLICY IF EXISTS "Users can update projects in their team" ON projects;
CREATE POLICY "Users can update projects in their team"
  ON projects FOR UPDATE
  USING (
    team_id = public.get_current_user_team_id()
    OR team_id IS NULL
    OR created_by = auth.uid()
  );

-- Sprints
DROP POLICY IF EXISTS "Users can read sprints in their team's projects" ON sprints;
CREATE POLICY "Users can read sprints in their team's projects"
  ON sprints FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE team_id = public.get_current_user_team_id()
         OR team_id IS NULL
         OR created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create sprints" ON sprints;
CREATE POLICY "Users can create sprints"
  ON sprints FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects
      WHERE team_id = public.get_current_user_team_id()
         OR team_id IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can update sprints in their team's projects" ON sprints;
CREATE POLICY "Users can update sprints in their team's projects"
  ON sprints FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE team_id = public.get_current_user_team_id()
         OR team_id IS NULL
         OR created_by = auth.uid()
    )
  );

-- Tasks
DROP POLICY IF EXISTS "Users can read tasks in their team" ON tasks;
CREATE POLICY "Users can read tasks in their team"
  ON tasks FOR SELECT
  USING (
    team_id = public.get_current_user_team_id()
    OR team_id IS NULL
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    team_id = public.get_current_user_team_id()
    OR team_id IS NULL
  );

DROP POLICY IF EXISTS "Users can update tasks in their team" ON tasks;
CREATE POLICY "Users can update tasks in their team"
  ON tasks FOR UPDATE
  USING (
    team_id = public.get_current_user_team_id()
    OR team_id IS NULL
    OR created_by = auth.uid()
  );

-- Planning conversations
DROP POLICY IF EXISTS "Users can read conversations in their team's projects" ON planning_conversations;
CREATE POLICY "Users can read conversations in their team's projects"
  ON planning_conversations FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE team_id = public.get_current_user_team_id()
         OR team_id IS NULL
         OR created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create conversations" ON planning_conversations;
CREATE POLICY "Users can create conversations"
  ON planning_conversations FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects
      WHERE team_id = public.get_current_user_team_id()
         OR team_id IS NULL
    )
  );

-- Planning messages
DROP POLICY IF EXISTS "Users can read messages in their team's conversations" ON planning_messages;
CREATE POLICY "Users can read messages in their team's conversations"
  ON planning_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.planning_conversations
      WHERE project_id IN (
        SELECT id FROM public.projects
        WHERE team_id = public.get_current_user_team_id()
           OR team_id IS NULL
           OR created_by = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can create messages in their team's conversations" ON planning_messages;
CREATE POLICY "Users can create messages in their team's conversations"
  ON planning_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.planning_conversations
      WHERE project_id IN (
        SELECT id FROM public.projects
        WHERE team_id = public.get_current_user_team_id()
           OR team_id IS NULL
      )
    )
  );

-- Agents
DROP POLICY IF EXISTS "Users can read agents for tasks in their team" ON agents;
CREATE POLICY "Users can read agents for tasks in their team"
  ON agents FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE team_id = public.get_current_user_team_id()
         OR team_id IS NULL
         OR created_by = auth.uid()
    )
  );

-- Events
DROP POLICY IF EXISTS "Users can read events for tasks in their team" ON events;
CREATE POLICY "Users can read events for tasks in their team"
  ON events FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE team_id = public.get_current_user_team_id()
         OR team_id IS NULL
         OR created_by = auth.uid()
    )
  );

-- ============================================================================
-- 4. DASHBOARD TABLES
-- ============================================================================

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_team_id ON activity_log(team_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_id ON activity_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read activity in their team" ON activity_log;
CREATE POLICY "Users can read activity in their team"
  ON activity_log FOR SELECT
  USING (
    team_id = public.get_current_user_team_id()
    OR team_id IS NULL
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create activity entries" ON activity_log;
CREATE POLICY "Users can create activity entries"
  ON activity_log FOR INSERT
  WITH CHECK (
    team_id = public.get_current_user_team_id()
    OR team_id IS NULL
  );

-- Task comments
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read comments on tasks in their team" ON task_comments;
CREATE POLICY "Users can read comments on tasks in their team"
  ON task_comments FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE team_id = public.get_current_user_team_id()
         OR team_id IS NULL
         OR created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create comments on tasks in their team" ON task_comments;
CREATE POLICY "Users can create comments on tasks in their team"
  ON task_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND task_id IN (
      SELECT id FROM tasks
      WHERE team_id = public.get_current_user_team_id()
         OR team_id IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can update their own comments" ON task_comments;
CREATE POLICY "Users can update their own comments"
  ON task_comments FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own comments" ON task_comments;
CREATE POLICY "Users can delete their own comments"
  ON task_comments FOR DELETE
  USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS update_task_comments_updated_at ON task_comments;
CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Team invites
CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  token TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_invites_team_id ON team_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);
CREATE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(token);

ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read invites for their team" ON team_invites;
CREATE POLICY "Users can read invites for their team"
  ON team_invites FOR SELECT
  USING (
    team_id = public.get_current_user_team_id()
    OR email = (SELECT email FROM users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Team admins can create invites" ON team_invites;
CREATE POLICY "Team admins can create invites"
  ON team_invites FOR INSERT
  WITH CHECK (
    team_id = public.get_current_user_team_id()
    AND invited_by = auth.uid()
  );

DROP TRIGGER IF EXISTS update_team_invites_updated_at ON team_invites;
CREATE TRIGGER update_team_invites_updated_at
  BEFORE UPDATE ON team_invites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. RECREATE VIEWS with security_invoker + pattern columns
-- ============================================================================

DROP VIEW IF EXISTS public.task_summary;
CREATE VIEW public.task_summary
WITH (security_invoker = true)
AS
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
  COALESCE(event_count.total, 0)::INTEGER AS event_count,
  t.pattern,
  t.distribution,
  t.pattern_config
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

DROP VIEW IF EXISTS public.sprint_summary;
CREATE VIEW public.sprint_summary
WITH (security_invoker = true)
AS
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
  COALESCE(task_counts.running, 0)::INTEGER AS tasks_running,
  s.pattern,
  s.distribution,
  s.pattern_config
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

DROP VIEW IF EXISTS public.project_summary;
CREATE VIEW public.project_summary
WITH (security_invoker = true)
AS
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
    s.project_id,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE t.status = 'completed') AS completed
  FROM tasks t
  JOIN sprints s ON t.sprint_id = s.id
  GROUP BY s.project_id
) task_counts ON p.id = task_counts.project_id;

-- Enable RLS on sync_state if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sync_state') THEN
    ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
