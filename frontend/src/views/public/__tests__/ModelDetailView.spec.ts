import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ModelDisplayConfig } from '@/api/modelDisplay'
import ModelDetailView from '../ModelDetailView.vue'

const { getModelDisplayConfig, localeState, routeState, t } = vi.hoisted(() => ({
  getModelDisplayConfig: vi.fn<() => Promise<ModelDisplayConfig>>(),
  localeState: { value: 'en' },
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
      'publicModels.officialSeventyFivePercent': 'Official price x 75%',
      'publicModels.officialEightyPercent': 'Official price x 80%',
      'publicModels.ownApiPrice': 'OwnAPI price',
      'publicModels.perSecond': '/ second',
      'publicModels.perSecondBilling': 'Billed by generated duration',
      'publicModels.resolution': 'Resolution',
      'publicModels.videoPriceEstimate': 'Video price estimate',
      'publicModels.viewProtocol': 'View API protocol',
      'publicModels.input': 'Input',
      'publicModels.cachedInput': 'Cached input',
      'publicModels.cacheWrite': 'Cache write',
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
      'publicModels.notFoundTitle': 'Model not found',
      'publicModels.notFoundDescription': 'This model is not currently listed in the public OwnAPI catalog.',
      'publicModels.free': 'Free',
      'publicModels.priceType': 'Price type',
      'publicModels.related': 'Related models',
      'publicModels.families.gpt.description': 'GPT model family',
      'publicModels.families.grok.description': 'Grok model family',
      'publicModels.families.claude.description': 'Claude model family',
      'publicModels.families.gemini.description': 'Gemini model family',
      'publicModels.families.qwen.description': 'Qwen model family',
      'publicModels.families.minimax.description': 'MiniMax model family',
      'publicModels.families.wan.description': 'Wan video model family',
      'publicModels.aliases.codexAutoReview': 'Alias for GPT-5.4 tuned for Codex automated review workflows.',
      'publicModels.pricingNotes.openAiLongContext': 'Inputs over 272K tokens may use OpenAI long-context rates.',
      'publicModels.pricingNotes.openAiRegional': 'Regional processing and service tiers may add provider charges.',
      'publicModels.pricingNotes.anthropicCacheWrite': 'Anthropic cache-write pricing is separate from the cached-input rate shown above.',
      'publicModels.pricingNotes.anthropicDataResidency': 'Anthropic data-residency options may add provider charges.',
      'publicModels.pricingNotes.claudeThirdPartyUsage': 'Usage rule: This model supports OwnAPI-compatible third-party API clients.',
      'publicModels.pricingNotes.claudeCacheStability': 'Prompt caching can occasionally be inconsistent. Retry the request if a transient cache issue occurs.',
      'publicModels.pricingNotes.alibabaGlobal': 'Alibaba Cloud international-region list prices and context tiers are shown.',
      'publicModels.pricingNotes.minimaxPromotion': 'MiniMax list prices are shown before its separate promotional discount.',
      'publicModels.pricingNotes.unpublishedDecision': 'The provider has not published a verified public token price.',
      'publicModels.pricingCondition.label': 'Time-based pricing',
      'publicModels.pricingCondition.baseOutsidePeak': 'The base OwnAPI prices shown above apply outside peak hours.',
      'publicModels.pricingCondition.schedule': 'Peak schedule',
      'publicModels.pricingCondition.weekdays': 'Monday–Friday',
      'publicModels.pricingCondition.beijingTime': `Beijing ${String(params?.windows ?? '')}`,
      'publicModels.pricingCondition.utc': 'UTC equivalent',
      'publicModels.pricingCondition.multiplier': 'Peak multiplier',
      'publicModels.pricingCondition.halfOpen': 'Opening times are included; closing times are excluded.',
      'publicModels.pricingCondition.usageAudit': 'Usage history records whether the standard 1× or peak 2× multiplier applied.',
    }
    const chineseMessages: Record<string, string> = {
      'publicModels.pricingCondition.label': '时段计费',
      'publicModels.pricingCondition.baseOutsidePeak': '上方展示的 OwnAPI 基础价格适用于非高峰时段。',
      'publicModels.pricingCondition.schedule': '高峰时段',
      'publicModels.pricingCondition.weekdays': '周一至周五',
      'publicModels.pricingCondition.beijingTime': `北京时间 ${String(params?.windows ?? '')}`,
      'publicModels.pricingCondition.utc': '对应 UTC',
      'publicModels.pricingCondition.multiplier': '高峰倍率',
      'publicModels.pricingCondition.halfOpen': '开始时间包含在内，结束时间不包含在内。',
      'publicModels.pricingCondition.usageAudit': '使用记录会标明本次请求采用标准 1× 还是高峰 2× 倍率。',
    }
    if (localeState.value.startsWith('zh') && chineseMessages[key]) return chineseMessages[key]
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
  useI18n: () => ({ t, locale: localeState }),
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
    localeState.value = 'en'
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

  it('returns the public 404 state for models without an exact verified price', async () => {
    const unpublished = mountDetail('gemini-3-pro-preview')
    await flushPromises()
    expect(unpublished.get('.not-found').text()).toContain('404')
    expect(unpublished.get('.not-found').text()).toContain('Model not found')
    expect(unpublished.get('.not-found').text()).toContain('This model is not currently listed in the public OwnAPI catalog.')
    expect(unpublished.find('.pricing-state').exists()).toBe(false)
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
    expect(wrapper.text()).toContain('Pricing checked 2026-09-07')

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
    expect(wrapper.text()).toContain('Usage rule: This model supports OwnAPI-compatible third-party API clients.')
    expect(wrapper.text()).toContain('Prompt caching can occasionally be inconsistent.')
  })

  it('renders MiniMax H3 video pricing by resolution', async () => {
    const wrapper = mountDetail('minimax-h3')
    await flushPromises()

    expect(wrapper.text()).toContain('MiniMax H3')
    expect(wrapper.text()).toContain('Video')
    expect(wrapper.text()).toContain('Official price x 75%')
    expect(wrapper.text()).toContain('$0.074627/ second')
    expect(wrapper.text()).toContain('$0.05597/ second')
    expect(wrapper.text()).toContain('$0.119403/ second')
    expect(wrapper.text()).toContain('$0.089552/ second')
  })

  it('renders Wan 3.0 US list prices and OwnAPI 80% prices', async () => {
    const wrapper = mountDetail('wan3-0-video-prime')
    await flushPromises()

    expect(wrapper.text()).toContain('Wan 3.0 Video Prime')
    expect(wrapper.text()).toContain('Official price x 80%')
    expect(wrapper.text()).toContain('$0.0636/ second')
    expect(wrapper.text()).toContain('$0.05088/ second')
    expect(wrapper.text()).toContain('$0.254399/ second')
    expect(wrapper.text()).toContain('$0.203519/ second')
    expect(wrapper.find('a[href="https://www.alibabacloud.com/help/en/model-studio/wan3-video-generation-api-reference"]').exists()).toBe(true)
  })

  it('renders the backend-owned DeepSeek peak rule in English without private routing data', async () => {
    getModelDisplayConfig.mockResolvedValue({
      ...emptyConfig,
      request_pricing_conditions: [{
        id: 'deepseek-weekday-peak-2026-09-13',
        models: ['deepseek-v4.1-flash'],
        timezone: 'Asia/Shanghai',
        weekdays: [1, 2, 3, 4, 5],
        windows: [{ start_minute: 540, end_minute: 720 }, { start_minute: 840, end_minute: 1080 }],
        customer_multiplier: 2,
        name_en: 'Weekday peak pricing',
        name_zh: '工作日高峰计费',
      }],
    })

    const wrapper = mountDetail('deepseek-v4-1-flash')
    await flushPromises()

    expect(wrapper.get('.pricing-condition').text()).toContain('Weekday peak pricing')
    expect(wrapper.get('.pricing-condition').text()).toContain('Monday–Friday · Beijing 09:00–12:00, 14:00–18:00')
    expect(wrapper.get('.pricing-condition').text()).toContain('01:00–04:00, 06:00–10:00')
    expect(wrapper.get('.pricing-condition').text()).toContain('2×')
    expect(wrapper.get('.pricing-condition').text()).toContain('Opening times are included; closing times are excluded.')
    expect(wrapper.get('.pricing-condition').text()).toContain('standard 1× or peak 2×')
    expect(wrapper.text().toLowerCase()).not.toContain('packy')
    expect(wrapper.text()).not.toContain('deepseek-v4-flash')
  })

  it('localizes the DeepSeek rule in Chinese and hides it from unrelated models', async () => {
    localeState.value = 'zh-CN'
    getModelDisplayConfig.mockResolvedValue({
      ...emptyConfig,
      request_pricing_conditions: [{
        id: 'deepseek-weekday-peak-2026-09-13',
        models: ['deepseek-v4.1-flash'],
        timezone: 'Asia/Shanghai',
        weekdays: [1, 2, 3, 4, 5],
        windows: [{ start_minute: 540, end_minute: 720 }, { start_minute: 840, end_minute: 1080 }],
        customer_multiplier: 2,
        name_en: 'Weekday peak pricing',
        name_zh: '工作日高峰计费',
      }],
    })

    const deepSeek = mountDetail('deepseek-v4-1-flash')
    await flushPromises()
    expect(deepSeek.get('.pricing-condition').text()).toContain('工作日高峰计费')
    expect(deepSeek.get('.pricing-condition').text()).toContain('周一至周五 · 北京时间 09:00–12:00, 14:00–18:00')
    expect(deepSeek.get('.pricing-condition').text()).toContain('开始时间包含在内，结束时间不包含在内。')

    const grok = mountDetail('grok-4-6')
    await flushPromises()
    expect(grok.find('.pricing-condition').exists()).toBe(false)
  })

  it('shows GPT-6 long-context pricing only above 272,000 input tokens', async () => {
    const wrapper = mountDetail('gpt-6-astra')
    await flushPromises()

    expect(wrapper.findAll('button.pricing-tier-option').map((button) => button.text())).toEqual([
      'Base pricing', '> 272,000 input tokens',
    ])
    expect(wrapper.text()).not.toContain('> 200,000 input tokens')
  })

})
