import { describe, expect, it } from 'vitest'
import publicSiteHeaderSource from '../PublicSiteHeader.vue?raw'
import publicSiteFooterSource from '../PublicSiteFooter.vue?raw'
import homeViewSource from '../../../views/HomeView.vue?raw'
import docsViewSource from '../../../views/public/DocsView.vue?raw'

const publicSurfaces = {
  'public header': publicSiteHeaderSource,
  'public footer': publicSiteFooterSource,
  'home page': homeViewSource,
  'docs page': docsViewSource,
}

describe('public navigation', () => {
  it.each(Object.entries(publicSurfaces))('does not link %s to the authenticated monitor', (_name, source) => {
    expect(source).not.toMatch(/(?:to|href)\s*=\s*["']\/monitor["']/)
  })
})
