<template>
  <button
    type="button"
    @click="toggle"
    class="toggle-switch"
    :class="{ 'toggle-switch-active': modelValue }"
    role="switch"
    :aria-checked="modelValue"
  >
    <span
      class="toggle-knob"
      :class="{ 'toggle-knob-active': modelValue }"
    />
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function toggle() {
  emit('update:modelValue', !props.modelValue)
}
</script>

<style scoped>
.toggle-switch {
  position: relative;
  display: inline-flex;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
  align-items: center;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: var(--bg-surface-alt);
  cursor: pointer;
  outline: none;
  transition: none;
}

.toggle-switch:hover {
  border-color: var(--accent);
  background: var(--bg-surface-alt);
}

.toggle-switch:focus-visible {
  border-color: var(--border-focus);
  outline: 2px solid var(--accent-soft);
  outline-offset: 2px;
}

.toggle-switch-active {
  border-color: var(--accent);
  background: var(--accent);
}

.toggle-switch-active:hover {
  background: var(--accent);
}

.toggle-switch:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.toggle-knob {
  position: absolute;
  left: 3px;
  width: 18px;
  height: 18px;
  border: 1px solid var(--border-default);
  border-radius: 999px;
  background: var(--bg-surface);
  transition: none;
}

.toggle-knob-active {
  left: 21px;
  border-color: var(--accent-contrast);
  background: var(--accent-contrast);
}
</style>
