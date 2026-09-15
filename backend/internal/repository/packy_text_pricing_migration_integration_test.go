//go:build integration

package repository

import (
	"context"
	"database/sql"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/service"
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
		ON CONFLICT (name) WHERE deleted_at IS NULL DO UPDATE SET
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
	// Migration 141 adds two DeepSeek rows before migration 139 removes the two
	// Claude Code-only rows, leaving the reviewed 39-model text catalog.
	require.Equal(t, 39, modelCount)

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

func TestPackyTextPricingMigration143IsIdempotentAndFailClosed(t *testing.T) {
	tx := testTx(t)
	ctx := context.Background()

	_, err := tx.ExecContext(ctx, `
		INSERT INTO groups (name, platform, rate_multiplier, status)
		VALUES ('OwnAPI', 'openai', 1.0, 'active')
		ON CONFLICT (name) WHERE deleted_at IS NULL DO UPDATE SET platform = EXCLUDED.platform, status = EXCLUDED.status
	`)
	require.NoError(t, err)
	_, err = tx.ExecContext(ctx, `
		INSERT INTO accounts (name, platform, type, credentials, extra, status)
		VALUES
		  ('Packy / Core', 'openai', 'apikey',
		   '{"api_key":"preserve-core","base_url":"https://core.example/v1","model_mapping":{"gpt-5.6-luna":"gpt-5.6-luna","gpt-5.6-sol":"gpt-5.6-sol","gpt-5.6-terra":"gpt-5.6-terra","gpt-6-astra":"gpt-6-astra"}}',
		   '{"upstream_provider":"packyapi"}', 'disabled'),
		  ('Packy / Codex', 'openai', 'apikey',
		   '{"api_key":"preserve-codex","base_url":"https://codex.example/v1","model_mapping":{"unrelated":"unrelated"}}',
		   '{"upstream_provider":"packyapi"}', 'disabled'),
		  ('Packy / DeepSeek Sale', 'openai', 'apikey',
		   '{"api_key":"preserve-deepseek","base_url":"https://deepseek.example/v1","model_mapping":{"deepseek-v4.1-flash":"deepseek-v4-flash","deepseek-v4-pro":"deepseek-v4-pro"}}',
		   '{"upstream_provider":"packyapi"}', 'disabled')
	`)
	require.NoError(t, err)

	seedSQL, err := migrations.FS.ReadFile("137_seed_ownapi_packy_text_pricing.sql")
	require.NoError(t, err)
	_, err = tx.ExecContext(ctx, string(seedSQL))
	require.NoError(t, err)
	legacySQL, err := migrations.FS.ReadFile("141_add_deepseek_sale_and_fix_gpt6_pricing.sql")
	require.NoError(t, err)
	_, err = tx.ExecContext(ctx, string(legacySQL))
	require.NoError(t, err)
	correctSQL, err := migrations.FS.ReadFile("143_correct_text_pricing_and_packy_scopes.sql")
	require.NoError(t, err)
	requireExecTwice(t, tx, string(correctSQL))

	assertPackyCustomerPrice(t, tx, "deepseek-v4.1-flash", 0.105e-6, 0.42e-6, 0.0021e-6)
	assertPackyCustomerPrice(t, tx, "gpt-5.4-mini", 0.6e-6, 3.6e-6, 0.06e-6)
	assertPackyCustomerPrice(t, tx, "gpt-5.5", 4.0e-6, 24.0e-6, 0.4e-6)
	assertPackyCustomerPrice(t, tx, "codex-auto-review", 2.0e-6, 12.0e-6, 0.2e-6)
	assertPackyTierWithCache(t, tx, "gpt-6-astra", 0, intPtr(272000), 7.0e-6, 35.0e-6, 8.75e-6, 0.7e-6)
	assertPackyTierWithCache(t, tx, "gpt-6-astra", 272000, nil, 14.0e-6, 52.5e-6, 17.5e-6, 1.4e-6)
	assertPackyGPT6TierSelectionBoundary(t, tx)

	var proCount int
	require.NoError(t, tx.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM channels c
		JOIN channel_model_pricing p ON p.channel_id = c.id
		WHERE c.name = 'OwnAPI LLM' AND p.models ? 'deepseek-v4-pro'
	`).Scan(&proCount))
	require.Zero(t, proCount)

	var coreCodexCount int
	require.NoError(t, tx.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM accounts
		WHERE name = 'Packy / Core'
		  AND credentials->'model_mapping' ?| ARRAY['gpt-5.6-luna','gpt-5.6-sol','gpt-5.6-terra','gpt-6-astra']
	`).Scan(&coreCodexCount))
	require.Zero(t, coreCodexCount)

	var codexMappingText string
	require.NoError(t, tx.QueryRowContext(ctx, `
		SELECT credentials->'model_mapping' FROM accounts WHERE name = 'Packy / Codex'
	`).Scan(&codexMappingText))
	require.JSONEq(t, `{"gpt-5.6-luna":"gpt-5.6-luna","gpt-5.6-sol":"gpt-5.6-sol","gpt-5.6-terra":"gpt-5.6-terra","gpt-6-astra":"gpt-6-astra"}`, codexMappingText)
	for accountName, wantCredential := range map[string][2]string{
		"Packy / Core":          {"preserve-core", "https://core.example/v1"},
		"Packy / Codex":         {"preserve-codex", "https://codex.example/v1"},
		"Packy / DeepSeek Sale": {"preserve-deepseek", "https://deepseek.example/v1"},
	} {
		var gotKey, gotBaseURL string
		require.NoError(t, tx.QueryRowContext(ctx, `SELECT credentials->>'api_key', credentials->>'base_url' FROM accounts WHERE name = $1`, accountName).Scan(&gotKey, &gotBaseURL))
		require.Equal(t, wantCredential[0], gotKey)
		require.Equal(t, wantCredential[1], gotBaseURL)
	}

	assertPackyAccountCostWithCache(t, tx, "Packy cost / Codex", "gpt-5.6-luna", 0.8/6.7e6, 4.8/6.7e6, 1.0/6.7e6, 0.08/6.7e6)
	assertPackyAccountCostWithCache(t, tx, "Packy cost / Codex", "gpt-5.6-sol", 4.0/6.7e6, 24.0/6.7e6, 5.0/6.7e6, 0.4/6.7e6)
	assertPackyAccountCostWithCache(t, tx, "Packy cost / Codex", "gpt-5.6-terra", 1.6/6.7e6, 9.6/6.7e6, 2.0/6.7e6, 0.16/6.7e6)
	assertPackyAccountCostWithCache(t, tx, "Packy cost / Codex", "gpt-6-astra", 8.0/6.7e6, 40.0/6.7e6, 10.0/6.7e6, 0.8/6.7e6)
	assertPackyAccountCostWithCache(t, tx, "Packy cost / DeepSeek Sale", "deepseek-v4-flash", 0.5/6.7e6, 2.0/6.7e6, 0, 0.01/6.7e6)
	assertPackyAccountCostTierWithCache(t, tx, "Packy cost / Codex", "gpt-5.6-luna", 0, intPtr(272000), 0.8/6.7e6, 4.8/6.7e6, 1.0/6.7e6, 0.08/6.7e6)
	assertPackyAccountCostTierWithCache(t, tx, "Packy cost / Codex", "gpt-5.6-luna", 272000, nil, 1.6/6.7e6, 7.2/6.7e6, 2.0/6.7e6, 0.16/6.7e6)
	assertPackyAccountCostTierWithCache(t, tx, "Packy cost / Codex", "gpt-5.6-sol", 272000, nil, 8.0/6.7e6, 36.0/6.7e6, 10.0/6.7e6, 0.8/6.7e6)
	assertPackyAccountCostTierWithCache(t, tx, "Packy cost / Codex", "gpt-5.6-terra", 272000, nil, 3.2/6.7e6, 14.4/6.7e6, 4.0/6.7e6, 0.32/6.7e6)

	var proCostCount int
	require.NoError(t, tx.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM channel_account_stats_model_pricing WHERE models ? 'deepseek-v4-pro'
	`).Scan(&proCostCount))
	require.Zero(t, proCostCount)
}

func assertPackyGPT6TierSelectionBoundary(t *testing.T, tx *sql.Tx) {
	t.Helper()
	rows, err := tx.QueryContext(context.Background(), `
		SELECT cpi.min_tokens, cpi.max_tokens, cpi.tier_label,
		       cpi.input_price, cpi.output_price, cpi.cache_write_price, cpi.cache_read_price
		FROM channels c
		JOIN channel_model_pricing cmp ON cmp.channel_id = c.id
		JOIN channel_pricing_intervals cpi ON cpi.pricing_id = cmp.id
		WHERE c.name = 'OwnAPI LLM' AND cmp.models ? 'gpt-6-astra'
		ORDER BY cpi.sort_order
	`)
	require.NoError(t, err)
	defer rows.Close()

	intervals := make([]service.PricingInterval, 0, 2)
	for rows.Next() {
		var interval service.PricingInterval
		var max sql.NullInt64
		require.NoError(t, rows.Scan(
			&interval.MinTokens, &max, &interval.TierLabel,
			&interval.InputPrice, &interval.OutputPrice, &interval.CacheWritePrice, &interval.CacheReadPrice,
		))
		if max.Valid {
			value := int(max.Int64)
			interval.MaxTokens = &value
		}
		intervals = append(intervals, interval)
	}
	require.NoError(t, rows.Err())
	require.Len(t, intervals, 2)

	for _, test := range []struct {
		tokens int
		label  string
	}{
		{tokens: 271999, label: "short"},
		{tokens: 272000, label: "short"},
		{tokens: 272001, label: "long"},
	} {
		matched := service.FindMatchingInterval(intervals, test.tokens)
		require.NotNil(t, matched, "expected GPT-6 tier at %d input tokens", test.tokens)
		require.Equal(t, test.label, matched.TierLabel)
	}
}

func TestPackyTextPricingMigration143RejectsAmbiguousCodexAccounts(t *testing.T) {
	tx := testTx(t)
	ctx := context.Background()

	_, err := tx.ExecContext(ctx, `
		INSERT INTO groups (name, platform, rate_multiplier, status)
		VALUES ('OwnAPI', 'openai', 1.0, 'active')
		ON CONFLICT (name) WHERE deleted_at IS NULL DO UPDATE SET platform = EXCLUDED.platform, status = EXCLUDED.status
	`)
	require.NoError(t, err)
	_, err = tx.ExecContext(ctx, `
		INSERT INTO accounts (name, platform, type, credentials, extra, status)
		VALUES
		  ('Packy / Codex', 'openai', 'apikey', '{"api_key":"first","model_mapping":{"gpt-5.6-luna":"gpt-5.6-luna"}}', '{"upstream_provider":"packyapi"}', 'disabled'),
		  ('Packy / Codex', 'openai', 'apikey', '{"api_key":"second","model_mapping":{"gpt-5.6-luna":"gpt-5.6-luna"}}', '{"upstream_provider":"packyapi"}', 'disabled')
	`)
	require.NoError(t, err)

	seedSQL, err := migrations.FS.ReadFile("137_seed_ownapi_packy_text_pricing.sql")
	require.NoError(t, err)
	_, err = tx.ExecContext(ctx, string(seedSQL))
	require.NoError(t, err)
	correctSQL, err := migrations.FS.ReadFile("143_correct_text_pricing_and_packy_scopes.sql")
	require.NoError(t, err)
	requireExecTwice(t, tx, string(correctSQL))

	var mappingCount int
	require.NoError(t, tx.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM accounts
		WHERE name = 'Packy / Codex'
		  AND credentials->'model_mapping' ?| ARRAY['gpt-5.6-luna','gpt-5.6-sol','gpt-5.6-terra','gpt-6-astra']
	`).Scan(&mappingCount))
	require.Zero(t, mappingCount)

	var ruleCount int
	require.NoError(t, tx.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM channel_account_stats_pricing_rules r
		JOIN channels c ON c.id = r.channel_id
		WHERE c.name = 'OwnAPI LLM' AND r.name = 'Packy cost / Codex'
	`).Scan(&ruleCount))
	require.Zero(t, ruleCount)

	var preservedKeys int
	require.NoError(t, tx.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM accounts
		WHERE name = 'Packy / Codex' AND credentials->>'api_key' IN ('first', 'second')
	`).Scan(&preservedKeys))
	require.Equal(t, 2, preservedKeys)
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

func assertPackyAccountCostWithCache(t *testing.T, tx *sql.Tx, rule, model string, input, output, cacheWrite, cacheRead float64) {
	t.Helper()
	var gotInput, gotOutput float64
	var gotCacheWrite, gotCacheRead sql.NullFloat64
	require.NoError(t, tx.QueryRowContext(context.Background(), `
		SELECT p.input_price, p.output_price, p.cache_write_price, p.cache_read_price
		FROM channel_account_stats_pricing_rules r
		JOIN channel_account_stats_model_pricing p ON p.rule_id = r.id
		WHERE r.name = $1 AND p.models ? $2
	`, rule, model).Scan(&gotInput, &gotOutput, &gotCacheWrite, &gotCacheRead))
	require.InDelta(t, input, gotInput, 1e-12)
	require.InDelta(t, output, gotOutput, 1e-12)
	if cacheWrite == 0 {
		require.False(t, gotCacheWrite.Valid)
	} else {
		require.True(t, gotCacheWrite.Valid)
		require.InDelta(t, cacheWrite, gotCacheWrite.Float64, 1e-12)
	}
	require.True(t, gotCacheRead.Valid)
	require.InDelta(t, cacheRead, gotCacheRead.Float64, 1e-12)
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

func assertPackyAccountCostTierWithCache(t *testing.T, tx *sql.Tx, rule, model string, min int, max *int, input, output, cacheWrite, cacheRead float64) {
	t.Helper()
	var gotInput, gotOutput, gotCacheWrite, gotCacheRead float64
	require.NoError(t, tx.QueryRowContext(context.Background(), `
		SELECT i.input_price, i.output_price, i.cache_write_price, i.cache_read_price
		FROM channel_account_stats_pricing_rules r
		JOIN channel_account_stats_model_pricing p ON p.rule_id = r.id
		JOIN channel_account_stats_pricing_intervals i ON i.pricing_id = p.id
		WHERE r.name = $1 AND p.models ? $2
		  AND i.min_tokens = $3 AND i.max_tokens IS NOT DISTINCT FROM $4
	`, rule, model, min, max).Scan(&gotInput, &gotOutput, &gotCacheWrite, &gotCacheRead))
	require.InDelta(t, input, gotInput, 1e-12)
	require.InDelta(t, output, gotOutput, 1e-12)
	require.InDelta(t, cacheWrite, gotCacheWrite, 1e-12)
	require.InDelta(t, cacheRead, gotCacheRead, 1e-12)
}

func intPtr(value int) *int { return &value }
