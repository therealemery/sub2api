package handler

import (
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/payment"
	"github.com/Wei-Shaw/sub2api/internal/service"
)

func TestStripeOnlyMethodLimits(t *testing.T) {
	resp := &service.MethodLimitsResponse{
		Methods: map[string]service.MethodLimits{
			payment.TypeAlipay: {SingleMin: 1, SingleMax: 100},
			payment.TypeStripe: {SingleMin: 5, SingleMax: 500},
			payment.TypeWxpay:  {SingleMin: 2, SingleMax: 200},
		},
		GlobalMin: 1,
		GlobalMax: 500,
	}

	got := stripeOnlyMethodLimits(resp)
	if len(got.Methods) != 1 {
		t.Fatalf("methods len = %d, want 1 (%v)", len(got.Methods), got.Methods)
	}
	if _, ok := got.Methods[payment.TypeStripe]; !ok {
		t.Fatalf("stripe method missing from filtered checkout methods: %v", got.Methods)
	}
	if got.GlobalMin != 5 || got.GlobalMax != 500 {
		t.Fatalf("global range = (%v, %v), want (5, 500)", got.GlobalMin, got.GlobalMax)
	}
}
