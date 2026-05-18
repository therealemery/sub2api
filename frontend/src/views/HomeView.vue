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
            <img :src="siteLogoPath" alt="Logo" class="site-logo-img" />
          </div>
          <span class="brand-name">{{ siteName }}</span>
        </div>

        <!-- Nav Actions -->
        <div class="nav-actions">
          <a
            :href="usageGuideUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="nav-doc-link"
          >
            {{ t('home.usageGuide') }}
          </a>

          <router-link to="/agent-recruitment" class="nav-doc-link">
            {{ t('home.agentRecruitment') }}
          </router-link>

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
          <img :src="heroLogoPath" alt="" class="site-logo-img" />
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
        </div>

        <div class="trust-panel" aria-label="OwnAPI trust commitments">
          <div class="trust-panel-copy">
            <strong>{{ t('home.trust.title') }}</strong>
            <span>{{ t('home.trust.description') }}</span>
          </div>
          <div class="trust-commitments">
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
        </div>
      </section>

      <section class="business-section" aria-label="B 端大用量 Token 方案">
        <div class="business-panel">
          <div class="business-copy">
            <span class="section-kicker">B 端大用量方案</span>
            <h2>
              <span>面向高频调用和团队</span>
              <span class="business-title-accent">专属批量使用</span>
            </h2>
            <p>
              如果你的业务需要长期、大量、稳定地消耗 AI Token，OwnAPI 可以提供更适合团队和工具服务商的用量方案，在价格、稳定性和模型体验之间保持更好的平衡。
            </p>
          </div>
          <div class="business-points">
            <article>
              <strong>更高性价比</strong>
              <span>适合批量任务、自动化工具、研发团队和内部系统长期接入。</span>
            </article>
            <article>
              <strong>稳定供给</strong>
              <span>围绕主流模型持续维护通道，不做低质量模型替换和体验注水。</span>
            </article>
            <article>
              <strong>长期合作</strong>
              <span>大用量客户可按实际使用规模配置更合适的额度和调用策略。</span>
            </article>
          </div>
          <button
            type="button"
            class="business-cta"
            :aria-label="`复制联系邮箱 ${contactEmail}`"
            @click="copyContactEmail"
          >
            {{ copiedContactEmail ? '已复制邮箱' : '粘贴联系邮箱' }}
            <Icon :name="copiedContactEmail ? 'check' : 'copy'" size="sm" />
          </button>
        </div>
      </section>

      <section class="agent-recruitment-section" aria-label="中转站代理招募">
        <div class="agent-recruitment-panel">
          <div class="agent-recruitment-copy">
            <span class="section-kicker">中转站代理招募</span>
            <h2>AI 时代的长期副业入口</h2>
            <p>
              AI Token 需求正在持续增长。成为 OwnAPI 代理后，可以围绕身边的开发者、团队和 AI 工具用户推广服务，并获得其他用户消费最高可达 40% 的分成。
            </p>
          </div>
          <div class="agent-recruitment-aside">
            <strong>最高 40%</strong>
            <span>用户消费分成</span>
            <router-link to="/agent-recruitment" class="agent-recruitment-cta">
              了解代理规则
              <Icon name="arrowRight" size="sm" />
            </router-link>
          </div>
        </div>
      </section>

      <section class="advantage-section">
        <div class="advantage-panel">
          <div class="advantage-copy">
            <span class="section-kicker">{{ t('home.solutions.title') }}</span>
            <h2>{{ t('home.solutions.subtitle') }}</h2>
            <p>{{ t('home.heroDescription') }}</p>
          </div>
          <div class="advantage-list">
            <article>
              <strong>{{ t('home.features.unifiedGateway') }}</strong>
              <span>{{ t('home.features.unifiedGatewayDesc') }}</span>
            </article>
            <article>
              <strong>{{ t('home.features.multiAccount') }}</strong>
              <span>{{ t('home.features.multiAccountDesc') }}</span>
            </article>
            <article>
              <strong>{{ t('home.features.balanceQuota') }}</strong>
              <span>{{ t('home.features.balanceQuotaDesc') }}</span>
            </article>
          </div>
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
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore, useAppStore } from '@/stores'
import Icon from '@/components/icons/Icon.vue'
import {
  DEFAULT_SITE_HERO_LOGO,
  DEFAULT_REPOSITORY_URL,
  DEFAULT_SITE_LOGO,
  DEFAULT_SITE_NAME,
  DEFAULT_SITE_SUBTITLE,
  isDefaultOwnApiLogo,
  resolveSiteLogoPath
} from '@/constants/branding'

const { t } = useI18n()

const authStore = useAuthStore()
const appStore = useAppStore()

// Site settings - directly from appStore (already initialized from injected config)
const siteName = computed(() => appStore.cachedPublicSettings?.site_name || appStore.siteName || DEFAULT_SITE_NAME)
const siteLogo = computed(() => resolveSiteLogoPath(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || DEFAULT_SITE_LOGO))
const siteLogoPath = computed(() => siteLogo.value)
const heroLogoPath = computed(() =>
  isDefaultOwnApiLogo(siteLogo.value)
    ? DEFAULT_SITE_HERO_LOGO
    : siteLogo.value
)
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || DEFAULT_SITE_SUBTITLE)
const heroDescription = computed(() => {
  const subtitle = siteSubtitle.value.trim()
  return subtitle && subtitle !== DEFAULT_SITE_SUBTITLE ? subtitle : t('home.heroDescription')
})
const docUrl = computed(() => appStore.cachedPublicSettings?.doc_url || appStore.docUrl || '')
const homeContent = computed(() => appStore.cachedPublicSettings?.home_content || '')
const usageGuideUrl = '/docs/ownapi-usage-guide.html'
const fallbackContactEmail = 'support@ownapi.dev'
const copiedContactEmail = ref(false)
const contactEmail = computed(() => {
  const rawContact = appStore.cachedPublicSettings?.contact_info || appStore.contactInfo || ''
  const email = rawContact.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]
  return email || fallbackContactEmail
})

function copyTextFallback(value: string) {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

async function copyContactEmail() {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(contactEmail.value)
    } else {
      copyTextFallback(contactEmail.value)
    }
    copiedContactEmail.value = true
    window.setTimeout(() => {
      copiedContactEmail.value = false
    }, 1600)
  } catch {
    copyTextFallback(contactEmail.value)
    copiedContactEmail.value = true
    window.setTimeout(() => {
      copiedContactEmail.value = false
    }, 1600)
  }
}

// Check if homeContent is a URL (for iframe display)
const isHomeContentUrl = computed(() => {
  const content = homeContent.value.trim()
  return content.startsWith('http://') || content.startsWith('https://')
})

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
  return [subtitle]
})
// Current year for footer
const currentYear = computed(() => new Date().getFullYear())

onMounted(() => {
  document.documentElement.classList.remove('dark')

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
  --bg-page: #f8f5f2;
  --bg-surface: #ffffff;
  --bg-surface-alt: #f1ebe4;
  --bg-subtle: #ebe2d8;
  --text-primary: #22201c;
  --text-secondary: #5f574e;
  --text-muted: #7d746a;
  --border-default: #ddd7ce;
  --border-strong: #c9bfb2;
  --accent: #d96941;
  --accent-hover: #bf5731;
  --accent-soft: #f5ded1;
  --accent-contrast: #ffffff;
  background: var(--bg-page);
  color: var(--text-primary);
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
  border-bottom: 1px solid var(--border-default);
  background: color-mix(in srgb, var(--bg-surface) 88%, transparent);
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
.hero-actions {
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
  mix-blend-mode: multiply;
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

.icon-action {
  display: inline-flex;
  height: 36px;
  width: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid var(--border-default);
  background: var(--bg-surface);
  color: var(--text-secondary);
  transition: none;
}

.nav-doc-link {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  padding: 0 10px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
  transition: none;
}

.icon-action:hover {
  background: var(--bg-surface-alt);
  color: var(--accent);
}

.nav-doc-link:hover {
  border-color: transparent;
  background: transparent;
  color: var(--accent);
}

.account-button {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--radius-md);
  background: var(--accent);
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 700;
  color: var(--accent-contrast);
  transition: none;
}

.account-button:hover {
  background: var(--accent-hover);
}

.account-button:active {
  transform: none;
}

.account-initial {
  display: inline-flex;
  height: 20px;
  width: 20px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--accent-contrast) 18%, transparent);
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
  gap: 24px;
  padding: 72px 0 52px;
  text-align: center;
}

.hero-logo {
  display: block;
  width: min(270px, 44vw);
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
  mix-blend-mode: multiply;
}

.hero-copy {
  max-width: 900px;
}

.hero-copy h1 {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: clamp(38px, 4.6vw, 60px);
  font-weight: 700;
  line-height: 1.08;
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
  margin: 18px auto 0;
  color: var(--text-secondary);
  font-size: clamp(15px, 1.7vw, 18px);
  line-height: 1.72;
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

.trust-panel {
  display: grid;
  width: min(100%, 1020px);
  gap: 22px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  padding: 34px 38px;
  text-align: left;
}

.trust-panel-copy {
  display: grid;
  gap: 8px;
}

.trust-panel-copy strong {
  color: var(--accent);
  font-size: 18px;
  font-weight: 900;
  line-height: 1.35;
}

.trust-panel-copy span {
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.75;
}

.trust-commitments {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid var(--border-default);
  padding-top: 22px;
}

.trust-commitments article {
  display: grid;
  min-width: 0;
  gap: 8px;
  padding: 4px 22px 4px 0;
}

.trust-commitments article + article {
  border-left: 1px solid var(--border-default);
  padding-right: 22px;
  padding-left: 22px;
}

.trust-commitments article strong {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 850;
  line-height: 1.35;
}

.trust-commitments article span {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.65;
}

.business-section {
  width: min(100% - 32px, 1120px);
  margin: 0 auto;
  padding: 4px 0 34px;
}

.business-panel {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr) auto;
  gap: 30px;
  align-items: center;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  padding: 34px 38px;
}

.business-copy {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.business-copy h2 {
  color: var(--text-primary);
  font-family: var(--font-serif);
  font-size: clamp(24px, 2.8vw, 36px);
  font-weight: 700;
  line-height: 1.16;
  letter-spacing: 0;
}

.business-copy h2 span {
  display: block;
}

.business-title-accent {
  color: var(--accent);
}

.business-copy p {
  max-width: 520px;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.78;
}

.business-points {
  display: grid;
  gap: 0;
  min-width: 0;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-surface-alt);
}

.business-points article {
  display: grid;
  gap: 6px;
  padding: 16px 18px;
}

.business-points article + article {
  border-top: 1px solid var(--border-default);
}

.business-points strong {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 900;
  line-height: 1.35;
}

.business-points span {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.business-cta {
  appearance: none;
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  background: var(--accent);
  padding: 0 18px;
  color: var(--accent-contrast);
  cursor: pointer;
  font-size: 14px;
  font-weight: 900;
  white-space: nowrap;
  transition: none;
}

.business-cta:hover {
  background: var(--accent-hover);
  color: var(--accent-contrast);
}

.agent-recruitment-section {
  width: min(100% - 32px, 1120px);
  margin: 0 auto;
  padding: 4px 0 34px;
}

.agent-recruitment-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 34px;
  align-items: center;
  border: 1px solid var(--accent);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--accent-soft) 42%, var(--bg-surface));
  padding: 34px 38px;
}

.agent-recruitment-copy {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.agent-recruitment-copy h2 {
  color: var(--text-primary);
  font-family: var(--font-serif);
  font-size: clamp(26px, 3vw, 38px);
  font-weight: 700;
  line-height: 1.16;
  letter-spacing: 0;
}

.agent-recruitment-copy p {
  max-width: 760px;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.78;
}

.agent-recruitment-aside {
  display: grid;
  justify-items: start;
  gap: 8px;
  min-width: 0;
  border-left: 1px solid var(--border-default);
  padding-left: 30px;
}

.agent-recruitment-aside strong {
  color: var(--accent);
  font-family: var(--font-serif);
  font-size: clamp(42px, 5vw, 64px);
  font-weight: 700;
  line-height: 1;
}

.agent-recruitment-aside span {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 900;
}

.agent-recruitment-cta {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  background: var(--accent);
  padding: 0 18px;
  color: var(--accent-contrast);
  font-size: 14px;
  font-weight: 900;
  transition: none;
}

.agent-recruitment-cta:hover {
  background: var(--accent-hover);
  color: var(--accent-contrast);
}

.advantage-section {
  width: min(100% - 32px, 1120px);
  margin: 0 auto;
  padding: 6px 0 34px;
}

.advantage-panel {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 40px;
  align-items: center;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  padding: 38px;
}

.advantage-copy {
  display: grid;
  gap: 14px;
}

.section-kicker {
  color: var(--accent);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0;
}

.advantage-copy h2 {
  color: var(--text-primary);
  font-family: var(--font-serif);
  font-size: clamp(24px, 2.8vw, 34px);
  font-weight: 700;
  line-height: 1.18;
  letter-spacing: 0;
}

.advantage-copy p {
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.75;
}

.advantage-list {
  display: grid;
  gap: 0;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-surface-alt);
}

.advantage-list article {
  display: grid;
  gap: 6px;
  padding: 18px 20px;
}

.advantage-list article + article {
  border-top: 1px solid var(--border-default);
}

.advantage-list strong {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 900;
}

.advantage-list span {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.65;
}

.providers-section {
  width: min(100% - 32px, 1120px);
  margin: 0 auto;
  padding: 34px 0 74px;
}

.section-heading {
  max-width: 720px;
  margin: 0 auto 30px;
  text-align: center;
}

.section-heading h2 {
  font-size: clamp(26px, 3vw, 36px);
  font-weight: 700;
  line-height: 1.16;
  letter-spacing: 0;
}

.section-heading p {
  margin-top: 10px;
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.7;
}

.provider-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  justify-content: center;
  gap: 20px;
}

.provider-chip {
  display: flex;
  min-height: 188px;
  min-width: 0;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 24px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  background: var(--bg-surface);
  padding: 34px;
  color: var(--text-primary);
  text-align: left;
}

.provider-logo {
  display: inline-flex;
  height: 112px;
  width: 112px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: var(--bg-surface-alt);
  color: var(--text-primary);
}

.provider-logo img {
  height: 68px;
  width: 68px;
}

.provider-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.provider-content strong {
  font-size: 26px;
  font-weight: 900;
  line-height: 1.2;
}

.provider-content span {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.55;
}

.upcoming-models {
  margin: 24px auto 0;
  max-width: 880px;
  text-align: center;
}

.upcoming-models p {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 700;
}

.upcoming-grid {
  display: flex;
  justify-content: center;
  gap: 18px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.upcoming-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: var(--radius-md);
  border: 0;
  background: transparent;
  padding: 6px 8px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 800;
}

.upcoming-chip img {
  height: 24px;
  width: 24px;
  opacity: 0.82;
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
  color: var(--text-muted);
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
    gap: 22px;
    padding: 48px 0 36px;
  }

  .hero-copy h1 {
    font-size: clamp(32px, 10vw, 44px);
    line-height: 1.12;
  }

  .business-section,
  .agent-recruitment-section,
  .advantage-section,
  .providers-section {
    width: min(100% - 24px, 1120px);
    padding: 38px 0;
  }

  .business-panel {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 28px 24px;
  }

  .business-copy p {
    max-width: none;
  }

  .business-cta {
    justify-self: start;
  }

  .agent-recruitment-panel {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 28px 24px;
  }

  .agent-recruitment-aside {
    border-top: 1px solid var(--border-default);
    border-left: 0;
    padding-top: 22px;
    padding-left: 0;
  }

  .advantage-panel {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 28px 24px;
  }

  .provider-grid,
  .trust-commitments {
    grid-template-columns: 1fr;
  }

  .trust-panel {
    padding: 28px 24px;
  }

  .trust-commitments article,
  .trust-commitments article + article {
    border-left: 0;
    padding: 16px 0;
  }

  .trust-commitments article + article {
    border-top: 1px solid var(--border-default);
  }

  .provider-chip {
    min-height: auto;
    align-items: flex-start;
    flex-direction: column;
    padding: 28px 24px;
    text-align: left;
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

  .nav-doc-link {
    display: none;
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
  letter-spacing: 0;
}

.brand-name {
  font-weight: 700;
}

.hero-copy h1,
.section-heading h2 {
  font-weight: 700;
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
.provider-content span,
.upcoming-models p,
.trust-panel-copy span,
.trust-commitments span,
.business-copy p,
.business-points span,
.landing-footer,
.footer-links a {
  color: var(--text-muted);
}

.trust-commitments strong,
.business-points strong,
.advantage-list strong,
.provider-content strong,
.section-kicker {
  color: var(--text-primary);
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
.trust-panel,
.business-panel,
.advantage-panel,
.provider-chip {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  color: var(--text-primary);
  box-shadow: none;
}

.secondary-cta:hover,
.icon-action:hover,
.footer-links a:hover,
.nav-doc-link:hover {
  border-color: var(--border-strong);
  background: var(--bg-subtle);
  color: var(--accent);
}

.provider-logo {
  background: var(--bg-surface-alt);
}

.trust-panel-copy strong,
.section-kicker {
  color: var(--accent);
}

.footer-links a:hover {
  color: var(--accent);
}

.landing-footer {
  border-top: 1px solid var(--border-default);
}

.landing-page :is(.provider-logo img, .upcoming-chip img) {
  filter: none;
}
</style>
