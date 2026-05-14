package service

import (
	"math"

	"github.com/shopspring/decimal"
)

const defaultPointsPerRMB = 10.0
const defaultBalanceRechargeMultiplier = defaultPointsPerRMB

func normalizePointsPerRMB(pointsPerRMB float64) float64 {
	if math.IsNaN(pointsPerRMB) || math.IsInf(pointsPerRMB, 0) || pointsPerRMB <= 0 {
		return defaultPointsPerRMB
	}
	return pointsPerRMB
}

func normalizeBalanceRechargeMultiplier(multiplier float64) float64 {
	return normalizePointsPerRMB(multiplier)
}

func calculateCreditedPoints(paymentAmount, pointsPerRMB float64) float64 {
	return decimal.NewFromFloat(paymentAmount).
		Mul(decimal.NewFromFloat(normalizePointsPerRMB(pointsPerRMB))).
		Round(2).
		InexactFloat64()
}

func calculateCreditedBalance(paymentAmount, multiplier float64) float64 {
	return calculateCreditedPoints(paymentAmount, multiplier)
}

func calculateGatewayRefundAmount(orderAmount, payAmount, refundAmount float64) float64 {
	if orderAmount <= 0 || payAmount <= 0 || refundAmount <= 0 {
		return 0
	}
	if math.Abs(refundAmount-orderAmount) <= amountToleranceCNY {
		return decimal.NewFromFloat(payAmount).Round(2).InexactFloat64()
	}
	return decimal.NewFromFloat(payAmount).
		Mul(decimal.NewFromFloat(refundAmount)).
		Div(decimal.NewFromFloat(orderAmount)).
		Round(2).
		InexactFloat64()
}
