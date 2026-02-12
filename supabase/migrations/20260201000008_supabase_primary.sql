-- =============================================================================
-- Migration 008: Supabase Primary Store Preparation
-- =============================================================================
-- Purpose: Prepares Supabase schema to become the primary store for CRUD operations.
--          Ensures all columns written by sync worker exist with proper types.
--          Adds source_id columns for backward compatibility with Modal short IDs.
--          All operations are idempotent (safe to run multiple times).
-- =============================================================================

-- =============================================================================
-- PART 1: Add source_id columns for Modal ID backward compatibility
-- =============================================================================

DO $$
BEGIN
    -- Projects: source_id for Modal short ID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'source_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN source_id TEXT;
        CREATE INDEX idx_projects_source_id ON projects(source_id);
    END IF;

    -- Sprints: source_id for Modal short ID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sprints' AND column_name = 'source_id'
    ) THEN
        ALTER TABLE sprints ADD COLUMN source_id TEXT;
        CREATE INDEX idx_sprints_source_id ON sprints(source_id);
    END IF;

    -- Tasks: source_id for Modal short ID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'source_id'
    ) THEN
        ALTER TABLE tasks ADD COLUMN source_id TEXT;
        CREATE INDEX idx_tasks_source_id ON tasks(source_id);
    END IF;
END $$;

-- =============================================================================
-- PART 2: Add execution pattern and distribution columns to tasks
-- =============================================================================

DO $$
BEGIN
    -- Task title (sync worker writes this)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'title'
    ) THEN
        ALTER TABLE tasks ADD COLUMN title TEXT DEFAULT '';
    END IF;

    -- Execution pattern (sequential/tournament/cascade/ensemble)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'pattern'
    ) THEN
        ALTER TABLE tasks ADD COLUMN pattern TEXT;
    END IF;

    -- Distribution mode (single/swarm)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'distribution'
    ) THEN
        ALTER TABLE tasks ADD COLUMN distribution TEXT;
    END IF;

    -- Pattern configuration (JSONB for pattern-specific settings)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'pattern_config'
    ) THEN
        ALTER TABLE tasks ADD COLUMN pattern_config JSONB;
    END IF;
END $$;

-- =============================================================================
-- PART 3: Add recommendation column to planning_conversations
-- =============================================================================

DO $$
BEGIN
    -- Planning recommendation (structured decomposition proposal)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'planning_conversations' AND column_name = 'recommendation'
    ) THEN
        ALTER TABLE planning_conversations ADD COLUMN recommendation JSONB;
    END IF;
END $$;

-- =============================================================================
-- PART 4: Create planning_sessions table
-- =============================================================================

CREATE TABLE IF NOT EXISTS planning_sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     UUID REFERENCES planning_conversations(id) ON DELETE CASCADE,
    repo_url            TEXT NOT NULL,
    project_id          UUID REFERENCES projects(id) ON DELETE CASCADE,
    workspace_path      TEXT,
    session_state       JSONB DEFAULT '{}',
    last_activity       TIMESTAMPTZ DEFAULT NOW(),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on conversation_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_planning_sessions_conversation_id
    ON planning_sessions(conversation_id);

-- Create index on project_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_planning_sessions_project_id
    ON planning_sessions(project_id);

-- =============================================================================
-- PART 5: Add 'deleted' to status enums (if they exist as enums)
-- =============================================================================

DO $$
BEGIN
    -- Check if project_status is an enum type
    IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'project_status'
    ) THEN
        -- Add 'deleted' value if it doesn't exist
        ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'deleted';
    END IF;

    -- Check if sprint_status is an enum type
    IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'sprint_status'
    ) THEN
        -- Add 'deleted' value if it doesn't exist
        ALTER TYPE sprint_status ADD VALUE IF NOT EXISTS 'deleted';
    END IF;

    -- Check if task_status is an enum type
    IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'task_status'
    ) THEN
        -- Add 'deleted' value if it doesn't exist
        ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'deleted';
    END IF;
END $$;

-- =============================================================================
-- PART 6: Update views to ensure deleted records are filtered
-- =============================================================================

-- project_summary view already created correctly in migration 007
-- with deleted_at/deleted_by columns and created_by fields.
-- No recreation needed here.

-- =============================================================================
-- PART 7: Create indexes for new columns
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_tasks_pattern ON tasks(pattern);
CREATE INDEX IF NOT EXISTS idx_tasks_distribution ON tasks(distribution);
CREATE INDEX IF NOT EXISTS idx_tasks_title ON tasks(title);

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
