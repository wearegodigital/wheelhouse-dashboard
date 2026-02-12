-- =============================================================================
-- WHEELHOUSE DATABASE SCHEMA - DASHBOARD VIEWS
-- =============================================================================

-- =============================================================================
-- PROJECT SUMMARY VIEW
-- =============================================================================

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
    (SELECT COUNT(*) FROM sprints WHERE project_id = p.id) as sprint_count,
    (SELECT COUNT(*) FROM sprints WHERE project_id = p.id AND status = 'completed') as sprints_completed,
    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as tasks_completed
FROM projects p
LEFT JOIN users u ON p.created_by = u.id;

-- =============================================================================
-- SPRINT SUMMARY VIEW
-- =============================================================================

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
    p.name as project_name,
    p.repo_url,
    (SELECT COUNT(*) FROM tasks WHERE sprint_id = s.id) as task_count,
    (SELECT COUNT(*) FROM tasks WHERE sprint_id = s.id AND status = 'completed') as tasks_completed,
    (SELECT COUNT(*) FROM tasks WHERE sprint_id = s.id AND status = 'running') as tasks_running
FROM sprints s
JOIN projects p ON s.project_id = p.id;

-- =============================================================================
-- TASK SUMMARY VIEW
-- =============================================================================

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
    u.email as created_by_email,
    u.display_name as created_by_name,
    p.name as project_name,
    s.name as sprint_name,
    (SELECT COUNT(*) FROM agents WHERE task_id = t.id) as agent_count,
    (SELECT COUNT(*) FROM events WHERE task_id = t.id) as event_count
FROM tasks t
LEFT JOIN users u ON t.created_by = u.id
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN sprints s ON t.sprint_id = s.id;

-- =============================================================================
-- AGENT ACTIVITY VIEW
-- =============================================================================

CREATE VIEW agent_activity AS
SELECT
    a.id,
    a.task_id,
    a.type,
    a.status,
    a.current_step,
    a.started_at,
    a.completed_at,
    a.error,
    t.description as task_description,
    t.repo_url
FROM agents a
JOIN tasks t ON a.task_id = t.id
ORDER BY a.created_at DESC;

-- =============================================================================
-- RECENT EVENTS VIEW
-- =============================================================================

CREATE VIEW recent_events AS
SELECT
    e.id,
    e.task_id,
    e.agent_id,
    e.type,
    e.payload,
    e.created_at,
    t.description as task_description,
    a.type as agent_type
FROM events e
LEFT JOIN tasks t ON e.task_id = t.id
LEFT JOIN agents a ON e.agent_id = a.id
ORDER BY e.created_at DESC
LIMIT 1000;
