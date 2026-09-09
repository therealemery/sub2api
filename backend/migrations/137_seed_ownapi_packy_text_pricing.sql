-- Seed the customer-facing OwnAPI LLM channel with the verified Packy text
-- intersection. Prices are final customer USD prices per token: current
-- manufacturer list price multiplied by the published OwnAPI factor (0.7,
-- except GPT-5.4 at 0.8). Models without a published manufacturer price are
-- deliberately absent so restrict_models fails closed before upstream use.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '10min';

-- Preserve sub-cent-per-MTok Packy costs after CNY-to-USD normalization.
ALTER TABLE channel_account_stats_model_pricing
    ALTER COLUMN input_price TYPE NUMERIC(20,12),
    ALTER COLUMN output_price TYPE NUMERIC(20,12),
    ALTER COLUMN cache_write_price TYPE NUMERIC(20,12),
    ALTER COLUMN cache_read_price TYPE NUMERIC(20,12);

INSERT INTO channels (name, description, status, restrict_models, billing_model_source)
VALUES (
    'OwnAPI LLM',
    'Verified customer-facing Packy text models with USD billing',
    'active',
    true,
    'channel_mapped'
)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    restrict_models = EXCLUDED.restrict_models,
    billing_model_source = EXCLUDED.billing_model_source,
    updated_at = NOW();

-- A group may belong to only one channel. Move only the intended OwnAPI OpenAI
-- group; do not disturb DC-API/MiniMax H3 or unrelated groups.
DELETE FROM channel_groups
WHERE group_id IN (
    SELECT id FROM groups WHERE name = 'OwnAPI' AND platform = 'openai'
);

INSERT INTO channel_groups (channel_id, group_id)
SELECT c.id, g.id
FROM channels c
JOIN groups g ON g.name = 'OwnAPI' AND g.platform = 'openai'
WHERE c.name = 'OwnAPI LLM'
ON CONFLICT (group_id) DO UPDATE SET channel_id = EXCLUDED.channel_id;

DELETE FROM channel_model_pricing
WHERE channel_id = (SELECT id FROM channels WHERE name = 'OwnAPI LLM');

-- Flat token prices. Dollar values are written per MTok for reviewability and
-- divided here because channel_model_pricing stores USD per token.
WITH target AS (
    SELECT id AS channel_id FROM channels WHERE name = 'OwnAPI LLM'
), prices(models, input_mtok, output_mtok, cache_write_mtok, cache_read_mtok) AS (
    VALUES
      ('["gpt-5.4-mini"]'::jsonb,                                      0.525,  3.15,   NULL, 0.0525),
      ('["gpt-5.5"]'::jsonb,                                           3.5,   21.0,   NULL, 0.35),
      ('["codex-auto-review"]'::jsonb,                                 1.75,  10.5,   NULL, 0.175),
      ('["claude-opus-4-6","claude-opus-4-7","claude-opus-4-8","claude-opus-5"]'::jsonb,
                                                                         3.5,   17.5,  4.375, 0.35),
      ('["claude-sonnet-4-5-20250929","claude-sonnet-4-6"]'::jsonb,   2.1,   10.5,  2.625, 0.21),
      ('["claude-sonnet-5"]'::jsonb,                                   1.4,    7.0,   1.75, 0.14),
      ('["claude-haiku-4-5-20251001"]'::jsonb,                         0.7,    3.5,  0.875, 0.07),
      ('["gemini-2.5-flash"]'::jsonb,                                  0.21,  1.75,   NULL, 0.021),
      ('["gemini-3-flash-preview"]'::jsonb,                             0.35,   2.1,   NULL, 0.035),
      ('["gemini-3.5-flash"]'::jsonb,                                  1.05,   6.3,   NULL, 0.105),
      ('["qwen3.7-max"]'::jsonb,                                       1.75,  5.25,   NULL, NULL),
      ('["qwen3.8-flash"]'::jsonb,                                     0.0791, 0.2674, NULL, NULL),
      ('["qwen3.8-max"]'::jsonb,                                       1.4,    4.2,   NULL, NULL),
      ('["glm-5.3"]'::jsonb,                                            0.98,  3.08,   NULL, 0.182),
      ('["glm-5.3-flash"]'::jsonb,                                      0.105, 0.35,   NULL, 0.021),
      ('["minimax-m2.5"]'::jsonb,                                       0.21,  0.84,   NULL, 0.021),
      ('["MiniMax-M2.7"]'::jsonb,                                       0.21,  0.84,   NULL, 0.042)
)
INSERT INTO channel_model_pricing (
    channel_id, platform, models, billing_mode,
    input_price, output_price, cache_write_price, cache_read_price
)
SELECT
    target.channel_id,
    'openai',
    prices.models,
    'token',
    prices.input_mtok / 1000000.0,
    prices.output_mtok / 1000000.0,
    prices.cache_write_mtok / 1000000.0,
    prices.cache_read_mtok / 1000000.0
FROM target CROSS JOIN prices;

-- Tiered models use complete, contiguous (min, max] ranges so every positive
-- token count resolves to an OwnAPI discounted price instead of falling back
-- to a provider/LiteLLM default.
WITH target AS (
    SELECT id AS channel_id FROM channels WHERE name = 'OwnAPI LLM'
), models(model, default_input_mtok, default_output_mtok, default_cache_write_mtok, default_cache_read_mtok) AS (
    VALUES
      ('gpt-6-astra',             3.5,    17.5,    4.375, NULL),
	  ('gpt-5.4',                  2.0,    12.0,    NULL,  0.2),
	  ('gpt-5.6-luna',             0.14,    0.84,   0.175, 0.014),
	  ('gpt-5.6-sol',              2.8,    14.0,    3.5,   0.28),
	  ('gpt-5.6-terra',            1.4,     8.4,    1.75,  0.14),
      ('grok-4.5',                1.4,     4.2,    NULL,  0.21),
      ('grok-4.6',                1.4,     4.2,    NULL,  0.35),
      ('gemini-2.5-pro',          0.875,   7.0,    NULL,  0.0875),
      ('gemini-3.1-pro-preview',  1.4,     8.4,    NULL,  0.14),
      ('qwen3-coder-next',        0.1008,  0.4018, NULL,  NULL),
      ('qwen3-max',               0.84,    4.2,    NULL,  NULL),
      ('qwen3-vl-flash',          0.0154,  0.1505, NULL,  NULL),
      ('qwen3.5-flash',           0.0203,  0.2009, NULL,  NULL),
      ('qwen3.5-plus',            0.0805,  0.4816, NULL,  NULL),
      ('qwen3.6-max-preview',     0.91,    5.46,   NULL,  NULL),
      ('qwen3.6-plus',            0.1932,  1.1557, NULL,  NULL),
      ('qwen3.7-plus',            0.28,    1.12,   NULL,  NULL),
      ('MiniMax-M3',              0.42,    1.68,   NULL,  0.084)
), inserted AS (
    INSERT INTO channel_model_pricing (
        channel_id, platform, models, billing_mode,
        input_price, output_price, cache_write_price, cache_read_price
    )
    SELECT
        target.channel_id,
        'openai',
        jsonb_build_array(models.model),
        'token',
        models.default_input_mtok / 1000000.0,
        models.default_output_mtok / 1000000.0,
		models.default_cache_write_mtok / 1000000.0,
        models.default_cache_read_mtok / 1000000.0
    FROM target CROSS JOIN models
    RETURNING id, models
), tiers(model, min_tokens, max_tokens, label, input_mtok, output_mtok, cache_write_mtok, cache_read_mtok, sort_order) AS (
    VALUES
      ('gpt-6-astra',                 0,  200000, 'short',  3.5,    17.5,   4.375, 0.35,   1),
      ('gpt-6-astra',            200000,    NULL, 'long',  14.0,    52.5,  17.5,   1.4,    2),
	  ('gpt-5.4',                      0,  272000, 'short',  2.0,    12.0,   NULL,   0.2,    1),
	  ('gpt-5.4',                 272000,    NULL, 'long',   4.0,    18.0,   NULL,   0.4,    2),
	  ('gpt-5.6-luna',                 0,  272000, 'short',  0.14,    0.84,  0.175, 0.014,  1),
	  ('gpt-5.6-luna',            272000,    NULL, 'long',   0.28,    1.26,  0.35,  0.028,  2),
	  ('gpt-5.6-sol',                  0,  272000, 'short',  2.8,    14.0,   3.5,   0.28,   1),
	  ('gpt-5.6-sol',             272000,    NULL, 'long',   5.6,    21.0,   7.0,   0.56,   2),
	  ('gpt-5.6-terra',                0,  272000, 'short',  1.4,     8.4,   1.75,  0.14,   1),
	  ('gpt-5.6-terra',           272000,    NULL, 'long',   2.8,    12.6,   3.5,   0.28,   2),
      ('grok-4.5',                    0,  199999, 'short',  1.4,     4.2,   NULL,   0.21,   1),
      ('grok-4.5',               199999,    NULL, 'long',   2.8,     8.4,   NULL,   0.42,   2),
      ('grok-4.6',                    0,  199999, 'short',  1.4,     4.2,   NULL,   0.35,   1),
      ('grok-4.6',               199999,    NULL, 'long',   2.8,     8.4,   NULL,   0.7,    2),
      ('gemini-2.5-pro',              0,  200000, 'short',  0.875,   7.0,   NULL,   0.0875, 1),
      ('gemini-2.5-pro',         200000,    NULL, 'long',   1.75,   10.5,   NULL,   0.175,  2),
      ('gemini-3.1-pro-preview',      0,  200000, 'short',  1.4,     8.4,   NULL,   0.14,   1),
      ('gemini-3.1-pro-preview', 200000,    NULL, 'long',   2.8,    12.6,   NULL,   0.28,   2),
      ('qwen3-coder-next',            0,   32000, 'short',  0.1008,  0.4018, NULL,   NULL,   1),
      ('qwen3-coder-next',        32000,  128000, 'mid',    0.1512,  0.6027, NULL,   NULL,   2),
      ('qwen3-coder-next',       128000,    NULL, 'long',   0.2513,  1.0038, NULL,   NULL,   3),
      ('qwen3-max',                   0,   32000, 'short',  0.84,    4.2,    NULL,   NULL,   1),
      ('qwen3-max',               32000,  128000, 'mid',    1.68,    8.4,    NULL,   NULL,   2),
      ('qwen3-max',              128000,    NULL, 'long',   2.1,    10.5,    NULL,   NULL,   3),
      ('qwen3-vl-flash',              0,   32000, 'short',  0.0154,  0.1505, NULL,   NULL,   1),
      ('qwen3-vl-flash',          32000,  128000, 'mid',    0.0301,  0.301,  NULL,   NULL,   2),
      ('qwen3-vl-flash',         128000,    NULL, 'long',   0.0602,  0.6013, NULL,   NULL,   3),
      ('qwen3.5-flash',               0,  128000, 'short',  0.0203,  0.2009, NULL,   NULL,   1),
      ('qwen3.5-flash',          128000,  256000, 'mid',    0.0805,  0.8029, NULL,   NULL,   2),
      ('qwen3.5-flash',          256000,    NULL, 'long',   0.1204,  1.204,  NULL,   NULL,   3),
      ('qwen3.5-plus',                0,  128000, 'short',  0.0805,  0.4816, NULL,   NULL,   1),
      ('qwen3.5-plus',           128000,  256000, 'mid',    0.2009,  1.204,  NULL,   NULL,   2),
      ('qwen3.5-plus',           256000,    NULL, 'long',   0.4011,  2.408,  NULL,   NULL,   3),
      ('qwen3.6-max-preview',         0,  128000, 'short',  0.91,    5.46,   NULL,   NULL,   1),
      ('qwen3.6-max-preview',    128000,    NULL, 'long',   1.4,     8.4,    NULL,   NULL,   2),
      ('qwen3.6-plus',                0,  256000, 'short',  0.1932,  1.1557, NULL,   NULL,   1),
      ('qwen3.6-plus',           256000,    NULL, 'long',   0.7707,  4.6214, NULL,   NULL,   2),
      ('qwen3.7-plus',                0,  256000, 'short',  0.28,    1.12,   NULL,   NULL,   1),
      ('qwen3.7-plus',           256000,    NULL, 'long',   0.84,    3.36,   NULL,   NULL,   2),
      ('MiniMax-M3',                  0,  512000, 'short',  0.42,    1.68,   NULL,   0.084,  1),
      ('MiniMax-M3',             512000,    NULL, 'long',   0.84,    3.36,   NULL,   0.168,  2)
)
INSERT INTO channel_pricing_intervals (
    pricing_id, min_tokens, max_tokens, tier_label,
    input_price, output_price, cache_write_price, cache_read_price, sort_order
)
SELECT
    inserted.id,
    tiers.min_tokens,
    tiers.max_tokens,
    tiers.label,
    tiers.input_mtok / 1000000.0,
    tiers.output_mtok / 1000000.0,
	tiers.cache_write_mtok / 1000000.0,
    tiers.cache_read_mtok / 1000000.0,
    tiers.sort_order
FROM inserted
JOIN tiers ON inserted.models = jsonb_build_array(tiers.model);

-- Packy account statistics cost rules. Packy's live ratio cards use a ¥2 per
-- model-ratio MTok base, then the selected token-group multiplier. OwnAPI
-- reports account cost in USD, so every value below is normalized by 6.7.
-- Rules match the four managed account names and remain inert if an account is
-- not present yet. Customer billing never reads these rules.
DELETE FROM channel_account_stats_pricing_rules
WHERE channel_id = (SELECT id FROM channels WHERE name = 'OwnAPI LLM')
  AND name LIKE 'Packy cost / %';

WITH target AS (
    SELECT id AS channel_id FROM channels WHERE name = 'OwnAPI LLM'
), rules(name, account_name, sort_order) AS (
    VALUES
      ('Packy cost / Core', 'Packy / Core', 10),
      ('Packy cost / Expansion', 'Packy / Expansion', 20),
      ('Packy cost / ZAI', 'Packy / ZAI', 30),
      ('Packy cost / GPT-5.4', 'Packy / GPT-5.4', 40)
)
INSERT INTO channel_account_stats_pricing_rules (
    channel_id, name, group_ids, account_ids, sort_order
)
SELECT target.channel_id, rules.name, '{}'::bigint[], ARRAY_AGG(a.id ORDER BY a.id), rules.sort_order
FROM target
JOIN rules ON true
JOIN accounts a ON a.name = rules.account_name AND a.deleted_at IS NULL
GROUP BY target.channel_id, rules.name, rules.sort_order;

-- Per-MTok Packy CNY price before USD normalization. The chosen group is
-- fixed per managed token/account and mirrors the verified production scopes.
WITH cost(rule_name, models, input_cny, output_cny, cache_read_cny, cache_write_cny) AS (
    VALUES
      ('Packy cost / Core', '["gpt-5.4-mini"]'::jsonb, 0.375, 2.25, 0.0375, NULL),
      ('Packy cost / Core', '["gpt-5.5"]'::jsonb, 2.5, 15.0, 0.25, NULL),
      ('Packy cost / Core', '["gpt-5.6-luna"]'::jsonb, 0.5, 3.0, 0.05, 0.625),
      ('Packy cost / Core', '["gpt-5.6-sol"]'::jsonb, 2.5, 15.0, 0.25, 3.125),
      ('Packy cost / Core', '["gpt-5.6-terra"]'::jsonb, 1.0, 6.0, 0.1, 1.25),
      ('Packy cost / Core', '["gpt-6-astra"]'::jsonb, 5.0, 25.0, 0.5, 6.25),
      ('Packy cost / Core', '["codex-auto-review"]'::jsonb, 2.5, 15.0, 0.25, NULL),
      ('Packy cost / Core', '["claude-opus-4-6","claude-opus-4-7","claude-opus-4-8","claude-opus-5"]'::jsonb, 4.0, 20.0, 0.4, 5.0),
      ('Packy cost / Core', '["claude-sonnet-4-6","claude-sonnet-5"]'::jsonb, 2.4, 12.0, 0.24, 3.0),
      ('Packy cost / Core', '["claude-haiku-4-5-20251001"]'::jsonb, 0.8, 4.0, 0.08, 1.0),
      ('Packy cost / Core', '["grok-4.5"]'::jsonb, 0.6, 1.8, 0.15, NULL),
      ('Packy cost / Core', '["grok-4.6"]'::jsonb, 0.6, 1.8, 0.15, NULL),
      ('Packy cost / Core', '["gemini-2.5-flash"]'::jsonb, 0.9, 7.5, NULL, NULL),
      ('Packy cost / Core', '["gemini-2.5-pro"]'::jsonb, 3.75, 30.0, NULL, NULL),
      ('Packy cost / Core', '["gemini-3-flash-preview"]'::jsonb, 1.5, 9.0, NULL, NULL),
      ('Packy cost / Core', '["gemini-3.1-pro-preview"]'::jsonb, 6.0, 36.0, NULL, NULL),
      ('Packy cost / Core', '["gemini-3.5-flash"]'::jsonb, 4.5, 27.0, 0.45, NULL),
      ('Packy cost / Core', '["glm-5.3"]'::jsonb, 4.0, 14.0, 1.0, NULL),
      ('Packy cost / Core', '["glm-5.3-flash"]'::jsonb, 0.4, 1.4, 0.115, NULL),
      ('Packy cost / Core', '["MiniMax-M3"]'::jsonb, 2.1, 8.4, 0.42, NULL),
      ('Packy cost / Expansion', '["claude-sonnet-4-5-20250929"]'::jsonb, 6.0, 30.0, 0.6, 7.5),
      ('Packy cost / Expansion', '["minimax-m2.5","MiniMax-M2.7"]'::jsonb, 1.05, 4.2, 0.21, NULL),
      ('Packy cost / Expansion', '["qwen3-coder-next"]'::jsonb, 0.5, 2.0, NULL, NULL),
      ('Packy cost / Expansion', '["qwen3-max"]'::jsonb, 1.25, 5.0, 0.25, NULL),
      ('Packy cost / Expansion', '["qwen3-vl-flash"]'::jsonb, 0.075, 0.75, 0.0075, NULL),
      ('Packy cost / Expansion', '["qwen3.5-flash"]'::jsonb, 0.1, 1.0, 0.01, NULL),
      ('Packy cost / Expansion', '["qwen3.5-plus"]'::jsonb, 0.4, 2.4, 0.04, NULL),
      ('Packy cost / Expansion', '["qwen3.6-max-preview"]'::jsonb, 4.5, 27.0, 0.45, NULL),
      ('Packy cost / Expansion', '["qwen3.6-plus"]'::jsonb, 1.0, 6.0, 0.1, NULL),
      ('Packy cost / Expansion', '["qwen3.7-max"]'::jsonb, 6.0, 18.0, 1.2, NULL),
      ('Packy cost / Expansion', '["qwen3.7-plus"]'::jsonb, 1.0, 4.0, 0.2, NULL),
      ('Packy cost / Expansion', '["qwen3.8-flash"]'::jsonb, 0.4, 1.35, 0.05, NULL),
      ('Packy cost / Expansion', '["qwen3.8-max"]'::jsonb, 6.0, 18.0, 0.75, NULL),
      ('Packy cost / GPT-5.4', '["gpt-5.4"]'::jsonb, 12.5, 75.0, 1.25, NULL)
)
INSERT INTO channel_account_stats_model_pricing (
    rule_id, platform, models, billing_mode,
    input_price, output_price, cache_write_price, cache_read_price
)
SELECT
    r.id, 'openai', cost.models, 'token',
    cost.input_cny / 6.7 / 1000000.0,
    cost.output_cny / 6.7 / 1000000.0,
    cost.cache_write_cny / 6.7 / 1000000.0,
    cost.cache_read_cny / 6.7 / 1000000.0
FROM cost
JOIN channel_account_stats_pricing_rules r ON r.name = cost.rule_name
JOIN channels c ON c.id = r.channel_id AND c.name = 'OwnAPI LLM';

-- Packy cost tiers use the same left-open/right-closed context semantics as
-- customer channel pricing. Only upstreams whose live card has a tier are
-- expanded here; a complete range prevents accidental fallback.
WITH tier(model, min_tokens, max_tokens, input_cny, output_cny, cache_read_cny, cache_write_cny, sort_order) AS (
    VALUES
      ('gpt-5.4',           0, 272000,12.5, 75.0, 1.25, NULL, 1), ('gpt-5.4',      272000, NULL,25.0,112.5,2.5, NULL, 2),
      ('gpt-5.6-luna',      0, 272000, 0.5,  3.0,  0.05, 0.625, 1), ('gpt-5.6-luna', 272000, NULL, 1.0,  4.5,  0.1,  1.25, 2),
      ('gpt-5.6-sol',       0, 272000, 2.5, 15.0,  0.25, 3.125, 1), ('gpt-5.6-sol',  272000, NULL, 5.0, 22.5,  0.5,  6.25, 2),
      ('gpt-5.6-terra',     0, 272000, 1.0,  6.0,  0.1,  1.25, 1), ('gpt-5.6-terra',272000, NULL, 2.0,  9.0,  0.2,  2.5,  2),
      ('grok-4.5',          0, 199999, 0.6,  1.8,  0.15, NULL, 1), ('grok-4.5',     199999, NULL, 1.2,  3.6,  0.3,  NULL, 2),
      ('qwen3-coder-next',  0,  32000, 0.5,  2.0,  NULL, NULL, 1), ('qwen3-coder-next',32000,128000,0.825,3.3,NULL,NULL,2), ('qwen3-coder-next',128000,NULL,1.25,5.0,NULL,NULL,3),
      ('qwen3-max',         0,  32000, 1.25, 5.0,  0.25, NULL, 1), ('qwen3-max',    32000,128000,2.0,8.0,0.4,NULL,2), ('qwen3-max',128000,NULL,3.5,14.0,0.7,NULL,3),
      ('qwen3-vl-flash',    0,  32000, 0.075,0.75,0.0075,NULL,1), ('qwen3-vl-flash',32000,128000,0.15,1.5,0.015,NULL,2), ('qwen3-vl-flash',128000,NULL,0.3,3.0,0.03,NULL,3),
      ('qwen3.5-flash',     0, 128000, 0.1,  1.0,  0.01, NULL, 1), ('qwen3.5-flash',128000,256000,0.4,4.0,0.04,NULL,2), ('qwen3.5-flash',256000,NULL,0.6,6.0,0.06,NULL,3),
      ('qwen3.5-plus',      0, 128000, 0.4,  2.4,  0.04, NULL, 1), ('qwen3.5-plus',128000,256000,1.0,6.0,0.1,NULL,2), ('qwen3.5-plus',256000,NULL,2.0,12.0,0.2,NULL,3),
      ('qwen3.6-max-preview',0,128000,4.5,27.0,0.45,NULL,1), ('qwen3.6-max-preview',128000,NULL,7.515,45.09,0.7515,NULL,2),
      ('qwen3.6-plus',      0, 256000, 1.0,  6.0,  0.1,  NULL, 1), ('qwen3.6-plus',256000,NULL,4.0,24.0,0.4,NULL,2),
      ('qwen3.7-plus',      0, 256000, 1.0,  4.0,  0.2,  NULL, 1), ('qwen3.7-plus',256000,NULL,3.0,12.0,0.6,NULL,2),
      ('MiniMax-M3',       0, 512000, 2.1,  8.4,  0.42, NULL, 1), ('MiniMax-M3',512000,NULL,4.2,16.8,0.84,NULL,2)
)
INSERT INTO channel_account_stats_pricing_intervals (
    pricing_id, min_tokens, max_tokens, tier_label,
    input_price, output_price, cache_write_price, cache_read_price, sort_order
)
SELECT
    p.id, tier.min_tokens, tier.max_tokens, NULL,
    tier.input_cny / 6.7 / 1000000.0,
    tier.output_cny / 6.7 / 1000000.0,
    tier.cache_write_cny / 6.7 / 1000000.0,
    tier.cache_read_cny / 6.7 / 1000000.0,
    tier.sort_order
FROM tier
JOIN channel_account_stats_model_pricing p ON p.models = jsonb_build_array(tier.model)
JOIN channel_account_stats_pricing_rules r ON r.id = p.rule_id
JOIN channels c ON c.id = r.channel_id AND c.name = 'OwnAPI LLM';
