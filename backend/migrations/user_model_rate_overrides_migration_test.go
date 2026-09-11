package migrations

import (
	"strings"
	"testing"
)

func TestUserModelRateOverridesMigration(t *testing.T) {
	content, err := FS.ReadFile("140_add_user_model_rate_overrides.sql")
	if err != nil {
		t.Fatalf("read migration: %v", err)
	}
	sql := string(content)
	for _, fragment := range []string{
		"CREATE TABLE IF NOT EXISTS user_model_rate_overrides",
		"REFERENCES users(id) ON DELETE CASCADE",
		"REFERENCES groups(id) ON DELETE CASCADE",
		"CREATE UNIQUE INDEX IF NOT EXISTS idx_user_model_rate_overrides_lookup",
		"lower(model_id)",
	} {
		if !strings.Contains(sql, fragment) {
			t.Fatalf("migration missing %q", fragment)
		}
	}
}
