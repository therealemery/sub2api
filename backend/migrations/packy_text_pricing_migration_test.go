package migrations

import (
	"regexp"
	"sort"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestMigration137SeedsFailClosedPackyTextPricing(t *testing.T) {
	content, err := FS.ReadFile("137_seed_ownapi_packy_text_pricing.sql")
	require.NoError(t, err)

	sql := string(content)
	require.Contains(t, sql, "'OwnAPI LLM'")
	require.Contains(t, sql, "restrict_models = EXCLUDED.restrict_models")
	require.Contains(t, sql, "g.name = 'OwnAPI' AND g.platform = 'openai'")
	require.Contains(t, sql, "'channel_mapped'")
	require.Contains(t, sql, "prices.input_mtok / 1000000.0")
	require.Contains(t, sql, "tiers.input_mtok / 1000000.0")

	for _, unpublished := range []string{"glm-5", "glm-5.2", "gemini-3-pro-preview", "kimi-k2.5"} {
		require.NotContains(t, sql, `"`+unpublished+`"`)
	}

	// Exact quoted model IDs across the flat and tiered seed blocks. Tiered
	// models appear more than once, so count unique IDs rather than literals.
	re := regexp.MustCompile(`['\"]([A-Za-z0-9][A-Za-z0-9._-]+)['\"]`)
	models := map[string]struct{}{}
	for _, match := range re.FindAllStringSubmatch(sql, -1) {
		model := match[1]
		if strings.HasPrefix(model, "gpt-") || strings.HasPrefix(model, "claude-") ||
			strings.HasPrefix(model, "gemini-") || strings.HasPrefix(model, "grok-") ||
			strings.HasPrefix(model, "qwen") || strings.HasPrefix(model, "glm-") ||
			strings.HasPrefix(strings.ToLower(model), "minimax-") || model == "codex-auto-review" {
			models[model] = struct{}{}
		}
	}
	wantModels := []string{
		"MiniMax-M2.7", "MiniMax-M3", "claude-haiku-4-5-20251001",
		"claude-opus-4-6", "claude-opus-4-7", "claude-opus-4-8",
		"claude-opus-5", "claude-sonnet-4-5-20250929", "claude-sonnet-4-6",
		"claude-sonnet-5", "codex-auto-review", "gemini-2.5-flash",
		"gemini-2.5-pro", "gemini-3-flash-preview", "gemini-3.1-pro-preview",
		"gemini-3.5-flash", "glm-5.3", "glm-5.3-flash",
		"gpt-5.4", "gpt-5.4-mini", "gpt-5.5", "gpt-5.6-luna",
		"gpt-5.6-sol", "gpt-5.6-terra", "gpt-6-astra", "grok-4.5",
		"grok-4.6", "minimax-m2.5", "qwen3-coder-next", "qwen3-max",
		"qwen3-vl-flash", "qwen3.5-flash", "qwen3.5-plus",
		"qwen3.6-max-preview", "qwen3.6-plus", "qwen3.7-max",
		"qwen3.7-plus", "qwen3.8-flash", "qwen3.8-max",
	}
	gotModels := make([]string, 0, len(models))
	for model := range models {
		gotModels = append(gotModels, model)
	}
	sort.Strings(gotModels)
	sort.Strings(wantModels)
	require.Equal(t, wantModels, gotModels)

	// GPT-5.4 is the sole 8-discount customer model. All remaining values are
	// the catalog's manufacturer prices multiplied by 0.7.
	require.Contains(t, sql, `('["gpt-5.4-mini"]'::jsonb,                                      0.525,  3.15,   NULL, 0.0525)`)
	require.Contains(t, sql, `('["glm-5.3-flash"]'::jsonb,                                      0.105, 0.35,   NULL, 0.021)`)

	// Tiered prices cover every positive token count, preventing an accidental
	// fallback to an undiscounted provider price.
	require.Contains(t, sql, "('gpt-6-astra',                 0,  200000")
	require.Contains(t, sql, "('gpt-6-astra',            200000,    NULL")
	require.Contains(t, sql, "('gpt-5.4',                      0,  272000")
	require.Contains(t, sql, "('gpt-5.4',                 272000,    NULL")
	require.Contains(t, sql, "('qwen3-coder-next',            0,   32000")
	require.Contains(t, sql, "('qwen3-coder-next',        32000,  128000")
	require.Contains(t, sql, "('qwen3-coder-next',       128000,    NULL")
	require.Contains(t, sql, "('MiniMax-M3',                  0,  512000")
	require.Contains(t, sql, "('MiniMax-M3',             512000,    NULL")
	require.Contains(t, sql, "cost.input_cny / 6.7 / 1000000.0")
	require.Contains(t, sql, "'Packy cost / Core'")
	require.Contains(t, sql, "'Packy cost / Expansion'")
	require.Contains(t, sql, "'Packy cost / GPT-5.4'")
}
