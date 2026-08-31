<template>
  <div class="public-site">
    <PublicSiteHeader />
    <Transition name="motion-fade" mode="out-in" appear>
      <div :key="route.fullPath" class="public-route-content">
        <slot />
      </div>
    </Transition>
    <PublicSiteFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore, useAppStore } from '@/stores'
import PublicSiteHeader from './PublicSiteHeader.vue'
import PublicSiteFooter from './PublicSiteFooter.vue'

const authStore = useAuthStore()
const appStore = useAppStore()
const route = useRoute()

onMounted(() => {
  document.documentElement.classList.remove('dark')
  authStore.checkAuth()
  if (!appStore.publicSettingsLoaded) appStore.fetchPublicSettings()
})
</script>

<style scoped>
.public-site{min-height:100vh;overflow-x:hidden;background:#fafafa;color:#171717;font-family:GeistSans,Geist,Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}.public-site,.public-site :deep(*){box-sizing:border-box}
</style>
