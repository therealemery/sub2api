package migrations

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestMigration138BackfillsAccountStatsTierLabels(t *testing.T) {
	content, err := FS.ReadFile("138_backfill_account_stats_tier_labels.sql")
	require.NoError(t, err)
	sql := string(content)
	require.Contains(t, sql, "UPDATE channel_account_stats_pricing_intervals")
	require.Contains(t, sql, "WHERE tier_label IS NULL")
	require.Contains(t, sql, "'short'")
	require.Contains(t, sql, "'mid'")
	require.Contains(t, sql, "'long'")
}
