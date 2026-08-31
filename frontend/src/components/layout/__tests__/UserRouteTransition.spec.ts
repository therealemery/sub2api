import { defineComponent, nextTick } from 'vue'
import { mount, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PublicSiteHeader from '../../public/PublicSiteHeader.vue'
import PublicSiteLayout from '../../public/PublicSiteLayout.vue'
import publicSiteLayoutSource from '../../public/PublicSiteLayout.vue?raw'
import layoutViewSource from '../LayoutView.vue?raw'
import UserRouteTransition from '../UserRouteTransition.vue'

const route = { fullPath: '/models' }
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

const RouterLinkStub = defineComponent({
  props: {
    to: {
      type: String,
      required: true
    }
  },
  emits: ['click'],
  template: '<a :href="to" @click.prevent="$emit(\'click\', $event)"><slot /></a>'
})

describe('UserRouteTransition', () => {
  it('is the single route gate around the keyed LayoutView router slot', () => {
    expect(layoutViewSource).toContain('<router-view v-slot="{ Component, route }">')
    expect(layoutViewSource).toContain('<UserRouteTransition :route-path="route.path">')
    expect(layoutViewSource).toContain('<component :is="Component" :key="route.fullPath" />')
    expect(layoutViewSource).not.toContain("startsWith('/admin')")
  })

  it('uses motion-fade for ordinary authenticated user routes', () => {
    const wrapper = mount(UserRouteTransition, {
      props: { routePath: '/dashboard' },
      slots: { default: '<section data-test="page">Dashboard</section>' }
    })

    expect(wrapper.get('transition-stub').attributes()).toMatchObject({
      mode: 'out-in',
      name: 'motion-fade'
    })
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

  it('fades public route content with a stable full-path key', () => {
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
    expect(publicSiteLayoutSource).toContain(':key="route.fullPath"')
  })

  it('wraps the open mobile menu in motion-scale-fade without delaying link clicks', async () => {
    const wrapper = mount(PublicSiteHeader, {
      global: {
        stubs: {
          Icon: true,
          LocaleSwitcher: true,
          RouterLink: RouterLinkStub
        }
      }
    })

    const toggle = wrapper.get('button.menu-button')
    expect(toggle.attributes('aria-expanded')).toBe('false')

    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('transition-stub').attributes('name')).toBe('motion-scale-fade')

    const firstLink = wrapper.get('.mobile-links a')
    expect(firstLink.attributes('href')).toBe('/models')
    expect(firstLink.element.tabIndex).toBe(0)

    await firstLink.trigger('click')
    await nextTick()
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.mobile-panel').exists()).toBe(false)
  })
})
