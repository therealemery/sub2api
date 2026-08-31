import { onBeforeUnmount, onMounted, readonly, ref, watch } from 'vue'
import { useReducedMotion } from './useReducedMotion'

export interface InViewRevealOptions {
  once?: boolean
  rootMargin?: string
  threshold?: number
}

/**
 * Reveals one mounted element when it enters the viewport.
 *
 * Content stays directly visible when observation is unavailable or motion is
 * reduced, so the enhancement never becomes a rendering requirement.
 */
export function useInViewReveal(options: InViewRevealOptions = {}) {
  const { once = true, rootMargin, threshold } = options
  const target = ref<HTMLElement | null>(null)
  const revealed = ref(false)
  const reducedMotion = useReducedMotion()
  let observer: IntersectionObserver | undefined

  const disconnect = (): void => {
    observer?.disconnect()
    observer = undefined
  }

  const revealDirectly = (): void => {
    revealed.value = true
    disconnect()
  }

  watch(reducedMotion, (reduced) => {
    if (reduced) {
      revealDirectly()
    }
  }, { flush: 'sync' })

  onMounted(() => {
    if (
      reducedMotion.value
      || typeof window === 'undefined'
      || typeof window.IntersectionObserver !== 'function'
      || target.value === null
    ) {
      revealDirectly()
      return
    }

    document.documentElement.classList.add('motion-enhanced')
    observer = new window.IntersectionObserver((entries) => {
      const isIntersecting = entries.some(entry => entry.isIntersecting)

      if (once) {
        if (isIntersecting) {
          revealDirectly()
        }
        return
      }

      revealed.value = isIntersecting
    }, { rootMargin, threshold })
    observer.observe(target.value)
  })

  onBeforeUnmount(disconnect)

  return { target, revealed: readonly(revealed) }
}
