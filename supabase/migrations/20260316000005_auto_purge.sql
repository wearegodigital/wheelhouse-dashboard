CREATE OR REPLACE FUNCTION purge_deleted_items() RETURNS void AS $$
BEGIN
    -- Delete order respects FK constraints: children first, parents last
    -- Events and agents reference tasks
    DELETE FROM events WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at < now() - interval '30 days');
    DELETE FROM agents WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at < now() - interval '30 days');
    DELETE FROM agent_summaries WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at < now() - interval '30 days');
    -- Tasks reference sprints and projects
    DELETE FROM tasks WHERE deleted_at < now() - interval '30 days';
    -- Sprints reference projects
    DELETE FROM sprints WHERE deleted_at < now() - interval '30 days';
    -- Planning conversations reference projects
    DELETE FROM planning_conversations WHERE project_id IN (SELECT id FROM projects WHERE deleted_at < now() - interval '30 days');
    -- Projects reference clients and repos
    DELETE FROM projects WHERE deleted_at < now() - interval '30 days';
    -- Repos reference clients
    DELETE FROM repos WHERE deleted_at < now() - interval '30 days';
    -- Clients are top-level
    DELETE FROM clients WHERE deleted_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;
