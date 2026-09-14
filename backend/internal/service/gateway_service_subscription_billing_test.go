//go:build unit

package service

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

// TestBuildUsageBillingCommand_SubscriptionAppliesRateMultiplier locks in the fix
// that subscription-mode billing honours the group (and any user-specific) rate
// multiplier — i.e. cmd.SubscriptionCost tracks ActualCost (= TotalCost *
// RateMultiplier), not raw TotalCost.
func TestBuildUsageBillingCommand_SubscriptionAppliesRateMultiplier(t *testing.T) {
	t.Parallel()

	groupID := int64(7)
	subID := int64(42)

	tests := []struct {
		name           string
		totalCost      float64
		actualCost     float64
		isSubscription bool
		wantSub        float64
		wantBalance    float64
	}{
		{
			name:           "subscription with 2x multiplier consumes 2x quota",
			totalCost:      1.0,
			actualCost:     2.0,
			isSubscription: true,
			wantSub:        2.0,
			wantBalance:    0,
		},
		{
			name:           "subscription with 0.5x multiplier consumes 0.5x quota",
			totalCost:      1.0,
			actualCost:     0.5,
			isSubscription: true,
			wantSub:        0.5,
			wantBalance:    0,
		},
		{
			name:           "free subscription (multiplier 0) consumes no quota",
			totalCost:      1.0,
			actualCost:     0,
			isSubscription: true,
			wantSub:        0,
			wantBalance:    0,
		},
		{
			name:           "balance billing keeps using ActualCost (regression)",
			totalCost:      1.0,
			actualCost:     2.0,
			isSubscription: false,
			wantSub:        0,
			wantBalance:    2.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			p := &postUsageBillingParams{
				Cost:               &CostBreakdown{TotalCost: tt.totalCost, ActualCost: tt.actualCost},
				User:               &User{ID: 1},
				APIKey:             &APIKey{ID: 2, GroupID: &groupID},
				Account:            &Account{ID: 3},
				Subscription:       &UserSubscription{ID: subID},
				IsSubscriptionBill: tt.isSubscription,
			}

			cmd := buildUsageBillingCommand("req-1", nil, p)
			if cmd == nil {
				t.Fatal("buildUsageBillingCommand returned nil")
			}
			if cmd.SubscriptionCost != tt.wantSub {
				t.Errorf("SubscriptionCost = %v, want %v", cmd.SubscriptionCost, tt.wantSub)
			}
			if cmd.BalanceCost != tt.wantBalance {
				t.Errorf("BalanceCost = %v, want %v", cmd.BalanceCost, tt.wantBalance)
			}
		})
	}
}

func TestBuildUsageBillingFingerprintIncludesPricingDecisionOnlyAsStructuredValues(t *testing.T) {
	base := &UsageBillingCommand{
		RequestID: "req-1", UserID: 1, AccountID: 2, APIKeyID: 3, Model: "deepseek-v4.1-flash",
		PricingEffectiveAt:  time.Date(2026, 9, 14, 1, 0, 0, 0, time.UTC),
		ConditionMultiplier: 2, PricingRuleID: deepSeekWeekdayPeakRuleID,
	}
	baseFingerprint := buildUsageBillingFingerprint(base)
	require.Equal(t, baseFingerprint, buildUsageBillingFingerprint(base))

	changedTime := *base
	changedTime.PricingEffectiveAt = changedTime.PricingEffectiveAt.Add(time.Second)
	require.NotEqual(t, baseFingerprint, buildUsageBillingFingerprint(&changedTime))
	changedFactor := *base
	changedFactor.ConditionMultiplier = 1
	require.NotEqual(t, baseFingerprint, buildUsageBillingFingerprint(&changedFactor))
	changedRule := *base
	changedRule.PricingRuleID = "future-neutral-rule"
	require.NotEqual(t, baseFingerprint, buildUsageBillingFingerprint(&changedRule))
}

func TestBuildUsageBillingCommandUsesAccountStatsCostForAccountQuota(t *testing.T) {
	accountCost := 0.25
	accountRate := 1.2
	p := &postUsageBillingParams{
		Cost: &CostBreakdown{TotalCost: 0.90, ActualCost: 0.90},
		User: &User{ID: 1}, APIKey: &APIKey{ID: 2},
		Account:          &Account{ID: 3, Type: AccountTypeAPIKey, Extra: map[string]any{"quota_limit": 100}},
		AccountStatsCost: &accountCost, AccountRateMultiplier: accountRate,
	}
	cmd := buildUsageBillingCommand("req-account-cost", nil, p)
	require.NotNil(t, cmd)
	require.InDelta(t, accountCost*accountRate, cmd.AccountQuotaCost, 1e-12)
}
