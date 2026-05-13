<template>
  <div class="relative w-full">
    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
      <Icon name="search" size="md" class="text-gray-400" />
    </div>
    <input
      :value="modelValue"
      type="text"
      class="input pl-10"
      :placeholder="placeholder"
      @input="handleInput"
    />
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import Icon from '@/components/icons/Icon.vue'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  debounceMs?: number
}>(), {
  placeholder: 'Search...',
  debounceMs: 300
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'search', value: string): void
}>()

const debouncedEmitSearch = useDebounceFn((value: string) => {
  emit('search', value)
}, props.debounceMs)

const handleInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', value)
  debouncedEmitSearch(value)
}
</script>

<style scoped>
:deep(.input) {
  min-height: 40px !important;
  border: 1px solid transparent !important;
  border-radius: var(--radius-md) !important;
  background: var(--bg-surface-alt) !important;
  color: var(--text-primary) !important;
  font-size: var(--text-body, 16px) !important;
  font-weight: 400 !important;
  box-shadow: none;
}

:deep(.input::placeholder) {
  color: var(--text-secondary) !important;
}

.relative :deep(svg) {
  color: var(--text-secondary) !important;
}
</style>
