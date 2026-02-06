-- Migration: 00006_add_execution_patterns
-- Description: Add execution pattern system columns to tasks table
-- Replaces old single execution_mode with two-level: pattern + distribution

-- ============================================================================
-- NEW ENUMS
-- ============================================================================

CREATE TYPE execution_pattern AS ENUM (
  'sequential',
  'tournament',
  'cascade',
  'ensemble'
);

CREATE TYPE distribution_mode AS ENUM (
  'single',
  'swarm'
);

-- ============================================================================
-- ADD COLUMNS TO TASKS
-- ============================================================================

ALTER TABLE tasks ADD COLUMN pattern execution_pattern;
ALTER TABLE tasks ADD COLUMN distribution distribution_mode NOT NULL DEFAULT 'single';
ALTER TABLE tasks ADD COLUMN pattern_config JSONB NOT NULL DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN model_tier TEXT;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_tasks_pattern ON tasks(pattern);
CREATE INDEX idx_tasks_distribution ON tasks(distribution);

-- ============================================================================
-- RECREATE task_summary VIEW
-- Latest definition was from 00002 (security_invoker = true)
-- 00003, 00004, 00005 did NOT modify this view
-- Adding: t.pattern, t.distribution, t.pattern_config
-- NOT adding: model_tier (intentionally excluded -- runtime param, not list display)
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
