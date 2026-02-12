-- Migration 009: Add missing columns to planning_conversations
-- The WheelhouseDB.create_conversation() method writes mode and repo_url
-- which were not in the original schema.

-- Add mode column (interactive/quick)
ALTER TABLE planning_conversations ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'interactive';

-- Add repo_url column (planning context)
ALTER TABLE planning_conversations ADD COLUMN IF NOT EXISTS repo_url TEXT DEFAULT '';
