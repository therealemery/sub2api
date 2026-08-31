<template>
  <slot v-if="isAdminRoute" />
  <Transition v-else name="motion-fade" mode="out-in">
    <slot />
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  routePath: string
}>()

const isAdminRoute = computed(() => props.routePath.startsWith('/admin'))
</script>
