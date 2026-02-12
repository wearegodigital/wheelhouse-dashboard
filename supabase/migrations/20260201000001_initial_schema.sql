-- =============================================================================
-- WHEELHOUSE DATABASE SCHEMA - INITIAL MIGRATION
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE project_status AS ENUM (
    'draft',        -- Being planned, not started
    'planning',     -- In planning conversation with orchestrator
    'ready',        -- Decomposed, ready to execute
    'running',      -- Execution in progress
    'paused',       -- Temporarily stopped
    'completed',    -- All sprints done
    'cancelled'     -- Abandoned
);

CREATE TYPE sprint_status AS ENUM (
    'draft',        -- Being planned
    'ready',        -- Decomposed, ready to execute
    'running',      -- Execution in progress
    'paused',       -- Temporarily stopped
    'completed',    -- All tasks done
    'cancelled'     -- Abandoned
);

CREATE TYPE conversation_status AS ENUM (
    'active',       -- Ongoing conversation
    'approved',     -- User approved the plan
    'cancelled'     -- User cancelled planning
);

CREATE TYPE task_status AS ENUM (
    'pending',      -- Created, not started
    'queued',       -- Waiting for agent
    'running',      -- Agent actively working
    'validating',   -- Checker running
    'completed',    -- Successfully done
    'failed',       -- Failed after retries
    'cancelled'     -- User cancelled
);

CREATE TYPE execution_mode AS ENUM (
    'sequential',
    'parallel',
    'swarm',
    'competitive'
);

CREATE TYPE agent_type AS ENUM (
    'orchestrator',
    'maker',
    'checker',
    'joiner',
    'documenter'
);

CREATE TYPE agent_status AS ENUM (
    'spawned',
    'running',
    'completed',
    'failed'
);

-- =============================================================================
-- TEAMS & USERS (Authentication Layer)
-- =============================================================================

CREATE TABLE teams (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    settings        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL UNIQUE,
    team_id         UUID REFERENCES teams(id) ON DELETE SET NULL,
    role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    display_name    TEXT,
    avatar_url      TEXT,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE api_keys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    key_hash        TEXT NOT NULL UNIQUE,  -- SHA-256 hash of the key
    key_prefix      TEXT NOT NULL,          -- First 8 chars for identification
    scopes          TEXT[] DEFAULT ARRAY['read', 'write'],
    last_used_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PROJECTS (Top-level work containers)
-- =============================================================================

CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID REFERENCES teams(id) ON DELETE CASCADE,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Project definition
    name            TEXT NOT NULL,
    description     TEXT NOT NULL,
    repo_url        TEXT NOT NULL,
    default_branch  TEXT DEFAULT 'main',

    -- Status tracking
    status          project_status DEFAULT 'draft',

    -- Metadata (flexible JSON for extensions)
    metadata        JSONB DEFAULT '{}',

    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ
);

-- =============================================================================
-- SPRINTS (Work periods within projects)
-- =============================================================================

CREATE TABLE sprints (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,

    -- Sprint definition
    name            TEXT NOT NULL,
    description     TEXT,
    order_index     INTEGER NOT NULL DEFAULT 0,  -- Order within project

    -- Status tracking
    status          sprint_status DEFAULT 'draft',

    -- Metadata
    metadata        JSONB DEFAULT '{}',

    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ
);

-- =============================================================================
-- PLANNING CONVERSATIONS (Chat with Orchestrator)
-- =============================================================================

CREATE TABLE planning_conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Can be linked to project, sprint, or standalone task
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    sprint_id       UUID REFERENCES sprints(id) ON DELETE CASCADE,
    task_id         UUID,  -- FK added after tasks table created

    -- Conversation state
    status          conversation_status DEFAULT 'active',

    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE TABLE planning_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES planning_conversations(id) ON DELETE CASCADE,

    -- Message content
    role            TEXT NOT NULL CHECK (role IN ('user', 'orchestrator', 'system')),
    content         TEXT NOT NULL,

    -- For orchestrator messages: structured recommendations
    recommendations JSONB,  -- Proposed decomposition

    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TASKS (Core Domain)
-- =============================================================================

CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID REFERENCES teams(id) ON DELETE CASCADE,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Hierarchy (optional - tasks can be standalone)
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    sprint_id       UUID REFERENCES sprints(id) ON DELETE CASCADE,
    order_index     INTEGER DEFAULT 0,  -- Order within sprint

    -- Task definition
    repo_url        TEXT NOT NULL,
    branch          TEXT,
    description     TEXT NOT NULL,

    -- Execution config
    mode            execution_mode DEFAULT 'sequential',
    agent_count     INTEGER DEFAULT 1,

    -- Status tracking
    status          task_status DEFAULT 'pending',
    progress        INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

    -- Results
    pr_url          TEXT,
    pr_number       INTEGER,
    error           TEXT,

    -- Metadata (flexible JSON for extensions)
    metadata        JSONB DEFAULT '{}',

    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ
);

-- Add FK constraint to planning_conversations now that tasks table exists
ALTER TABLE planning_conversations
    ADD CONSTRAINT fk_planning_conversations_task
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- =============================================================================
-- AGENTS (Execution Tracking)
-- =============================================================================

CREATE TABLE agents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

    type            agent_type NOT NULL,
    status          agent_status DEFAULT 'spawned',

    -- Execution details
    worker_index    INTEGER,  -- For parallel/swarm modes

    -- Progress tracking
    current_step    TEXT,
    steps_completed INTEGER DEFAULT 0,

    -- Results
    error           TEXT,
    output          JSONB DEFAULT '{}',

    -- Metadata
    metadata        JSONB DEFAULT '{}',

    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ
);

-- =============================================================================
-- EVENTS (Audit Trail)
-- =============================================================================

CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID REFERENCES tasks(id) ON DELETE CASCADE,
    agent_id        UUID REFERENCES agents(id) ON DELETE SET NULL,

    -- Event type (matches JSONL event types)
    type            TEXT NOT NULL,

    -- Full event payload
    payload         JSONB NOT NULL,

    -- Source tracking (for sync deduplication)
    source_cursor   BIGINT,  -- Position in JSONL file
    source_hash     TEXT,    -- Hash for idempotency

    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SYNC STATE (For Modal -> Supabase sync)
-- =============================================================================

CREATE TABLE sync_state (
    id              TEXT PRIMARY KEY DEFAULT 'default',
    cursor          BIGINT DEFAULT 0,      -- Last processed byte offset
    event_count     BIGINT DEFAULT 0,      -- Total events synced
    last_event_id   UUID,                  -- Last event synced
    last_sync_at    TIMESTAMPTZ,
    error           TEXT,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize sync state
INSERT INTO sync_state (id) VALUES ('default') ON CONFLICT DO NOTHING;
