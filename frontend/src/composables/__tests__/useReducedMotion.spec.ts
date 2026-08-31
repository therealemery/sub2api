import { defineComponent, type Ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useReducedMotion } from '../useReducedMotion'

interface MockMediaQueryList extends EventTarget {
  matches: boolean
  addEventListener: MediaQueryList['addEventListener']
  removeEventListener: MediaQueryList['removeEventListener']
}

describe('useReducedMotion', () => {
  let media: MockMediaQueryList

  beforeEach(() => {
    media = Object.assign(new EventTarget(), {
      matches: false,
      addEventListener: vi.fn(EventTarget.prototype.addEventListener),
      removeEventListener: vi.fn(EventTarget.prototype.removeEventListener)
    })

    vi.stubGlobal('matchMedia', vi.fn(() => media))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('tracks preference changes and removes its listener on unmount', () => {
    let reduced: Readonly<Ref<boolean>> | undefined

    const wrapper = mount(defineComponent({
      setup() {
        reduced = useReducedMotion()
        return () => null
      }
    }))

    expect(reduced?.value).toBe(false)
    expect(media.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    const listener = vi.mocked(media.addEventListener).mock.calls[0]?.[1]

    media.matches = true
    media.dispatchEvent(new Event('change'))
    expect(reduced?.value).toBe(true)
    
    wrapper.unmount()
    expect(media.removeEventListener).toHaveBeenCalledWith('change', listener)
  })
})
