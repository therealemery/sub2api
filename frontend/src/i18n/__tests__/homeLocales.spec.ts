import { describe, expect, it } from 'vitest'
import en from '../locales/en'
import zh from '../locales/zh'

function flattenMessages(source: Record<string, any>, prefix = ''): Record<string, string> {
  return Object.entries(source).reduce<Record<string, string>>((result, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object') {
      Object.assign(result, flattenMessages(value, path))
    } else {
      result[path] = value
    }
    return result
  }, {})
}

describe('home locale messages', () => {
  it('keeps the English and Chinese home message contracts aligned', () => {
    const english = flattenMessages(en.home)
    const chinese = flattenMessages(zh.home)

    expect(Object.keys(english).sort()).toEqual(Object.keys(chinese).sort())
    expect(Object.values(english).every((value) => typeof value === 'string' && value.length > 0)).toBe(true)
    expect(Object.values(chinese).every((value) => typeof value === 'string' && value.length > 0)).toBe(true)
  })

  it('provides English as the default-facing home copy', () => {
    expect(en.home.heroSubtitle).toBe('One API for ChatGPT and Claude')
    expect(en.home.code.copy).toBe('Copy code')
  })
})
