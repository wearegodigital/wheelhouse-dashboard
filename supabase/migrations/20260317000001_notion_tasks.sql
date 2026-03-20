CREATE TABLE IF NOT EXISTS notion_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notion_page_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT '',
    priority TEXT NOT NULL DEFAULT '',
    task_type TEXT NOT NULL DEFAULT '',
    client_name TEXT NOT NULL DEFAULT '',
    project_name TEXT NOT NULL DEFAULT '',
    due_date TEXT,
    estimated_time FLOAT,
    wheelhouse_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    content_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    image_urls TEXT[] NOT NULL DEFAULT '{}',
    -- content_blocks and image_urls reserved for future use:
    -- Phase 2+ will parse Notion block children into content_blocks
    -- and extract image URLs from file/external blocks into image_urls.
    -- NOT populated by the sync flow in this plan.
    notion_created_at TIMESTAMPTZ,
    notion_last_edited TIMESTAMPTZ,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    missing_since TIMESTAMPTZ,
    consecutive_misses INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    deleted_by TEXT
);
-- NOTE: client_name and project_name will be '' after sync because
-- _get_relation_title is a stub that cannot resolve Notion relations
-- without additional API calls. Resolving relations is a separate
-- future enhancement. No index on client_name until it is populated.
CREATE INDEX idx_notion_tasks_status ON notion_tasks(status);
CREATE INDEX idx_notion_tasks_wh_task ON notion_tasks(wheelhouse_task_id) WHERE wheelhouse_task_id IS NOT NULL;
CREATE INDEX idx_notion_tasks_synced ON notion_tasks(synced_at);
CREATE INDEX idx_notion_tasks_deleted ON notion_tasks(deleted_at);
ALTER TABLE notion_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on notion_tasks" ON notion_tasks FOR ALL USING (true) WITH CHECK (true);
