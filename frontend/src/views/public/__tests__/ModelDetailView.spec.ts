import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ModelDisplayConfig } from '@/api/modelDisplay'
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
      'publicModels.shortContext': 'Short context',
      'publicModels.longContext': 'Long context',
      'publicModels.longContextThreshold': `Long context above ${String(params?.count ?? '')} tokens`,
      'publicModels.pricingCheckedAt': `Pricing checked ${String(params?.date ?? '')}`,
      'publicModels.viewOfficialPricing': 'View official pricing',
      'publicModels.priceUnavailable': 'Price on request',
      'publicModels.priceType': 'Price type',
      'publicModels.related': 'Related models',
      'publicModels.families.gpt.description': 'GPT model family',
      'publicModels.families.grok.description': 'Grok model family',
      'publicModels.families.claude.description': 'Claude model family',
      'publicModels.aliases.codexAutoReview': 'Alias for GPT-5.4 tuned for Codex automated review workflows.',
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
    expect(wrapper.text()).toContain('Long context above 200,000 tokens')
    expect(wrapper.text()).toContain('$2')
    expect(wrapper.text()).toContain('$1.4')
    expect(wrapper.text()).toContain('$0.5')
    expect(wrapper.text()).toContain('$0.35')
    expect(wrapper.text()).toContain('$6')
    expect(wrapper.text()).toContain('$4.2')
    expect(wrapper.text()).toContain('$4')
    expect(wrapper.text()).toContain('$2.8')
    expect(wrapper.text()).toContain('$1')
    expect(wrapper.text()).toContain('$0.7')
    expect(wrapper.text()).toContain('$12')
    expect(wrapper.text()).toContain('$8.4')
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
  })
})
