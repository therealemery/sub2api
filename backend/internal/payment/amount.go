package payment

import (
	"fmt"

	"github.com/shopspring/decimal"
)

const minorUnitsPerMajor = 100

// MajorToMinor converts a major currency amount string (e.g. "10.50") to
// minor units (for example cents) using 2-decimal currencies.
// Uses shopspring/decimal for precision.
func MajorToMinor(amountStr string) (int64, error) {
	d, err := decimal.NewFromString(amountStr)
	if err != nil {
		return 0, fmt.Errorf("invalid amount: %s", amountStr)
	}
	return d.Mul(decimal.NewFromInt(minorUnitsPerMajor)).IntPart(), nil
}

// MinorToMajor converts minor units to major currency units as a float64 for
// interface compatibility.
func MinorToMajor(minor int64) float64 {
	return decimal.NewFromInt(minor).Div(decimal.NewFromInt(minorUnitsPerMajor)).InexactFloat64()
}

// YuanToFen converts a CNY yuan string (e.g. "10.50") to fen (int64).
// Deprecated: use MajorToMinor for currency-neutral payment code.
func YuanToFen(yuanStr string) (int64, error) {
	return MajorToMinor(yuanStr)
}

// FenToYuan converts fen (int64) to yuan as a float64 for interface compatibility.
// Deprecated: use MinorToMajor for currency-neutral payment code.
func FenToYuan(fen int64) float64 {
	return MinorToMajor(fen)
}
