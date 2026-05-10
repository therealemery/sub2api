package provider

import (
	"encoding/json"
	"testing"

	stripe "github.com/stripe/stripe-go/v85"
)

func TestStripeCurrencyIsUSD(t *testing.T) {
	if stripeCurrency != "usd" {
		t.Fatalf("stripeCurrency = %q, want usd", stripeCurrency)
	}
}

func TestParseStripePaymentIntentUsesMinorUnits(t *testing.T) {
	raw, err := json.Marshal(stripe.PaymentIntent{
		ID:       "pi_test",
		Amount:   1000,
		Metadata: map[string]string{"orderId": "sub2_123"},
	})
	if err != nil {
		t.Fatalf("marshal payment intent: %v", err)
	}

	notification, err := parseStripePaymentIntent(&stripe.Event{Data: &stripe.EventData{Raw: raw}}, "success", "{}")
	if err != nil {
		t.Fatalf("parseStripePaymentIntent: %v", err)
	}
	if notification.Amount != 10 {
		t.Fatalf("Amount = %v, want 10", notification.Amount)
	}
	if notification.OrderID != "sub2_123" {
		t.Fatalf("OrderID = %q, want sub2_123", notification.OrderID)
	}
}
