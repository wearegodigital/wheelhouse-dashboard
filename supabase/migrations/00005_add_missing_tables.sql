-- Migration: 00005_add_missing_tables
-- Description: Add task_comments and team_invites tables that were defined in types but not created

-- ============================================================================
-- TASK COMMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX idx_task_comments_parent_id ON task_comments(parent_id);
CREATE INDEX idx_task_comments_created_at ON task_comments(created_at);

-- Enable RLS
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can read comments on tasks in their team"
  ON task_comments FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE team_id = public.get_current_user_team_id()
         OR team_id IS NULL
         OR created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create comments on tasks in their team"
  ON task_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND task_id IN (
      SELECT id FROM tasks
      WHERE team_id = public.get_current_user_team_id()
         OR team_id IS NULL
    )
  );

CREATE POLICY "Users can update their own comments"
  ON task_comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON task_comments FOR DELETE
  USING (user_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TEAM INVITES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_team_invites_team_id ON team_invites(team_id);
CREATE INDEX idx_team_invites_email ON team_invites(email);
CREATE INDEX idx_team_invites_token ON team_invites(token);
CREATE INDEX idx_team_invites_status ON team_invites(status);

-- Enable RLS
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can read invites for their team"
  ON team_invites FOR SELECT
  USING (
    team_id = public.get_current_user_team_id()
    OR email = (SELECT email FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Team admins can create invites"
  ON team_invites FOR INSERT
  WITH CHECK (
    team_id = public.get_current_user_team_id()
    AND invited_by = auth.uid()
  );

CREATE POLICY "Team admins can update invites"
  ON team_invites FOR UPDATE
  USING (team_id = public.get_current_user_team_id());

CREATE POLICY "Team admins can delete invites"
  ON team_invites FOR DELETE
  USING (team_id = public.get_current_user_team_id());

-- Updated_at trigger
CREATE TRIGGER update_team_invites_updated_at
  BEFORE UPDATE ON team_invites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE task_comments IS 'Comments on tasks for collaboration';
COMMENT ON TABLE team_invites IS 'Pending invitations to join teams';
