ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS repo_id UUID REFERENCES repos(id) ON DELETE SET NULL;
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_repo_id ON projects(repo_id);
