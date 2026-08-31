<template>
  <header class="public-header">
    <nav class="public-nav" :aria-label="siteName">
      <router-link to="/home" class="public-brand" @click="closeMenu">
        <img :src="siteLogo" alt="" />
        <span>{{ siteName }}</span>
      </router-link>

      <div class="public-links">
        <router-link to="/models">{{ t('home.models') }}</router-link>
        <router-link to="/docs">{{ t('home.docs') }}</router-link>
        <router-link to="/agent-recruitment">{{ t('home.agentRecruitment') }}</router-link>
      </div>

      <div class="public-actions">
        <LocaleSwitcher />
        <router-link to="/login" class="nav-button nav-button-light">{{ t('home.login') }}</router-link>
        <router-link :to="primaryActionPath" class="nav-button nav-button-dark">
          {{ isAuthenticated ? t('home.dashboard') : t('home.getStarted') }}
        </router-link>
      </div>

      <button
        type="button"
        class="menu-button"
        :aria-label="menuOpen ? t('home.navigation.closeMenu') : t('home.navigation.openMenu')"
        :aria-expanded="menuOpen"
        @click="menuOpen = !menuOpen"
      >
        <Icon :name="menuOpen ? 'x' : 'menu'" size="md" />
      </button>
    </nav>

    <Transition name="motion-scale-fade">
      <div v-if="menuOpen" class="mobile-panel">
        <div class="mobile-links">
          <router-link to="/models" @click="closeMenu">{{ t('home.models') }}</router-link>
          <router-link to="/docs" @click="closeMenu">{{ t('home.docs') }}</router-link>
          <router-link to="/agent-recruitment" @click="closeMenu">{{ t('home.agentRecruitment') }}</router-link>
        </div>
        <div class="mobile-actions">
          <LocaleSwitcher />
          <router-link :to="primaryActionPath" class="nav-button nav-button-dark" @click="closeMenu">
            {{ isAuthenticated ? t('home.dashboard') : t('home.getStarted') }}
          </router-link>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore, useAppStore } from '@/stores'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import Icon from '@/components/icons/Icon.vue'
import { DEFAULT_SITE_LOGO, resolveSiteLogoPath, resolveSiteName } from '@/constants/branding'

const { t } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()
const menuOpen = ref(false)

const siteName = computed(() => resolveSiteName(appStore.cachedPublicSettings?.site_name || appStore.siteName))
const siteLogo = computed(() => resolveSiteLogoPath(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || DEFAULT_SITE_LOGO))
const isAuthenticated = computed(() => authStore.isAuthenticated)
const primaryActionPath = computed(() => isAuthenticated.value
  ? (authStore.isAdmin ? '/admin/dashboard' : '/dashboard')
  : '/register')

function closeMenu() {
  menuOpen.value = false
}
</script>

<style scoped>
.public-header{position:sticky;top:0;z-index:50;border-bottom:1px solid #e5e5e5;background:rgba(250,250,250,.92);backdrop-filter:blur(16px)}
.public-nav{display:grid;grid-template-columns:minmax(180px,1fr) auto minmax(300px,1fr);align-items:center;gap:28px;width:min(100% - 48px,1392px);height:64px;margin:0 auto}
.public-brand{display:inline-flex;align-items:center;gap:10px;width:fit-content;color:#171717;text-decoration:none}.public-brand img{width:26px;height:26px;object-fit:contain;mix-blend-mode:multiply}.public-brand span{font-size:16px;font-weight:650;letter-spacing:-.02em}
.public-links,.public-actions{display:flex;align-items:center}.public-links{justify-content:center;gap:28px}.public-links a{color:#444;font-size:14px;text-decoration:none}.public-links a:hover,.public-links a.router-link-active{color:#000}.public-actions{justify-content:flex-end;gap:10px}
.nav-button{display:inline-flex;min-height:40px;align-items:center;justify-content:center;border:1px solid #e5e5e5;border-radius:9px;padding:0 16px;font-size:14px;font-weight:560;text-decoration:none}.nav-button-light{background:#fff;color:#171717}.nav-button-dark{border-color:#171717;background:#171717;color:#fff}.nav-button:hover{border-color:#aaa}.nav-button-dark:hover{background:#333}
.menu-button,.mobile-panel{display:none}
@media(max-width:1020px){.public-nav{grid-template-columns:1fr auto}.public-links{display:none}}
@media(max-width:767px){.public-nav{width:calc(100% - 32px)}.public-brand span,.public-actions{display:none}.menu-button{display:inline-flex;width:42px;height:42px;align-items:center;justify-content:center;border:1px solid #e5e5e5;border-radius:10px;background:#fff;color:#171717}.mobile-panel{display:flex;position:fixed;inset:65px 0 0;z-index:49;flex-direction:column;justify-content:space-between;overflow-y:auto;background:#fafafa;padding:26px 24px 34px}.mobile-links{display:grid}.mobile-links a{display:flex;min-height:54px;align-items:center;border-bottom:1px solid #e5e5e5;color:#171717;font-size:20px;text-decoration:none}.mobile-actions{display:grid;gap:12px}.mobile-actions .nav-button{width:100%}}
</style>
