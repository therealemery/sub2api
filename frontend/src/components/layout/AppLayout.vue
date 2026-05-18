<template>
  <div class="app-shell min-h-screen bg-gray-50 bg-[var(--bg-surface-alt)]">
    <div class="app-shell-grid" aria-hidden="true"></div>

    <!-- Sidebar -->
    <AppSidebar />

    <!-- Main Content Area -->
    <div class="app-shell-content relative min-h-screen lg:ml-64">
      <!-- Header -->
      <AppHeader />

      <!-- Main Content -->
      <main class="app-main p-3 md:p-5 lg:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@/styles/onboarding.css'
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useOnboardingTour } from '@/composables/useOnboardingTour'
import { useOnboardingStore } from '@/stores/onboarding'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.user?.role === 'admin')
const shouldAutoStartOnboarding = computed(() => false)

const { replayTour } = useOnboardingTour({
  storageKey: isAdmin.value ? 'admin_guide' : 'user_guide',
  autoStart: shouldAutoStartOnboarding.value
})

const onboardingStore = useOnboardingStore()

onMounted(() => {
  onboardingStore.setReplayCallback(replayTour)
})

defineExpose({ replayTour })
</script>
