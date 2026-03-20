-- Clients table: TEXT columns with CHECK constraints (no Postgres enums)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    notion_id TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'archived', 'deleted')),
    client_type TEXT NOT NULL DEFAULT 'project-based' CHECK (client_type IN ('project-based', 'retainer', 'internal')),
    contact_email TEXT,
    contact_phone TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    deleted_by TEXT
);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_notion_id ON clients(notion_id) WHERE notion_id IS NOT NULL;
CREATE INDEX idx_clients_deleted_at ON clients(deleted_at);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
