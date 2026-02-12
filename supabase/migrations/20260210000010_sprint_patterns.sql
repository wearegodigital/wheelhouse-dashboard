-- Add execution pattern columns to sprints table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sprints' AND column_name = 'pattern'
    ) THEN
        ALTER TABLE sprints ADD COLUMN pattern TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sprints' AND column_name = 'distribution'
    ) THEN
        ALTER TABLE sprints ADD COLUMN distribution TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sprints' AND column_name = 'pattern_config'
    ) THEN
        ALTER TABLE sprints ADD COLUMN pattern_config JSONB;
    END IF;
END $$;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sprints_pattern ON sprints(pattern);
CREATE INDEX IF NOT EXISTS idx_sprints_distribution ON sprints(distribution);
