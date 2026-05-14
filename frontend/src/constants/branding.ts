export const DEFAULT_SITE_NAME = 'OwnAPI'
export const DEFAULT_SITE_SUBTITLE = 'OwnAPI'
export const DEFAULT_SITE_LOGO_LIGHT = '/brand/ownapi-logo-clean.png'
export const DEFAULT_SITE_LOGO = DEFAULT_SITE_LOGO_LIGHT
export const DEFAULT_SITE_HERO_LOGO = '/brand/ownapi-hero-logo-clean.png'
export const DEFAULT_PAYMENT_PRODUCT_PREFIX = DEFAULT_SITE_NAME
export const DEFAULT_DOC_URL = ''
export const DEFAULT_REPOSITORY_URL = ''

const LEGACY_OWNAPI_LOGO_PATTERN = /^\/(?:brand\/)?(?:logo|ownapi-(?:hero-)?logo(?:-(?:light|dark))?)\.(?:png|svg)$/i

function isLegacyOwnApiLogoPath(value?: string): boolean {
  const normalized = value?.trim().split(/[?#]/)[0]
  if (!normalized) return true
  return normalized === DEFAULT_SITE_LOGO || normalized === DEFAULT_SITE_HERO_LOGO || LEGACY_OWNAPI_LOGO_PATTERN.test(normalized)
}

export function resolveSiteLogoPath(logo?: string): string {
  const trimmed = logo?.trim()
  if (!trimmed || isLegacyOwnApiLogoPath(trimmed)) {
    return DEFAULT_SITE_LOGO
  }
  return trimmed
}

export function isDefaultOwnApiLogo(logo?: string): boolean {
  const resolved = resolveSiteLogoPath(logo)
  return resolved === DEFAULT_SITE_LOGO
}
