<template>
  <!-- Custom Home Content: Full Page Mode -->
  <div v-if="homeContent" class="min-h-screen">
    <!-- iframe mode -->
    <iframe
      v-if="isHomeContentUrl"
      :src="homeContent.trim()"
      class="h-screen w-full border-0"
      allowfullscreen
    ></iframe>
    <!-- HTML mode - SECURITY: homeContent is admin-only setting, XSS risk is acceptable -->
    <div v-else v-html="homeContent"></div>
  </div>

  <!-- Default Home Page -->
  <div v-else class="landing-page">
    <!-- Header -->
    <header class="landing-header">
      <nav class="landing-nav">
        <!-- Logo -->
        <div class="brand-mark">
          <div class="brand-logo">
            <img :src="siteLogoPaths.light" alt="Logo" class="theme-logo-light" />
            <img :src="siteLogoPaths.dark" alt="Logo" class="theme-logo-dark" />
          </div>
          <span class="brand-name">{{ siteName }}</span>
        </div>

        <!-- Nav Actions -->
        <div class="nav-actions">
          <LocaleSwitcher />

          <router-link to="/agent-recruitment" class="nav-doc-link">
            {{ t('home.agentRecruitment') }}
          </router-link>

          <a
            :href="usageGuideUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="nav-doc-link"
          >
            {{ t('home.usageGuide') }}
          </a>

          <a
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="icon-action"
            :title="t('home.viewDocs')"
          >
            <Icon name="book" size="md" />
          </a>

          <button
            @click="toggleTheme"
            class="icon-action"
            :title="isDark ? t('home.switchToLight') : t('home.switchToDark')"
          >
            <Icon v-if="isDark" name="sun" size="md" />
            <Icon v-else name="moon" size="md" />
          </button>

          <router-link v-if="isAuthenticated" :to="dashboardPath" class="account-button">
            <span class="account-initial">{{ userInitial }}</span>
            <span>{{ t('home.dashboard') }}</span>
            <Icon name="externalLink" size="xs" />
          </router-link>
          <router-link v-else to="/login" class="account-button">
            {{ t('home.login') }}
          </router-link>
        </div>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="landing-main">
      <section class="hero-section">
        <div class="hero-logo" aria-hidden="true">
          <img :src="heroLogoPaths.light" alt="" class="theme-logo-light" />
          <img :src="heroLogoPaths.dark" alt="" class="theme-logo-dark" />
        </div>

        <div class="hero-copy">
          <h1>
            <span>{{ siteName }}</span>
            <span class="gradient-text">
              <span
                v-for="(line, index) in heroSubtitleLines"
                :key="`${line}-${index}`"
                class="gradient-line"
              >
                {{ line }}
              </span>
            </span>
          </h1>
          <p>{{ heroDescription }}</p>
        </div>

        <div class="hero-actions">
          <router-link :to="isAuthenticated ? dashboardPath : '/login'" class="primary-cta">
            {{ isAuthenticated ? t('home.goToDashboard') : t('home.getStarted') }}
            <Icon name="arrowRight" size="sm" />
          </router-link>
          <a :href="usageGuideUrl" target="_blank" rel="noopener noreferrer" class="secondary-cta">
            {{ t('home.usageGuide') }}
          </a>
          <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="secondary-cta">
            {{ t('home.docs') }}
          </a>
        </div>

        <div class="tag-row">
          <div class="landing-tag">
            <Icon name="swap" size="sm" />
            <span>{{ t('home.tags.beginnerFriendly') }}</span>
          </div>
          <div class="landing-tag">
            <Icon name="shield" size="sm" />
            <span>{{ t('home.tags.proFriendly') }}</span>
          </div>
          <div class="landing-tag">
            <Icon name="chart" size="sm" />
            <span>{{ t('home.tags.oneKeyAccess') }}</span>
          </div>
        </div>

        <div class="trust-note">
          <strong>{{ t('home.trust.title') }}</strong>
          <span>{{ t('home.trust.description') }}</span>
        </div>

        <div class="trust-grid" aria-label="OwnAPI trust commitments">
          <article>
            <strong>{{ t('home.trust.longTermTitle') }}</strong>
            <span>{{ t('home.trust.longTermDescription') }}</span>
          </article>
          <article>
            <strong>{{ t('home.trust.transparentTitle') }}</strong>
            <span>{{ t('home.trust.transparentDescription') }}</span>
          </article>
          <article>
            <strong>{{ t('home.trust.modelQualityTitle') }}</strong>
            <span>{{ t('home.trust.modelQualityDescription') }}</span>
          </article>
        </div>
      </section>

      <section class="feature-section">
        <div class="section-heading">
          <h2>{{ t('home.solutions.title') }}</h2>
          <p>{{ t('home.solutions.subtitle') }}</p>
        </div>

        <div class="feature-grid">
          <article class="feature-card">
            <div class="feature-icon">
              <Icon name="server" size="lg" />
            </div>
            <h3>{{ t('home.features.unifiedGateway') }}</h3>
            <p>{{ t('home.features.unifiedGatewayDesc') }}</p>
          </article>

          <article class="feature-card">
            <div class="feature-icon">
              <Icon name="shield" size="lg" />
            </div>
            <h3>{{ t('home.features.multiAccount') }}</h3>
            <p>{{ t('home.features.multiAccountDesc') }}</p>
          </article>

          <article class="feature-card">
            <div class="feature-icon">
              <Icon name="dollar" size="lg" />
            </div>
            <h3>{{ t('home.features.balanceQuota') }}</h3>
            <p>{{ t('home.features.balanceQuotaDesc') }}</p>
          </article>
        </div>
      </section>

      <section class="providers-section">
        <div class="section-heading">
          <h2>{{ t('home.providers.title') }}</h2>
          <p>{{ t('home.providers.description') }}</p>
        </div>

        <div class="provider-grid">
          <div v-for="provider in providerLogos" :key="provider.name" class="provider-chip">
            <span class="provider-logo">
              <img :src="provider.logo" :alt="provider.name" />
            </span>
            <span class="provider-content">
              <strong>{{ provider.name }}</strong>
              <span>{{ t(provider.descriptionKey) }}</span>
            </span>
          </div>
        </div>

        <div class="upcoming-models">
          <p>{{ t('home.providers.upcomingDescription') }}</p>
          <div class="upcoming-grid">
            <div v-for="provider in upcomingProviders" :key="provider.name" class="upcoming-chip">
              <img :src="provider.logo" alt="" aria-hidden="true" />
              <span>{{ provider.name }}</span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="footer-inner">
        <p>&copy; {{ currentYear }} {{ siteName }}. {{ t('home.footer.allRightsReserved') }}</p>
        <div class="footer-links">
          <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer">
            {{ t('home.docs') }}
          </a>
          <a v-if="githubUrl" :href="githubUrl" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore, useAppStore } from '@/stores'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import Icon from '@/components/icons/Icon.vue'
import {
  DEFAULT_SITE_HERO_LOGO,
  DEFAULT_SITE_HERO_LOGO_DARK,
  DEFAULT_SITE_HERO_LOGO_LIGHT,
  DEFAULT_REPOSITORY_URL,
  DEFAULT_SITE_LOGO,
  DEFAULT_SITE_NAME,
  DEFAULT_SITE_SUBTITLE,
  isDefaultOwnApiLogo,
  resolveSiteLogoPath,
  resolveThemedSiteLogoPaths
} from '@/constants/branding'

const { t } = useI18n()

const authStore = useAuthStore()
const appStore = useAppStore()

// Site settings - directly from appStore (already initialized from injected config)
const siteName = computed(() => appStore.cachedPublicSettings?.site_name || appStore.siteName || DEFAULT_SITE_NAME)
const siteLogo = computed(() => resolveSiteLogoPath(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || DEFAULT_SITE_LOGO))
const siteLogoPaths = computed(() => resolveThemedSiteLogoPaths(siteLogo.value))
const heroLogoPaths = computed(() =>
  isDefaultOwnApiLogo(siteLogo.value)
    ? { light: DEFAULT_SITE_HERO_LOGO_LIGHT || DEFAULT_SITE_HERO_LOGO, dark: DEFAULT_SITE_HERO_LOGO_DARK }
    : siteLogoPaths.value
)
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || DEFAULT_SITE_SUBTITLE)
const heroDescription = computed(() => {
  const subtitle = siteSubtitle.value.trim()
  return subtitle && subtitle !== DEFAULT_SITE_SUBTITLE ? subtitle : t('home.heroDescription')
})
const docUrl = computed(() => appStore.cachedPublicSettings?.doc_url || appStore.docUrl || '')
const homeContent = computed(() => appStore.cachedPublicSettings?.home_content || '')
const usageGuideUrl = '/docs/ownapi-usage-guide.html'

// Check if homeContent is a URL (for iframe display)
const isHomeContentUrl = computed(() => {
  const content = homeContent.value.trim()
  return content.startsWith('http://') || content.startsWith('https://')
})

// Theme
const isDark = ref(document.documentElement.classList.contains('dark'))

// GitHub URL
const githubUrl = DEFAULT_REPOSITORY_URL

// Auth state
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.isAdmin)
const dashboardPath = computed(() => isAdmin.value ? '/admin/dashboard' : '/dashboard')
const userInitial = computed(() => {
  const user = authStore.user
  if (!user || !user.email) return ''
  return user.email.charAt(0).toUpperCase()
})

const providerLogos = [
  { name: 'ChatGPT', logo: '/brand/openai.svg', descriptionKey: 'home.providers.chatgptDescription' },
  { name: 'Claude', logo: '/brand/claude.svg', descriptionKey: 'home.providers.claudeDescription' }
]
const upcomingProviders = [
  { name: 'Gemini', logo: '/brand/gemini.svg' },
  { name: 'DeepSeek', logo: '/brand/deepseek.svg' },
  { name: 'Qwen', logo: '/brand/qwen.svg' },
  { name: 'Mistral', logo: '/brand/mistral.svg' }
]
const heroSubtitleLines = computed(() => {
  const subtitle = t('home.heroSubtitle')
  if (subtitle.includes('，')) {
    const [first, ...rest] = subtitle.split('，')
    return [`${first}，`, rest.join('，').trim()].filter(Boolean)
  }
  return [subtitle]
})
// Current year for footer
const currentYear = computed(() => new Date().getFullYear())

// Toggle theme
function toggleTheme() {
  isDark.value = !isDark.value
  const nextTheme = isDark.value ? 'dark' : 'light'
  document.documentElement.classList.toggle('dark', isDark.value)
  document.documentElement.dataset.theme = nextTheme
  localStorage.setItem('theme', nextTheme)
}

// Initialize theme
function initTheme() {
  const savedTheme = localStorage.getItem('theme')
  if (
    savedTheme === 'dark' ||
    (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
}

onMounted(() => {
  initTheme()

  // Check auth state
  authStore.checkAuth()

  // Ensure public settings are loaded (will use cache if already loaded from injected config)
  if (!appStore.publicSettingsLoaded) {
    appStore.fetchPublicSettings()
  }
})
</script>

<style scoped>
.landing-page {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  background: var(--bg-page);
  color: rgb(15 23 42);
}

.landing-page,
.landing-page *,
.landing-page *::before,
.landing-page *::after {
  box-sizing: border-box;
}

.landing-header {
  position: sticky;
  top: 0;
  z-index: 30;
  border-bottom: 1px solid rgba(226, 232, 240, 0.72);
  background: rgba(248, 250, 252, 0.82);
  backdrop-filter: none;
}

.landing-nav {
  display: flex;
  height: 64px;
  width: min(100% - 32px, 1120px);
  margin: 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.brand-mark,
.nav-actions,
.footer-links,
.hero-actions,
.tag-row {
  display: flex;
  align-items: center;
}

.brand-mark {
  min-width: 0;
  gap: 10px;
}

.brand-logo {
  display: flex;
  height: 36px;
  width: 36px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.brand-logo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}

.brand-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0;
}

.nav-actions {
  flex: 0 0 auto;
  gap: 10px;
}

.landing-header :deep(.relative > button) {
  color: rgb(71 85 105);
}

.landing-header :deep(.relative > button:hover) {
  background: rgb(241 245 249);
  color: rgb(15 23 42);
}

.landing-header :deep(.relative svg) {
  color: rgb(148 163 184);
}

.icon-action {
  display: inline-flex;
  height: 36px;
  width: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: rgb(100 116 139);
  transition: background-color 0.16s ease, color 0.16s ease;
}

.nav-doc-link {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.7);
  padding: 0 14px;
  color: rgb(71 85 105);
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.icon-action:hover {
  background: rgb(241 245 249);
  color: rgb(15 23 42);
}

.nav-doc-link:hover {
  border-color: var(--border-strong);
  background: var(--bg-subtle);
  color: var(--accent);
}

.account-button {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 999px;
  background: rgb(15 23 42);
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 700;
  color: white;
  transition: background-color 0.16s ease, transform 0.16s ease;
}

.account-button:hover {
  background: rgb(30 41 59);
}

.account-button:active {
  transform: translateY(1px);
}

.account-initial {
  display: inline-flex;
  height: 20px;
  width: 20px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 11px;
}

.landing-main {
  position: relative;
  z-index: 1;
}

.hero-section {
  display: flex;
  min-height: auto;
  width: min(100% - 32px, 1120px);
  margin: 0 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 44px 0 36px;
  text-align: center;
}

.hero-logo {
  display: block;
  width: min(360px, 68vw);
  filter: none;
  line-height: 0;
  aspect-ratio: 1 / 1;
}

.hero-logo img {
  display: block;
  height: 100%;
  width: 100%;
  object-fit: contain;
  object-position: center;
}

.hero-copy {
  max-width: 920px;
}

.hero-copy h1 {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: clamp(36px, 5vw, 58px);
  font-weight: 900;
  line-height: 1.04;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.gradient-text {
  background: none;
  background-clip: initial;
  color: var(--accent);
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.gradient-line {
  display: inline;
}

.gradient-line + .gradient-line {
  margin-left: 0.16em;
}

.hero-copy p {
  max-width: 720px;
  margin: 14px auto 0;
  color: rgb(71 85 105);
  font-size: clamp(15px, 1.7vw, 18px);
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.hero-actions {
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}

.primary-cta,
.secondary-cta {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--radius-md);
  padding: 0 28px;
  font-size: 15px;
  font-weight: 800;
  transition: none;
}

.primary-cta {
  background: var(--accent);
  color: var(--accent-contrast);
  box-shadow: none;
}

.primary-cta:hover {
  background: var(--accent);
}

.secondary-cta {
  border: 1px solid var(--border-focus);
  color: var(--accent);
}

.secondary-cta:hover {
  border-color: var(--border-focus);
  background: var(--accent-soft);
}

.primary-cta:active,
.secondary-cta:active {
  transform: none;
}

.tag-row {
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.landing-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.76);
  padding: 10px 16px;
  color: rgb(71 85 105);
  font-size: 13px;
  font-weight: 700;
}

.landing-tag svg {
  color: var(--accent);
}

.trust-note {
  display: grid;
  gap: 6px;
  width: min(100%, 760px);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  padding: 18px 22px;
  color: rgb(51 65 85);
  text-align: center;
}

.trust-note strong {
  color: rgb(15 23 42);
  font-size: 16px;
  font-weight: 900;
}

.trust-note span {
  color: rgb(100 116 139);
  font-size: 14px;
  line-height: 1.65;
}

.trust-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  width: min(100%, 860px);
}

.trust-grid article {
  display: grid;
  gap: 7px;
  min-width: 0;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  padding: 16px;
  text-align: left;
}

.trust-grid strong {
  color: rgb(15 23 42);
  font-size: 14px;
  font-weight: 900;
  line-height: 1.35;
}

.trust-grid span {
  color: rgb(100 116 139);
  font-size: 13px;
  line-height: 1.65;
}

.feature-section,
.providers-section {
  width: min(100% - 32px, 1120px);
  margin: 0 auto;
  padding: 54px 0;
}

.section-heading {
  max-width: 720px;
  margin: 0 auto 22px;
  text-align: center;
}

.section-heading h2 {
  font-size: clamp(26px, 3vw, 36px);
  font-weight: 900;
  line-height: 1.16;
  letter-spacing: 0;
}

.section-heading p {
  margin-top: 10px;
  color: rgb(100 116 139);
  font-size: 16px;
  line-height: 1.7;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.feature-card {
  min-width: 0;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.72);
  padding: 20px;
  box-shadow: none;
}

.feature-icon {
  display: flex;
  height: 44px;
  width: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--accent-soft);
  color: var(--accent);
}

.feature-card h3 {
  margin-top: 14px;
  font-size: 17px;
  font-weight: 800;
}

.feature-card p {
  margin-top: 8px;
  color: rgb(100 116 139);
  font-size: 14px;
  line-height: 1.7;
}

.provider-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 340px));
  justify-content: center;
  gap: 18px;
}

.provider-chip {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.72);
  padding: 26px 24px;
  color: rgb(51 65 85);
  text-align: center;
}

.provider-logo {
  display: inline-flex;
  height: 96px;
  width: 96px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  background: rgb(248 250 252);
  color: rgb(15 23 42);
}

.provider-logo img {
  height: 58px;
  width: 58px;
}

.provider-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.provider-content strong {
  font-size: 22px;
  font-weight: 900;
  line-height: 1.2;
}

.provider-content span {
  color: rgb(100 116 139);
  font-size: 14px;
  line-height: 1.55;
}

.upcoming-models {
  margin: 22px auto 0;
  max-width: 780px;
  text-align: center;
}

.upcoming-models p {
  color: rgb(100 116 139);
  font-size: 14px;
  font-weight: 700;
}

.upcoming-grid {
  display: flex;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.upcoming-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.78);
  padding: 12px 18px;
  color: rgb(71 85 105);
  font-size: 15px;
  font-weight: 800;
}

.upcoming-chip img {
  height: 26px;
  width: 26px;
}

.landing-footer {
  position: relative;
  z-index: 1;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  padding: 28px 0;
}

.footer-inner {
  display: flex;
  width: min(100% - 32px, 1120px);
  margin: 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: rgb(100 116 139);
  font-size: 13px;
}

.footer-links {
  gap: 16px;
}

.footer-links a {
  transition: color 0.16s ease;
}

.footer-links a:hover {
  color: rgb(15 23 42);
}

@media (max-width: 768px) {
  .landing-nav {
    height: auto;
    min-height: 60px;
    width: min(100% - 24px, 1120px);
    padding: 10px 0;
  }

  .brand-name {
    max-width: 140px;
  }

  .nav-actions {
    gap: 6px;
  }

  .icon-action {
    height: 34px;
    width: 34px;
  }

  .account-button {
    min-height: 34px;
    padding: 7px 12px;
  }

  .hero-section {
    width: min(100% - 24px, 1120px);
    gap: 20px;
    padding: 36px 0 32px;
  }

  .hero-copy h1 {
    font-size: clamp(32px, 10vw, 44px);
    line-height: 1.12;
  }

  .feature-section,
  .providers-section {
    width: min(100% - 24px, 1120px);
    padding: 38px 0;
  }

  .feature-grid,
  .provider-grid {
    grid-template-columns: 1fr;
  }

  .provider-logo {
    height: 82px;
    width: 82px;
  }

  .provider-logo img {
    height: 50px;
    width: 50px;
  }

  .footer-inner {
    width: min(100% - 24px, 1120px);
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 520px) {
  .landing-nav {
    width: 100%;
    padding-right: 12px;
    padding-left: 12px;
  }

  .nav-actions {
    min-width: 0;
  }

  .brand-name {
    display: none;
  }

  .hero-copy {
    max-width: 100%;
  }

  .hero-copy h1 {
    font-size: clamp(28px, 8vw, 32px);
    line-height: 1.16;
  }

  .hero-copy p {
    width: 100%;
    max-width: 340px;
  }

  .gradient-text {
    display: block;
    width: 100%;
    margin: 0 auto;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .gradient-line {
    display: block;
  }

  .gradient-line + .gradient-line {
    margin-left: 0;
  }

  .hero-actions {
    width: 100%;
    max-width: min(100%, 340px);
    margin-right: auto;
    margin-left: auto;
  }

  .primary-cta,
  .secondary-cta {
    width: 100%;
    max-width: 100%;
  }

  .tag-row {
    align-items: stretch;
    flex-direction: column;
    width: 100%;
    max-width: 340px;
    margin-right: auto;
    margin-left: auto;
  }

  .landing-tag {
    justify-content: center;
  }
}

/* RELAY-UI-SPEC v2.0 landing lock */
.landing-page {
  background: var(--bg-page);
  color: var(--text-primary);
}

.dot-grid {
  display: none;
}

.landing-header {
  border-bottom: 1px solid var(--border-default);
  background: var(--bg-surface);
  backdrop-filter: none;
}

.brand-logo,
.icon-action,
.feature-icon,
.provider-logo,
.account-initial {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-surface-alt);
  color: var(--accent);
}

.brand-logo {
  border: 0;
  border-radius: 0;
  background: transparent;
}

.brand-name,
.hero-copy h1,
.section-heading h2 {
  color: var(--text-primary);
  font-family: var(--font-serif);
  font-weight: 400;
  letter-spacing: 0;
}

.hero-logo {
  filter: none;
}

.gradient-text,
.gradient-line {
  background: none;
  color: var(--accent);
  -webkit-text-fill-color: currentColor;
}

.hero-copy p,
.section-heading p,
.feature-card p,
.provider-content p,
.upcoming-models p,
.trust-note span,
.landing-footer,
.footer-links a {
  color: var(--text-muted);
}

.primary-cta,
.account-button {
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  background: var(--accent);
  color: var(--text-inverse);
  box-shadow: none;
}

.primary-cta:hover,
.account-button:hover {
  background: var(--accent-hover);
}

.secondary-cta,
.nav-doc-link,
.landing-tag,
.trust-note,
.feature-card,
.provider-chip,
.upcoming-chip {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  color: var(--text-primary);
  box-shadow: none;
}

.secondary-cta:hover,
.icon-action:hover,
.footer-links a:hover {
  border-color: var(--border-strong);
  background: var(--bg-subtle);
  color: var(--accent);
}

.feature-icon,
.provider-logo {
  background: var(--bg-surface-alt);
}

.trust-note strong {
  color: var(--accent);
}

.landing-tag svg,
.feature-icon,
.footer-links a:hover {
  color: var(--accent);
}

.landing-footer {
  border-top: 1px solid var(--border-default);
}
</style>
