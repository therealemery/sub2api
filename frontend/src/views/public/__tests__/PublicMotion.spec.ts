import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ModelDisplayConfig } from '@/api/modelDisplay'
import ModelCodeExamples from '@/components/models/ModelCodeExamples.vue'
import DocsView from '../DocsView.vue'
import ModelsCatalogView from '../ModelsCatalogView.vue'
import catalogSource from '../ModelsCatalogView.vue?raw'
import detailSource from '../ModelDetailView.vue?raw'
import docsSource from '../DocsView.vue?raw'
import modelCodeSource from '@/components/models/ModelCodeExamples.vue?raw'

const { getModelDisplayConfig, navigate, t } = vi.hoisted(() => ({
  getModelDisplayConfig: vi.fn<() => Promise<ModelDisplayConfig>>(),
  navigate: vi.fn(),
  t: (key: string, params?: Record<string, unknown>) => {
    const messages: Record<string, string> = {
      'publicModels.resultCount': `${String(params?.count ?? '')} models`,
      'publicModels.officialListPrice': 'Official list price',
      'publicModels.officialSeventyPercent': 'Official price x 70%',
      'publicModels.ownApiPrice': 'OwnAPI price',
      'publicModels.input': 'Input',
      'publicModels.cachedInput': 'Cached input',
      'publicModels.output': 'Output',
      'publicModels.perMillion': '/ 1M tokens',
      'publicModels.shortContext': 'Short context',
      'publicModels.longContext': 'Long context',
      'publicModels.longContextThreshold': `Long context: ${String(params?.count ?? '')}`,
      'publicModels.code.copy': 'Copy',
      'publicModels.code.copied': 'Copied',
    }
    return messages[key] ?? key
  },
}))

vi.mock('@/api/modelDisplay', () => ({
  default: { getModelDisplayConfig },
}))

vi.mock('@/stores', () => ({
  useAuthStore: () => ({ isAdmin: false, isAuthenticated: false }),
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
        Icon: true,
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

describe('public Models and Docs motion', () => {
  beforeEach(() => {
    getModelDisplayConfig.mockResolvedValue(emptyConfig)
    navigate.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('bounds catalog list motion and keeps stable model keys', async () => {
    const wrapper = mountCatalog()
    await flushPromises()

    const list = wrapper.get('transition-group-stub[name="motion-list"]')
    const cards = list.findAll('.model-card')

    expect(list.attributes('tag')).toBe('div')
    expect(cards.slice(0, 7).map(card => card.attributes('style'))).toEqual([
      '--motion-delay: 0ms;',
      '--motion-delay: 40ms;',
      '--motion-delay: 80ms;',
      '--motion-delay: 120ms;',
      '--motion-delay: 160ms;',
      '--motion-delay: 200ms;',
      '--motion-delay: 0ms;',
    ])
    expect(catalogSource).toContain(':key="`${model.platform}:${model.modelId}`"')
    expect(catalogSource).toContain('transform:translateY(-2px)')
    expect(catalogSource).toContain('transform:scale(1.02)')
    expect(catalogSource).toMatch(/@media\(prefers-reduced-motion:reduce\).*\.model-card:hover.*transform:none!important/s)
  })

  it('crossfades a Grok pricing tier as one value group without navigation', async () => {
    const wrapper = mountCatalog()
    await flushPromises()
    const grokCard = wrapper.findAll('.model-card').find(card => card.text().includes('Grok 4.5'))
    const longContextButton = grokCard?.findAll('button').find(button => button.text() === 'Long context')

    expect(grokCard?.get('transition-stub[name="motion-fade"]').attributes('mode')).toBe('out-in')
    await longContextButton?.trigger('click')

    expect(grokCard?.text()).toContain('$2.8')
    expect(navigate).not.toHaveBeenCalled()
    expect(catalogSource).not.toMatch(/<Transition[^>]*>\s*<strong[^>]*>\{\{ metric\.ownApi/)
  })

  it('crossfades model-detail pricing tables without animating individual digits', () => {
    expect(detailSource).toContain('<Transition name="motion-fade" mode="out-in">')
    expect(detailSource).toContain('class="pricing-tier-values"')
    expect(detailSource).not.toMatch(/<Transition[^>]*>\s*<td>\{\{ row\.(official|ownApi)/)
    expect(detailSource).toContain('class="copy-model-button"')
    expect(detailSource).toContain('}, 1500)')
  })

  it('crossfades copy confirmation in a stable button and resets after 1.5 seconds', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const wrapper = mount(ModelCodeExamples, {
      props: { modelId: 'gpt-5.4' },
      global: { stubs: { Icon: true } },
    })
    const button = wrapper.get('.model-code-heading button')

    expect(button.classes()).toContain('copy-feedback-button')
    expect(button.get('transition-stub[name="motion-fade"]').attributes('mode')).toBe('out-in')
    await button.trigger('click')
    await flushPromises()
    expect(button.text()).toContain('Copied')

    await vi.advanceTimersByTimeAsync(1499)
    expect(button.text()).toContain('Copied')
    await vi.advanceTimersByTimeAsync(1)
    expect(button.text()).toContain('Copy')
    expect(modelCodeSource).toContain('min-inline-size:88px')
  })

  it('moves Docs navigation indication but leaves prose and code free of reveal motion', async () => {
    const observe = vi.fn()
    const disconnect = vi.fn()
    vi.stubGlobal('IntersectionObserver', vi.fn(() => ({ observe, disconnect })))
    const wrapper = mount(DocsView, {
      attachTo: document.body,
      global: {
        stubs: {
          DocsCodeExamples: { template: '<div class="docs-code" />' },
          Icon: true,
          PublicSiteLayout: { template: '<div><slot /></div>' },
          RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        },
      },
    })
    const quickStart = wrapper.get('.on-this-page a[href="#quick-start"]')

    await quickStart.trigger('click')
    expect(quickStart.classes()).toContain('is-active')
    expect(quickStart.attributes('aria-current')).toBe('location')
    expect(observe).toHaveBeenCalled()

    expect(docsSource).toContain('transition:transform var(--motion-fast)')
    expect(docsSource).toMatch(/@media\(prefers-reduced-motion:reduce\).*scroll-behavior:auto.*transform:none/s)
    expect(docsSource).not.toContain('reveal-item')
    expect(docsSource).not.toContain('data-motion-section')

    wrapper.unmount()
    expect(disconnect).toHaveBeenCalledTimes(1)
  })
})
