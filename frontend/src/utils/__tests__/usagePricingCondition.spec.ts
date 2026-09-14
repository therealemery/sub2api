import { describe, expect, it } from 'vitest'
import {
  formatPricingConditionMultiplier,
  formatPricingEffectiveAtUTC,
  normalizeConditionMultiplier,
  pricingRuleLabel,
} from '../usagePricing'

describe('usage pricing condition formatters', () => {
  it('normalizes missing and invalid historical values to the neutral factor', () => {
    for (const value of [undefined, null, 0, -1, Number.NaN, Number.POSITIVE_INFINITY, '2']) {
      expect(normalizeConditionMultiplier(value)).toBe(1)
      expect(formatPricingConditionMultiplier(value)).toBe('1x')
    }
  })

  it('formats current and future positive factors without throwing', () => {
    expect(formatPricingConditionMultiplier(1)).toBe('1x')
    expect(formatPricingConditionMultiplier(2)).toBe('2x')
    expect(formatPricingConditionMultiplier(1.25)).toBe('1.25x')
  })

  it('uses provider-neutral localized rule labels', () => {
    expect(pricingRuleLabel('deepseek-weekday-peak-2026-09-13', 'en')).toBe('Weekday peak pricing')
    expect(pricingRuleLabel('deepseek-weekday-peak-2026-09-13', 'zh-CN')).toBe('工作日高峰计费')
    expect(pricingRuleLabel('future-rule', 'en')).toBe('Request time rule')
    expect(pricingRuleLabel(null, 'zh-CN')).toBe('标准时段')
  })

  it('formats the locked attempt timestamp as ISO UTC', () => {
    expect(formatPricingEffectiveAtUTC('2026-09-14T09:30:00+08:00')).toBe('2026-09-14T01:30:00.000Z')
    expect(formatPricingEffectiveAtUTC(null)).toBe('-')
    expect(formatPricingEffectiveAtUTC('invalid')).toBe('-')
  })
})
