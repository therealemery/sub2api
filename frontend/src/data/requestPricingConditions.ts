import type { PublicRequestPricingConditionRule } from '@/api/modelDisplay'

export interface FormattedRequestPricingCondition {
  beijingWindows: string
  utcWindows: string
  weekdayRange: string
  multiplier: string
}

export function requestPricingConditionForModel(
  rules: PublicRequestPricingConditionRule[],
  modelId: string,
): PublicRequestPricingConditionRule | null {
  const canonical = canonicalModelId(modelId)
  return rules.find((rule) => rule.models.some((model) => canonicalModelId(model) === canonical)) ?? null
}

export function formatRequestPricingCondition(rule: PublicRequestPricingConditionRule): FormattedRequestPricingCondition {
  return {
    beijingWindows: rule.windows.map(formatWindow).join(', '),
    utcWindows: rule.windows.map((window) => formatWindow({
      start_minute: shiftMinute(window.start_minute, -8 * 60),
      end_minute: shiftMinute(window.end_minute, -8 * 60),
    })).join(', '),
    weekdayRange: rule.weekdays.join(','),
    multiplier: `${formatMultiplier(rule.customer_multiplier)}×`,
  }
}

function canonicalModelId(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, '-').replace(/[^a-z0-9]+/g, '-')
}

function formatWindow(window: { start_minute: number; end_minute: number }): string {
  return `${formatMinute(window.start_minute)}–${formatMinute(window.end_minute)}`
}

function formatMinute(total: number): string {
  const normalized = shiftMinute(total, 0)
  const hour = Math.floor(normalized / 60)
  const minute = normalized % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function shiftMinute(value: number, delta: number): number {
  return ((value + delta) % (24 * 60) + 24 * 60) % (24 * 60)
}

function formatMultiplier(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : String(value)
}
