-- Migration 011: Align DB enums with Python code
--
-- Fixes:
-- 1. task_status enum missing 'assigned', 'in_progress', 'checking', 'deleted'
--    (Python TaskStatus uses these; DB had 'queued', 'running', 'validating')
-- 2. planning_message_role enum missing 'assistant'
--    (API writes role='assistant' but enum only has 'user','orchestrator','system')

-- Add missing task_status enum values
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'checking';
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'deleted';

-- Add missing planning_message_role enum value
-- (handles both CHECK constraint and enum type variants)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'planning_message_role') THEN
        EXECUTE 'ALTER TYPE planning_message_role ADD VALUE IF NOT EXISTS ''assistant''';
    ELSE
        ALTER TABLE planning_messages DROP CONSTRAINT IF EXISTS planning_messages_role_check;
        ALTER TABLE planning_messages ADD CONSTRAINT planning_messages_role_check
            CHECK (role IN ('user', 'orchestrator', 'system', 'assistant'));
    END IF;
END $$;
