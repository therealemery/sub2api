package migrations

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestMigration143CorrectsTextPricingAndPackyScopes(t *testing.T) {
	content, err := FS.ReadFile("143_correct_text_pricing_and_packy_scopes.sql")
	require.NoError(t, err)

	sql := string(content)
	lowerSQL := strings.ToLower(sql)

	for _, accountName := range []string{"Packy / Codex", "Packy / DeepSeek Sale"} {
		require.Contains(t, sql, "'"+accountName+"'")
	}
	require.GreaterOrEqual(t, strings.Count(sql, "extra->>'upstream_provider' = 'packyapi'"), 3)
	require.GreaterOrEqual(t, strings.Count(sql, "HAVING COUNT(*) = 1"), 3)
	require.NotContains(t, lowerSQL, "insert into accounts")
	require.NotContains(t, lowerSQL, "'api_key'")
	require.NotContains(t, lowerSQL, "137_seed_ownapi_packy_text_pricing")
	require.NotContains(t, lowerSQL, "141_add_deepseek_sale_and_fix_gpt6_pricing")

	// Final customer USD/MTok rows from the reviewed manufacturer snapshot.
	require.Contains(t, sql, "('deepseek-v4.1-flash', 0.105,  0.42,  NULL,  0.0021)")
	require.Contains(t, sql, "('gpt-5.4-mini',         0.6,    3.6,   NULL,  0.06)")
	require.Contains(t, sql, "('gpt-5.5',              4.0,   24.0,   NULL,  0.4)")
	require.Contains(t, sql, "('codex-auto-review',    2.0,   12.0,   NULL,  0.2)")
	require.NotContains(t, sql, "('deepseek-v4-pro',")

	// The left-open/right-closed intervals keep exactly 272K in the short tier.
	require.Contains(t, sql, "('gpt-6-astra',      0, 272000, 'short'")
	require.Contains(t, sql, "('gpt-6-astra', 272000,   NULL, 'long'")

	// Exact codex group cards, not values inferred from the public sale price.
	require.Contains(t, sql, "('Packy cost / Codex', 'gpt-5.6-luna',  0.8,  4.8,  1.0, 0.08)")
	require.Contains(t, sql, "('Packy cost / Codex', 'gpt-5.6-sol',    4.0, 24.0,  5.0, 0.4)")
	require.Contains(t, sql, "('Packy cost / Codex', 'gpt-5.6-terra',  1.6,  9.6,  2.0, 0.16)")
	require.Contains(t, sql, "('Packy cost / Codex', 'gpt-6-astra',     8.0, 40.0, 10.0, 0.8)")
	require.Contains(t, sql, "costs.input_cny / 6.7 / 1000000.0")
}
