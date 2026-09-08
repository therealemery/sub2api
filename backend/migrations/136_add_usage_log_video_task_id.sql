-- Keep opaque OwnAPI video task tokens outside the general usage-log payload.
-- Only authenticated, owner-scoped video history handlers read this table.
CREATE TABLE IF NOT EXISTS usage_video_tasks (
    usage_log_id BIGINT PRIMARY KEY REFERENCES usage_logs(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_video_tasks_user_id
    ON usage_video_tasks(user_id);
