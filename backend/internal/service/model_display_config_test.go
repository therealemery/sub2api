//go:build unit

package service

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/stretchr/testify/require"
)

func TestSettingService_GetModelDisplayConfig_DefaultsWhenUnsetOrInvalid(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name  string
		value string
	}{
		{name: "unset"},
		{name: "blank", value: "   "},
		{name: "invalid json", value: "{bad-json"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			repo := newMockSettingRepo()
			if tt.value != "" {
				require.NoError(t, repo.Set(context.Background(), SettingKeyModelDisplayConfig, tt.value))
			}
			svc := NewSettingService(repo, &config.Config{})

			got, err := svc.GetModelDisplayConfig(context.Background())
			require.NoError(t, err)
			require.NotNil(t, got)
			require.Empty(t, got.FeaturedModels)
			require.Empty(t, got.PricingModels)
			require.Nil(t, got.ReferenceDiscount)
		})
	}
}

func TestSettingService_UpdateModelDisplayConfig_NormalizesAndPersists(t *testing.T) {
	t.Parallel()

	repo := newMockSettingRepo()
	svc := NewSettingService(repo, &config.Config{})
	negative := -1.0
	input := 0.000003
	output := 0.000015
	zero := 0.0
	discount := 0.6

	got, err := svc.UpdateModelDisplayConfig(context.Background(), ModelDisplayConfig{
		FeaturedModels: []FeaturedModelConfig{
			{Model: "  claude-sonnet-4.5  ", Platform: " Anthropic ", Badge: " 主推 ", SortOrder: 20},
			{Model: "", Platform: "openai", Badge: "skip", SortOrder: 1},
			{Model: "claude-sonnet-4.5", Platform: "anthropic", Badge: "duplicate", SortOrder: 1},
			{Model: "gpt-5.4", Platform: "OPENAI", SortOrder: 10},
		},
		PricingModels: []ModelDisplayPricingConfig{
			{Model: "gpt-5.4", Platform: " OpenAI ", BillingMode: "bad-mode", InputPrice: &negative, OutputPrice: &zero, SortOrder: 10},
			{Model: " claude-sonnet-4.5 ", Platform: "Anthropic", BillingMode: string(BillingModeToken), InputPrice: &input, OutputPrice: &output, SortOrder: 5},
			{Model: "claude-sonnet-4.5", Platform: "anthropic", BillingMode: string(BillingModePerRequest), PerRequestPrice: &input, SortOrder: 1},
			{Model: "", Platform: "openai", SortOrder: 1},
		},
		ReferenceDiscount: &discount,
	})
	require.NoError(t, err)

	require.Equal(t, []FeaturedModelConfig{
		{Model: "gpt-5.4", Platform: "openai", SortOrder: 1},
		{Model: "claude-sonnet-4.5", Platform: "anthropic", Badge: "主推", SortOrder: 2},
	}, got.FeaturedModels)

	require.Len(t, got.PricingModels, 2)
	require.Equal(t, "claude-sonnet-4.5", got.PricingModels[0].Model)
	require.Equal(t, "anthropic", got.PricingModels[0].Platform)
	require.Equal(t, string(BillingModeToken), got.PricingModels[0].BillingMode)
	require.Equal(t, 1, got.PricingModels[0].SortOrder)
	require.Equal(t, input, *got.PricingModels[0].InputPrice)
	require.Equal(t, output, *got.PricingModels[0].OutputPrice)

	require.Equal(t, "gpt-5.4", got.PricingModels[1].Model)
	require.Equal(t, "openai", got.PricingModels[1].Platform)
	require.Equal(t, string(BillingModeToken), got.PricingModels[1].BillingMode)
	require.Nil(t, got.PricingModels[1].InputPrice)
	require.Equal(t, zero, *got.PricingModels[1].OutputPrice)
	require.Equal(t, discount, *got.ReferenceDiscount)

	raw, err := repo.GetValue(context.Background(), SettingKeyModelDisplayConfig)
	require.NoError(t, err)
	var persisted ModelDisplayConfig
	require.NoError(t, json.Unmarshal([]byte(raw), &persisted))
	require.Equal(t, got.FeaturedModels, persisted.FeaturedModels)
	require.Equal(t, got.PricingModels, persisted.PricingModels)
	require.Equal(t, discount, *persisted.ReferenceDiscount)
}
