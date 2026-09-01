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
      'publicModels.usdPerMillion': 'USD / 1M tokens',
      'publicModels.shortContext': 'Short context',
      'publicModels.longContext': 'Long context',
      'publicModels.pricingTierBase': 'Base pricing',
      'publicModels.pricingTierMinimum': `${String(params?.operator ?? '')} ${String(params?.count ?? '')} input tokens`,
      'publicModels.pricingTierRange': `${String(params?.minOperator ?? '')} ${String(params?.min ?? '')} – ${String(params?.maxOperator ?? '')} ${String(params?.max ?? '')} input tokens`,
      'publicModels.longContextThreshold': `Long context: ${String(params?.count ?? '')} tokens or more`,
      'publicModels.pricingCheckedAt': `Pricing checked ${String(params?.date ?? '')}`,
      'publicModels.viewOfficialPricing': 'View official pricing',
      'publicModels.priceUnavailable': 'Price on request',
      'publicModels.notPublished': 'Not published',
      'publicModels.free': 'Free',
      'publicModels.priceType': 'Price type',
      'publicModels.related': 'Related models',
      'publicModels.families.gpt.description': 'GPT model family',
      'publicModels.families.grok.description': 'Grok model family',
      'publicModels.families.claude.description': 'Claude model family',
      'publicModels.families.gemini.description': 'Gemini model family',
      'publicModels.families.qwen.description': 'Qwen model family',
      'publicModels.families.minimax.description': 'MiniMax model family',
      'publicModels.aliases.codexAutoReview': 'Alias for GPT-5.4 tuned for Codex automated review workflows.',
      'publicModels.pricingNotes.openAiLongContext': 'Inputs over 272K tokens may use OpenAI long-context rates.',
      'publicModels.pricingNotes.openAiRegional': 'Regional processing and service tiers may add provider charges.',
      'publicModels.pricingNotes.anthropicCacheWrite': 'Anthropic cache-write pricing is separate from the cached-input rate shown above.',
      'publicModels.pricingNotes.anthropicDataResidency': 'Anthropic data-residency options may add provider charges.',
      'publicModels.pricingNotes.alibabaGlobal': 'Alibaba Cloud international-region list prices and context tiers are shown.',
      'publicModels.pricingNotes.minimaxPromotion': 'MiniMax list prices are shown before its separate promotional discount.',
      'publicModels.pricingNotes.unpublishedDecision': 'The provider has not published a verified public token price.',
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
    expect(wrapper.text()).toContain('Base pricing')
    expect(wrapper.text()).toContain('≥ 200,000 input tokens')
    for (const price of [
      '$2 USD / 1M tokens',
      '$1.4 USD / 1M tokens',
      '$0.5 USD / 1M tokens',
      '$0.35 USD / 1M tokens',
      '$6 USD / 1M tokens',
      '$4.2 USD / 1M tokens',
    ]) {
      expect(wrapper.text()).toContain(price)
    }

    await wrapper.findAll('button.pricing-tier-option')[1]?.trigger('click')
    for (const price of [
      '$4 USD / 1M tokens',
      '$2.8 USD / 1M tokens',
      '$1 USD / 1M tokens',
      '$0.7 USD / 1M tokens',
      '$12 USD / 1M tokens',
      '$8.4 USD / 1M tokens',
    ]) {
      expect(wrapper.text()).toContain(price)
    }
    expect(wrapper.find('a button').exists()).toBe(false)
  })

  it('renders verified Free and Not published pricing states without numeric fallbacks', async () => {
    const free = mountDetail('omni-moderation-latest')
    await flushPromises()
    expect(free.get('.pricing-state').text()).toContain('Free')
    expect(free.findAll('.pricing-tier tbody td')).toHaveLength(0)
    expect(free.text()).not.toContain('$0')

    const unpublished = mountDetail('gpt-daybreak-blue-latest')
    await flushPromises()
    expect(unpublished.get('.pricing-state').text()).toContain('Not published')
    expect(unpublished.text()).toContain('The provider has not published a verified public token price.')
    expect(unpublished.findAll('.pricing-tier tbody td')).toHaveLength(0)
    expect(unpublished.text()).not.toMatch(/\$\d/)
  })

  it('switches Gemini threshold tiers with exact derived pricing', async () => {
    const gemini = mountDetail('gemini-2.5-pro')
    await flushPromises()
    expect(gemini.text()).toContain('> 200,000 input tokens')
    expect(gemini.text()).toContain('$1.25 USD / 1M tokens')
    expect(gemini.text()).toContain('$0.875 USD / 1M tokens')
    await gemini.findAll('button.pricing-tier-option')[1]?.trigger('click')
    expect(gemini.text()).toContain('$2.5 USD / 1M tokens')
    expect(gemini.text()).toContain('$1.75 USD / 1M tokens')
    expect(gemini.text()).toContain('$15 USD / 1M tokens')
    expect(gemini.text()).toContain('$10.5 USD / 1M tokens')

  })

  it('renders and switches all three Qwen pricing tiers', async () => {
    const wrapper = mountDetail('qwen3-5-plus')
    await flushPromises()
    const buttons = wrapper.findAll('button.pricing-tier-option')

    expect(buttons).toHaveLength(3)
    expect(buttons.map((button) => button.text())).toEqual([
      'Base pricing', '> 128,000 – ≤ 256,000 input tokens', '> 256,000 – ≤ 1,000,000 input tokens',
    ])
    expect(wrapper.text()).toContain('$0.115 USD / 1M tokens')
    expect(wrapper.text()).toContain('$0.0805 USD / 1M tokens')

    await buttons[1]?.trigger('click')
    expect(wrapper.text()).toContain('$0.287 USD / 1M tokens')
    expect(wrapper.text()).toContain('$0.2009 USD / 1M tokens')
    await buttons[2]?.trigger('click')
    expect(wrapper.text()).toContain('$0.573 USD / 1M tokens')
    expect(wrapper.text()).toContain('$0.4011 USD / 1M tokens')
    expect(wrapper.text()).toContain('Alibaba Cloud international-region list prices and context tiers are shown.')
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

})
