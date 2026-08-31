import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ModelDisplayConfig } from '@/api/modelDisplay'
import type { ModelCatalogEntry } from '@/data/modelCatalog'
import ModelDetailView from '../ModelDetailView.vue'

const { getModelDisplayConfig, routeState, t } = vi.hoisted(() => ({
  getModelDisplayConfig: vi.fn<() => Promise<ModelDisplayConfig>>(),
  routeState: { params: { modelId: 'grok-4-6' } },
  t: (key: string, params?: Record<string, unknown>) => {
    const messages: Record<string, string> = {
      'publicModels.backToModels': 'All models',
      'publicModels.getStarted': 'Get an API key',
      'publicModels.copyModel': 'Copy model ID',
      'publicModels.modelId': 'Model ID',
      'publicModels.context': 'Context',
      'publicModels.modality': 'Modality',
      'publicModels.pricing': 'Current pricing',
      'publicModels.capability': 'Capability',
      'publicModels.officialListPrice': 'Official list price',
      'publicModels.officialSeventyPercent': 'Official price x 70%',
      'publicModels.ownApiPrice': 'OwnAPI price',
      'publicModels.input': 'Input',
      'publicModels.cachedInput': 'Cached input',
      'publicModels.output': 'Output',
      'publicModels.perMillion': '/ 1M tokens',
      'publicModels.usdPerMillion': 'USD / 1M tokens',
      'publicModels.shortContext': 'Short context',
      'publicModels.longContext': 'Long context',
      'publicModels.longContextThreshold': `Long context: ${String(params?.count ?? '')} tokens or more`,
      'publicModels.pricingCheckedAt': `Pricing checked ${String(params?.date ?? '')}`,
      'publicModels.viewOfficialPricing': 'View official pricing',
      'publicModels.priceUnavailable': 'Price on request',
      'publicModels.notPublished': 'Not published',
      'publicModels.priceType': 'Price type',
      'publicModels.related': 'Related models',
      'publicModels.families.gpt.description': 'GPT model family',
      'publicModels.families.grok.description': 'Grok model family',
      'publicModels.families.claude.description': 'Claude model family',
      'publicModels.aliases.codexAutoReview': 'Alias for GPT-5.4 tuned for Codex automated review workflows.',
      'publicModels.pricingNotes.openAiLongContext': 'Inputs over 272K tokens may use OpenAI long-context rates.',
      'publicModels.pricingNotes.openAiRegional': 'Regional processing and service tiers may add provider charges.',
      'publicModels.pricingNotes.anthropicCacheWrite': 'Anthropic cache-write pricing is separate from the cached-input rate shown above.',
      'publicModels.pricingNotes.anthropicDataResidency': 'Anthropic data-residency options may add provider charges.',
    }
    return messages[key] ?? key
  },
}))

vi.mock('@/api/modelDisplay', () => ({
  default: { getModelDisplayConfig },
}))

vi.mock('@/stores', () => ({
  useAuthStore: () => ({ isAuthenticated: false }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
}))

vi.mock('vue-i18n', () => ({
  createI18n: () => ({
    global: {
      locale: { value: 'en' },
      setLocaleMessage: vi.fn(),
    },
  }),
  useI18n: () => ({ t }),
}))

const emptyConfig: ModelDisplayConfig = {
  featured_models: [],
  pricing_models: [],
  reference_discount: null,
}

function mountDetail(modelId: string) {
  routeState.params.modelId = modelId

  return mount(ModelDetailView, {
    global: {
      stubs: {
        Icon: { props: ['name'], template: '<span :data-icon="name" />' },
        ModelCodeExamples: { template: '<section />' },
        PublicSiteLayout: { template: '<div><slot /></div>' },
        RouterLink: {
          props: ['to'],
          template: '<a :href="typeof to === `string` ? to : to?.path"><slot /></a>',
        },
      },
    },
  })
}

describe('ModelDetailView', () => {
  beforeEach(() => {
    getModelDisplayConfig.mockResolvedValue(emptyConfig)
  })

  it('renders official, OwnAPI, and long-context pricing for Grok 4.6', async () => {
    const wrapper = mountDetail('grok-4-6')
    await flushPromises()

    expect(wrapper.text()).toContain('Grok 4.6')
    expect(wrapper.text()).toContain('Short context')
    expect(wrapper.text()).toContain('Long context: 200,000 tokens or more')
    for (const price of [
      '$2 USD / 1M tokens',
      '$1.4 USD / 1M tokens',
      '$0.5 USD / 1M tokens',
      '$0.35 USD / 1M tokens',
      '$6 USD / 1M tokens',
      '$4.2 USD / 1M tokens',
      '$4 USD / 1M tokens',
      '$2.8 USD / 1M tokens',
      '$1 USD / 1M tokens',
      '$0.7 USD / 1M tokens',
      '$12 USD / 1M tokens',
      '$8.4 USD / 1M tokens',
    ]) {
      expect(wrapper.text()).toContain(price)
    }
  })

  it('renders alias disclosure and links to GPT-5.4 official pricing source', async () => {
    const wrapper = mountDetail('codex-auto-review')
    await flushPromises()

    expect(wrapper.text()).toContain('Alias for GPT-5.4 tuned for Codex automated review workflows.')
    expect(wrapper.text()).toContain('Pricing checked 2026-08-31')

    const sourceLink = wrapper.find('a[href="https://developers.openai.com/api/docs/models/gpt-5.4"]')
    expect(sourceLink.exists()).toBe(true)
    expect(sourceLink.text()).toBe('View official pricing')
    expect(sourceLink.attributes('target')).toBe('_blank')
    expect(sourceLink.attributes('rel')).toBe('noopener noreferrer')
    expect(wrapper.text()).toContain('Inputs over 272K tokens may use OpenAI long-context rates.')
    expect(wrapper.text()).toContain('Regional processing and service tiers may add provider charges.')
  })

  it('discloses Anthropic cache-write and data-residency pricing exclusions', async () => {
    const wrapper = mountDetail('claude-opus-4-6')
    await flushPromises()

    expect(wrapper.text()).toContain('Anthropic cache-write pricing is separate from the cached-input rate shown above.')
    expect(wrapper.text()).toContain('Anthropic data-residency options may add provider charges.')
  })

  it('uses not-published copy for null verified pricing cells', async () => {
    const wrapper = mountDetail('null-price-model')
    await flushPromises()

    const vm = wrapper.vm as unknown as { entries: ModelCatalogEntry[] }
    vm.entries = [{
      slug: 'null-price-model',
      modelId: 'null-price-model',
      displayName: 'Null Price Model',
      provider: 'OwnAPI',
      platform: 'custom',
      family: 'ownapi',
      modality: 'Text',
      capabilities: ['Text'],
      summaryKey: 'publicModels.families.ownapi.summary',
      descriptionKey: 'publicModels.families.ownapi.description',
      artwork: '/model-art/ownapi.jpg',
      providerLogo: '/brand/ownapi-logo-clean.png',
      contextWindow: null,
      featured: false,
      featuredBadge: '',
      sortOrder: 1,
      price: null,
      pricingSource: {
        official: { input: null, cachedInput: null, output: null },
        multiplier: 0.7,
        sourceUrl: 'https://example.com/pricing',
        checkedAt: '2026-08-31',
      },
      modelClass: [],
      endpoints: [],
      isAlias: false,
      aliasNoteKey: null,
      available: null,
    }]
    await wrapper.vm.$nextTick()

    const priceCells = wrapper.findAll('.pricing-tier tbody td')
    expect(wrapper.text()).toContain('Null Price Model')
    expect(priceCells).toHaveLength(6)
    expect(priceCells.every((cell) => cell.text() === 'Not published')).toBe(true)
    expect(wrapper.text()).not.toContain('Price on request')
  })
})
