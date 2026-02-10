-- Migration: 00007_add_sprint_pattern_columns
-- Description: Add execution pattern columns to sprints table
-- Mirrors task pattern columns added in 00006

-- Reuse existing enums (execution_pattern, distribution_mode) from 00006

ALTER TABLE sprints ADD COLUMN IF NOT EXISTS pattern execution_pattern;
ALTER TABLE sprints ADD COLUMN IF NOT EXISTS distribution distribution_mode NOT NULL DEFAULT 'single';
ALTER TABLE sprints ADD COLUMN IF NOT EXISTS pattern_config JSONB NOT NULL DEFAULT '{}';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sprints_pattern ON sprints(pattern);
CREATE INDEX IF NOT EXISTS idx_sprints_distribution ON sprints(distribution);

-- Recreate sprint_summary view to include pattern columns
-- Source: 00002_fix_auth_and_security.sql lines 97-126 (exact replica + 3 new columns)
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
