import { getConfiguredTableDefaultPageSize, normalizeTablePageSize } from '@/utils/tablePreferences'

const STORAGE_KEY = 'table-page-size'
const STORAGE_DEFAULT_KEY = 'table-page-size-default'

export function getPersistedPageSize(fallback = getConfiguredTableDefaultPageSize()): number {
  if (typeof window !== 'undefined') {
    try {
      const configuredDefault = getConfiguredTableDefaultPageSize()
      const storedDefault = Number(window.localStorage.getItem(STORAGE_DEFAULT_KEY))
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored !== null && storedDefault === configuredDefault) {
        const parsed = Number(stored)
        if (Number.isFinite(parsed)) {
          return normalizeTablePageSize(parsed)
        }
      }
    } catch (error) {
      console.warn('Failed to read persisted page size:', error)
    }
  }
  return normalizeTablePageSize(getConfiguredTableDefaultPageSize() || fallback)
}

export function setPersistedPageSize(size: number): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, String(size))
    window.localStorage.setItem(STORAGE_DEFAULT_KEY, String(getConfiguredTableDefaultPageSize()))
  } catch (error) {
    console.warn('Failed to persist page size:', error)
  }
}
