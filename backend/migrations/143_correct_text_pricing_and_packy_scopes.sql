-- Correct the reviewed OwnAPI text price snapshot and lock the cost-sensitive
-- Packy routes to their exact managed accounts. This migration never creates
-- an upstream account and never inserts, copies, or rotates a credential.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '2min';

-- Rebuild only the affected customer rows. Removing model IDs from a grouped
-- row first preserves any unrelated model and its existing pricing.
UPDATE channel_model_pricing pricing
SET models = pricing.models
        - 'deepseek-v4.1-flash' - 'deepseek-v4-pro'
        - 'gpt-5.4' - 'gpt-5.4-mini' - 'gpt-5.5' - 'codex-auto-review'
        - 'gpt-5.6-luna' - 'gpt-5.6-sol' - 'gpt-5.6-terra' - 'gpt-6-astra',
    updated_at = NOW()
FROM channels channel
WHERE pricing.channel_id = channel.id
  AND channel.name = 'OwnAPI LLM'
  AND pricing.models ?| ARRAY[
      'deepseek-v4.1-flash', 'deepseek-v4-pro',
      'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.5', 'codex-auto-review',
      'gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-6-astra'
  ];

DELETE FROM channel_model_pricing pricing
USING channels channel
WHERE pricing.channel_id = channel.id
  AND channel.name = 'OwnAPI LLM'
  AND pricing.models = '[]'::jsonb;

-- Flat/default prices are final customer USD/MTok values. DeepSeek Pro is
-- intentionally absent until an exact manufacturer-authoritative price is
-- reviewed. The Codex and other reviewed OpenAI rows are one-model records so
-- future corrections cannot accidentally alter a sibling model.
WITH target AS (
    SELECT id AS channel_id FROM channels WHERE name = 'OwnAPI LLM'
), prices(model, input_mtok, output_mtok, cache_write_mtok, cache_read_mtok) AS (
    VALUES
      ('deepseek-v4.1-flash', 0.105,  0.42,  NULL,  0.0021),
      ('gpt-5.4',              2.0,   12.0,   NULL,  0.2),
      ('gpt-5.4-mini',         0.6,    3.6,   NULL,  0.06),
      ('gpt-5.5',              4.0,   24.0,   NULL,  0.4),
      ('codex-auto-review',    2.0,   12.0,   NULL,  0.2),
      ('gpt-5.6-luna',         0.14,   0.84,  0.175, 0.014),
      ('gpt-5.6-sol',          2.8,   14.0,   3.5,   0.28),
      ('gpt-5.6-terra',        1.4,    8.4,   1.75,  0.14),
      ('gpt-6-astra',          7.0,   35.0,   8.75,  0.7)
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
    prices.cache_write_mtok / 1000000.0,
    prices.cache_read_mtok / 1000000.0
FROM target CROSS JOIN prices;

-- Complete, contiguous (min,max] customer tiers. Exactly 272,000 tokens use
-- the short tier; the long tier starts only above 272,000.
WITH tiers(model, min_tokens, max_tokens, label, input_mtok, output_mtok, cache_write_mtok, cache_read_mtok, sort_order) AS (
    VALUES
      ('gpt-5.4',          0, 272000, 'short', 2.0,  12.0, NULL, 0.2, 1),
      ('gpt-5.4',     272000,   NULL, 'long',  4.0,  18.0, NULL, 0.4, 2),
      ('gpt-5.6-luna',     0, 272000, 'short', 0.14,  0.84, 0.175, 0.014, 1),
      ('gpt-5.6-luna',272000,   NULL, 'long',  0.28,  1.26, 0.35,  0.028, 2),
      ('gpt-5.6-sol',      0, 272000, 'short', 2.8,  14.0,  3.5,   0.28, 1),
      ('gpt-5.6-sol', 272000,   NULL, 'long',  5.6,  21.0,  7.0,   0.56, 2),
      ('gpt-5.6-terra',    0, 272000, 'short', 1.4,   8.4,  1.75,  0.14, 1),
      ('gpt-5.6-terra',272000,  NULL, 'long',  2.8,  12.6,  3.5,   0.28, 2),
      ('gpt-6-astra',      0, 272000, 'short', 7.0,  35.0,  8.75,  0.7, 1),
      ('gpt-6-astra', 272000,   NULL, 'long', 14.0,  52.5, 17.5,   1.4, 2)
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
JOIN channels channel ON channel.name = 'OwnAPI LLM'
JOIN channel_model_pricing pricing
  ON pricing.channel_id = channel.id
 AND pricing.models = jsonb_build_array(tiers.model);

-- Exact managed-account scopes. Remove cost-sensitive mappings from every
-- managed Packy account first, then restore them only when one unambiguous
-- exact-name account exists. This also cleans stale wrong-account mappings and
-- makes duplicate exact-name accounts fail closed.
UPDATE accounts
SET credentials = jsonb_set(
        COALESCE(credentials, '{}'::jsonb),
        '{model_mapping}',
        COALESCE(credentials->'model_mapping', '{}'::jsonb)
          - 'gpt-5.6-luna' - 'gpt-5.6-sol' - 'gpt-5.6-terra' - 'gpt-6-astra'
          - 'deepseek-v4.1-flash' - 'deepseek-v4-pro',
        true
    ),
    updated_at = NOW()
WHERE deleted_at IS NULL
  AND extra->>'upstream_provider' = 'packyapi'
  AND COALESCE(credentials->'model_mapping', '{}'::jsonb) ?| ARRAY[
      'gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-6-astra',
      'deepseek-v4.1-flash', 'deepseek-v4-pro'
  ];

WITH exact_account AS (
    SELECT MIN(id) AS id
    FROM accounts
    WHERE name = 'Packy / Codex'
      AND deleted_at IS NULL
      AND extra->>'upstream_provider' = 'packyapi'
    HAVING COUNT(*) = 1
)
UPDATE accounts account
SET credentials = jsonb_set(
        COALESCE(credentials, '{}'::jsonb),
        '{model_mapping}',
        '{"gpt-5.6-luna":"gpt-5.6-luna","gpt-5.6-sol":"gpt-5.6-sol","gpt-5.6-terra":"gpt-5.6-terra","gpt-6-astra":"gpt-6-astra"}'::jsonb,
        true
    ),
    updated_at = NOW()
FROM exact_account
WHERE account.id = exact_account.id;

WITH exact_account AS (
    SELECT MIN(id) AS id
    FROM accounts
    WHERE name = 'Packy / DeepSeek Sale'
      AND deleted_at IS NULL
      AND extra->>'upstream_provider' = 'packyapi'
    HAVING COUNT(*) = 1
)
UPDATE accounts account
SET credentials = jsonb_set(
        COALESCE(credentials, '{}'::jsonb),
        '{model_mapping}',
        '{"deepseek-v4.1-flash":"deepseek-v4-flash"}'::jsonb,
        true
    ),
    updated_at = NOW()
FROM exact_account
WHERE account.id = exact_account.id;

-- Remove the old Core card entries even if migration 137 grouped them with a
-- future model. Empty rows cascade-delete their intervals.
UPDATE channel_account_stats_model_pricing pricing
SET models = pricing.models
        - 'gpt-5.6-luna' - 'gpt-5.6-sol' - 'gpt-5.6-terra' - 'gpt-6-astra',
    updated_at = NOW()
FROM channel_account_stats_pricing_rules rule, channels channel
WHERE pricing.rule_id = rule.id
  AND rule.channel_id = channel.id
  AND channel.name = 'OwnAPI LLM'
  AND rule.name = 'Packy cost / Core'
  AND pricing.models ?| ARRAY['gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-6-astra'];

DELETE FROM channel_account_stats_model_pricing pricing
USING channel_account_stats_pricing_rules rule, channels channel
WHERE pricing.rule_id = rule.id
  AND rule.channel_id = channel.id
  AND channel.name = 'OwnAPI LLM'
  AND rule.name = 'Packy cost / Core'
  AND pricing.models = '[]'::jsonb;

-- Recreate only the two exact account-owned rules. If an account is absent,
-- no rule is created and the route remains fail-closed.
DELETE FROM channel_account_stats_pricing_rules rule
USING channels channel
WHERE rule.channel_id = channel.id
  AND channel.name = 'OwnAPI LLM'
  AND rule.name IN ('Packy cost / Codex', 'Packy cost / DeepSeek Sale');

WITH target AS (
    SELECT id AS channel_id FROM channels WHERE name = 'OwnAPI LLM'
), rules(rule_name, account_name, sort_order) AS (
    VALUES
      ('Packy cost / Codex', 'Packy / Codex', 45),
      ('Packy cost / DeepSeek Sale', 'Packy / DeepSeek Sale', 50)
), exact_accounts AS (
    SELECT MIN(id) AS id, name
    FROM accounts
    WHERE deleted_at IS NULL
      AND extra->>'upstream_provider' = 'packyapi'
      AND name IN ('Packy / Codex', 'Packy / DeepSeek Sale')
    GROUP BY name
    HAVING COUNT(*) = 1
)
INSERT INTO channel_account_stats_pricing_rules (
    channel_id, name, group_ids, account_ids, sort_order
)
SELECT target.channel_id, rules.rule_name, '{}'::bigint[], ARRAY[account.id], rules.sort_order
FROM target
JOIN rules ON true
JOIN exact_accounts account ON account.name = rules.account_name;

-- Exact 2026-09-14 Packy CNY/MTok cards. The codex group uses a 0.8 group
-- ratio over Packy's ¥2 model-ratio base. OwnAPI normalizes account reporting
-- to USD at 6.7 CNY/USD. These are costs, never customer prices.
WITH costs(rule_name, model, input_cny, output_cny, cache_write_cny, cache_read_cny) AS (
    VALUES
      ('Packy cost / Codex', 'gpt-5.6-luna',  0.8,  4.8,  1.0, 0.08),
      ('Packy cost / Codex', 'gpt-5.6-sol',    4.0, 24.0,  5.0, 0.4),
      ('Packy cost / Codex', 'gpt-5.6-terra',  1.6,  9.6,  2.0, 0.16),
      ('Packy cost / Codex', 'gpt-6-astra',     8.0, 40.0, 10.0, 0.8),
      ('Packy cost / DeepSeek Sale', 'deepseek-v4-flash', 0.5, 2.0, NULL, 0.01)
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
    costs.cache_write_cny / 6.7 / 1000000.0,
    costs.cache_read_cny / 6.7 / 1000000.0
FROM costs
JOIN channel_account_stats_pricing_rules rule ON rule.name = costs.rule_name
JOIN channels channel ON channel.id = rule.channel_id AND channel.name = 'OwnAPI LLM';

-- Packy's three GPT-5.6 Codex cards have a >272K input x2/output x1.5 tier.
-- GPT-6 Astra currently has no Packy cost tier, so its reviewed flat card is
-- deliberately used for both customer context tiers.
WITH tiers(model, min_tokens, max_tokens, input_cny, output_cny, cache_write_cny, cache_read_cny, sort_order) AS (
    VALUES
      ('gpt-5.6-luna',      0, 272000, 0.8,  4.8,  1.0, 0.08, 1),
      ('gpt-5.6-luna', 272000,   NULL, 1.6,  7.2,  2.0, 0.16, 2),
      ('gpt-5.6-sol',       0, 272000, 4.0, 24.0,  5.0, 0.4,  1),
      ('gpt-5.6-sol',  272000,   NULL, 8.0, 36.0, 10.0, 0.8,  2),
      ('gpt-5.6-terra',     0, 272000, 1.6,  9.6,  2.0, 0.16, 1),
      ('gpt-5.6-terra',272000,   NULL, 3.2, 14.4,  4.0, 0.32, 2)
)
INSERT INTO channel_account_stats_pricing_intervals (
    pricing_id, min_tokens, max_tokens, tier_label,
    input_price, output_price, cache_write_price, cache_read_price, sort_order
)
SELECT
    pricing.id,
    tiers.min_tokens,
    tiers.max_tokens,
    NULL,
    tiers.input_cny / 6.7 / 1000000.0,
    tiers.output_cny / 6.7 / 1000000.0,
    tiers.cache_write_cny / 6.7 / 1000000.0,
    tiers.cache_read_cny / 6.7 / 1000000.0,
    tiers.sort_order
FROM tiers
JOIN channel_account_stats_pricing_rules rule ON rule.name = 'Packy cost / Codex'
JOIN channels channel ON channel.id = rule.channel_id AND channel.name = 'OwnAPI LLM'
JOIN channel_account_stats_model_pricing pricing
  ON pricing.rule_id = rule.id
 AND pricing.models = jsonb_build_array(tiers.model);
