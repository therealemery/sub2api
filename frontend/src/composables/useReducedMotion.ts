import { onBeforeUnmount, onMounted, readonly, ref, type Ref } from 'vue'

/**
 * Tracks the user's operating-system reduced-motion preference for one component.
 */
export function useReducedMotion(): Readonly<Ref<boolean>> {
  const reduced = ref(false)
  let media: MediaQueryList | undefined

  const updatePreference = (): void => {
    reduced.value = media?.matches ?? false
  }

  onMounted(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    media = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduced.value = media.matches
    media.addEventListener('change', updatePreference)
  })

  onBeforeUnmount(() => {
    media?.removeEventListener('change', updatePreference)
  })

  return readonly(reduced)
}
