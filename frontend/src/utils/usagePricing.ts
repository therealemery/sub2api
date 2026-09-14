export const TOKENS_PER_MILLION = 1_000_000

interface TokenPriceFormatOptions {
  fractionDigits?: number
  withCurrencySymbol?: boolean
  emptyValue?: string
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function calculateTokenUnitPrice(
  cost: number | null | undefined,
  tokens: number | null | undefined
): number | null {
  if (!isFiniteNumber(cost) || !isFiniteNumber(tokens) || tokens <= 0) {
    return null
  }

  return cost / tokens
}

export function calculateTokenPricePerMillion(
  cost: number | null | undefined,
  tokens: number | null | undefined
): number | null {
  const unitPrice = calculateTokenUnitPrice(cost, tokens)
  if (unitPrice == null) {
    return null
  }

  return unitPrice * TOKENS_PER_MILLION
}

export function formatTokenPricePerMillion(
  cost: number | null | undefined,
  tokens: number | null | undefined,
  options: TokenPriceFormatOptions = {}
): string {
  const pricePerMillion = calculateTokenPricePerMillion(cost, tokens)
  if (pricePerMillion == null) {
    return options.emptyValue ?? '-'
  }

  const fractionDigits = options.fractionDigits ?? 4
  const formatted = pricePerMillion.toFixed(fractionDigits)
  return options.withCurrencySymbol == false ? formatted : `$${formatted}`
}

export function normalizeConditionMultiplier(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return 1
  }
  return value
}

export function formatPricingConditionMultiplier(value: unknown): string {
  const multiplier = normalizeConditionMultiplier(value)
  const formatted = Number.isInteger(multiplier)
    ? multiplier.toFixed(0)
    : multiplier.toLocaleString('en-US', { maximumFractionDigits: 4, useGrouping: false })
  return `${formatted}x`
}

export function pricingRuleLabel(ruleId: string | null | undefined, locale: string): string {
  const chinese = locale.toLowerCase().startsWith('zh')
  if (!ruleId) {
    return chinese ? '标准时段' : 'Standard time'
  }
  if (ruleId === 'deepseek-weekday-peak-2026-09-13') {
    return chinese ? '工作日高峰计费' : 'Weekday peak pricing'
  }
  return chinese ? '请求时段规则' : 'Request time rule'
}

export function formatPricingEffectiveAtUTC(value: string | null | undefined): string {
  if (!value) return '-'
  const timestamp = new Date(value)
  return Number.isNaN(timestamp.getTime()) ? '-' : timestamp.toISOString()
}
