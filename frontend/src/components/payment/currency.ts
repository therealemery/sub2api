export const DEFAULT_PAYMENT_CURRENCY = 'CNY'
export const CNY_PER_USD = 6.7

export function normalizePaymentCurrency(currency?: string | null): string {
  const normalized = String(currency || '').trim().toUpperCase()
  return /^[A-Z]{3}$/.test(normalized) ? normalized : DEFAULT_PAYMENT_CURRENCY
}

function paymentCurrencyFractionDigits(currency: string): number {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  } catch {
    return 2
  }
}

export function formatPaymentAmount(amount: number, currency?: string | null, locale?: string): string {
  const normalized = normalizePaymentCurrency(currency)
  const fractionDigits = paymentCurrencyFractionDigits(normalized)
  try {
    return new Intl.NumberFormat(locale || undefined, {
      style: 'currency',
      currency: normalized,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(Number.isFinite(amount) ? amount : 0)
  } catch {
    return `${normalized} ${(Number.isFinite(amount) ? amount : 0).toFixed(fractionDigits)}`
  }
}

export function calculateCreditedUsd(amount: number, currency?: string | null, multiplier = 1): number {
  const normalized = normalizePaymentCurrency(currency)
  if (normalized !== 'CNY' && normalized !== 'USD') {
    throw new Error(`Unsupported balance recharge currency: ${normalized}`)
  }
  const safeAmount = Number.isFinite(amount) ? amount : 0
  const safeMultiplier = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1
  const converted = normalized === 'CNY' ? safeAmount / CNY_PER_USD : safeAmount
  return Math.round(converted * safeMultiplier * 100) / 100
}
