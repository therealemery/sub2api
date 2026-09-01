<template>
  <div v-if="homeContent" class="min-h-screen">
    <iframe v-if="isHomeContentUrl" :src="homeContent.trim()" class="h-screen w-full border-0" allowfullscreen></iframe>
    <div v-else v-html="homeContent"></div>
  </div>

  <PublicSiteLayout v-else>
    <div class="landing-page" :class="{ 'is-reduced-motion': reducedMotion, 'is-hero-animating': heroShouldAnimate }">
      <main>
      <section class="announcement-bar" :aria-label="t('home.announcement.label')">
        <span>{{ t('home.announcement.text') }}</span>
        <router-link to="/models">{{ t('home.announcement.action') }} <Icon name="arrowRight" size="xs" /></router-link>
      </section>

      <section class="hero-section">
        <div class="hero-copy">
          <span class="eyebrow hero-motion-item" :class="{ 'is-revealed': heroIsSettled }" data-motion-layer="eyebrow" style="--hero-delay: 0ms">{{ t('home.heroEyebrow') }}</span>
          <h1 class="hero-motion-item" :class="{ 'is-revealed': heroIsSettled }" data-motion-layer="title" style="--hero-delay: 60ms"><span>{{ siteName }}</span><span>{{ t('home.heroSubtitle') }}</span></h1>
          <div class="hero-actions hero-motion-item" :class="{ 'is-revealed': heroIsSettled }" data-motion-layer="actions" style="--hero-delay: 120ms">
            <router-link :to="primaryActionPath" class="primary-button">
              {{ isAuthenticated ? t('home.goToDashboard') : t('home.getApiKey') }}
            </router-link>
            <router-link to="/models" class="secondary-button">{{ t('home.viewPricing') }}</router-link>
          </div>
        </div>
        <div class="gateway-visual hero-motion-item" :class="{ 'is-revealed': heroIsSettled }" data-motion-layer="gateway" style="--hero-delay: 180ms" aria-hidden="true">
          <div class="gateway-provider gateway-provider-openai gateway-provider-tile" style="--hero-delay: 180ms"><img src="/brand/openai.svg" alt="" /></div>
          <div class="gateway-provider gateway-provider-claude gateway-provider-tile" style="--hero-delay: 220ms"><img src="/brand/claude.svg" alt="" /></div>
          <div class="gateway-center gateway-center-tile" style="--hero-delay: 180ms"><img :src="siteLogoPath" alt="" /></div>
          <div class="gateway-provider gateway-provider-gemini gateway-provider-tile" style="--hero-delay: 260ms"><img src="/brand/gemini.svg" alt="" /></div>
          <div class="gateway-provider gateway-provider-deepseek gateway-provider-tile" style="--hero-delay: 300ms"><img src="/brand/deepseek.svg" alt="" /></div>
        </div>
        <ul class="hero-outcomes">
          <li v-for="signal in heroSignals" :key="signal.titleKey">
            <strong>{{ t(signal.titleKey) }}</strong><span>{{ t(signal.descriptionKey) }}</span>
          </li>
        </ul>
      </section>

      <section ref="providerRevealTarget" class="provider-strip reveal-item" :class="{ 'is-revealed': providerRevealed }" data-motion-section="providers" :aria-label="t('home.providers.title')">
        <div v-for="provider in allProviders" :key="provider.provider" class="provider-wordmark">
          <img :src="provider.logo" alt="" /><span>{{ provider.label }}</span>
        </div>
      </section>

      <section ref="gatewayStoryRevealTarget" class="story-section story-section-code reveal-item" :class="{ 'is-revealed': gatewayStoryRevealed }" data-motion-section="gateway-story">
        <div class="story-heading"><span class="section-index">01</span><h2>{{ t('home.stories.gatewayTitle') }}</h2></div>
        <div class="story-stage story-stage-code">
          <div class="code-panel">
            <div class="code-panel-header">
              <div><span>{{ t('home.code.label') }}</span><strong>{{ t('home.code.title') }}</strong></div>
              <button type="button" :aria-label="t('home.code.copyAria')" @click="copyCodeExample">
                <Icon :name="copiedCode ? 'check' : 'copy'" size="sm" />
                {{ copiedCode ? t('home.code.copied') : t('home.code.copy') }}
              </button>
            </div>
            <pre><code>{{ codeExample }}</code></pre>
          </div>
          <div class="story-proof">
            <p>{{ t('home.stories.gatewayProof') }}</p>
            <ul>
              <li>{{ t('home.trust.longTermTitle') }}</li><li>{{ t('home.features.unifiedGateway') }}</li>
              <li>{{ t('home.trust.modelQualityTitle') }}</li><li>{{ t('home.features.balanceQuota') }}</li>
            </ul>
            <a :href="usageGuideUrl" target="_blank" rel="noopener noreferrer" class="text-link">
              {{ t('home.trust.docsAction') }} <Icon name="arrowRight" size="xs" />
            </a>
          </div>
        </div>
      </section>

      <section ref="scaleStoryRevealTarget" class="story-section reveal-item" :class="{ 'is-revealed': scaleStoryRevealed }" data-motion-section="scale-story">
        <div class="story-heading story-heading-right"><span class="section-index">02</span><h2>{{ t('home.stories.scaleTitle') }}</h2></div>
        <div class="story-stage route-stage">
          <div class="route-console">
            <div class="route-console-header">
              <span>{{ t('home.stories.routeConsole') }}</span>
            </div>
            <ol>
              <li v-for="(step, index) in integrationSteps" :key="step.titleKey">
                <span class="route-step-number">0{{ index + 1 }}</span>
                <div><strong>{{ t(step.titleKey) }}</strong><p>{{ t(step.descriptionKey) }}</p></div>
                <Icon name="check" size="sm" />
              </li>
            </ol>
          </div>
          <div class="story-proof">
            <p>{{ t('home.stories.scaleProof') }}</p>
            <ul>
              <li>{{ t('home.features.multiAccount') }}</li><li>{{ t('home.integration.steps.usageTitle') }}</li>
              <li>{{ t('home.trust.transparentTitle') }}</li><li>{{ t('home.status') }}</li>
            </ul>
          </div>
        </div>
      </section>

      <section ref="teamsStoryRevealTarget" class="story-section reveal-item" :class="{ 'is-revealed': teamsStoryRevealed }" data-motion-section="teams-story">
        <div class="story-heading"><span class="section-index">03</span><h2>{{ t('home.stories.teamsTitle') }}</h2></div>
        <div class="audience-stage">
          <article v-for="audience in audiences" :key="audience.titleKey">
            <Icon :name="audience.icon" size="lg" /><strong>{{ t(audience.titleKey) }}</strong><p>{{ t(audience.descriptionKey) }}</p>
          </article>
          <aside>
            <span>{{ t('home.business.kicker') }}</span><strong>{{ t('home.business.titleAccent') }}</strong>
            <p>{{ t('home.business.description', { siteName }) }}</p>
            <button type="button" class="text-link" @click="copyContactEmail">
              {{ copiedContactEmail ? t('home.business.emailCopied') : t('home.business.contactSales') }}
              <Icon :name="copiedContactEmail ? 'check' : 'arrowRight'" size="xs" />
            </button>
          </aside>
        </div>
      </section>

      <section ref="capabilitiesRevealTarget" class="capabilities-section reveal-item" :class="{ 'is-revealed': capabilitiesRevealed }" data-motion-section="capabilities">
        <div class="section-title-row"><h2>{{ t('home.capabilities.title') }}</h2><p>{{ t('home.capabilities.description') }}</p></div>
        <div class="capability-grid">
          <component
            :is="card.to ? 'router-link' : 'article'"
            v-for="card in capabilityCards"
            :key="card.titleKey"
            v-bind="card.to ? { to: card.to } : {}"
            class="capability-card"
          >
            <div class="capability-card-visual">
              <img v-if="card.logo" :src="card.logo" alt="" />
              <Icon v-else :name="card.icon || 'sparkles'" size="xl" />
            </div>
            <div><strong>{{ t(card.titleKey) }}</strong><p>{{ t(card.descriptionKey) }}</p></div>
          </component>
        </div>
      </section>

      <section ref="faqRevealTarget" class="faq-section reveal-item" :class="{ 'is-revealed': faqRevealed }" data-motion-section="faq" :aria-labelledby="'faq-title'">
        <div class="section-title-row">
          <div><span class="eyebrow">{{ t('home.faq.kicker') }}</span><h2 id="faq-title">{{ t('home.faq.title') }}</h2></div>
          <p>{{ t('home.faq.description') }}</p>
        </div>
        <div class="faq-list">
          <details v-for="item in faqItems" :key="item.questionKey">
            <summary>{{ t(item.questionKey) }} <Icon name="plus" size="sm" /></summary>
            <div class="faq-answer"><div><p>{{ t(item.answerKey) }}</p></div></div>
          </details>
        </div>
      </section>

      <section ref="agentRevealTarget" class="agent-section reveal-item" :class="{ 'is-revealed': agentRevealed }" data-motion-section="agent" :aria-label="t('home.recruitment.ariaLabel')">
        <div><span class="eyebrow">{{ t('home.recruitment.kicker') }}</span><h2>{{ t('home.recruitment.title') }}</h2><p>{{ t('home.recruitment.description', { siteName }) }}</p></div>
        <div class="agent-metric">
          <strong>{{ t('home.recruitment.commission') }}</strong><span>{{ t('home.recruitment.commissionLabel') }}</span>
          <router-link to="/agent-recruitment" class="text-link">{{ t('home.recruitment.learnMore') }} <Icon name="arrowRight" size="xs" /></router-link>
        </div>
      </section>

      <section ref="finalCtaRevealTarget" class="final-cta-section reveal-item" :class="{ 'is-revealed': finalCtaRevealed }" data-motion-section="final-cta">
        <span class="eyebrow">{{ siteName }}</span><h2>{{ t('home.cta.title') }}</h2><p>{{ t('home.cta.description') }}</p>
        <div class="hero-actions">
          <router-link :to="primaryActionPath" class="primary-button">{{ isAuthenticated ? t('home.goToDashboard') : t('home.cta.button') }}</router-link>
          <router-link to="/models" class="secondary-button">{{ t('home.viewPricing') }}</router-link>
          <a :href="`mailto:${contactEmail}`" class="secondary-button">{{ t('home.cta.enterprise') }}</a>
        </div>
      </section>
      </main>
    </div>
  </PublicSiteLayout>
</template>

<script lang="ts">
// In-memory only: a full reload starts a new page session and allows one replay.
let hasPlayedDefaultHomeHero = false
</script>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore, useAppStore } from '@/stores'
import Icon from '@/components/icons/Icon.vue'
import PublicSiteLayout from '@/components/public/PublicSiteLayout.vue'
import { buildHomeCodeExample } from '@/utils/homeCodeExample'
import { DEFAULT_SITE_LOGO, resolveSiteLogoPath, resolveSiteName } from '@/constants/branding'
import { useInViewReveal } from '@/composables/useInViewReveal'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { getCatalogProviderSummaries } from '@/data/modelCatalog'

const { t } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()
const copiedContactEmail = ref(false)
const copiedCode = ref(false)
const reducedMotion = useReducedMotion()
const { target: providerRevealTarget, revealed: providerRevealed } = useInViewReveal({ rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
const { target: gatewayStoryRevealTarget, revealed: gatewayStoryRevealed } = useInViewReveal({ rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
const { target: scaleStoryRevealTarget, revealed: scaleStoryRevealed } = useInViewReveal({ rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
const { target: teamsStoryRevealTarget, revealed: teamsStoryRevealed } = useInViewReveal({ rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
const { target: capabilitiesRevealTarget, revealed: capabilitiesRevealed } = useInViewReveal({ rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
const { target: faqRevealTarget, revealed: faqRevealed } = useInViewReveal({ rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
const { target: agentRevealTarget, revealed: agentRevealed } = useInViewReveal({ rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
const { target: finalCtaRevealTarget, revealed: finalCtaRevealed } = useInViewReveal({ rootMargin: '0px 0px -8% 0px', threshold: 0.12 })

const siteName = computed(() => {
  const configuredName = (appStore.cachedPublicSettings?.site_name || appStore.siteName || '').trim()
  return resolveSiteName(configuredName)
})
const siteLogo = computed(() => resolveSiteLogoPath(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || DEFAULT_SITE_LOGO))
const siteLogoPath = computed(() => siteLogo.value)
const homeContent = computed(() => appStore.cachedPublicSettings?.home_content || '')
const heroShouldAnimate = ref(false)
const heroIsSettled = computed(() => reducedMotion.value || !heroShouldAnimate.value)

watch(reducedMotion, (reduced) => {
  if (reduced) heroShouldAnimate.value = false
}, { flush: 'sync' })

onMounted(() => {
  if (homeContent.value) return

  heroShouldAnimate.value = !reducedMotion.value && !hasPlayedDefaultHomeHero
  hasPlayedDefaultHomeHero = true
})

const usageGuideUrl = '/docs/ownapi-usage-guide.html'
const fallbackContactEmail = 'support@ownapi.dev'
const codeExample = computed(() => buildHomeCodeExample(window.location.origin))
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
async function writeClipboard(value: string) {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value)
    else copyTextFallback(value)
  } catch { copyTextFallback(value) }
}
async function copyContactEmail() {
  await writeClipboard(contactEmail.value)
  copiedContactEmail.value = true
  window.setTimeout(() => { copiedContactEmail.value = false }, 1600)
}
async function copyCodeExample() {
  await writeClipboard(codeExample.value)
  copiedCode.value = true
  window.setTimeout(() => { copiedCode.value = false }, 1600)
}

const isHomeContentUrl = computed(() => {
  const content = homeContent.value.trim()
  return content.startsWith('http://') || content.startsWith('https://')
})
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.isAdmin)
const dashboardPath = computed(() => isAdmin.value ? '/admin/dashboard' : '/dashboard')
const primaryActionPath = computed(() => isAuthenticated.value ? dashboardPath.value : '/login')

const heroSignals = [
  { titleKey: 'home.heroSignals.compatible', descriptionKey: 'home.trust.longTermDescription' },
  { titleKey: 'home.heroSignals.billing', descriptionKey: 'home.trust.transparentDescription' },
  { titleKey: 'home.heroSignals.models', descriptionKey: 'home.trust.modelQualityDescription' }
] as const
const allProviders = getCatalogProviderSummaries()
const integrationSteps = [
  { titleKey: 'home.integration.steps.accountTitle', descriptionKey: 'home.integration.steps.accountDescription' },
  { titleKey: 'home.integration.steps.keyTitle', descriptionKey: 'home.integration.steps.keyDescription' },
  { titleKey: 'home.integration.steps.urlTitle', descriptionKey: 'home.integration.steps.urlDescription' },
  { titleKey: 'home.integration.steps.usageTitle', descriptionKey: 'home.integration.steps.usageDescription' }
] as const
const audiences = [
  { icon: 'terminal', titleKey: 'home.audiences.developerTitle', descriptionKey: 'home.audiences.developerDescription' },
  { icon: 'users', titleKey: 'home.audiences.teamTitle', descriptionKey: 'home.audiences.teamDescription' },
  { icon: 'server', titleKey: 'home.audiences.providerTitle', descriptionKey: 'home.audiences.providerDescription' }
] as const
type CapabilityCard = {
  logo?: string
  icon?: 'terminal' | 'chartBar' | 'shield' | 'users'
  titleKey: string
  descriptionKey: string
  to?: string
}

const capabilityCards: readonly CapabilityCard[] = [
  { logo: '/brand/openai.svg', titleKey: 'home.capabilities.chatgptTitle', descriptionKey: 'home.providers.chatgptDescription', to: '/models' },
  { logo: '/brand/claude.svg', titleKey: 'home.capabilities.claudeTitle', descriptionKey: 'home.providers.claudeDescription', to: '/models' },
  { icon: 'terminal', titleKey: 'home.capabilities.gatewayTitle', descriptionKey: 'home.capabilities.gatewayDescription', to: '/docs/ownapi-usage-guide.html' },
  { icon: 'chartBar', titleKey: 'home.capabilities.usageTitle', descriptionKey: 'home.capabilities.usageDescription', to: '/key-usage' },
  { icon: 'shield', titleKey: 'home.capabilities.statusTitle', descriptionKey: 'home.capabilities.statusDescription' },
  { icon: 'users', titleKey: 'home.capabilities.businessTitle', descriptionKey: 'home.capabilities.businessDescription' }
]
const faqItems = [
  { questionKey: 'home.faq.protocolQuestion', answerKey: 'home.faq.protocolAnswer' },
  { questionKey: 'home.faq.billingQuestion', answerKey: 'home.faq.billingAnswer' },
  { questionKey: 'home.faq.balanceQuestion', answerKey: 'home.faq.balanceAnswer' },
  { questionKey: 'home.faq.modelQuestion', answerKey: 'home.faq.modelAnswer' },
  { questionKey: 'home.faq.failedQuestion', answerKey: 'home.faq.failedAnswer' },
  { questionKey: 'home.faq.dataQuestion', answerKey: 'home.faq.dataAnswer' },
  { questionKey: 'home.faq.supportQuestion', answerKey: 'home.faq.supportAnswer' }
] as const
</script>

<style scoped>
.landing-page{--page:#fafafa;--surface:#fff;--ink:#171717;--muted:#666;--soft:#8f8f8f;--line:#e5e5e5;min-height:100vh;overflow-x:hidden;background:var(--page);color:var(--ink);font-family:GeistSans,Geist,Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.landing-page,.landing-page *,.landing-page *::before,.landing-page *::after{box-sizing:border-box}.landing-page a{color:inherit;text-decoration:none}.landing-page button{font:inherit}
.landing-header{position:sticky;top:0;z-index:40;border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--page) 92%,transparent);backdrop-filter:blur(16px)}
.landing-nav{display:grid;grid-template-columns:minmax(180px,1fr) auto minmax(300px,1fr);align-items:center;gap:28px;width:min(100% - 48px,1392px);height:64px;margin:0 auto}
.brand-mark{display:inline-flex;align-items:center;gap:10px;width:fit-content}.brand-logo{width:26px;height:26px;object-fit:contain;mix-blend-mode:multiply}.brand-name{font-size:16px;font-weight:650;letter-spacing:-.02em}
.desktop-nav,.desktop-actions,.hero-actions,.text-link{display:flex;align-items:center}.desktop-nav{justify-content:center;gap:28px;color:#444;font-size:14px}.desktop-nav a,.footer-column a{transition:color 160ms ease}.desktop-nav a:hover,.footer-column a:hover{color:#000}.desktop-actions{justify-content:flex-end;gap:10px}
.nav-primary,.nav-secondary,.primary-button,.secondary-button{display:inline-flex;min-height:40px;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:9px;padding:0 16px;font-size:14px;font-weight:560;transition:background 160ms ease,border-color 160ms ease,color 160ms ease}.nav-primary,.primary-button{border-color:var(--ink);background:var(--ink);color:#fff!important}.nav-secondary,.secondary-button{background:var(--surface);color:var(--ink)}.nav-primary:hover,.primary-button:hover{background:#333}.nav-secondary:hover,.secondary-button:hover{border-color:#b8b8b8;background:#f6f6f6}.mobile-menu-button,.mobile-menu{display:none}
.announcement-bar{display:flex;min-height:104px;align-items:center;justify-content:center;gap:34px;padding:24px;font-size:14px}.announcement-bar a{display:inline-flex;align-items:center;gap:8px;font-weight:600}
.landing-page.is-hero-animating .hero-motion-item{animation:hero-enter 380ms var(--ease-enter) both;animation-delay:var(--hero-delay,0ms)}.landing-page.is-hero-animating .gateway-visual.hero-motion-item{animation-name:hero-fade-in;animation-duration:320ms}.landing-page.is-hero-animating .gateway-provider-tile,.landing-page.is-hero-animating .gateway-center-tile{animation:gateway-tile-enter 280ms var(--ease-enter) both;animation-delay:var(--hero-delay,180ms)}
@keyframes hero-enter{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes hero-fade-in{from{opacity:0}to{opacity:1}}@keyframes gateway-tile-enter{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
.hero-section{display:grid;grid-template-columns:minmax(0,1fr) minmax(330px,.9fr) minmax(0,1fr);align-items:center;min-height:700px;width:min(100% - 48px,1392px);margin:0 auto;padding:72px 0 48px}.hero-copy{align-self:center}.eyebrow{display:inline-block;margin-bottom:22px;color:var(--muted);font-size:13px;font-weight:560}
.hero-copy h1,.story-heading h2,.section-title-row h2,.agent-section h2,.final-cta-section h2{margin:0;font-weight:500;letter-spacing:-.06em;line-height:.98}.hero-copy h1{display:flex;flex-direction:column;max-width:470px;font-size:clamp(54px,5.1vw,80px)}.hero-actions{gap:10px;margin-top:34px;flex-wrap:wrap}.primary-button,.secondary-button{min-height:46px;border-radius:999px;padding:0 22px;font-size:15px}
.gateway-visual{display:grid;grid-template-columns:repeat(3,74px);grid-template-rows:repeat(3,74px);justify-content:center;align-content:center;min-height:420px;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:74px 74px;background-position:center;mask-image:radial-gradient(circle,#000 25%,transparent 72%)}
.gateway-center,.gateway-provider{display:flex;align-items:center;justify-content:center;width:56px;height:56px;align-self:center;justify-self:center;border:1px solid var(--line);border-radius:14px;background:var(--surface)}.gateway-center{grid-column:2;grid-row:2;width:68px;height:68px;border-color:var(--ink);box-shadow:0 12px 32px rgba(0,0,0,.08)}.gateway-provider img{width:28px;height:28px;object-fit:contain}.gateway-center img{width:38px;height:38px;object-fit:contain;mix-blend-mode:multiply}.gateway-provider-openai{grid-column:1;grid-row:1}.gateway-provider-claude{grid-column:3;grid-row:1}.gateway-provider-gemini{grid-column:1;grid-row:3}.gateway-provider-deepseek{grid-column:3;grid-row:3}
.hero-outcomes{display:grid;gap:22px;margin:0;padding:0 0 0 64px;list-style:none}.hero-outcomes li{display:grid;gap:7px}.hero-outcomes strong{font-size:17px;font-weight:560}.hero-outcomes span{max-width:310px;color:var(--muted);font-size:14px;line-height:1.55}
.provider-strip{display:grid;grid-template-columns:repeat(8,1fr);width:min(100% - 48px,1392px);margin:0 auto;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.provider-wordmark{display:flex;min-height:116px;align-items:center;justify-content:center;gap:10px;border-right:1px solid var(--line);transition:background-color var(--motion-fast) var(--ease-standard),transform var(--motion-fast) var(--ease-standard)}.provider-wordmark:hover{z-index:1;background:#fff;transform:translateY(-3px)}.provider-wordmark:last-child{border-right:0}.provider-wordmark img{width:26px;height:26px;object-fit:contain;filter:grayscale(1);transition:transform var(--motion-fast) var(--ease-standard)}.provider-wordmark:hover img{transform:scale(1.04)}.provider-wordmark span{font-size:16px;font-weight:620}
.story-section,.capabilities-section,.faq-section,.agent-section,.final-cta-section,.landing-footer{width:min(100% - 48px,1392px);margin:0 auto}.story-section{padding-top:180px}.story-heading{display:grid;grid-template-columns:72px minmax(0,920px);align-items:start}.story-heading-right{grid-template-columns:minmax(120px,1fr) minmax(0,920px)}.story-heading-right .section-index{grid-column:1}.story-heading-right h2{grid-column:2}.section-index{padding-top:12px;color:var(--soft);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}.story-heading h2{font-size:clamp(52px,6vw,92px)}
.story-stage{display:grid;grid-template-columns:minmax(0,2fr) minmax(280px,1fr);margin-top:60px;border:1px solid var(--line);background:var(--surface)}.story-stage-code{min-height:610px}.code-panel{min-width:0;padding:clamp(24px,4vw,64px);border-right:1px solid var(--line);background:#0d0d0d;color:#ededed}.code-panel-header{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:44px}.code-panel-header>div{display:grid;gap:6px}.code-panel-header span{color:#888;font-size:12px}.code-panel-header strong{font-size:15px;font-weight:560}.code-panel-header button{display:inline-flex;align-items:center;gap:8px;border:1px solid #343434;border-radius:8px;background:#1a1a1a;padding:9px 12px;color:#ddd;cursor:pointer}.code-panel pre{margin:0;overflow-x:auto}.code-panel code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:clamp(12px,1.1vw,15px);line-height:1.8;white-space:pre}
.story-proof{display:flex;flex-direction:column;justify-content:flex-end;padding:clamp(30px,4vw,56px)}.story-proof>p{margin:0 0 38px;font-size:clamp(22px,2.5vw,36px);letter-spacing:-.04em;line-height:1.15}.story-proof ul{display:grid;gap:12px;margin:0 0 36px;padding:0;color:var(--muted);font-size:14px;list-style:none}.text-link{width:fit-content;gap:8px;border:0;background:transparent;padding:0;color:var(--ink);font-size:14px;font-weight:620;cursor:pointer}.text-link:hover{text-decoration:underline;text-underline-offset:4px}
.route-stage{min-height:640px}.route-console{display:flex;flex-direction:column;justify-content:center;min-width:0;padding:clamp(24px,5vw,76px);border-right:1px solid var(--line)}.route-console-header{display:flex;align-items:center;justify-content:space-between;padding-bottom:24px;border-bottom:1px solid var(--line);font-size:13px;font-weight:620}.route-console ol{margin:0;padding:0;list-style:none}.route-console li{display:grid;grid-template-columns:42px 1fr auto;align-items:center;gap:18px;padding:26px 0;border-bottom:1px solid var(--line)}.route-console li:last-child{border-bottom:0}.route-step-number{color:var(--soft);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}.route-console li div{display:grid;gap:5px}.route-console strong{font-size:15px;font-weight:620}.route-console p{margin:0;color:var(--muted);font-size:13px;line-height:1.5}
.audience-stage{display:grid;grid-template-columns:repeat(3,1fr) 1.25fr;margin-top:60px;border:1px solid var(--line);background:var(--surface)}.audience-stage article,.audience-stage aside{display:flex;min-height:360px;flex-direction:column;justify-content:flex-end;padding:34px;border-right:1px solid var(--line)}.audience-stage>:last-child{border-right:0}.audience-stage svg{margin-bottom:auto;color:#444}.audience-stage strong{margin-bottom:12px;font-size:19px;font-weight:590}.audience-stage p{margin:0;color:var(--muted);font-size:14px;line-height:1.6}.audience-stage aside{background:#171717;color:#fff}.audience-stage aside>span{margin-bottom:auto;color:#888;font-size:12px}.audience-stage aside p{margin-bottom:24px;color:#aaa}.audience-stage aside .text-link{color:#fff}
.capabilities-section{padding-top:180px}.section-title-row{display:flex;align-items:flex-end;justify-content:space-between;gap:40px;margin-bottom:56px}.section-title-row h2{max-width:820px;font-size:clamp(48px,6vw,86px)}.section-title-row>p{max-width:360px;margin:0;color:var(--muted);font-size:15px;line-height:1.6}.capability-grid{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line);border-left:1px solid var(--line)}.capability-card{display:flex;min-height:320px;flex-direction:column;justify-content:space-between;padding:32px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--surface);transition:background-color var(--motion-fast) var(--ease-standard),transform var(--motion-fast) var(--ease-standard)}.capability-card:hover{background:#f5f5f5;transform:translateY(-2px)}.capability-card-visual img,.capability-card-visual svg{transition:transform var(--motion-fast) var(--ease-standard)}.capability-card:hover .capability-card-visual img,.capability-card:hover .capability-card-visual svg{transform:scale(1.04)}.capability-card-visual{display:flex;height:148px;align-items:center;justify-content:center}.capability-card-visual img{width:54px;height:54px;object-fit:contain;filter:grayscale(1)}.capability-card-visual svg{color:#333}.capability-card strong{display:block;margin-bottom:8px;font-size:20px;font-weight:590}.capability-card p{margin:0;color:var(--muted);font-size:14px;line-height:1.55}
.faq-section{padding-top:180px}.faq-section .section-title-row{align-items:flex-start}.faq-list{border-top:1px solid var(--line)}.faq-list details{border-bottom:1px solid var(--line)}.faq-list summary{display:flex;min-height:76px;align-items:center;justify-content:space-between;gap:20px;cursor:pointer;font-size:17px;font-weight:550;list-style:none}.faq-list summary::-webkit-details-marker{display:none}.faq-list details[open] summary svg{transform:rotate(45deg)}.faq-list summary svg{transition:transform var(--motion-fast) var(--ease-standard)}.faq-list details>.faq-answer{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows var(--motion-base) var(--ease-standard),opacity var(--motion-fast) var(--ease-standard)}.faq-list details[open]>.faq-answer{grid-template-rows:1fr;opacity:1}.faq-answer>div{overflow:hidden}.faq-list details p{max-width:780px;margin:-8px 0 30px;color:var(--muted);font-size:14px;line-height:1.7}
.agent-section{display:grid;grid-template-columns:2fr 1fr;margin-top:180px;border:1px solid var(--line);background:var(--surface)}.agent-section>div{min-height:360px;padding:clamp(32px,5vw,68px)}.agent-section>div:first-child{border-right:1px solid var(--line)}.agent-section h2{max-width:780px;font-size:clamp(42px,5vw,72px)}.agent-section p{max-width:760px;margin:28px 0 0;color:var(--muted);line-height:1.7}.agent-metric{display:flex;flex-direction:column;justify-content:flex-end}.agent-metric>strong{font-size:clamp(48px,5vw,76px);font-weight:500;letter-spacing:-.06em}.agent-metric>span{margin:6px 0 36px;color:var(--muted);font-size:13px}
.final-cta-section{display:flex;min-height:660px;flex-direction:column;align-items:center;justify-content:center;padding:100px 24px;text-align:center}.final-cta-section h2{max-width:900px;font-size:clamp(54px,7vw,100px)}.final-cta-section p{max-width:600px;margin:26px 0 0;color:var(--muted);font-size:16px;line-height:1.65}.final-cta-section .hero-actions{justify-content:center}
.landing-footer{display:grid;grid-template-columns:1.2fr 2fr;gap:80px;padding:64px 0 24px;border-top:1px solid var(--line)}.footer-brand p{max-width:360px;margin:20px 0 0;color:var(--muted);font-size:13px;line-height:1.65}.footer-directory{display:grid;grid-template-columns:repeat(3,1fr);gap:30px}.footer-column{display:grid;align-content:start;gap:12px;font-size:13px}.footer-column strong{margin-bottom:4px;font-weight:620}.footer-column a{color:var(--muted)}.footer-bottom{display:flex;grid-column:1/-1;align-items:center;justify-content:space-between;margin-top:50px;padding-top:22px;border-top:1px solid var(--line)}.footer-bottom p{margin:0;color:var(--soft);font-size:12px}
@media(max-width:1100px){.landing-nav{grid-template-columns:1fr auto}.desktop-nav{display:none}.hero-section{grid-template-columns:1fr 320px}.hero-outcomes{grid-column:1/-1;grid-template-columns:repeat(3,1fr);padding:20px 0 0}.provider-strip{grid-template-columns:repeat(4,1fr)}.provider-wordmark:nth-child(4){border-right:0}.provider-wordmark:nth-child(-n+4){border-bottom:1px solid var(--line)}.audience-stage{grid-template-columns:repeat(2,1fr)}.audience-stage>:nth-child(2){border-right:0}.audience-stage>:nth-child(-n+2){border-bottom:1px solid var(--line)}.capability-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:767px){.landing-nav{width:calc(100% - 32px);height:64px}.brand-name,.desktop-actions{display:none}.mobile-menu-button{display:inline-flex;width:42px;height:42px;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink)}.mobile-menu{display:flex;position:fixed;inset:65px 0 0;z-index:39;flex-direction:column;justify-content:space-between;overflow-y:auto;background:var(--page);padding:26px 24px 34px}.mobile-menu-links{display:grid}.mobile-menu-links a{display:flex;min-height:52px;align-items:center;border-bottom:1px solid var(--line);font-size:20px}.mobile-menu-actions{display:grid;gap:10px}.mobile-menu-actions .primary-button,.mobile-menu-actions .secondary-button{width:100%;border-radius:9px}.announcement-bar{min-height:112px;flex-direction:column;gap:10px;padding:18px;text-align:center}.hero-section{display:flex;min-height:620px;width:calc(100% - 32px);flex-direction:column;justify-content:center;padding:26px 0 24px;text-align:center}.hero-copy{display:contents}.hero-copy .eyebrow{display:none}.hero-copy h1{order:3;align-items:center;font-size:clamp(42px,12vw,52px)}.gateway-visual{order:2;min-height:210px;transform:scale(.74);margin:-22px 0}.hero-outcomes{order:4;display:block;padding:0}.hero-outcomes li{display:none}.hero-outcomes li:first-child{display:grid}.hero-outcomes li:first-child span{display:none}.hero-copy .hero-actions{order:5;display:grid;width:100%;margin-top:24px}.hero-copy .primary-button,.hero-copy .secondary-button{width:100%}.provider-strip{display:flex;width:100%;overflow-x:auto;border-left:0;border-right:0;scrollbar-width:none}.provider-strip::-webkit-scrollbar{display:none}.provider-wordmark{min-width:170px;min-height:100px;border-bottom:0!important}.story-section,.capabilities-section,.faq-section,.agent-section,.final-cta-section,.landing-footer{width:calc(100% - 32px)}.story-section,.capabilities-section,.faq-section{padding-top:112px}.story-heading,.story-heading-right{display:block}.story-heading .section-index{display:block;margin-bottom:18px;padding:0}.story-heading h2,.story-heading-right h2{font-size:clamp(43px,13vw,60px)}.story-stage{display:flex;flex-direction:column;margin-top:38px}.story-stage-code,.route-stage{min-height:0}.code-panel,.route-console{border-right:0;border-bottom:1px solid var(--line)}.code-panel{padding:24px 20px 34px}.code-panel-header{align-items:flex-start;margin-bottom:30px}.code-panel-header button{padding:8px;font-size:0}.code-panel code{font-size:11px}.story-proof{min-height:360px;padding:28px 24px}.route-console{padding:12px 24px}.route-console li{grid-template-columns:30px 1fr auto;gap:10px;padding:22px 0}.audience-stage{grid-template-columns:1fr;margin-top:38px}.audience-stage article,.audience-stage aside{min-height:300px;border-right:0;border-bottom:1px solid var(--line)}.audience-stage>:last-child{border-bottom:0}.section-title-row{display:block;margin-bottom:38px}.section-title-row h2{font-size:clamp(43px,13vw,60px)}.section-title-row>p{margin-top:24px}.capability-grid{grid-template-columns:1fr}.capability-card{min-height:280px}.faq-list summary{font-size:15px}.agent-section{grid-template-columns:1fr;margin-top:112px}.agent-section>div{min-height:320px}.agent-section>div:first-child{border-right:0;border-bottom:1px solid var(--line)}.final-cta-section{min-height:600px}.final-cta-section h2{font-size:clamp(48px,15vw,68px)}.final-cta-section .hero-actions{display:grid;width:100%}.landing-footer{grid-template-columns:1fr;gap:54px}.footer-directory{grid-template-columns:repeat(2,1fr)}.footer-bottom{align-items:flex-start;flex-direction:column;gap:18px}}
@media(prefers-reduced-motion:reduce){.landing-page *,.landing-page *::before,.landing-page *::after{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important}.hero-motion-item,.gateway-provider-tile,.gateway-center-tile{opacity:1!important;transform:none!important;animation:none!important}.provider-wordmark:hover,.provider-wordmark:hover img,.capability-card:hover,.capability-card:hover .capability-card-visual img,.capability-card:hover .capability-card-visual svg{transform:none!important}.faq-list details>.faq-answer{transition:none}}
</style>
