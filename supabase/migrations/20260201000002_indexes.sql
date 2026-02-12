-- =============================================================================
-- WHEELHOUSE DATABASE SCHEMA - INDEXES
-- =============================================================================

-- =============================================================================
-- TEAMS
-- =============================================================================

CREATE INDEX idx_teams_slug ON teams(slug);

-- =============================================================================
-- USERS
-- =============================================================================

CREATE INDEX idx_users_team_id ON users(team_id);
CREATE INDEX idx_users_email ON users(email);

-- =============================================================================
-- API KEYS
-- =============================================================================

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);

-- =============================================================================
-- PROJECTS
-- =============================================================================

CREATE INDEX idx_projects_team_id ON projects(team_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- =============================================================================
-- SPRINTS
-- =============================================================================

CREATE INDEX idx_sprints_project_id ON sprints(project_id);
CREATE INDEX idx_sprints_status ON sprints(status);
CREATE INDEX idx_sprints_order ON sprints(project_id, order_index);

-- =============================================================================
-- PLANNING CONVERSATIONS
-- =============================================================================

CREATE INDEX idx_planning_conversations_project_id ON planning_conversations(project_id);
CREATE INDEX idx_planning_conversations_sprint_id ON planning_conversations(sprint_id);
CREATE INDEX idx_planning_conversations_status ON planning_conversations(status);

-- =============================================================================
-- PLANNING MESSAGES
-- =============================================================================

CREATE INDEX idx_planning_messages_conversation_id ON planning_messages(conversation_id);
CREATE INDEX idx_planning_messages_created_at ON planning_messages(created_at);

-- =============================================================================
-- TASKS
-- =============================================================================

CREATE INDEX idx_tasks_team_id ON tasks(team_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_sprint_id ON tasks(sprint_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_team_status ON tasks(team_id, status);
CREATE INDEX idx_tasks_sprint_order ON tasks(sprint_id, order_index);

-- =============================================================================
-- AGENTS
-- =============================================================================

CREATE INDEX idx_agents_task_id ON agents(task_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_type ON agents(type);

-- =============================================================================
-- EVENTS
-- =============================================================================

CREATE INDEX idx_events_task_id ON events(task_id);
CREATE INDEX idx_events_agent_id ON events(agent_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_source_cursor ON events(source_cursor);
CREATE INDEX idx_events_source_hash ON events(source_hash);
