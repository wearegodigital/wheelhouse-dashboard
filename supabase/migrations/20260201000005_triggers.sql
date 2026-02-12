-- =============================================================================
-- WHEELHOUSE DATABASE SCHEMA - TRIGGERS
-- =============================================================================

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- APPLY UPDATED_AT TRIGGERS
-- =============================================================================

CREATE TRIGGER teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sprints_updated_at
    BEFORE UPDATE ON sprints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER planning_conversations_updated_at
    BEFORE UPDATE ON planning_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sync_state_updated_at
    BEFORE UPDATE ON sync_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- REALTIME NOTIFICATION TRIGGER FUNCTION
-- =============================================================================

-- Notify on task status changes (for Realtime)
CREATE OR REPLACE FUNCTION notify_task_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Supabase Realtime automatically handles this via publication
    -- This function can be extended for custom notifications
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_change_notify
    AFTER INSERT OR UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION notify_task_change();

-- =============================================================================
-- USER CREATION TRIGGER (for Supabase Auth integration)
-- =============================================================================

-- Auto-create user record on Supabase Auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_team_id UUID;
BEGIN
    -- Get or create default team
    SELECT id INTO default_team_id FROM teams WHERE slug = 'default';

    IF default_team_id IS NULL THEN
        INSERT INTO teams (name, slug)
        VALUES ('Default Team', 'default')
        RETURNING id INTO default_team_id;
    END IF;

    -- Create user record
    INSERT INTO users (id, email, team_id, role)
    VALUES (
        NEW.id,
        NEW.email,
        default_team_id,
        'member'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on Supabase Auth user creation
-- Note: This trigger requires access to auth.users table
-- It should be created in the Supabase dashboard or via migration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
