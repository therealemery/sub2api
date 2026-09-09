-- Packy's cc token group is restricted to the Claude Code client and forbids
-- third-party integrations. OwnAPI is a third-party gateway, so fail closed:
-- remove the two cc-only SKUs from customer pricing and every managed Packy
-- account. The cc-sale Claude SKUs remain available because Packy explicitly
-- permits third-party integrations for that group.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '2min';

UPDATE channel_model_pricing cmp
SET models = cmp.models
      - 'claude-haiku-4-5-20251001'
      - 'claude-sonnet-4-5-20250929',
    updated_at = NOW()
FROM channels c
WHERE cmp.channel_id = c.id
  AND c.name = 'OwnAPI LLM'
  AND cmp.models ?| ARRAY[
    'claude-haiku-4-5-20251001',
    'claude-sonnet-4-5-20250929'
  ];

DELETE FROM channel_model_pricing
WHERE channel_id = (SELECT id FROM channels WHERE name = 'OwnAPI LLM')
  AND models = '[]'::jsonb;

UPDATE channel_account_stats_model_pricing pricing
SET models = pricing.models
      - 'claude-haiku-4-5-20251001'
      - 'claude-sonnet-4-5-20250929',
    updated_at = NOW()
FROM channel_account_stats_pricing_rules rule, channels c
WHERE pricing.rule_id = rule.id
  AND rule.channel_id = c.id
  AND c.name = 'OwnAPI LLM'
  AND pricing.models ?| ARRAY[
    'claude-haiku-4-5-20251001',
    'claude-sonnet-4-5-20250929'
  ];

DELETE FROM channel_account_stats_model_pricing pricing
USING channel_account_stats_pricing_rules rule, channels c
WHERE pricing.rule_id = rule.id
  AND rule.channel_id = c.id
  AND c.name = 'OwnAPI LLM'
  AND pricing.models = '[]'::jsonb;

UPDATE accounts
SET credentials = jsonb_set(
        credentials,
        '{model_mapping}',
        COALESCE(credentials->'model_mapping', '{}'::jsonb)
          - 'claude-haiku-4-5-20251001'
          - 'claude-sonnet-4-5-20250929'
    ),
    updated_at = NOW()
WHERE deleted_at IS NULL
  AND extra->>'upstream_provider' = 'packyapi'
  AND (
    COALESCE(credentials->'model_mapping', '{}'::jsonb) ? 'claude-haiku-4-5-20251001'
    OR COALESCE(credentials->'model_mapping', '{}'::jsonb) ? 'claude-sonnet-4-5-20250929'
  );
