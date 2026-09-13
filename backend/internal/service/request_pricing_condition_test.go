package service

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestRequestPricingConditionBoundaries(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		at         string
		wantFactor float64
		wantRuleID string
	}{
		{name: "monday morning before", at: "2026-09-14T00:59:59Z", wantFactor: 1},
		{name: "monday morning opens", at: "2026-09-14T01:00:00Z", wantFactor: 2, wantRuleID: deepSeekWeekdayPeakRuleID},
		{name: "monday morning peak", at: "2026-09-14T02:30:00Z", wantFactor: 2, wantRuleID: deepSeekWeekdayPeakRuleID},
		{name: "monday morning closes", at: "2026-09-14T04:00:00Z", wantFactor: 1},
		{name: "monday afternoon opens", at: "2026-09-14T06:00:00Z", wantFactor: 2, wantRuleID: deepSeekWeekdayPeakRuleID},
		{name: "friday afternoon peak", at: "2026-09-18T09:59:59Z", wantFactor: 2, wantRuleID: deepSeekWeekdayPeakRuleID},
		{name: "monday afternoon closes", at: "2026-09-14T10:00:00Z", wantFactor: 1},
		{name: "saturday", at: "2026-09-19T02:00:00Z", wantFactor: 1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			at, err := time.Parse(time.RFC3339, tt.at)
			require.NoError(t, err)

			got, err := ResolveRequestPricingContext("deepseek-v4.1-flash", at)
			require.NoError(t, err)
			require.Equal(t, "deepseek-v4.1-flash", got.CanonicalModel)
			require.Equal(t, at.UTC(), got.EffectiveAt)
			require.Equal(t, tt.wantRuleID, got.RuleID)
			require.Equal(t, tt.wantFactor, got.CustomerMultiplier)
			require.Equal(t, tt.wantFactor, got.UpstreamCostMultiplier)
		})
	}
}

func TestRequestPricingConditionCanonicalAndNeutralModels(t *testing.T) {
	t.Parallel()

	peak, err := ResolveRequestPricingContext("  DeepSeek-V4.1-Flash  ", time.Date(2026, 9, 14, 1, 0, 0, 0, time.UTC))
	require.NoError(t, err)
	require.Equal(t, "deepseek-v4.1-flash", peak.CanonicalModel)
	require.Equal(t, deepSeekWeekdayPeakRuleID, peak.RuleID)
	require.Equal(t, 2.0, peak.CustomerMultiplier)
	require.Equal(t, 2.0, peak.UpstreamCostMultiplier)

	neutral, err := ResolveRequestPricingContext("gpt-6-astra", time.Date(2026, 9, 14, 1, 0, 0, 0, time.UTC))
	require.NoError(t, err)
	require.Equal(t, "gpt-6-astra", neutral.CanonicalModel)
	require.Empty(t, neutral.RuleID)
	require.Equal(t, 1.0, neutral.CustomerMultiplier)
	require.Equal(t, 1.0, neutral.UpstreamCostMultiplier)
}

func TestRequestPricingConditionPublicProjectionIsSanitizedAndDefensive(t *testing.T) {
	t.Parallel()

	rules := PublicRequestPricingConditionRules()
	require.Len(t, rules, 1)
	require.Equal(t, deepSeekWeekdayPeakRuleID, rules[0].ID)
	require.Equal(t, []string{"deepseek-v4.1-flash"}, rules[0].Models)
	require.Equal(t, "Asia/Shanghai", rules[0].Timezone)
	require.Equal(t, 2.0, rules[0].CustomerMultiplier)
	require.Equal(t, []RequestPricingTimeWindow{
		{StartMinute: 9 * 60, EndMinute: 12 * 60},
		{StartMinute: 14 * 60, EndMinute: 18 * 60},
	}, rules[0].Windows)

	payload, err := json.Marshal(rules)
	require.NoError(t, err)
	payloadText := string(payload)
	require.NotContains(t, payloadText, "upstream_cost_multiplier")
	require.NotContains(t, payloadText, "source")
	require.NotContains(t, payloadText, "packy")
	require.NotContains(t, payloadText, "account")
	require.NotContains(t, payloadText, "deepseek-v4-flash")

	rules[0].Models[0] = "mutated"
	rules[0].Windows[0].StartMinute = 0
	fresh := PublicRequestPricingConditionRules()
	require.Equal(t, "deepseek-v4.1-flash", fresh[0].Models[0])
	require.Equal(t, 9*60, fresh[0].Windows[0].StartMinute)
}

func TestValidateRequestPricingConditionRules(t *testing.T) {
	t.Parallel()

	valid := testRequestPricingConditionRule("rule-a", "model-a")
	require.NoError(t, ValidateRequestPricingConditionRules([]RequestPricingConditionRule{valid}))
	require.NoError(t, ValidateRequestPricingConditionRules(requestPricingConditionRules))

	tests := []struct {
		name  string
		rules []RequestPricingConditionRule
	}{
		{name: "duplicate id", rules: []RequestPricingConditionRule{valid, testRequestPricingConditionRule("rule-a", "model-b")}},
		{name: "duplicate model ownership", rules: []RequestPricingConditionRule{valid, testRequestPricingConditionRule("rule-b", " MODEL-A ")}},
		{name: "invalid timezone", rules: []RequestPricingConditionRule{func() RequestPricingConditionRule {
			r := valid
			r.Timezone = "Mars/Olympus"
			return r
		}()}},
		{name: "empty window", rules: []RequestPricingConditionRule{func() RequestPricingConditionRule {
			r := valid
			r.Windows = []RequestPricingTimeWindow{{StartMinute: 100, EndMinute: 100}}
			return r
		}()}},
		{name: "overlapping windows", rules: []RequestPricingConditionRule{func() RequestPricingConditionRule {
			r := valid
			r.Windows = []RequestPricingTimeWindow{{StartMinute: 100, EndMinute: 200}, {StartMinute: 199, EndMinute: 300}}
			return r
		}()}},
		{name: "invalid weekday", rules: []RequestPricingConditionRule{func() RequestPricingConditionRule {
			r := valid
			r.Weekdays = []time.Weekday{time.Weekday(7)}
			return r
		}()}},
		{name: "zero customer multiplier", rules: []RequestPricingConditionRule{func() RequestPricingConditionRule {
			r := valid
			r.CustomerMultiplier = 0
			return r
		}()}},
		{name: "negative upstream multiplier", rules: []RequestPricingConditionRule{func() RequestPricingConditionRule {
			r := valid
			r.UpstreamCostMultiplier = -1
			return r
		}()}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			require.Error(t, ValidateRequestPricingConditionRules(tt.rules))
		})
	}
}

func testRequestPricingConditionRule(id, model string) RequestPricingConditionRule {
	return RequestPricingConditionRule{
		ID:                     id,
		Models:                 []string{model},
		Timezone:               "UTC",
		Weekdays:               []time.Weekday{time.Monday},
		Windows:                []RequestPricingTimeWindow{{StartMinute: 60, EndMinute: 120}},
		CustomerMultiplier:     2,
		UpstreamCostMultiplier: 2,
		NameEN:                 "Test rule",
		NameZH:                 "测试规则",
		Source:                 "test",
		VerifiedAt:             "2026-09-13",
	}
}
