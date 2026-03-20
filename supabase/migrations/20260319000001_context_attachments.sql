CREATE TABLE context_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    repo_id UUID REFERENCES repos(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('file', 'notion_link', 'url', 'text_note')),
    title TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    url TEXT,
    notion_page_id TEXT,
    mime_type TEXT,
    file_size_bytes BIGINT,
    ai_context_summary TEXT,
    storage_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT exactly_one_parent CHECK (
        (client_id IS NOT NULL)::int +
        (repo_id IS NOT NULL)::int +
        (project_id IS NOT NULL)::int +
        (sprint_id IS NOT NULL)::int +
        (task_id IS NOT NULL)::int = 1
    )
);

CREATE INDEX idx_context_attachments_client ON context_attachments(client_id) WHERE client_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_context_attachments_repo ON context_attachments(repo_id) WHERE repo_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_context_attachments_project ON context_attachments(project_id) WHERE project_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_context_attachments_sprint ON context_attachments(sprint_id) WHERE sprint_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_context_attachments_task ON context_attachments(task_id) WHERE task_id IS NOT NULL AND deleted_at IS NULL;

ALTER TABLE context_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON context_attachments FOR ALL USING (true) WITH CHECK (true);
