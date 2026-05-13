<template>
  <section class="page-intro" :class="{ 'page-intro-compact': compact }">
    <div class="page-intro-main">
      <p v-if="eyebrow" class="page-intro-eyebrow">{{ eyebrow }}</p>
      <h2>{{ title }}</h2>
      <p class="page-intro-description">{{ description }}</p>
    </div>

    <div v-if="$slots.actions" class="page-intro-actions">
      <slot name="actions" />
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description: string
  eyebrow?: string
  compact?: boolean
}>(), {
  eyebrow: '',
  compact: false
})
</script>
