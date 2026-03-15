CREATE TABLE IF NOT EXISTS agent_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    agent_role TEXT NOT NULL,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    success BOOLEAN NOT NULL DEFAULT true,
    summary TEXT NOT NULL DEFAULT '',
    files_modified JSONB NOT NULL DEFAULT '[]'::jsonb,
    key_decisions JSONB NOT NULL DEFAULT '[]'::jsonb,
    issues_encountered JSONB NOT NULL DEFAULT '[]'::jsonb,
    error TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_summaries_task_id ON agent_summaries(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_summaries_sprint_id ON agent_summaries(sprint_id);

ALTER TABLE agent_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view agent summaries" ON agent_summaries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks t
            JOIN sprints s ON s.id = t.sprint_id
            JOIN projects p ON p.id = s.project_id
            WHERE t.id = agent_summaries.task_id
                AND p.team_id = public.get_current_user_team_id()
        )
    );

CREATE POLICY "Service role can insert agent summaries" ON agent_summaries
    FOR INSERT WITH CHECK (true);
