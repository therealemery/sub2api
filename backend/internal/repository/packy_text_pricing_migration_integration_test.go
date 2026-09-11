//go:build integration

package repository

import (
	"context"
	"database/sql"
	"testing"

	"github.com/Wei-Shaw/sub2api/migrations"
	"github.com/stretchr/testify/require"
)

func TestPackyTextPricingMigrationIsIdempotentAndFailClosed(t *testing.T) {
	tx := testTx(t)
	ctx := context.Background()

	// Fresh databases apply the migration before an administrator creates the
	// OwnAPI group. Re-run it after inserting the group, twice, to cover both
	// the production binding path and SQL-level idempotence.
	_, err := tx.ExecContext(ctx, `
		INSERT INTO groups (name, platform, rate_multiplier, status)
		VALUES ('OwnAPI', 'openai', 1.0, 'active')
		ON CONFLICT (name) DO UPDATE SET
			platform = EXCLUDED.platform,
			rate_multiplier = EXCLUDED.rate_multiplier,
			status = EXCLUDED.status
	`)
	require.NoError(t, err)
	_, err = tx.ExecContext(ctx, `
		INSERT INTO accounts (name, platform, type, credentials, extra, status)
		VALUES
		  ('Packy / Core', 'openai', 'apikey', '{"model_mapping":{"claude-haiku-4-5-20251001":"claude-haiku-4-5-20251001","claude-opus-4-6":"claude-opus-4-6"}}', '{"upstream_provider":"packyapi"}', 'disabled'),
		  ('Packy / Expansion', 'openai', 'apikey', '{"model_mapping":{"claude-sonnet-4-5-20250929":"claude-sonnet-4-5-20250929","qwen3.5-flash":"qwen3.5-flash"}}', '{"upstream_provider":"packyapi"}', 'disabled'),
		  ('Packy / ZAI', 'openai', 'apikey', '{}', '{}', 'disabled'),
		  ('Packy / GPT-5.4', 'openai', 'apikey', '{}', '{}', 'disabled')
	`)
	require.NoError(t, err)

	sqlBytes, err := migrations.FS.ReadFile("137_seed_ownapi_packy_text_pricing.sql")
	require.NoError(t, err)
	requireExecTwice(t, tx, string(sqlBytes))

	var restrictModels bool
	var billingSource string
	require.NoError(t, tx.QueryRowContext(ctx, `
		SELECT restrict_models, billing_model_source
		FROM channels
		WHERE name = 'OwnAPI LLM'
	`).Scan(&restrictModels, &billingSource))
	require.True(t, restrictModels)
	require.Equal(t, "channel_mapped", billingSource)

	var bindingCount int
	require.NoError(t, tx.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM channel_groups cg
		JOIN channels c ON c.id = cg.channel_id
		JOIN groups g ON g.id = cg.group_id
		WHERE c.name = 'OwnAPI LLM' AND g.name = 'OwnAPI' AND g.platform = 'openai'
	`).Scan(&bindingCount))
	require.Equal(t, 1, bindingCount)

	var modelCount int
	require.NoError(t, tx.QueryRowContext(ctx, `
		SELECT COUNT(DISTINCT model_id)
		FROM channels c
		JOIN channel_model_pricing cmp ON cmp.channel_id = c.id
		CROSS JOIN LATERAL jsonb_array_elements_text(cmp.models) AS models(model_id)
		WHERE c.name = 'OwnAPI LLM'
	`).Scan(&modelCount))
	require.Equal(t, 39, modelCount)

	var forbiddenCount int
	require.NoError(t, tx.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM channels c
		JOIN channel_model_pricing cmp ON cmp.channel_id = c.id
		CROSS JOIN LATERAL jsonb_array_elements_text(cmp.models) AS models(model_id)
		WHERE c.name = 'OwnAPI LLM'
		  AND model_id IN ('glm-5', 'glm-5.2', 'gemini-3-pro-preview', 'kimi-k2.5', 'MiniMax-H3')
	`).Scan(&forbiddenCount))
	require.Zero(t, forbiddenCount)

	assertPackyCustomerPrice(t, tx, "gpt-5.4", 2.0e-6, 12.0e-6, 0.2e-6)
	assertPackyCustomerPrice(t, tx, "gpt-5.4-mini", 0.525e-6, 3.15e-6, 0.0525e-6)
	assertPackyCustomerPrice(t, tx, "glm-5.3-flash", 0.105e-6, 0.35e-6, 0.021e-6)

	assertPackyTier(t, tx, "gpt-6-astra", 200000, nil, 14.0e-6, 52.5e-6)
	assertPackyTier(t, tx, "gpt-5.4", 272000, nil, 4.0e-6, 18.0e-6)
	assertPackyTier(t, tx, "qwen3-coder-next", 32000, intPtr(128000), 0.1512e-6, 0.6027e-6)
	assertPackyTier(t, tx, "MiniMax-M3", 512000, nil, 0.84e-6, 3.36e-6)

	var costRuleCount int
	require.NoError(t, tx.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM channel_account_stats_pricing_rules r
		JOIN channels c ON c.id = r.channel_id
		WHERE c.name = 'OwnAPI LLM' AND r.name LIKE 'Packy cost / %'
	`).Scan(&costRuleCount))
	require.Equal(t, 4, costRuleCount)
	assertPackyAccountCost(t, tx, "Packy cost / Core", "glm-5.3-flash", 0.4/6.7e6, 1.4/6.7e6)
	assertPackyAccountCostTier(t, tx, "Packy cost / GPT-5.4", "gpt-5.4", 272000, nil, 25.0/6.7e6, 112.5/6.7e6)

	deepSeekSQL, err := migrations.FS.ReadFile("141_add_deepseek_sale_and_fix_gpt6_pricing.sql")
	require.NoError(t, err)
	// Before the dedicated account exists, customer prices and GPT-6 fixes are
	// still applied, but no DeepSeek upstream cost rule is created.
	requireExecTwice(t, tx, string(deepSeekSQL))
	assertPackyCustomerPrice(t, tx, "deepseek-v4.1-flash", 0.1125e-6, 0.45e-6, 0.00225e-6)
	assertPackyCustomerPrice(t, tx, "deepseek-v4-pro", 0.1125e-6, 0.45e-6, 0.00225e-6)
	assertPackyTierWithCache(t, tx, "gpt-6-astra", 0, intPtr(200000), 7.0e-6, 35.0e-6, 8.75e-6, 0.7e-6)
	assertPackyTierWithCache(t, tx, "gpt-6-astra", 200000, nil, 14.0e-6, 52.5e-6, 17.5e-6, 1.4e-6)

	var deepSeekRuleCount int
	require.NoError(t, tx.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM channel_account_stats_pricing_rules r
		JOIN channels c ON c.id = r.channel_id
		WHERE c.name = 'OwnAPI LLM' AND r.name = 'Packy cost / DeepSeek Sale'
	`).Scan(&deepSeekRuleCount))
	require.Zero(t, deepSeekRuleCount)

	_, err = tx.ExecContext(ctx, `
		INSERT INTO accounts (name, platform, type, credentials, extra, status)
		VALUES ('Packy / DeepSeek Sale', 'openai', 'apikey',
		        '{"api_key":"placeholder","base_url":"https://cf.api.fan/v1"}',
		        '{"upstream_provider":"packyapi"}', 'disabled')
	`)
	require.NoError(t, err)
	requireExecTwice(t, tx, string(deepSeekSQL))
	assertPackyAccountCost(t, tx, "Packy cost / DeepSeek Sale", "deepseek-v4-flash", 1.5/6.7e6, 4.5/6.7e6)
	assertPackyAccountCost(t, tx, "Packy cost / DeepSeek Sale", "deepseek-v4-pro", 4.5/6.7e6, 13.5/6.7e6)

	var mapped string
	require.NoError(t, tx.QueryRowContext(ctx, `
		SELECT credentials->'model_mapping'->>'deepseek-v4.1-flash'
		FROM accounts WHERE name = 'Packy / DeepSeek Sale'
	`).Scan(&mapped))
	require.Equal(t, "deepseek-v4-flash", mapped)

	removeCCOnlySQL, err := migrations.FS.ReadFile("139_remove_claude_code_only_packy_models.sql")
	require.NoError(t, err)
	requireExecTwice(t, tx, string(removeCCOnlySQL))

	require.NoError(t, tx.QueryRowContext(ctx, `
		SELECT COUNT(DISTINCT model_id)
		FROM channels c
		JOIN channel_model_pricing cmp ON cmp.channel_id = c.id
		CROSS JOIN LATERAL jsonb_array_elements_text(cmp.models) AS models(model_id)
		WHERE c.name = 'OwnAPI LLM'
	`).Scan(&modelCount))
	require.Equal(t, 37, modelCount)

	require.NoError(t, tx.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM channels c
		JOIN channel_model_pricing cmp ON cmp.channel_id = c.id
		CROSS JOIN LATERAL jsonb_array_elements_text(cmp.models) AS models(model_id)
		WHERE c.name = 'OwnAPI LLM'
		  AND model_id IN ('claude-haiku-4-5-20251001', 'claude-sonnet-4-5-20250929')
	`).Scan(&forbiddenCount))
	require.Zero(t, forbiddenCount)

	var restrictedMappings, allowedMappings int
	require.NoError(t, tx.QueryRowContext(ctx, `
		SELECT
		  COUNT(*) FILTER (WHERE credentials->'model_mapping' ?| ARRAY['claude-haiku-4-5-20251001', 'claude-sonnet-4-5-20250929']),
		  COUNT(*) FILTER (WHERE credentials->'model_mapping' ?| ARRAY['claude-opus-4-6', 'qwen3.5-flash'])
		FROM accounts
		WHERE extra->>'upstream_provider' = 'packyapi'
	`).Scan(&restrictedMappings, &allowedMappings))
	require.Zero(t, restrictedMappings)
	require.Equal(t, 2, allowedMappings)
}

func requireExecTwice(t *testing.T, tx *sql.Tx, migrationSQL string) {
	t.Helper()
	for range 2 {
		_, err := tx.ExecContext(context.Background(), migrationSQL)
		require.NoError(t, err)
	}
}

func assertPackyCustomerPrice(t *testing.T, tx *sql.Tx, model string, input, output, cacheRead float64) {
	t.Helper()
	var gotInput, gotOutput, gotCacheRead float64
	require.NoError(t, tx.QueryRowContext(context.Background(), `
		SELECT cmp.input_price, cmp.output_price, cmp.cache_read_price
		FROM channels c
		JOIN channel_model_pricing cmp ON cmp.channel_id = c.id
		WHERE c.name = 'OwnAPI LLM' AND cmp.models ? $1
	`, model).Scan(&gotInput, &gotOutput, &gotCacheRead))
	require.InDelta(t, input, gotInput, 1e-12)
	require.InDelta(t, output, gotOutput, 1e-12)
	require.InDelta(t, cacheRead, gotCacheRead, 1e-12)
}

func assertPackyTier(t *testing.T, tx *sql.Tx, model string, min int, max *int, input, output float64) {
	t.Helper()
	var gotInput, gotOutput float64
	require.NoError(t, tx.QueryRowContext(context.Background(), `
		SELECT cpi.input_price, cpi.output_price
		FROM channels c
		JOIN channel_model_pricing cmp ON cmp.channel_id = c.id
		JOIN channel_pricing_intervals cpi ON cpi.pricing_id = cmp.id
		WHERE c.name = 'OwnAPI LLM' AND cmp.models ? $1
		  AND cpi.min_tokens = $2 AND cpi.max_tokens IS NOT DISTINCT FROM $3
	`, model, min, max).Scan(&gotInput, &gotOutput))
	require.InDelta(t, input, gotInput, 1e-12)
	require.InDelta(t, output, gotOutput, 1e-12)
}

func assertPackyTierWithCache(t *testing.T, tx *sql.Tx, model string, min int, max *int, input, output, cacheWrite, cacheRead float64) {
	t.Helper()
	var gotInput, gotOutput, gotCacheWrite, gotCacheRead float64
	require.NoError(t, tx.QueryRowContext(context.Background(), `
		SELECT cpi.input_price, cpi.output_price, cpi.cache_write_price, cpi.cache_read_price
		FROM channels c
		JOIN channel_model_pricing cmp ON cmp.channel_id = c.id
		JOIN channel_pricing_intervals cpi ON cpi.pricing_id = cmp.id
		WHERE c.name = 'OwnAPI LLM' AND cmp.models ? $1
		  AND cpi.min_tokens = $2 AND cpi.max_tokens IS NOT DISTINCT FROM $3
	`, model, min, max).Scan(&gotInput, &gotOutput, &gotCacheWrite, &gotCacheRead))
	require.InDelta(t, input, gotInput, 1e-12)
	require.InDelta(t, output, gotOutput, 1e-12)
	require.InDelta(t, cacheWrite, gotCacheWrite, 1e-12)
	require.InDelta(t, cacheRead, gotCacheRead, 1e-12)
}

func assertPackyAccountCost(t *testing.T, tx *sql.Tx, rule, model string, input, output float64) {
	t.Helper()
	var gotInput, gotOutput float64
	require.NoError(t, tx.QueryRowContext(context.Background(), `
		SELECT p.input_price, p.output_price
		FROM channel_account_stats_pricing_rules r
		JOIN channel_account_stats_model_pricing p ON p.rule_id = r.id
		WHERE r.name = $1 AND p.models ? $2
	`, rule, model).Scan(&gotInput, &gotOutput))
	require.InDelta(t, input, gotInput, 1e-12)
	require.InDelta(t, output, gotOutput, 1e-12)
}

func assertPackyAccountCostTier(t *testing.T, tx *sql.Tx, rule, model string, min int, max *int, input, output float64) {
	t.Helper()
	var gotInput, gotOutput float64
	require.NoError(t, tx.QueryRowContext(context.Background(), `
		SELECT i.input_price, i.output_price
		FROM channel_account_stats_pricing_rules r
		JOIN channel_account_stats_model_pricing p ON p.rule_id = r.id
		JOIN channel_account_stats_pricing_intervals i ON i.pricing_id = p.id
		WHERE r.name = $1 AND p.models ? $2
		  AND i.min_tokens = $3 AND i.max_tokens IS NOT DISTINCT FROM $4
	`, rule, model, min, max).Scan(&gotInput, &gotOutput))
	require.InDelta(t, input, gotInput, 1e-12)
	require.InDelta(t, output, gotOutput, 1e-12)
}

func intPtr(value int) *int { return &value }
