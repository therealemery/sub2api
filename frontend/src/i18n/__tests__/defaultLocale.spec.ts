import { describe, expect, it } from 'vitest'
import { resolveInitialLocale } from '../index'

describe('initial locale', () => {
  it('defaults first-time visitors to English', () => {
    expect(resolveInitialLocale(null)).toBe('en')
  })

  it('keeps a saved Chinese preference', () => {
    expect(resolveInitialLocale('zh')).toBe('zh')
  })

  it('falls back to English for an invalid saved preference', () => {
    expect(resolveInitialLocale('fr')).toBe('en')
  })
})
