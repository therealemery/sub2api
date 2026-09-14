package migrations

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestUsagePricingAuditMigrationContract(t *testing.T) {
	content, err := FS.ReadFile("142_add_usage_pricing_audit.sql")
	require.NoError(t, err)
	sql := strings.ToLower(string(content))

	for _, fragment := range []string{
		"alter table usage_logs add column if not exists pricing_effective_at timestamptz null",
		"alter table usage_logs add column if not exists condition_multiplier numeric(10,4) not null default 1",
		"alter table usage_logs add column if not exists pricing_rule_id varchar(128) null",
		"check (condition_multiplier > 0)",
		"conrelid = 'usage_logs'::regclass",
	} {
		require.Contains(t, sql, fragment)
	}
	for _, forbidden := range []string{
		"update usage_logs",
		"alter table accounts",
		"credentials",
		"api_key",
		"secret",
	} {
		require.NotContains(t, sql, forbidden)
	}
}
