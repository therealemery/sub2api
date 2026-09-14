import { describe, expect, it } from 'vitest'
import { formatRequestPricingCondition, requestPricingConditionForModel } from '../requestPricingConditions'

const rule = {
  id: 'deepseek-weekday-peak-2026-09-13',
  models: ['deepseek-v4.1-flash'],
  timezone: 'Asia/Shanghai',
  weekdays: [1, 2, 3, 4, 5],
  windows: [
    { start_minute: 540, end_minute: 720 },
    { start_minute: 840, end_minute: 1080 },
  ],
  customer_multiplier: 2,
  name_en: 'Weekday peak pricing',
  name_zh: '工作日高峰计费',
}

describe('request pricing conditions', () => {
  it('matches canonical OwnAPI model spelling without exposing aliases', () => {
    expect(requestPricingConditionForModel([rule], 'DeepSeek_V4.1_Flash')).toEqual(rule)
    expect(requestPricingConditionForModel([rule], 'gpt-6-astra')).toBeNull()
  })

  it('derives Beijing and UTC windows from structured minutes', () => {
    expect(formatRequestPricingCondition(rule)).toEqual({
      beijingWindows: '09:00–12:00, 14:00–18:00',
      utcWindows: '01:00–04:00, 06:00–10:00',
      weekdayRange: '1,2,3,4,5',
      multiplier: '2×',
    })
  })
})
