package service

import (
	"context"
	"encoding/json"
	"errors"
	"sort"
	"strings"
)

type FeaturedModelConfig struct {
	Model     string `json:"model"`
	Platform  string `json:"platform,omitempty"`
	Badge     string `json:"badge,omitempty"`
	SortOrder int    `json:"sort_order"`
}

type ModelDisplayPricingConfig struct {
	Model            string   `json:"model"`
	Platform         string   `json:"platform,omitempty"`
	BillingMode      string   `json:"billing_mode,omitempty"`
	InputPrice       *float64 `json:"input_price"`
	OutputPrice      *float64 `json:"output_price"`
	CacheWritePrice  *float64 `json:"cache_write_price"`
	CacheReadPrice   *float64 `json:"cache_read_price"`
	ImageOutputPrice *float64 `json:"image_output_price"`
	PerRequestPrice  *float64 `json:"per_request_price"`
	SortOrder        int      `json:"sort_order"`
}

type ModelDisplayConfig struct {
	FeaturedModels    []FeaturedModelConfig       `json:"featured_models"`
	PricingModels     []ModelDisplayPricingConfig `json:"pricing_models"`
	ReferenceDiscount *float64                    `json:"reference_discount,omitempty"`
}

func DefaultModelDisplayConfig() *ModelDisplayConfig {
	return &ModelDisplayConfig{
		FeaturedModels: []FeaturedModelConfig{},
		PricingModels:  []ModelDisplayPricingConfig{},
	}
}

func (s *SettingService) GetModelDisplayConfig(ctx context.Context) (*ModelDisplayConfig, error) {
	raw, err := s.settingRepo.GetValue(ctx, SettingKeyModelDisplayConfig)
	if err != nil {
		if errors.Is(err, ErrSettingNotFound) {
			return DefaultModelDisplayConfig(), nil
		}
		return nil, err
	}
	if strings.TrimSpace(raw) == "" {
		return DefaultModelDisplayConfig(), nil
	}

	var cfg ModelDisplayConfig
	if err := json.Unmarshal([]byte(raw), &cfg); err != nil {
		return DefaultModelDisplayConfig(), nil
	}
	normalizeModelDisplayConfig(&cfg)
	return &cfg, nil
}

func (s *SettingService) UpdateModelDisplayConfig(ctx context.Context, cfg ModelDisplayConfig) (*ModelDisplayConfig, error) {
	normalizeModelDisplayConfig(&cfg)
	raw, err := json.Marshal(cfg)
	if err != nil {
		return nil, err
	}
	if err := s.settingRepo.Set(ctx, SettingKeyModelDisplayConfig, string(raw)); err != nil {
		return nil, err
	}
	if s.onUpdate != nil {
		s.onUpdate()
	}
	return &cfg, nil
}

func normalizeModelDisplayConfig(cfg *ModelDisplayConfig) {
	normalizeFeaturedModels(cfg)
	normalizePricingModels(cfg)
	cfg.ReferenceDiscount = cleanPositiveDiscount(cfg.ReferenceDiscount)
}

func normalizeFeaturedModels(cfg *ModelDisplayConfig) {
	if cfg.FeaturedModels == nil {
		cfg.FeaturedModels = []FeaturedModelConfig{}
	}

	seen := make(map[string]struct{}, len(cfg.FeaturedModels))
	items := make([]FeaturedModelConfig, 0, len(cfg.FeaturedModels))
	for _, item := range cfg.FeaturedModels {
		item.Model = strings.TrimSpace(item.Model)
		item.Platform = strings.ToLower(strings.TrimSpace(item.Platform))
		item.Badge = strings.TrimSpace(item.Badge)
		if item.Model == "" {
			continue
		}
		key := item.Platform + "::" + strings.ToLower(item.Model)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		items = append(items, item)
	}

	sort.SliceStable(items, func(i, j int) bool {
		if items[i].SortOrder == items[j].SortOrder {
			return items[i].Model < items[j].Model
		}
		return items[i].SortOrder < items[j].SortOrder
	})

	for i := range items {
		items[i].SortOrder = i + 1
	}
	cfg.FeaturedModels = items
}

func normalizePricingModels(cfg *ModelDisplayConfig) {
	if cfg.PricingModels == nil {
		cfg.PricingModels = []ModelDisplayPricingConfig{}
		return
	}

	seen := make(map[string]struct{}, len(cfg.PricingModels))
	items := make([]ModelDisplayPricingConfig, 0, len(cfg.PricingModels))
	for _, item := range cfg.PricingModels {
		item.Model = strings.TrimSpace(item.Model)
		item.Platform = strings.ToLower(strings.TrimSpace(item.Platform))
		item.BillingMode = normalizeModelDisplayBillingMode(item.BillingMode)
		item.InputPrice = cleanNonNegativePrice(item.InputPrice)
		item.OutputPrice = cleanNonNegativePrice(item.OutputPrice)
		item.CacheWritePrice = cleanNonNegativePrice(item.CacheWritePrice)
		item.CacheReadPrice = cleanNonNegativePrice(item.CacheReadPrice)
		item.ImageOutputPrice = cleanNonNegativePrice(item.ImageOutputPrice)
		item.PerRequestPrice = cleanNonNegativePrice(item.PerRequestPrice)
		if item.Model == "" {
			continue
		}
		key := item.Platform + "::" + strings.ToLower(item.Model)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		items = append(items, item)
	}

	sort.SliceStable(items, func(i, j int) bool {
		if items[i].SortOrder == items[j].SortOrder {
			return items[i].Model < items[j].Model
		}
		return items[i].SortOrder < items[j].SortOrder
	})

	for i := range items {
		items[i].SortOrder = i + 1
	}
	cfg.PricingModels = items
}

func normalizeModelDisplayBillingMode(mode string) string {
	switch strings.ToLower(strings.TrimSpace(mode)) {
	case string(BillingModePerRequest):
		return string(BillingModePerRequest)
	case string(BillingModeImage):
		return string(BillingModeImage)
	default:
		return string(BillingModeToken)
	}
}

func cleanNonNegativePrice(value *float64) *float64 {
	if value == nil || *value < 0 {
		return nil
	}
	return value
}

func cleanPositiveDiscount(value *float64) *float64 {
	if value == nil || *value <= 0 {
		return nil
	}
	return value
}
