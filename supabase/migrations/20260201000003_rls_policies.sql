-- =============================================================================
-- WHEELHOUSE DATABASE SCHEMA - ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- TEAMS POLICIES
-- =============================================================================

-- Users can only see their own team
CREATE POLICY teams_select ON teams FOR SELECT
    USING (id IN (SELECT team_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- USERS POLICIES
-- =============================================================================

-- Users can see teammates
CREATE POLICY users_select ON users FOR SELECT
    USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- API KEYS POLICIES
-- =============================================================================

-- Users can only see their own keys
CREATE POLICY api_keys_select ON api_keys FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY api_keys_insert ON api_keys FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY api_keys_delete ON api_keys FOR DELETE
    USING (user_id = auth.uid());

-- =============================================================================
-- PROJECTS POLICIES
-- =============================================================================

-- Team members can see team projects
CREATE POLICY projects_select ON projects FOR SELECT
    USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

CREATE POLICY projects_insert ON projects FOR INSERT
    WITH CHECK (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

CREATE POLICY projects_update ON projects FOR UPDATE
    USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- SPRINTS POLICIES
-- =============================================================================

-- Access via project relationship
CREATE POLICY sprints_select ON sprints FOR SELECT
    USING (project_id IN (
        SELECT id FROM projects WHERE team_id IN (
            SELECT team_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY sprints_insert ON sprints FOR INSERT
    WITH CHECK (project_id IN (
        SELECT id FROM projects WHERE team_id IN (
            SELECT team_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY sprints_update ON sprints FOR UPDATE
    USING (project_id IN (
        SELECT id FROM projects WHERE team_id IN (
            SELECT team_id FROM users WHERE id = auth.uid()
        )
    ));

-- =============================================================================
-- PLANNING CONVERSATIONS POLICIES
-- =============================================================================

-- Access via project/sprint/task relationship
CREATE POLICY planning_conversations_select ON planning_conversations FOR SELECT
    USING (
        project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM users WHERE id = auth.uid()))
        OR sprint_id IN (SELECT s.id FROM sprints s JOIN projects p ON s.project_id = p.id WHERE p.team_id IN (SELECT team_id FROM users WHERE id = auth.uid()))
    );

CREATE POLICY planning_conversations_insert ON planning_conversations FOR INSERT
    WITH CHECK (
        project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM users WHERE id = auth.uid()))
        OR sprint_id IN (SELECT s.id FROM sprints s JOIN projects p ON s.project_id = p.id WHERE p.team_id IN (SELECT team_id FROM users WHERE id = auth.uid()))
    );

-- =============================================================================
-- PLANNING MESSAGES POLICIES
-- =============================================================================

-- Access via conversation
CREATE POLICY planning_messages_select ON planning_messages FOR SELECT
    USING (conversation_id IN (SELECT id FROM planning_conversations));

CREATE POLICY planning_messages_insert ON planning_messages FOR INSERT
    WITH CHECK (conversation_id IN (SELECT id FROM planning_conversations));

-- =============================================================================
-- TASKS POLICIES
-- =============================================================================

-- Team members can see team tasks
CREATE POLICY tasks_select ON tasks FOR SELECT
    USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

CREATE POLICY tasks_insert ON tasks FOR INSERT
    WITH CHECK (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- AGENTS POLICIES
-- =============================================================================

-- Same as tasks (via task relationship)
CREATE POLICY agents_select ON agents FOR SELECT
    USING (task_id IN (
        SELECT id FROM tasks WHERE team_id IN (
            SELECT team_id FROM users WHERE id = auth.uid()
        )
    ));

-- =============================================================================
-- EVENTS POLICIES
-- =============================================================================

-- Same as tasks (via task relationship)
CREATE POLICY events_select ON events FOR SELECT
    USING (task_id IN (
        SELECT id FROM tasks WHERE team_id IN (
            SELECT team_id FROM users WHERE id = auth.uid()
        )
    ));
