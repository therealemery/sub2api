package service

import "testing"

func TestCalculateCreditedBalanceForCurrency(t *testing.T) {
	tests := []struct {
		name       string
		amount     float64
		currency   string
		multiplier float64
		want       float64
	}{
		{"cny", 67, "CNY", 1, 10},
		{"usd", 10, "USD", 1, 10},
		{"multiplier", 67, " cny ", 0.9, 9},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := calculateCreditedBalanceForCurrency(tt.amount, tt.currency, tt.multiplier)
			if err != nil || got != tt.want {
				t.Fatalf("got %v, %v; want %v", got, err, tt.want)
			}
		})
	}
	if _, err := calculateCreditedBalanceForCurrency(10, "EUR", 1); err == nil {
		t.Fatal("expected unsupported currency error")
	}
}

func TestCalculateGatewayBalanceAmount(t *testing.T) {
	for _, tt := range []struct {
		currency string
		want     float64
	}{
		{currency: "CNY", want: 67},
		{currency: "USD", want: 10},
	} {
		got, err := calculateGatewayBalanceAmount(10, tt.currency)
		if err != nil || got != tt.want {
			t.Fatalf("currency %s: got %v, %v; want %v", tt.currency, got, err, tt.want)
		}
	}
}
