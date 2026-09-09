package migrations

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestMigration139RemovesClaudeCodeOnlyPackyModels(t *testing.T) {
	content, err := FS.ReadFile("139_remove_claude_code_only_packy_models.sql")
	require.NoError(t, err)

	sql := string(content)
	for _, model := range []string{"claude-haiku-4-5-20251001", "claude-sonnet-4-5-20250929"} {
		require.Contains(t, sql, model)
	}
	require.Contains(t, sql, "channel_model_pricing")
	require.Contains(t, sql, "channel_account_stats_model_pricing")
	require.Contains(t, sql, "extra->>'upstream_provider' = 'packyapi'")
	require.Contains(t, sql, "credentials->'model_mapping'")
}
