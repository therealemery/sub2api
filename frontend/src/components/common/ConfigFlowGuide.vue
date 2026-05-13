<template>
  <section class="config-flow-guide" :aria-label="title">
    <div class="config-flow-header">
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>

    <div class="config-flow-terms">
      <div v-for="term in terms" :key="term.label" class="config-flow-term">
        <strong>{{ term.label }}</strong>
        <span>{{ term.description }}</span>
      </div>
    </div>

    <div v-if="steps.length" class="config-flow-steps">
      <template v-for="(step, index) in steps" :key="step">
        <span class="config-flow-step">{{ step }}</span>
        <span v-if="index < steps.length - 1" class="config-flow-arrow">-&gt;</span>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description: string
  terms: Array<{ label: string; description: string }>
  steps?: string[]
}>(), {
  steps: () => []
})
</script>
