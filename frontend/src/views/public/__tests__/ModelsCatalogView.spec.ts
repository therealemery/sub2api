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
    expect(wrapper.get('#catalog-results-title').text()).toBe('16 models')
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
