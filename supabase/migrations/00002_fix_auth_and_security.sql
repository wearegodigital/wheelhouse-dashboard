-- Migration: 00002_fix_auth_and_security
-- Description: Fix handle_new_user trigger, view security, and function search paths

-- ============================================================================
-- FIX: handle_new_user function for auth trigger
-- ============================================================================

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function with proper security settings
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

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FIX: Update other functions to have immutable search_path
-- ============================================================================

-- Fix update_updated_at_column function
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
-- FIX: Recreate views with SECURITY INVOKER (matching original definitions)
-- ============================================================================

-- Drop existing views
DROP VIEW IF EXISTS public.task_summary;
DROP VIEW IF EXISTS public.sprint_summary;
DROP VIEW IF EXISTS public.project_summary;

-- Recreate project_summary view with security_invoker
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
    project_id,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed
  FROM tasks
  GROUP BY project_id
) task_counts ON p.id = task_counts.project_id;

-- Recreate sprint_summary view with security_invoker
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

-- Recreate task_summary view with security_invoker
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
-- FIX: Enable RLS on sync_state table if it exists
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sync_state' AND table_schema = 'public') THEN
    ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;

    -- Create a permissive policy for now (adjust based on your needs)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sync_state' AND policyname = 'Allow all for sync_state') THEN
      CREATE POLICY "Allow all for sync_state"
        ON public.sync_state
        FOR ALL
        USING (true)
        WITH CHECK (true);
    END IF;
  END IF;
END;
$$;

-- ============================================================================
-- Grant necessary permissions
-- ============================================================================

-- Ensure the handle_new_user function can be executed
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
