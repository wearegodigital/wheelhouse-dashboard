-- Migration: 00003_fix_rls_recursion
-- Description: Fix infinite recursion in RLS policies by using SECURITY DEFINER function
-- Error: "infinite recursion detected in policy for relation 'users'"

-- ============================================================================
-- CREATE HELPER FUNCTION (SECURITY DEFINER bypasses RLS)
-- ============================================================================

-- This function safely gets the current user's team_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_current_user_team_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT team_id FROM public.users WHERE id = auth.uid();
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_user_team_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_team_id() TO service_role;

-- ============================================================================
-- FIX: Teams policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can read teams they belong to" ON teams;
CREATE POLICY "Users can read teams they belong to"
  ON teams FOR SELECT
  USING (
    id = public.get_current_user_team_id()
  );

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

-- ============================================================================
-- FIX: Users policies (the main culprit)
-- ============================================================================

DROP POLICY IF EXISTS "Users can read all users in their team" ON users;
CREATE POLICY "Users can read all users in their team"
  ON users FOR SELECT
  USING (
    -- Always allow reading your own record (no recursion)
    id = auth.uid()
    -- Allow reading teammates via the SECURITY DEFINER function
    OR team_id = public.get_current_user_team_id()
  );

-- ============================================================================
-- FIX: Projects policies
-- ============================================================================

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

-- ============================================================================
-- FIX: Sprints policies
-- ============================================================================

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

DROP POLICY IF EXISTS "Users can create sprints in their team's projects" ON sprints;
CREATE POLICY "Users can create sprints in their team's projects"
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

-- ============================================================================
-- FIX: Tasks policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can read tasks in their team" ON tasks;
CREATE POLICY "Users can read tasks in their team"
  ON tasks FOR SELECT
  USING (
    team_id = public.get_current_user_team_id()
    OR team_id IS NULL
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create tasks in their team" ON tasks;
CREATE POLICY "Users can create tasks in their team"
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

-- ============================================================================
-- FIX: Agents policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can read agents for their team's tasks" ON agents;
CREATE POLICY "Users can read agents for their team's tasks"
  ON agents FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE team_id = public.get_current_user_team_id()
         OR team_id IS NULL
         OR created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create agents for their team's tasks" ON agents;
CREATE POLICY "Users can create agents for their team's tasks"
  ON agents FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE team_id = public.get_current_user_team_id()
         OR team_id IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can update agents for their team's tasks" ON agents;
CREATE POLICY "Users can update agents for their team's tasks"
  ON agents FOR UPDATE
  USING (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE team_id = public.get_current_user_team_id()
         OR team_id IS NULL
         OR created_by = auth.uid()
    )
  );

-- ============================================================================
-- FIX: Events policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can read events for their team's tasks" ON events;
CREATE POLICY "Users can read events for their team's tasks"
  ON events FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE team_id = public.get_current_user_team_id()
         OR team_id IS NULL
         OR created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create events for their team's tasks" ON events;
CREATE POLICY "Users can create events for their team's tasks"
  ON events FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE team_id = public.get_current_user_team_id()
         OR team_id IS NULL
    )
  );

-- ============================================================================
-- FIX: Planning conversations policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can read their team's planning conversations" ON planning_conversations;
CREATE POLICY "Users can read their team's planning conversations"
  ON planning_conversations FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE team_id = public.get_current_user_team_id()
         OR team_id IS NULL
         OR created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create planning conversations" ON planning_conversations;
CREATE POLICY "Users can create planning conversations"
  ON planning_conversations FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects
      WHERE team_id = public.get_current_user_team_id()
         OR team_id IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can update their team's planning conversations" ON planning_conversations;
CREATE POLICY "Users can update their team's planning conversations"
  ON planning_conversations FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE team_id = public.get_current_user_team_id()
         OR team_id IS NULL
         OR created_by = auth.uid()
    )
  );

-- ============================================================================
-- FIX: Planning messages policies
-- ============================================================================

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
