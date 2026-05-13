export const DEFAULT_SITE_NAME = 'OwnAPI'
export const DEFAULT_SITE_SUBTITLE = 'OwnAPI'
export const DEFAULT_SITE_LOGO_LIGHT = '/brand/ownapi-logo-light.png?v=20260512-logo-final'
export const DEFAULT_SITE_LOGO_DARK = '/brand/ownapi-logo-dark.png?v=20260512-logo-final'
export const DEFAULT_SITE_LOGO = DEFAULT_SITE_LOGO_LIGHT
export const DEFAULT_SITE_HERO_LOGO_LIGHT = DEFAULT_SITE_LOGO_LIGHT
export const DEFAULT_SITE_HERO_LOGO_DARK = DEFAULT_SITE_LOGO_DARK
export const DEFAULT_SITE_HERO_LOGO = DEFAULT_SITE_HERO_LOGO_LIGHT
export const DEFAULT_PAYMENT_PRODUCT_PREFIX = DEFAULT_SITE_NAME
export const DEFAULT_DOC_URL = ''
export const DEFAULT_REPOSITORY_URL = ''

const LEGACY_OWNAPI_LOGOS = new Set([
  '/logo.png',
  '/logo.svg',
  '/brand/logo.png',
  '/brand/logo.svg',
  '/brand/ownapi-logo.svg',
  '/brand/ownapi-hero-logo.svg',
  DEFAULT_SITE_LOGO_LIGHT,
  DEFAULT_SITE_LOGO_DARK,
  DEFAULT_SITE_HERO_LOGO_LIGHT,
  DEFAULT_SITE_HERO_LOGO_DARK,
  DEFAULT_SITE_LOGO,
  DEFAULT_SITE_HERO_LOGO,
])

export function resolveSiteLogoPath(logo?: string): string {
  const trimmed = logo?.trim()
  const normalized = trimmed?.split(/[?#]/)[0]
  if (!trimmed || !normalized || LEGACY_OWNAPI_LOGOS.has(trimmed) || LEGACY_OWNAPI_LOGOS.has(normalized)) {
    return DEFAULT_SITE_LOGO
  }
  return trimmed
}

export function resolveThemedSiteLogoPaths(logo?: string): { light: string; dark: string } {
  const trimmed = logo?.trim()
  const normalized = trimmed?.split(/[?#]/)[0]
  if (!trimmed || !normalized || LEGACY_OWNAPI_LOGOS.has(trimmed) || LEGACY_OWNAPI_LOGOS.has(normalized)) {
    return {
      light: DEFAULT_SITE_LOGO_LIGHT,
      dark: DEFAULT_SITE_LOGO_DARK
    }
  }
  return {
    light: trimmed,
    dark: trimmed
  }
}

export function resolveThemedSiteLogoPath(logo: string | undefined, isDark: boolean): string {
  const paths = resolveThemedSiteLogoPaths(logo)
  return isDark ? paths.dark : paths.light
}

export function isDefaultOwnApiLogo(logo?: string): boolean {
  const resolved = resolveSiteLogoPath(logo)
  return resolved === DEFAULT_SITE_LOGO_LIGHT || resolved === DEFAULT_SITE_LOGO_DARK
}
