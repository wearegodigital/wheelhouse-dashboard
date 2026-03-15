-- Migration: 20260315000001_add_missing_rls
-- Description: Add missing RLS policies for team_invites and activity_log.
--
-- After migration 20260212000012_dashboard_features:
--   - task_comments: SELECT, INSERT, UPDATE, DELETE — already complete
--   - activity_log:  SELECT, INSERT — missing DELETE
--   - team_invites:  SELECT, INSERT — missing UPDATE, DELETE
--   - projects/sprints/tasks: UPDATE already added in 012 — no gaps
--
-- All statements use DROP IF EXISTS + CREATE for idempotency.

-- ============================================================================
-- team_invites: add UPDATE (accept/expire) and DELETE (revoke) policies
-- ============================================================================

-- Admins can update invite status (e.g. mark as revoked/expired).
-- Invited users can also update to accept (sets status = 'accepted').
DROP POLICY IF EXISTS "Team admins can update invites" ON team_invites;
CREATE POLICY "Team admins can update invites"
  ON team_invites FOR UPDATE
  USING (
    team_id = public.get_current_user_team_id()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Admins can delete (hard-revoke) invites for their team.
DROP POLICY IF EXISTS "Team admins can delete invites" ON team_invites;
CREATE POLICY "Team admins can delete invites"
  ON team_invites FOR DELETE
  USING (
    team_id = public.get_current_user_team_id()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- activity_log: add DELETE policy (admins can prune old entries)
-- ============================================================================

DROP POLICY IF EXISTS "Team admins can delete activity entries" ON activity_log;
CREATE POLICY "Team admins can delete activity entries"
  ON activity_log FOR DELETE
  USING (
    team_id = public.get_current_user_team_id()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
