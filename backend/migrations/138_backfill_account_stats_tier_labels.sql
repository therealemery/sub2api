-- Account-statistics tier labels are descriptive metadata, but the repository
-- scans them as a non-null string. Backfill the Packy pricing intervals that
-- were seeded without labels and keep this migration safe to run once.
UPDATE channel_account_stats_pricing_intervals
SET tier_label = CASE
    WHEN min_tokens = 0 AND max_tokens IS NOT NULL THEN 'short'
    WHEN min_tokens > 0 AND max_tokens IS NOT NULL THEN 'mid'
    WHEN min_tokens > 0 AND max_tokens IS NULL THEN 'long'
    ELSE 'default'
END
WHERE tier_label IS NULL;
