-- Migration: 00008_align_enums
-- Description: Align DB enums with backend Python code
--
-- Fixes:
-- 1. task_status enum missing 'assigned', 'in_progress', 'checking', 'deleted'
--    (Backend uses these; DB only had 'pending','queued','running','validating','completed','failed','cancelled')
-- 2. planning_message_role enum missing 'assistant'
--    (Backend writes role='assistant' but enum only has 'user','orchestrator','system')

-- Add missing task_status enum values
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'checking';
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'deleted';

-- Add missing planning_message_role enum value
ALTER TYPE planning_message_role ADD VALUE IF NOT EXISTS 'assistant';
