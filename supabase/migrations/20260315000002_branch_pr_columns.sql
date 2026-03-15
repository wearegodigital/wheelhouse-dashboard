-- =============================================================================
-- ADD BRANCH AND PR URL COLUMNS TO SPRINTS AND PROJECTS
-- Mirrors backend migrations 014_sprint_pr_url.sql and 015_project_branch.sql
-- =============================================================================

DO $$ BEGIN
  ALTER TABLE sprints ADD COLUMN IF NOT EXISTS branch text;
  ALTER TABLE sprints ADD COLUMN IF NOT EXISTS pr_url text;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS branch text;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS pr_url text;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- =============================================================================
-- RECREATE VIEWS TO INCLUDE NEW COLUMNS
-- =============================================================================

DROP VIEW IF EXISTS project_summary;
CREATE VIEW project_summary AS
SELECT
    p.id,
    p.team_id,
    p.name,
    p.description,
    p.repo_url,
    p.status,
    p.branch,
    p.pr_url,
    p.created_at,
    p.updated_at,
    p.completed_at,
    p.deleted_at,
    p.deleted_by,
    u.email as created_by_email,
    u.display_name as created_by_name,
    (SELECT COUNT(*) FROM sprints WHERE project_id = p.id AND deleted_at IS NULL) as sprint_count,
    (SELECT COUNT(*) FROM sprints WHERE project_id = p.id AND status = 'completed' AND deleted_at IS NULL) as sprints_completed,
    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND deleted_at IS NULL) as task_count,
    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed' AND deleted_at IS NULL) as tasks_completed
FROM projects p
LEFT JOIN users u ON p.created_by = u.id;

DROP VIEW IF EXISTS sprint_summary;
CREATE VIEW sprint_summary AS
SELECT
    s.id,
    s.project_id,
    s.name,
    s.description,
    s.order_index,
    s.status,
    s.branch,
    s.pr_url,
    s.pattern,
    s.distribution,
    s.pattern_config,
    s.created_at,
    s.updated_at,
    s.completed_at,
    p.name as project_name,
    p.repo_url,
    (SELECT COUNT(*) FROM tasks WHERE sprint_id = s.id AND deleted_at IS NULL) as task_count,
    (SELECT COUNT(*) FROM tasks WHERE sprint_id = s.id AND status = 'completed' AND deleted_at IS NULL) as tasks_completed,
    (SELECT COUNT(*) FROM tasks WHERE sprint_id = s.id AND status = 'running' AND deleted_at IS NULL) as tasks_running
FROM sprints s
JOIN projects p ON s.project_id = p.id;
