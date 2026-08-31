import { defineComponent, h, type Ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useInViewReveal, type InViewRevealOptions } from '../useInViewReveal'

interface MockMediaQueryList extends EventTarget {
  matches: boolean
  addEventListener: MediaQueryList['addEventListener']
  removeEventListener: MediaQueryList['removeEventListener']
}

const observerInstances: MockIntersectionObserver[] = []

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin: string
  readonly thresholds: ReadonlyArray<number>
  readonly observe = vi.fn()
  readonly unobserve = vi.fn()
  readonly disconnect = vi.fn()
  readonly takeRecords = vi.fn(() => [])

  constructor(
    private readonly callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {}
  ) {
    this.rootMargin = options.rootMargin ?? '0px'
    this.thresholds = [typeof options.threshold === 'number' ? options.threshold : 0]
    observerInstances.push(this)
  }

  emit(isIntersecting: boolean): void {
    const target = this.observe.mock.calls[0]?.[0]
    this.callback([{ isIntersecting, target } as IntersectionObserverEntry], this)
  }
}

function createMedia(matches: boolean): MockMediaQueryList {
  return Object.assign(new EventTarget(), {
    matches,
    addEventListener: vi.fn(EventTarget.prototype.addEventListener),
    removeEventListener: vi.fn(EventTarget.prototype.removeEventListener)
  })
}

function mountReveal(options: InViewRevealOptions = {}) {
  let revealed: Readonly<Ref<boolean>> | undefined

  const wrapper = mount(defineComponent({
    setup() {
      const reveal = useInViewReveal(options)
      revealed = reveal.revealed
      return () => h('div', { ref: reveal.target })
    }
  }))

  return { wrapper, revealed }
}

describe('useInViewReveal', () => {
  beforeEach(() => {
    observerInstances.length = 0
    vi.stubGlobal('matchMedia', vi.fn(() => createMedia(false)))
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    document.documentElement.classList.remove('motion-enhanced')
  })

  afterEach(() => {
    document.documentElement.classList.remove('motion-enhanced')
    vi.unstubAllGlobals()
  })

  it('starts observing its target after mount with the requested options', () => {
    expect(observerInstances).toHaveLength(0)

    const { wrapper, revealed } = mountReveal({
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.2
    })
    const observer = observerInstances[0]

    expect(observerInstances).toHaveLength(1)
    expect(observer?.rootMargin).toBe('0px 0px -12% 0px')
    expect(observer?.thresholds).toEqual([0.2])
    expect(observer?.observe).toHaveBeenCalledWith(wrapper.element)
    expect(revealed?.value).toBe(false)
    expect(document.documentElement.classList.contains('motion-enhanced')).toBe(true)

    wrapper.unmount()
  })

  it('reveals and disconnects after the first intersection by default', () => {
    const { wrapper, revealed } = mountReveal()
    const observer = observerInstances[0]

    observer?.emit(true)

    expect(revealed?.value).toBe(true)
    expect(observer?.disconnect).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('continues tracking visibility when once is false', () => {
    const { wrapper, revealed } = mountReveal({ once: false })
    const observer = observerInstances[0]

    observer?.emit(true)
    expect(revealed?.value).toBe(true)
    expect(observer?.disconnect).not.toHaveBeenCalled()

    observer?.emit(false)
    expect(revealed?.value).toBe(false)

    wrapper.unmount()
  })

  it('reveals immediately without observing when Reduced Motion is enabled', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => createMedia(true)))

    const { wrapper, revealed } = mountReveal()

    expect(revealed?.value).toBe(true)
    expect(observerInstances).toHaveLength(0)

    wrapper.unmount()
  })

  it('reveals immediately when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined)

    const { wrapper, revealed } = mountReveal()

    expect(revealed?.value).toBe(true)
    expect(observerInstances).toHaveLength(0)

    wrapper.unmount()
  })

  it('disconnects an active observer on unmount', () => {
    const { wrapper } = mountReveal()
    const observer = observerInstances[0]

    wrapper.unmount()

    expect(observer?.disconnect).toHaveBeenCalledTimes(1)
  })
})
