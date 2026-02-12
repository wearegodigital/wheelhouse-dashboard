-- Migration 012: Add 'failed' to sprint_status and project_status enums
--
-- monitor_sprint and monitor_project need to set status to 'failed'
-- when tasks/sprints fail, but the enum didn't include it.

ALTER TYPE sprint_status ADD VALUE IF NOT EXISTS 'failed';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'failed';
