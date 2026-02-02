-- Migration: 00004_add_activity_log
-- Description: Add activity_log table for tracking user actions

-- ============================================================================
-- ACTIVITY LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL, -- 'project', 'sprint', 'task', 'comment'
  entity_id UUID NOT NULL,
  entity_name TEXT, -- Human-readable name for display
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'started', 'completed', 'failed', 'commented'
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for activity_log
CREATE INDEX idx_activity_log_team_id ON activity_log(team_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_entity_type ON activity_log(entity_type);
CREATE INDEX idx_activity_log_entity_id ON activity_log(entity_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity_log
CREATE POLICY "Users can read activity in their team"
  ON activity_log FOR SELECT
  USING (
    team_id = public.get_current_user_team_id()
    OR team_id IS NULL
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can create activity entries"
  ON activity_log FOR INSERT
  WITH CHECK (
    team_id = public.get_current_user_team_id()
    OR team_id IS NULL
  );

-- Comment
COMMENT ON TABLE activity_log IS 'Tracks user actions for activity feed display';
