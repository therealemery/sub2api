-- Persist the immutable pricing decision used for each billable request.
-- Historical rows retain their stored costs and receive only the neutral default.
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS pricing_effective_at TIMESTAMPTZ NULL;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS condition_multiplier NUMERIC(10,4) NOT NULL DEFAULT 1;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS pricing_rule_id VARCHAR(128) NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'usage_logs_condition_multiplier_positive'
          AND conrelid = 'usage_logs'::regclass
    ) THEN
        ALTER TABLE usage_logs
            ADD CONSTRAINT usage_logs_condition_multiplier_positive
            CHECK (condition_multiplier > 0);
    END IF;
END $$;
