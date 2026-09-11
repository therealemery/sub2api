package migrations

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestMigration141AddsOnlyDeepSeekSaleAndCorrectsGPT6Pricing(t *testing.T) {
	content, err := FS.ReadFile("141_add_deepseek_sale_and_fix_gpt6_pricing.sql")
	require.NoError(t, err)

	sql := string(content)
	require.Contains(t, sql, "'OwnAPI LLM'")
	require.Contains(t, sql, "'Packy / DeepSeek Sale'")
	require.Contains(t, sql, "'Packy cost / DeepSeek Sale'")
	require.Contains(t, sql, "'deepseek-v4.1-flash'")
	require.Contains(t, sql, "'deepseek-v4-flash'")
	require.Contains(t, sql, "'deepseek-v4-pro'")
	require.Contains(t, sql, "0.1125")
	require.Contains(t, sql, "0.45")
	require.Contains(t, sql, "0.00225")

	// GPT-6 prices are per MTok before the migration divides them to exact
	// per-token database values. Both complete intervals must be present.
	require.Contains(t, sql, "('short',      0, 200000, 7.0,  35.0,  8.75, 0.7, 1)")
	require.Contains(t, sql, "('long',  200000,   NULL, 14.0, 52.5, 17.5, 1.4, 2)")

	// The credential update is account-name scoped and writes only a mapping;
	// migrations must never carry production secrets.
	require.Contains(t, sql, "jsonb_set")
	require.Contains(t, sql, "{model_mapping}")
	require.NotContains(t, sql, "api_key")
	require.NotContains(t, sql, "INSERT INTO accounts")
}
