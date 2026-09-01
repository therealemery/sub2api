import { describe, expect, it } from 'vitest'
import { calculateCreditedUsd, formatPaymentAmount } from '../currency'

describe('formatPaymentAmount', () => {
  it('uses the currency default fraction digits', () => {
    expect(formatPaymentAmount(100, 'JPY', 'en-US')).not.toContain('.00')
    expect(formatPaymentAmount(100, 'KRW', 'en-US')).not.toContain('.00')
    expect(formatPaymentAmount(100, 'HKD', 'en-US')).toContain('.00')
  })
})

describe('calculateCreditedUsd', () => {
  it('converts CNY at 6.7 CNY per USD', () => {
    expect(calculateCreditedUsd(67, 'CNY')).toBe(10)
  })

  it('credits USD one-to-one and applies the operational multiplier', () => {
    expect(calculateCreditedUsd(10, 'USD')).toBe(10)
    expect(calculateCreditedUsd(67, ' cny ', 0.9)).toBe(9)
  })

  it('rejects unsupported recharge currencies', () => {
    expect(() => calculateCreditedUsd(10, 'EUR')).toThrow('Unsupported balance recharge currency')
  })
})
