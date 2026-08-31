import { defineComponent, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import HomeView from '../HomeView.vue'
import homeViewSource from '../HomeView.vue?raw'

interface MockMediaQueryList extends EventTarget {
  matches: boolean
  addEventListener: MediaQueryList['addEventListener']
  removeEventListener: MediaQueryList['removeEventListener']
}

const state = vi.hoisted(() => ({
  homeContent: '',
  isAuthenticated: false
}))

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()

  return {
    ...actual,
    useI18n: () => ({ t: (key: string) => key })
  }
})

vi.mock('@/stores', () => ({
  useAuthStore: () => ({
    get isAuthenticated() { return state.isAuthenticated },
    isAdmin: false
  }),
  useAppStore: () => ({
    get cachedPublicSettings() {
      return state.homeContent ? { home_content: state.homeContent } : null
    },
    contactInfo: '',
    siteLogo: '',
    siteName: 'OwnAPI'
  })
}))

const observerInstances: MockIntersectionObserver[] = []

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = '0px'
  readonly thresholds = [0]
  readonly observe = vi.fn()
  readonly unobserve = vi.fn()
  readonly disconnect = vi.fn()
  readonly takeRecords = vi.fn(() => [])

  constructor(private readonly callback: IntersectionObserverCallback) {
    observerInstances.push(this)
  }

  reveal(): void {
    const target = this.observe.mock.calls[0]?.[0]
    this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this)
  }
}

function createMedia(matches: boolean): MockMediaQueryList {
  return Object.assign(new EventTarget(), {
    matches,
    addEventListener: vi.fn(EventTarget.prototype.addEventListener),
    removeEventListener: vi.fn(EventTarget.prototype.removeEventListener)
  })
}

async function mountHome(reducedMotion = false) {
  vi.stubGlobal('matchMedia', vi.fn(() => createMedia(reducedMotion)))
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/home', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div />' } },
      { path: '/models', component: { template: '<div />' } },
      { path: '/docs/ownapi-usage-guide.html', component: { template: '<div />' } },
      { path: '/key-usage', component: { template: '<div />' } },
      { path: '/agent-recruitment', component: { template: '<div />' } }
    ]
  })
  await router.push('/home')
  await router.isReady()

  const wrapper = mount(HomeView, {
    global: {
      plugins: [router],
      stubs: {
        Icon: true,
        PublicSiteLayout: { template: '<div><slot /></div>' }
      }
    }
  })

  return { router, wrapper }
}

async function mountHomeRoute(reducedMotion = false) {
  vi.stubGlobal('matchMedia', vi.fn(() => createMedia(reducedMotion)))
  const EmptyPage = defineComponent({ template: '<div data-away-page />' })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/home', component: HomeView },
      { path: '/models', component: EmptyPage },
      { path: '/login', component: EmptyPage },
      { path: '/docs/ownapi-usage-guide.html', component: EmptyPage },
      { path: '/key-usage', component: EmptyPage },
      { path: '/agent-recruitment', component: EmptyPage }
    ]
  })
  await router.push('/home')
  await router.isReady()

  const wrapper = mount(RouterView, {
    global: {
      plugins: [router],
      stubs: {
        Icon: true,
        PublicSiteLayout: { template: '<div><slot /></div>' }
      }
    }
  })

  return { router, wrapper }
}

describe('HomeView motion', () => {
  beforeEach(() => {
    state.homeContent = ''
    state.isAuthenticated = false
    observerInstances.length = 0
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    document.documentElement.classList.remove('motion-enhanced')
  })

  afterEach(() => {
    document.documentElement.classList.remove('motion-enhanced')
    vi.unstubAllGlobals()
  })

  it('plays the bounded hero sequence once per session without custom-home pollution', async () => {
    state.homeContent = '<main data-custom-home>Custom</main>'
    const { wrapper: customWrapper } = await mountHome()

    expect(customWrapper.find('.landing-page').exists()).toBe(false)
    customWrapper.unmount()

    state.homeContent = ''
    const { router, wrapper: firstWrapper } = await mountHomeRoute()
    const layers = firstWrapper.findAll('[data-motion-layer]')

    expect(firstWrapper.get('.landing-page').classes()).toContain('is-hero-animating')
    expect(layers.map(layer => layer.attributes('data-motion-layer'))).toEqual([
      'eyebrow',
      'title',
      'actions',
      'gateway'
    ])
    expect(layers.map(layer => layer.attributes('style'))).toEqual([
      '--hero-delay: 0ms;',
      '--hero-delay: 60ms;',
      '--hero-delay: 120ms;',
      '--hero-delay: 180ms;'
    ])
    expect(firstWrapper.findAll('.gateway-provider-tile').map(tile => tile.attributes('style'))).toEqual([
      '--hero-delay: 180ms;',
      '--hero-delay: 220ms;',
      '--hero-delay: 260ms;',
      '--hero-delay: 300ms;'
    ])
    expect(300 + 280).toBeLessThan(600)
    expect(homeViewSource).toContain('animation:gateway-tile-enter 280ms')

    await router.push('/models')
    await flushPromises()
    expect(firstWrapper.find('.landing-page').exists()).toBe(false)

    await router.push('/home')
    await flushPromises()
    expect(firstWrapper.get('.landing-page').classes()).not.toContain('is-hero-animating')
    expect(firstWrapper.findAll('[data-motion-layer]').every(layer => layer.classes().includes('is-revealed'))).toBe(true)

    firstWrapper.unmount()
  })

  it('keeps native FAQ disclosure semantics with layout-safe grid animation', async () => {
    const { wrapper } = await mountHome()
    const disclosure = wrapper.get('.faq-list details')

    expect(disclosure.get('summary').element.tagName).toBe('SUMMARY')
    expect(disclosure.get('.faq-answer').exists()).toBe(true)
    expect(homeViewSource).toContain('grid-template-rows:0fr')
    expect(homeViewSource).toContain('details[open]>.faq-answer{grid-template-rows:1fr')
    expect(homeViewSource).not.toMatch(/scrollHeight|getBoundingClientRect/)

    wrapper.unmount()
  })

  it('reveals meaningful section containers once they intersect', async () => {
    const { wrapper } = await mountHome()
    const capabilities = wrapper.get('[data-motion-section="capabilities"]')
    const observer = observerInstances.find(instance => (
      instance.observe.mock.calls[0]?.[0] === capabilities.element
    ))

    expect(capabilities.classes()).toContain('reveal-item')
    expect(capabilities.classes()).not.toContain('is-revealed')
    expect(observer?.observe).toHaveBeenCalledWith(capabilities.element)

    observer?.reveal()
    await nextTick()

    expect(capabilities.classes()).toContain('is-revealed')
    expect(observer?.disconnect).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('keeps the primary CTA immediately navigable without advancing timers', async () => {
    const { router, wrapper } = await mountHome()

    await wrapper.get('.hero-copy .primary-button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/login')
    wrapper.unmount()
  })

  it('exposes final hero and section content immediately under Reduced Motion', async () => {
    const { wrapper } = await mountHome(true)
    await nextTick()

    expect(wrapper.get('.landing-page').classes()).toContain('is-reduced-motion')
    expect(wrapper.get('.landing-page').classes()).not.toContain('is-hero-animating')
    expect(wrapper.findAll('[data-motion-layer]').every(layer => layer.classes().includes('is-revealed'))).toBe(true)
    expect(wrapper.findAll('[data-motion-section]').every(section => section.classes().includes('is-revealed'))).toBe(true)
    expect(observerInstances).toHaveLength(0)

    wrapper.unmount()
  })

  it('does not wrap configured custom home content in landing motion', async () => {
    state.homeContent = '<main data-custom-home>Custom</main>'
    const { wrapper } = await mountHome()

    expect(wrapper.get('[data-custom-home]').text()).toBe('Custom')
    expect(wrapper.find('.landing-page').exists()).toBe(false)
    expect(observerInstances).toHaveLength(0)

    wrapper.unmount()
  })
})
