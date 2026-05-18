<template>
  <section class="page-intro" :class="{ 'page-intro-compact': compact }">
    <div class="page-intro-main">
      <p v-if="eyebrow" class="page-intro-eyebrow">{{ eyebrow }}</p>
      <h1 class="page-intro-title">{{ title }}</h1>
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

<style scoped>
.page-intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-6);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  padding: 28px 32px;
  color: var(--text-primary);
  box-shadow: none;
}

.page-intro-compact {
  padding: 28px 32px;
}

.page-intro-main {
  display: grid;
  gap: 10px;
  max-width: 920px;
  min-width: 0;
}

.page-intro-eyebrow {
  margin: 0;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0;
}

.page-intro-title {
  margin: 0;
  color: var(--text-primary);
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 900;
  line-height: 1.22;
  letter-spacing: 0;
}

.page-intro-description {
  margin: 0;
  max-width: 880px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.75;
}

.page-intro-actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-left: auto;
}

@media (max-width: 768px) {
  .page-intro {
    display: grid;
    padding: 22px;
  }

  .page-intro-compact {
    padding: 22px;
  }

  .page-intro-title {
    font-size: 24px;
  }

  .page-intro-actions {
    justify-content: flex-start;
    margin-left: 0;
  }
}
</style>
