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
    p.client_id,
    p.repo_id,
    p.notion_id,
    p.created_at,
    p.updated_at,
    p.completed_at,
    u.email AS created_by_email,
    u.display_name AS created_by_name,
    (SELECT COUNT(*) FROM sprints WHERE project_id = p.id AND deleted_at IS NULL) AS sprint_count,
    (SELECT COUNT(*) FROM sprints WHERE project_id = p.id AND status = 'completed' AND deleted_at IS NULL) AS sprints_completed,
    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND deleted_at IS NULL) AS task_count,
    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed' AND deleted_at IS NULL) AS tasks_completed,
    p.deleted_at,
    p.deleted_by
FROM projects p
LEFT JOIN users u ON p.created_by = u.id
WHERE p.deleted_at IS NULL;
