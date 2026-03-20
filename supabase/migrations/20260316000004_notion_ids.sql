ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notion_id TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS notion_id TEXT;
CREATE INDEX idx_tasks_notion_id ON tasks(notion_id) WHERE notion_id IS NOT NULL;
CREATE INDEX idx_projects_notion_id ON projects(notion_id) WHERE notion_id IS NOT NULL;
