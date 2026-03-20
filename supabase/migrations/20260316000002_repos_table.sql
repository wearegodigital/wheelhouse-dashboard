-- Repos table: TEXT columns with CHECK constraints (no Postgres enums)
CREATE TABLE IF NOT EXISTS repos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    github_org TEXT NOT NULL DEFAULT '',
    github_repo TEXT NOT NULL DEFAULT '',
    default_branch TEXT NOT NULL DEFAULT 'main',
    repo_url TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    deleted_by TEXT
);
CREATE INDEX idx_repos_client_id ON repos(client_id);
CREATE INDEX idx_repos_github ON repos(github_org, github_repo);
CREATE INDEX idx_repos_deleted_at ON repos(deleted_at);
ALTER TABLE repos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on repos" ON repos FOR ALL USING (true) WITH CHECK (true);
