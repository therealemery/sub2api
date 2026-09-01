import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ModelDisplayConfig } from '@/api/modelDisplay'
import en from '@/i18n/locales/en'
import zh from '@/i18n/locales/zh'
import ModelsCatalogView from '../ModelsCatalogView.vue'

const { getModelDisplayConfig, navigate, t } = vi.hoisted(() => ({
  getModelDisplayConfig: vi.fn<() => Promise<ModelDisplayConfig>>(),
  navigate: vi.fn(),
  t: (key: string, params?: Record<string, unknown>) => {
    const messages: Record<string, string> = {
      'publicModels.officialListPrice': 'Official list price',
      'publicModels.officialSeventyPercent': 'Official price × 70%',
      'publicModels.ownApiPrice': 'OwnAPI price',
      'publicModels.resultCount': `${String(params?.count ?? '')} models`,
      'publicModels.providerModelCount': `${String(params?.count ?? '')} models`,
      'publicModels.searchLabel': 'Search models',
      'publicModels.clearSearch': 'Clear search',
      'publicModels.free': 'Free',
      'publicModels.input': 'Input',
      'publicModels.cachedInput': 'Cached input',
      'publicModels.output': 'Output',
      'publicModels.perMillion': '/ 1M tokens',
      'publicModels.shortContext': 'Short context',
      'publicModels.longContext': 'Long context',
      'publicModels.longContextThreshold': `Long context above ${String(params?.count ?? '')} tokens`,
    }
    return messages[key] ?? key
  },
}))

vi.mock('@/api/modelDisplay', () => ({
  default: { getModelDisplayConfig },
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

function mountCatalog() {
  return mount(ModelsCatalogView, {
    global: {
      stubs: {
        PublicSiteLayout: { template: '<div><slot /></div>' },
        RouterLink: {
          props: ['to'],
          setup: () => ({ navigate }),
          template: '<a :href="typeof to === `string` ? to : to?.path" @click="navigate(to)"><slot /></a>',
        },
      },
    },
  })
}

describe('ModelsCatalogView', () => {
  beforeEach(() => {
    getModelDisplayConfig.mockResolvedValue(emptyConfig)
    navigate.mockClear()
  })

  it('uses neutral result-count copy in both locales', async () => {
    expect(en.publicModels.resultCount).toBe('{count} models')
    expect(zh.publicModels.resultCount).toBe('共 {count} 个模型')

    const wrapper = mountCatalog()
    await flushPromises()
    expect(wrapper.get('#catalog-results-title').text()).toBe('46 models')
  })

  it('renders all eight providers as ordered sections with correct model counts', async () => {
    const wrapper = mountCatalog()
    await flushPromises()
    const sections = wrapper.findAll('section.provider-section')

    expect(sections.map((section) => section.get('h2').text())).toEqual([
      'OpenAI', 'Anthropic', 'xAI', 'Google', 'Qwen', 'Z.AI', 'Moonshot', 'MiniMax',
    ])
    expect(sections.map((section) => section.findAll('.model-card').length)).toEqual([9, 9, 2, 7, 11, 3, 2, 3])
    for (const section of sections) {
      const provider = section.get('h2').text()
      expect(section.findAll('.provider-line').every((line) => line.text().includes(provider))).toBe(true)
    }
  })

  it('supports normalized ranked search without interleaving providers', async () => {
    const wrapper = mountCatalog()
    await flushPromises()
    const search = wrapper.get('input[type="search"]')

    await search.setValue('gpt 5.4 mini')
    expect(wrapper.findAll('section.provider-section').map((section) => section.get('h2').text())).toEqual(['OpenAI'])
    expect(wrapper.text()).toContain('GPT-5.4 Mini')

    await search.setValue('google flash')
    expect(wrapper.findAll('section.provider-section').map((section) => section.get('h2').text())).toEqual(['Google'])

    await search.setValue('qwen coder')
    expect(wrapper.findAll('section.provider-section').map((section) => section.get('h2').text())).toEqual(['Qwen'])
    expect(wrapper.find('.model-card h3').text()).toBe('Qwen3 Coder Next')
  })

  it('clears only search independently and resets every filter on demand', async () => {
    const wrapper = mountCatalog()
    await flushPromises()
    const anthropicLabel = wrapper.findAll('.filter-rail label').find((label) => label.text().includes('Anthropic'))!
    await anthropicLabel.get('input').setValue()
    await wrapper.get('input[type="search"]').setValue('claude')

    await wrapper.get('button.search-clear').trigger('click')
    expect((wrapper.get('input[type="search"]').element as HTMLInputElement).value).toBe('')
    expect((anthropicLabel.get('input').element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.findAll('section.provider-section').map((section) => section.get('h2').text())).toEqual(['Anthropic'])

    await wrapper.get('.reset-all').trigger('click')
    expect((wrapper.get('input[type="search"]').element as HTMLInputElement).value).toBe('')
    expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('featured')
    expect(wrapper.findAll('section.provider-section')).toHaveLength(8)
  })

  it('renders free and unpublished pricing without zero-value metric fallbacks', async () => {
    const wrapper = mountCatalog()
    await flushPromises()
    const moderation = wrapper.findAll('.model-card').find((card) => card.text().includes('Omni Moderation'))!
    const unpublished = wrapper.findAll('.model-card').find((card) => card.text().includes('GPT Daybreak Blue'))!

    expect(moderation.get('.pricing-card-status').text()).toContain('Free')
    expect(moderation.findAll('.price-line')).toHaveLength(0)
    expect(moderation.text()).not.toContain('$0')
    expect(unpublished.get('.pricing-card-status').text()).toContain('publicModels.notPublished')
    expect(unpublished.findAll('.price-line')).toHaveLength(0)
    expect(unpublished.text()).not.toContain('$0')
  })

  it('renders traceable OwnAPI pricing for GPT-5.6 Sol', async () => {
    const wrapper = mountCatalog()
    await flushPromises()
    const solCard = wrapper.findAll('.model-card').find((card) => card.text().includes('GPT-5.6 Sol'))
    const artworkLink = solCard?.find('a.model-art.model-card-link')

    expect(wrapper.text()).toContain('GPT-5.6 Sol')
    expect(artworkLink?.exists()).toBe(true)
    expect(artworkLink?.find('img').exists()).toBe(true)
    expect(wrapper.text()).toContain('Official list price')
    expect(wrapper.text()).toContain('Official price × 70%')
    expect(wrapper.text()).toContain('$2.8')
    expect(wrapper.text()).toContain('$14')
    expect(solCard?.findAll('.price-line .price-unit')).toHaveLength(3)
    expect(solCard?.findAll('.price-line .price-unit').every((unit) => unit.text() === '/ 1M tokens')).toBe(true)
  })

  it('keeps Grok tier buttons outside links and switches pricing without navigation', async () => {
    const wrapper = mountCatalog()
    await flushPromises()
    const grokCard = wrapper.findAll('.model-card').find((card) => card.text().includes('Grok 4.5'))
    expect(grokCard?.text()).toContain('$1.4')
    expect(grokCard?.find('a button').exists()).toBe(false)

    const longContextButton = grokCard?.findAll('button').find((button) => button.text() === 'Long context')
    const shortContextButton = grokCard?.findAll('button').find((button) => button.text() === 'Short context')
    expect(shortContextButton?.attributes('aria-pressed')).toBe('true')
    expect(longContextButton?.attributes('aria-pressed')).toBe('false')
    await longContextButton?.trigger('click')

    expect(grokCard?.text()).toContain('$2.8')
    expect(shortContextButton?.attributes('aria-pressed')).toBe('false')
    expect(longContextButton?.attributes('aria-pressed')).toBe('true')
    expect(navigate).not.toHaveBeenCalled()
  })
})
