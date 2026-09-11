-- Per-customer, per-model pricing overrides, scoped to an OwnAPI customer group.
-- NULL is represented by deleting the row; the effective rate then falls back
-- to the existing user-group override and finally the group default.
CREATE TABLE IF NOT EXISTS user_model_rate_overrides (
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id        BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    model_id        VARCHAR(255) NOT NULL,
    rate_multiplier DECIMAL(10,4) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, group_id, model_id),
    CONSTRAINT user_model_rate_overrides_rate_positive CHECK (rate_multiplier > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_model_rate_overrides_lookup
    ON user_model_rate_overrides(user_id, group_id, lower(model_id));

COMMENT ON TABLE user_model_rate_overrides IS '客户按 OwnAPI 分组和模型设置的专属倍率';
COMMENT ON COLUMN user_model_rate_overrides.rate_multiplier IS '覆盖客户分组倍率；例如 0.8 表示在该模型基础价格上再乘 0.8';
