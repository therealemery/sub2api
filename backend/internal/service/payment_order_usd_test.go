package service

import (
	"context"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/payment"
)

func TestCreateOrderRejectsNonStripeUSDCheckout(t *testing.T) {
	t.Parallel()

	svc := &PaymentService{}
	_, err := svc.CreateOrder(context.Background(), CreateOrderRequest{
		UserID:      1,
		Amount:      10,
		PaymentType: payment.TypeAlipay,
		OrderType:   payment.OrderTypeBalance,
	})
	if err == nil {
		t.Fatal("CreateOrder accepted non-Stripe payment method for USD checkout")
	}
}

func TestBuildPaymentSubjectUsesUSDForRecharge(t *testing.T) {
	t.Parallel()

	svc := &PaymentService{}
	if got := svc.buildPaymentSubject(nil, 10, &PaymentConfig{}); got != "OwnAPI 10.00 USD" {
		t.Fatalf("buildPaymentSubject() = %q, want %q", got, "OwnAPI 10.00 USD")
	}
}
