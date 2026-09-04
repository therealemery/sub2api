import { defineComponent, nextTick, onMounted, onUnmounted } from 'vue'
import { flushPromises, mount, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import PublicSiteHeader from '../../public/PublicSiteHeader.vue'
import PublicSiteLayout from '../../public/PublicSiteLayout.vue'
import publicSiteLayoutSource from '../../public/PublicSiteLayout.vue?raw'
import LayoutView from '../LayoutView.vue'
import layoutViewSource from '../LayoutView.vue?raw'
import UserRouteTransition from '../UserRouteTransition.vue'

const route = { fullPath: '/models', path: '/models' }
const checkAuth = vi.fn()
const fetchPublicSettings = vi.fn()

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()

  return {
    ...actual,
    useRoute: () => route
  }
})

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()

  return {
    ...actual,
    useI18n: () => ({ t: (key: string) => key })
  }
})

vi.mock('@/stores', () => ({
  useAuthStore: () => ({
    checkAuth,
    isAdmin: false,
    isAuthenticated: false
  }),
  useAppStore: () => ({
    cachedPublicSettings: null,
    fetchPublicSettings,
    publicSettingsLoaded: true,
    siteLogo: '',
    siteName: 'OwnAPI'
  })
}))

describe('UserRouteTransition', () => {
  it('is the single route gate around the keyed LayoutView router slot', () => {
    expect(layoutViewSource).toContain('<router-view v-slot="{ Component, route }">')
    expect(layoutViewSource).toContain('<UserRouteTransition :route-path="route.path">')
    expect(layoutViewSource).toContain('<component :is="Component" :key="route.path" />')
    expect(layoutViewSource).not.toContain("startsWith('/admin')")
  })

  it('does not remount a user page when only its query changes', async () => {
    const mounted = vi.fn()
    const unmounted = vi.fn()
    const PaymentPage = defineComponent({
      setup() {
        onMounted(mounted)
        onUnmounted(unmounted)
      },
      template: '<section data-test="payment-page">Payment</section>'
    })
    const AppLayoutStub = defineComponent({ template: '<div><slot /></div>' })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{
        path: '/payment',
        component: LayoutView,
        children: [{ path: '', component: PaymentPage }]
      }]
    })

    await router.push('/payment?resume=confirm')
    await router.isReady()
    const wrapper = mount(RouterView, {
      global: {
        plugins: [router],
        stubs: { AppLayout: AppLayoutStub }
      }
    })
    await flushPromises()

    expect(wrapper.get('[data-test="payment-page"]').exists()).toBe(true)
    expect(mounted).toHaveBeenCalledTimes(1)

    await router.push('/payment?resume=complete')
    await flushPromises()

    expect(router.currentRoute.value.query.resume).toBe('complete')
    expect(mounted).toHaveBeenCalledTimes(1)
    expect(unmounted).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('uses motion-fade for ordinary authenticated user routes', () => {
    const wrapper = mount(UserRouteTransition, {
      props: { routePath: '/dashboard' },
      slots: { default: '<section data-test="page">Dashboard</section>' }
    })

    expect(wrapper.get('transition-stub').attributes()).toMatchObject({ name: 'motion-fade' })
    expect(wrapper.get('[data-test="page"]').text()).toBe('Dashboard')
  })

  it.each(['/admin', '/admin/dashboard', '/administrator-preview'])(
    'bypasses the transition for every admin-prefixed path: %s',
    (routePath) => {
      const wrapper = mount(UserRouteTransition, {
        props: { routePath },
        slots: { default: '<section data-test="page">Admin</section>' }
      })

      expect(wrapper.find('transition-stub').exists()).toBe(false)
      expect(wrapper.get('[data-test="page"]').text()).toBe('Admin')
    }
  )
})

describe('public route and navigation motion', () => {
  beforeEach(() => {
    route.fullPath = '/models'
    checkAuth.mockClear()
    fetchPublicSettings.mockClear()
  })

  it('fades public route content with a stable path key', () => {
    const wrapper = shallowMount(PublicSiteLayout, {
      slots: { default: '<main data-test="public-page">Models</main>' }
    })

    expect(wrapper.get('transition-stub').attributes()).toMatchObject({
      appear: 'true',
      mode: 'out-in',
      name: 'motion-fade'
    })
    expect(wrapper.get('.public-route-content').element.parentElement).toBe(
      wrapper.get('transition-stub').element
    )
    expect(publicSiteLayoutSource).toContain(':key="route.path"')
  })

  it('keeps the real mobile menu transition keyboard-focusable and navigates immediately', async () => {
    const EmptyPage = defineComponent({ template: '<div />' })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/home', component: EmptyPage },
        { path: '/models', component: EmptyPage },
        { path: '/docs', component: EmptyPage },
        { path: '/agent-recruitment', component: EmptyPage },
        { path: '/login', component: EmptyPage },
        { path: '/register', component: EmptyPage }
      ]
    })
    await router.push('/home')
    await router.isReady()

    const wrapper = mount(PublicSiteHeader, {
      attachTo: document.body,
      global: {
        plugins: [router],
        stubs: {
          Icon: true,
          LocaleSwitcher: true,
          Transition: false
        }
      }
    })

    const toggle = wrapper.get('button.menu-button')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(toggle.attributes('type')).toBe('button')
    toggle.element.focus()
    expect(document.activeElement).toBe(toggle.element)

    // JSDOM does not synthesize a native button click for Enter, so model the
    // browser's default activation only when the key event was not cancelled.
    const enterEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })
    toggle.element.dispatchEvent(enterEvent)
    if (!enterEvent.defaultPrevented) toggle.element.click()
    await nextTick()
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('.mobile-panel').classes()).toContain('motion-scale-fade-enter-from')

    const firstLink = wrapper.get('.mobile-links a')
    expect(firstLink.attributes('href')).toBe('/models')
    expect(firstLink.element.tabIndex).toBe(0)

    const push = vi.spyOn(router, 'push')
    await firstLink.trigger('click')
    expect(push).toHaveBeenCalledWith('/models')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/models')
    const leavingPanel = wrapper.get('.mobile-panel')
    expect(leavingPanel.classes()).toContain('motion-scale-fade-leave-active')

    wrapper.unmount()
  })
})
