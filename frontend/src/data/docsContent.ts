export interface DocsNavigationItem {
  id: string
  labelKey: string
  href: string
}

export interface DocsNavigationGroup {
  labelKey: string
  items: DocsNavigationItem[]
}

export const docsNavigation: DocsNavigationGroup[] = [
  {
    labelKey: 'publicDocs.navGroups.start',
    items: [
      { id: 'overview', labelKey: 'publicDocs.navItems.overview', href: '#overview' },
      { id: 'api-key', labelKey: 'publicDocs.navItems.key', href: '#api-key' },
      { id: 'models', labelKey: 'publicDocs.navItems.models', href: '#model-types' },
    ],
  },
  {
    labelKey: 'publicDocs.navGroups.api',
    items: [
      { id: 'text-api', labelKey: 'publicDocs.navItems.text', href: '#quick-start' },
      { id: 'image-api', labelKey: 'publicDocs.navItems.images', href: '#model-types' },
      { id: 'openai-sdk', labelKey: 'publicDocs.navItems.sdk', href: '#quick-start' },
    ],
  },
  {
    labelKey: 'publicDocs.navGroups.guides',
    items: [
      { id: 'base-url', labelKey: 'publicDocs.navItems.baseUrl', href: '#base-url' },
      { id: 'fallback', labelKey: 'publicDocs.navItems.fallback', href: '#production' },
      { id: 'errors', labelKey: 'publicDocs.navItems.errors', href: '#errors' },
      { id: 'rate-limits', labelKey: 'publicDocs.navItems.limits', href: '#errors' },
    ],
  },
  {
    labelKey: 'publicDocs.navGroups.support',
    items: [
      { id: 'help', labelKey: 'publicDocs.navItems.help', href: '#resources' },
    ],
  },
]

export const docsOnThisPage: DocsNavigationItem[] = [
  { id: 'overview', labelKey: 'publicDocs.navItems.overview', href: '#overview' },
  { id: 'model-types', labelKey: 'publicDocs.typesTitle', href: '#model-types' },
  { id: 'quick-start', labelKey: 'publicDocs.startTitle', href: '#quick-start' },
  { id: 'base-url', labelKey: 'publicDocs.baseUrlTitle', href: '#base-url' },
  { id: 'production', labelKey: 'publicDocs.whyTitle', href: '#production' },
  { id: 'errors', labelKey: 'publicDocs.errorsTitle', href: '#errors' },
  { id: 'resources', labelKey: 'publicDocs.resourcesTitle', href: '#resources' },
]
