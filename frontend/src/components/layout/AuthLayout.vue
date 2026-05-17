<template>
  <div class="auth-shell">
    <div class="auth-grid" aria-hidden="true"></div>

    <main class="auth-frame">
      <section class="auth-brand" aria-label="Brand">
        <div class="auth-logo">
          <img :src="authLogo" alt="Logo" class="site-logo-img" />
        </div>
        <h1>{{ siteName }}</h1>
        <p v-if="showSubtitle">{{ siteSubtitle }}</p>
        <div class="auth-theme-line" aria-hidden="true"></div>
      </section>

      <section class="auth-card">
        <slot />
      </section>

      <div class="auth-footer-link">
        <slot name="footer" />
      </div>

      <div class="auth-copyright">
        &copy; {{ currentYear }} {{ siteName }}. All rights reserved.
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAppStore } from '@/stores'
import { sanitizeUrl } from '@/utils/url'
import {
  DEFAULT_SITE_HERO_LOGO,
  DEFAULT_SITE_LOGO,
  DEFAULT_SITE_NAME,
  DEFAULT_SITE_SUBTITLE,
  isDefaultOwnApiLogo,
  resolveSiteLogoPath
} from '@/constants/branding'

const appStore = useAppStore()

const siteName = computed(() => appStore.siteName || DEFAULT_SITE_NAME)
const siteLogo = computed(() => sanitizeUrl(resolveSiteLogoPath(appStore.siteLogo || DEFAULT_SITE_LOGO), { allowRelative: true, allowDataUrl: true }))
const authLogo = computed(() =>
  isDefaultOwnApiLogo(siteLogo.value)
    ? DEFAULT_SITE_HERO_LOGO
    : siteLogo.value
)
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || DEFAULT_SITE_SUBTITLE)
const showSubtitle = computed(() => {
  const subtitle = siteSubtitle.value.trim()
  return Boolean(subtitle && subtitle !== DEFAULT_SITE_SUBTITLE)
})
const currentYear = computed(() => new Date().getFullYear())

onMounted(() => {
  appStore.fetchPublicSettings()
})
</script>

<style scoped>
.auth-shell {
  position: relative;
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: var(--space-8) var(--space-4);
  background: var(--bg-page);
  color: var(--text-primary);
}

.auth-grid {
  display: none;
}

.auth-frame {
  position: relative;
  z-index: 1;
  width: min(100%, 420px);
}

.auth-brand {
  margin-bottom: var(--space-6);
  text-align: center;
}

.auth-logo {
  display: inline-flex;
  height: min(176px, 42vw);
  width: min(176px, 42vw);
  align-items: center;
  justify-content: center;
  background: transparent;
  line-height: 0;
}

.auth-logo img {
  height: 100%;
  width: 100%;
  object-fit: contain;
  object-position: center;
  mix-blend-mode: multiply;
}

.auth-brand h1 {
  margin-top: var(--space-3);
  color: var(--text-primary);
  font-family: var(--font-serif);
  font-size: var(--text-heading-lg);
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: 0;
}

.auth-brand p {
  margin-top: var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-body-sm);
  line-height: 1.6;
}

.auth-theme-line {
  width: 96px;
  height: 1px;
  margin: var(--space-4) auto 0;
  background: var(--accent);
}

.auth-card {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  padding: var(--space-7);
}

.auth-footer-link {
  margin-top: var(--space-5);
  text-align: center;
  font-size: var(--text-body-sm);
}

.auth-copyright {
  margin-top: var(--space-6);
  text-align: center;
  color: var(--text-faint);
  font-size: var(--text-micro);
}

.auth-card :deep(.input) {
  min-height: 40px;
  border-color: transparent;
  background: var(--input-bg);
  color: var(--text-primary);
}

.auth-card :deep(.input:focus) {
  border-color: var(--border-focus);
  box-shadow: none;
}

.auth-card :deep(.input-label) {
  color: var(--text-primary);
  font-weight: 500;
}

.auth-card :deep(.btn-primary) {
  min-height: 48px;
  border-radius: var(--radius-md);
  border-color: var(--accent);
  background: var(--accent);
  color: var(--text-inverse);
  box-shadow: none;
}

.auth-card :deep(.btn-primary:hover) {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.auth-card :deep(.btn-secondary) {
  min-height: 40px;
  border-color: var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  color: var(--text-primary);
  box-shadow: none;
}

.auth-card :deep(.btn-secondary:hover) {
  border-color: var(--border-strong);
  background: var(--bg-subtle);
}

.auth-footer-link :deep(a) {
  color: var(--text-link);
  font-weight: 600;
}

@media (max-width: 520px) {
  .auth-shell {
    padding: var(--space-6) var(--space-3);
  }

  .auth-logo {
    height: min(150px, 48vw);
    width: min(150px, 48vw);
  }

  .auth-brand h1 {
    font-size: var(--text-heading);
  }

  .auth-card {
    padding: var(--space-6);
  }
}
</style>
