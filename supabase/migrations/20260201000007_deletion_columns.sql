-- Migration: Add soft delete columns for deletion support
-- This migration adds deleted_at and deleted_by columns to enable soft deletes
-- while maintaining audit trail of who deleted entities and when.

-- Add soft delete columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_by TEXT;

-- Add soft delete columns to sprints
ALTER TABLE sprints ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE sprints ADD COLUMN IF NOT EXISTS deleted_by TEXT;

-- Add soft delete columns to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_by TEXT;

-- Create indexes for efficient filtering of non-deleted records
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_sprints_deleted_at ON sprints(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);

-- Create views for active (non-deleted) entities
CREATE OR REPLACE VIEW active_projects AS
SELECT * FROM projects WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_sprints AS
SELECT * FROM sprints WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_tasks AS
SELECT * FROM tasks WHERE deleted_at IS NULL;

-- Must DROP existing views before recreating with different columns
DROP VIEW IF EXISTS project_summary;

-- Recreate project_summary with deleted_at/deleted_by and created_by fields
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
    u.email as created_by_email,
    u.display_name as created_by_name,
    (SELECT COUNT(*) FROM sprints WHERE project_id = p.id AND deleted_at IS NULL) as sprint_count,
    (SELECT COUNT(*) FROM sprints WHERE project_id = p.id AND status = 'completed' AND deleted_at IS NULL) as sprints_completed,
    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND deleted_at IS NULL) as task_count,
    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed' AND deleted_at IS NULL) as tasks_completed,
    p.deleted_at,
    p.deleted_by
FROM projects p
LEFT JOIN users u ON p.created_by = u.id
WHERE p.deleted_at IS NULL;
