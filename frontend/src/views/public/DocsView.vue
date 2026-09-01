<template>
  <PublicSiteLayout>
    <main class="docs-page">
      <div class="docs-shell">
        <aside class="docs-nav" :class="{ 'docs-nav-open': navigationOpen }">
          <button type="button" class="docs-nav-toggle" :aria-expanded="navigationOpen" @click="navigationOpen = !navigationOpen">
            {{ t('publicDocs.navigation') }} <Icon :name="navigationOpen ? 'chevronUp' : 'chevronDown'" size="sm" />
          </button>
          <nav :aria-label="t('publicDocs.navigation')">
            <div v-for="group in docsNavigation" :key="group.labelKey">
              <strong>{{ t(group.labelKey) }}</strong>
              <a v-for="item in group.items" :key="item.id" :href="item.href" :class="{ 'is-active': isActiveHref(item.href) }" :aria-current="isActiveHref(item.href) ? 'location' : undefined" @click="setActiveSection(item.href); navigationOpen = false">{{ t(item.labelKey) }}</a>
            </div>
          </nav>
        </aside>

        <article class="docs-content">
          <header id="overview" class="docs-hero">
            <span>{{ t('publicDocs.eyebrow') }}</span>
            <h1>{{ t('publicDocs.title') }}</h1>
            <p>{{ t('publicDocs.description') }}</p>
          </header>

          <section id="api-key" class="entry-grid" :aria-label="t('publicDocs.quickStart')">
            <router-link to="/register"><Icon name="key" size="lg" /><div><h2>{{ t('publicDocs.quickStart') }}</h2><p>{{ t('publicDocs.quickStartDescription') }}</p></div><Icon name="arrowRight" size="sm" /></router-link>
            <router-link to="/models"><Icon name="sparkles" size="lg" /><div><h2>{{ t('publicDocs.modelList') }}</h2><p>{{ t('publicDocs.modelListDescription') }}</p></div><Icon name="arrowRight" size="sm" /></router-link>
            <router-link :to="dashboardPath"><Icon name="chartBar" size="lg" /><div><h2>{{ t('publicDocs.dashboard') }}</h2><p>{{ t('publicDocs.dashboardDescription') }}</p></div><Icon name="arrowRight" size="sm" /></router-link>
          </section>

          <section id="model-types" class="docs-section">
            <span class="section-index">01</span><h2>{{ t('publicDocs.accessTitle') }}</h2><p>{{ t('publicDocs.typesTitle') }}</p>
            <div class="type-grid">
              <article><Icon name="chat" size="lg" /><h3>{{ t('publicDocs.textTitle') }}</h3><p>{{ t('publicDocs.textDescription') }}</p><router-link to="/models">{{ t('publicDocs.modelList') }} <Icon name="arrowRight" size="xs" /></router-link></article>
              <article><Icon name="sparkles" size="lg" /><h3>{{ t('publicDocs.imageTitle') }}</h3><p>{{ t('publicDocs.imageDescription') }}</p><router-link to="/models">{{ t('publicDocs.modelList') }} <Icon name="arrowRight" size="xs" /></router-link></article>
              <article><Icon name="terminal" size="lg" /><h3>{{ t('publicDocs.codeTitle') }}</h3><p>{{ t('publicDocs.codeDescription') }}</p><a href="#quick-start">{{ t('publicDocs.quickStart') }} <Icon name="arrowRight" size="xs" /></a></article>
            </div>
          </section>

          <section id="quick-start" class="docs-section code-section">
            <div class="section-copy"><span class="section-index">02</span><h2>{{ t('publicDocs.startTitle') }}</h2><p>{{ t('publicDocs.quickStartDescription') }}</p></div>
            <DocsCodeExamples />
          </section>

          <section id="base-url" class="docs-section split-section">
            <div><span class="section-index">03</span><h2>{{ t('publicDocs.baseUrlTitle') }}</h2><p>{{ t('publicDocs.baseUrlDescription') }}</p></div>
            <div class="config-card"><span>baseURL</span><code>{{ baseUrl }}</code><span>apiKey</span><code>process.env.OWNAPI_API_KEY</code></div>
          </section>

          <section id="production" class="docs-section">
            <span class="section-index">04</span><h2>{{ t('publicDocs.whyTitle') }}</h2>
            <div class="guide-grid">
              <article><Icon name="cube" size="lg" /><h3>{{ t('publicDocs.unifiedTitle') }}</h3><p>{{ t('publicDocs.unifiedDescription') }}</p></article>
              <article><Icon name="chartBar" size="lg" /><h3>{{ t('publicDocs.billingTitle') }}</h3><p>{{ t('publicDocs.billingDescription') }}</p></article>
              <article><Icon name="shield" size="lg" /><h3>{{ t('publicDocs.reliabilityTitle') }}</h3><p>{{ t('publicDocs.reliabilityDescription') }}</p></article>
            </div>
          </section>

          <section id="errors" class="docs-section split-section">
            <div><span class="section-index">05</span><h2>{{ t('publicDocs.errorsTitle') }}</h2><p>{{ t('publicDocs.errorsDescription') }}</p></div>
            <div class="error-list">
              <div><code>401</code><span>{{ t('publicDocs.authErrorDescription') }}</span></div>
              <div><code>429</code><span>{{ t('publicDocs.rateLimitDescription') }}</span></div>
              <div><code>5xx</code><span>{{ t('publicDocs.upstreamErrorDescription') }}</span></div>
            </div>
          </section>

          <section id="resources" class="docs-section resources-section">
            <span class="section-index">06</span><h2>{{ t('publicDocs.resourcesTitle') }}</h2>
            <div class="resource-links">
              <a href="/docs/ownapi-usage-guide.html"><div><strong>{{ t('publicDocs.integrationsTitle') }}</strong><p>{{ t('publicDocs.integrationsDescription') }}</p></div><Icon name="arrowRight" size="sm" /></a>
            </div>
          </section>
        </article>

        <aside class="on-this-page">
          <strong>{{ t('publicDocs.onThisPage') }}</strong>
          <div class="on-this-page-links" :style="{ '--active-index': activeSectionIndex }">
            <span class="docs-active-indicator" aria-hidden="true"></span>
            <a v-for="item in docsOnThisPage" :key="item.id" :href="item.href" :class="{ 'is-active': isActiveHref(item.href) }" :aria-current="isActiveHref(item.href) ? 'location' : undefined" @click="setActiveSection(item.href)">{{ t(item.labelKey) }}</a>
          </div>
        </aside>
      </div>
    </main>
  </PublicSiteLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores'
import Icon from '@/components/icons/Icon.vue'
import PublicSiteLayout from '@/components/public/PublicSiteLayout.vue'
import DocsCodeExamples from '@/components/docs/DocsCodeExamples.vue'
import { docsNavigation, docsOnThisPage } from '@/data/docsContent'

const { t } = useI18n()
const authStore = useAuthStore()
const navigationOpen = ref(false)
const activeSection = ref(window.location.hash.slice(1) || 'overview')
const baseUrl = `${window.location.origin}/v1`
const dashboardPath = computed(() => authStore.isAuthenticated ? (authStore.isAdmin ? '/admin/dashboard' : '/dashboard') : '/login')
const activeSectionIndex = computed(() => Math.max(0, docsOnThisPage.findIndex(item => sectionId(item.href) === activeSection.value)))
let sectionObserver: IntersectionObserver | null = null

function sectionId(href: string): string {
  return href.replace(/^#/, '')
}

function isActiveHref(href: string): boolean {
  return activeSection.value === sectionId(href)
}

function setActiveSection(href: string): void {
  activeSection.value = sectionId(href)
}

function syncActiveSectionFromHash(): void {
  if (window.location.hash) setActiveSection(window.location.hash)
}

onMounted(() => {
  window.addEventListener('hashchange', syncActiveSectionFromHash)
  if (typeof IntersectionObserver === 'undefined') return

  sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries.find(entry => entry.isIntersecting)
    if (visible?.target.id) activeSection.value = visible.target.id
  }, { rootMargin: '-15% 0px -70% 0px' })

  for (const item of docsOnThisPage) {
    const section = document.getElementById(item.id)
    if (section) sectionObserver.observe(section)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncActiveSectionFromHash)
  sectionObserver?.disconnect()
})
</script>

<style scoped>
.docs-page{min-height:100vh;background:#fafafa;color:#171717;scroll-behavior:smooth}.docs-shell{display:grid;grid-template-columns:210px minmax(0,820px) 170px;justify-content:center;gap:54px;width:min(100% - 48px,1392px);margin:0 auto;padding:58px 0 160px}.docs-nav,.on-this-page{align-self:start;position:sticky;top:94px}.docs-nav-toggle{display:none}.docs-nav nav{display:grid;gap:30px}.docs-nav nav>div{display:grid;gap:10px}.docs-nav strong,.on-this-page strong{margin-bottom:3px;color:#444;font-size:11px;font-weight:650;text-transform:uppercase;letter-spacing:.08em}.docs-nav a,.on-this-page a{color:#777;font-size:12px;line-height:1.45;text-decoration:none}.docs-nav a:hover,.on-this-page a:hover,.docs-nav a.is-active,.on-this-page a.is-active{color:#111}.on-this-page{display:grid;gap:11px;padding-left:20px;border-left:1px solid #ddd}.on-this-page-links{--docs-nav-step:29px;position:relative;display:grid;grid-auto-rows:18px;gap:11px}.docs-active-indicator{position:absolute;top:0;left:-10px;width:2px;height:18px;border-radius:999px;background:#171717;transform:translateY(calc(var(--active-index) * var(--docs-nav-step)));transition:transform var(--motion-fast) var(--ease-standard);will-change:transform}.docs-hero{padding:40px 0 70px;border-bottom:1px solid #ddd}.docs-hero>span{color:#666;font-size:12px;font-weight:620}.docs-hero h1{margin:22px 0 20px;font-size:clamp(54px,6vw,82px);font-weight:520;letter-spacing:-.065em;line-height:.98}.docs-hero p{max-width:680px;margin:0;color:#666;font-size:16px;line-height:1.7}.entry-grid{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid #ddd}.entry-grid>a{display:flex;min-height:245px;flex-direction:column;padding:26px 20px;border-right:1px solid #ddd;color:inherit;text-decoration:none}.entry-grid>a:last-child{border-right:0}.entry-grid>a>svg:first-child{margin-bottom:auto;color:#555}.entry-grid>a>svg:last-child{margin-top:20px}.entry-grid h2{margin:0 0 9px;font-size:17px}.entry-grid p{margin:0;color:#777;font-size:12px;line-height:1.6}.docs-section{padding:110px 0;border-bottom:1px solid #ddd}.section-index{display:block;margin-bottom:18px;color:#999;font-family:ui-monospace,monospace;font-size:11px}.docs-section>h2,.section-copy h2,.split-section h2{margin:0;font-size:clamp(42px,5vw,68px);font-weight:520;letter-spacing:-.055em;line-height:1}.docs-section>p,.section-copy p,.split-section>div>p{margin:20px 0 0;color:#777;line-height:1.7}.type-grid,.guide-grid{display:grid;grid-template-columns:repeat(3,1fr);margin-top:46px;border-top:1px solid #ddd;border-left:1px solid #ddd}.type-grid article,.guide-grid article{display:flex;min-height:310px;flex-direction:column;padding:25px;border-right:1px solid #ddd;border-bottom:1px solid #ddd;background:#fff}.type-grid svg,.guide-grid svg{margin-bottom:auto;color:#555}.type-grid h3,.guide-grid h3{margin:28px 0 10px;font-size:19px}.type-grid p,.guide-grid p{margin:0;color:#777;font-size:12px;line-height:1.65}.type-grid a{display:inline-flex;align-items:center;gap:7px;margin-top:22px;color:#222;font-size:11px;font-weight:620;text-decoration:none}.code-section{display:grid;gap:42px}.split-section{display:grid;grid-template-columns:1fr 1fr;gap:54px}.config-card{display:grid;align-content:start;gap:10px;border:1px solid #ddd;border-radius:14px;background:#fff;padding:24px}.config-card span{margin-top:12px;color:#777;font-size:11px}.config-card code{overflow-x:auto;border-radius:8px;background:#f2f2f2;padding:13px;font-size:11px}.error-list{border-top:1px solid #ddd}.error-list>div{display:grid;grid-template-columns:58px 1fr;gap:16px;padding:18px 0;border-bottom:1px solid #ddd}.error-list code{font-size:12px;font-weight:700}.error-list span{color:#666;font-size:12px;line-height:1.6}.resource-links{display:grid;grid-template-columns:1fr;gap:16px;margin-top:40px}.resource-links>a{display:flex;min-height:150px;align-items:flex-end;justify-content:space-between;gap:20px;border:1px solid #ddd;border-radius:14px;background:#fff;padding:23px;color:inherit;text-decoration:none}.resource-links strong{font-size:16px}.resource-links p{margin:8px 0 0;color:#777;font-size:12px;line-height:1.5}
@media(max-width:1080px){.docs-shell{grid-template-columns:190px minmax(0,1fr)}.on-this-page{display:none}}
@media(max-width:760px){.docs-shell{display:block;width:calc(100% - 32px);padding-top:24px}.docs-nav{position:sticky;top:74px;z-index:20;border:1px solid #ddd;border-radius:10px;background:#fff}.docs-nav-toggle{display:flex;width:100%;min-height:46px;align-items:center;justify-content:space-between;border:0;background:transparent;padding:0 14px;font:inherit;font-size:12px}.docs-nav nav{display:none;max-height:62vh;overflow:auto;padding:8px 16px 20px}.docs-nav-open nav{display:grid}.docs-hero{padding-top:64px}.entry-grid{grid-template-columns:1fr}.entry-grid>a{min-height:190px;border-right:0;border-bottom:1px solid #ddd}.type-grid,.guide-grid{grid-template-columns:1fr}.split-section{grid-template-columns:1fr}.resource-links{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.docs-page{scroll-behavior:auto}.docs-active-indicator{transition:none}}
</style>
