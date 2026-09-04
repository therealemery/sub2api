package service

import (
	"fmt"
	"math"
	"strings"

	"github.com/Wei-Shaw/sub2api/internal/payment"
	"github.com/shopspring/decimal"
)

const defaultBalanceRechargeMultiplier = 1.0
const cnyPerUsd = 6.7

func calculateGatewayBalanceAmount(usdAmount float64, currency string) (float64, error) {
	normalized, err := payment.NormalizePaymentCurrency(strings.TrimSpace(currency))
	if err != nil {
		return 0, err
	}
	if normalized != "CNY" && normalized != "USD" {
		return 0, fmt.Errorf("unsupported balance recharge currency: %s", normalized)
	}
	amount := decimal.NewFromFloat(usdAmount)
	if normalized == "CNY" {
		amount = amount.Mul(decimal.NewFromFloat(cnyPerUsd))
	}
	return amount.Round(int32(payment.CurrencyMaxFractionDigits(normalized))).InexactFloat64(), nil
}

func normalizeBalanceRechargeMultiplier(multiplier float64) float64 {
	if math.IsNaN(multiplier) || math.IsInf(multiplier, 0) || multiplier <= 0 {
		return defaultBalanceRechargeMultiplier
	}
	return multiplier
}

func calculateCreditedBalanceForCurrency(paymentAmount float64, currency string, multiplier float64) (float64, error) {
	normalized, err := payment.NormalizePaymentCurrency(strings.TrimSpace(currency))
	if err != nil {
		return 0, err
	}
	if normalized != "CNY" && normalized != "USD" {
		return 0, fmt.Errorf("unsupported balance recharge currency: %s", normalized)
	}
	base := decimal.NewFromFloat(paymentAmount)
	if normalized == "CNY" {
		base = base.Div(decimal.NewFromFloat(cnyPerUsd))
	}
	return base.Mul(decimal.NewFromFloat(normalizeBalanceRechargeMultiplier(multiplier))).
		Round(2).
		InexactFloat64(), nil
}

func calculateGatewayRefundAmount(orderAmount, payAmount, refundAmount float64, currency string) float64 {
	if orderAmount <= 0 || payAmount <= 0 || refundAmount <= 0 {
		return 0
	}
	fractionDigits := int32(payment.CurrencyMaxFractionDigits(currency))
	if math.Abs(refundAmount-orderAmount) <= paymentAmountToleranceForCurrency(currency) {
		return decimal.NewFromFloat(payAmount).Round(fractionDigits).InexactFloat64()
	}
	return decimal.NewFromFloat(payAmount).
		Mul(decimal.NewFromFloat(refundAmount)).
		Div(decimal.NewFromFloat(orderAmount)).
		Round(fractionDigits).
		InexactFloat64()
}
