CREATE TABLE project_notion_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    notion_page_id TEXT NOT NULL,
    notion_task_id UUID REFERENCES notion_tasks(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'source' CHECK (role IN ('source', 'reference', 'related')),
    title TEXT NOT NULL DEFAULT '',
    url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(project_id, notion_page_id)
);

CREATE INDEX idx_project_notion_links_project ON project_notion_links(project_id);
CREATE INDEX idx_project_notion_links_notion_page ON project_notion_links(notion_page_id);

ALTER TABLE project_notion_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON project_notion_links FOR ALL USING (true) WITH CHECK (true);
