-- Add the two customer-facing DeepSeek V4 models through their dedicated
-- Packy deepseek-sale account and correct GPT-6 Astra customer billing.
-- This migration never creates an upstream account or stores an API token.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '2min';

-- Remove any stale DeepSeek entries from this channel before inserting the
-- approved one-model rows. This remains idempotent even if an administrator
-- previously grouped either model with another price record.
UPDATE channel_model_pricing pricing
SET models = pricing.models - 'deepseek-v4.1-flash' - 'deepseek-v4-pro',
    updated_at = NOW()
FROM channels channel
WHERE pricing.channel_id = channel.id
  AND channel.name = 'OwnAPI LLM'
  AND pricing.models ?| ARRAY['deepseek-v4.1-flash', 'deepseek-v4-pro'];

DELETE FROM channel_pricing_intervals cpi
USING channel_model_pricing pricing, channels channel
WHERE cpi.pricing_id = pricing.id
  AND pricing.channel_id = channel.id
  AND channel.name = 'OwnAPI LLM'
  AND pricing.models ?| ARRAY['deepseek-v4.1-flash', 'deepseek-v4-pro'];

DELETE FROM channel_model_pricing
WHERE channel_id = (SELECT id FROM channels WHERE name = 'OwnAPI LLM')
  AND models = '[]'::jsonb;

WITH target AS (
    SELECT id AS channel_id FROM channels WHERE name = 'OwnAPI LLM'
), prices(model, input_mtok, output_mtok, cache_read_mtok) AS (
    VALUES
      ('deepseek-v4.1-flash', 0.1125, 0.45, 0.00225),
      ('deepseek-v4-pro',     0.1125, 0.45, 0.00225)
)
INSERT INTO channel_model_pricing (
    channel_id, platform, models, billing_mode,
    input_price, output_price, cache_write_price, cache_read_price
)
SELECT
    target.channel_id,
    'openai',
    jsonb_build_array(prices.model),
    'token',
    prices.input_mtok / 1000000.0,
    prices.output_mtok / 1000000.0,
    NULL,
    prices.cache_read_mtok / 1000000.0
FROM target CROSS JOIN prices;

-- GPT-6 defaults use the short-context customer price. Replace both ranges so
-- every token count resolves to the corrected 70-percent price.
UPDATE channel_model_pricing pricing
SET input_price = 7.0 / 1000000.0,
    output_price = 35.0 / 1000000.0,
    cache_write_price = 8.75 / 1000000.0,
    cache_read_price = 0.7 / 1000000.0,
    updated_at = NOW()
FROM channels channel
WHERE pricing.channel_id = channel.id
  AND channel.name = 'OwnAPI LLM'
  AND pricing.models = '["gpt-6-astra"]'::jsonb;

WITH target AS (
    SELECT id AS channel_id FROM channels WHERE name = 'OwnAPI LLM'
)
INSERT INTO channel_model_pricing (
    channel_id, platform, models, billing_mode,
    input_price, output_price, cache_write_price, cache_read_price
)
SELECT
    target.channel_id, 'openai', '["gpt-6-astra"]'::jsonb, 'token',
    7.0 / 1000000.0, 35.0 / 1000000.0, 8.75 / 1000000.0, 0.7 / 1000000.0
FROM target
WHERE NOT EXISTS (
    SELECT 1 FROM channel_model_pricing pricing
    WHERE pricing.channel_id = target.channel_id
      AND pricing.models = '["gpt-6-astra"]'::jsonb
);

DELETE FROM channel_pricing_intervals cpi
USING channel_model_pricing pricing, channels channel
WHERE cpi.pricing_id = pricing.id
  AND pricing.channel_id = channel.id
  AND channel.name = 'OwnAPI LLM'
  AND pricing.models = '["gpt-6-astra"]'::jsonb;

WITH tiers(label, min_tokens, max_tokens, input_mtok, output_mtok, cache_write_mtok, cache_read_mtok, sort_order) AS (
    VALUES
      ('short',      0, 200000, 7.0,  35.0,  8.75, 0.7, 1),
      ('long',  200000,   NULL, 14.0, 52.5, 17.5, 1.4, 2)
)
INSERT INTO channel_pricing_intervals (
    pricing_id, min_tokens, max_tokens, tier_label,
    input_price, output_price, cache_write_price, cache_read_price, sort_order
)
SELECT
    pricing.id,
    tiers.min_tokens,
    tiers.max_tokens,
    tiers.label,
    tiers.input_mtok / 1000000.0,
    tiers.output_mtok / 1000000.0,
    tiers.cache_write_mtok / 1000000.0,
    tiers.cache_read_mtok / 1000000.0,
    tiers.sort_order
FROM tiers
JOIN channel_model_pricing pricing ON pricing.models = '["gpt-6-astra"]'::jsonb
JOIN channels channel ON channel.id = pricing.channel_id AND channel.name = 'OwnAPI LLM';

-- A dedicated Packy account must be created separately with a deepseek-sale
-- token. If it already exists, replace its whitelist with exactly the two
-- approved customer-to-upstream mappings. No other Packy account is touched.
UPDATE accounts
SET credentials = jsonb_set(
        COALESCE(credentials, '{}'::jsonb),
        '{model_mapping}',
        '{"deepseek-v4.1-flash":"deepseek-v4-flash","deepseek-v4-pro":"deepseek-v4-pro"}'::jsonb,
        true
    ),
    updated_at = NOW()
WHERE name = 'Packy / DeepSeek Sale'
  AND deleted_at IS NULL
  AND extra->>'upstream_provider' = 'packyapi';

DELETE FROM channel_account_stats_pricing_rules rule
USING channels channel
WHERE rule.channel_id = channel.id
  AND channel.name = 'OwnAPI LLM'
  AND rule.name = 'Packy cost / DeepSeek Sale';

WITH target AS (
    SELECT id AS channel_id FROM channels WHERE name = 'OwnAPI LLM'
), account AS (
    SELECT id FROM accounts
    WHERE name = 'Packy / DeepSeek Sale'
      AND deleted_at IS NULL
      AND extra->>'upstream_provider' = 'packyapi'
)
INSERT INTO channel_account_stats_pricing_rules (
    channel_id, name, group_ids, account_ids, sort_order
)
SELECT target.channel_id, 'Packy cost / DeepSeek Sale', '{}'::bigint[], ARRAY[account.id], 50
FROM target CROSS JOIN account;

-- Packy displays these deepseek-sale deductions as CNY per MTok under its
-- RMB/USD 1:1 convention. OwnAPI account statistics normalize them to USD at
-- the configured 6.7 CNY per USD. Cost lookup uses the final upstream model ID.
WITH costs(model, input_cny, output_cny, cache_read_cny) AS (
    VALUES
      ('deepseek-v4-flash', 1.5,  4.5,  0.05),
      ('deepseek-v4-pro',   4.5, 13.5,  0.15)
)
INSERT INTO channel_account_stats_model_pricing (
    rule_id, platform, models, billing_mode,
    input_price, output_price, cache_write_price, cache_read_price
)
SELECT
    rule.id,
    'openai',
    jsonb_build_array(costs.model),
    'token',
    costs.input_cny / 6.7 / 1000000.0,
    costs.output_cny / 6.7 / 1000000.0,
    NULL,
    costs.cache_read_cny / 6.7 / 1000000.0
FROM costs
JOIN channel_account_stats_pricing_rules rule ON rule.name = 'Packy cost / DeepSeek Sale'
JOIN channels channel ON channel.id = rule.channel_id AND channel.name = 'OwnAPI LLM';
