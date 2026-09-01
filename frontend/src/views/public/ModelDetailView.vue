<template>
  <PublicSiteLayout>
    <main class="detail-page">
      <div v-if="loading" class="detail-loading" aria-busy="true"></div>

      <template v-else-if="model">
        <section class="detail-hero">
          <router-link to="/models" class="back-link"><Icon name="arrowLeft" size="xs" />{{ t('publicModels.backToModels') }}</router-link>
          <div class="detail-hero-grid">
            <div class="detail-identity">
              <div class="provider-line"><img :src="model.providerLogo" alt="" /><span>{{ model.provider }}</span><small v-if="model.featured">{{ model.featuredBadge || t('publicModels.featured') }}</small></div>
              <h1>{{ model.displayName }}</h1>
              <p>{{ t(model.descriptionKey) }}</p>
              <div class="detail-actions">
                <router-link :to="primaryActionPath" class="primary-action">{{ isAuthenticated ? t('publicModels.createKey') : t('publicModels.getStarted') }}</router-link>
                <button type="button" class="copy-model-button" aria-live="polite" @click="copyModelId">
                  <Transition name="motion-fade" mode="out-in">
                    <span :key="modelCopied ? 'copied' : 'copy'" class="copy-model-feedback"><Icon :name="modelCopied ? 'check' : 'copy'" size="sm" />{{ modelCopied ? t('publicModels.modelCopied') : t('publicModels.copyModel') }}</span>
                  </Transition>
                </button>
              </div>
            </div>
            <div class="detail-art"><img :src="model.artwork" alt="" /></div>
          </div>
        </section>

        <section class="detail-overview">
          <div class="metadata-grid">
            <article><span>{{ t('publicModels.modelId') }}</span><code>{{ model.modelId }}</code></article>
            <article><span>{{ t('publicModels.context') }}</span><strong>{{ model.contextWindow || '—' }}</strong></article>
            <article><span>{{ t('publicModels.modality') }}</span><strong>{{ model.modality }}</strong></article>
          </div>

          <div class="detail-content-grid">
            <div>
              <section class="capability-section">
                <span class="section-label">{{ t('publicModels.capability') }}</span>
                <div class="capability-list"><span v-for="capability in model.capabilities" :key="capability">{{ capability }}</span></div>
              </section>
              <ModelCodeExamples :model-id="model.modelId" />
            </div>

            <aside class="pricing-panel">
              <span class="section-label">{{ t('publicModels.pricing') }}</span>
              <template v-if="detailPricingSource">
                <p v-if="model.isAlias && model.aliasNoteKey" class="alias-note">{{ t(model.aliasNoteKey) }}</p>
                <div class="pricing-source">
                  <span>{{ t('publicModels.pricingCheckedAt', { date: detailPricingSource.checkedAt }) }}</span>
                  <a :href="detailPricingSourceUrl" target="_blank" rel="noopener noreferrer">{{ t('publicModels.viewOfficialPricing') }}</a>
                </div>
                <div class="pricing-tier">
                  <div class="pricing-tier-heading">
                    <strong>{{ t('publicModels.shortContext') }}</strong>
                    <span>{{ t('publicModels.officialSeventyPercent') }}</span>
                  </div>
                  <Transition name="motion-fade" mode="out-in">
                    <div :key="pricingTierKey(model, 'short', detailPricingSource.official)" class="pricing-tier-values">
                      <table>
                        <thead>
                          <tr>
                            <th scope="col">{{ t('publicModels.priceType') }}</th>
                            <th scope="col">{{ t('publicModels.officialListPrice') }}</th>
                            <th scope="col">{{ t('publicModels.ownApiPrice') }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="row in pricingRows(detailPricingSource.official, detailPricingSource.multiplier)" :key="row.key">
                            <th scope="row">{{ row.label }}</th>
                            <td>{{ row.official }}</td>
                            <td>{{ row.ownApi }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Transition>
                </div>
                <div v-if="detailPricingSource.longContext" class="pricing-tier">
                  <div class="pricing-tier-heading">
                    <strong>{{ t('publicModels.longContext') }}</strong>
                    <span>{{ t('publicModels.longContextThreshold', { count: detailPricingSource.longContext.thresholdTokens.toLocaleString('en-US') }) }}</span>
                  </div>
                  <Transition name="motion-fade" mode="out-in">
                    <div :key="pricingTierKey(model, 'long', detailPricingSource.longContext)" class="pricing-tier-values">
                      <table>
                        <thead>
                          <tr>
                            <th scope="col">{{ t('publicModels.priceType') }}</th>
                            <th scope="col">{{ t('publicModels.officialListPrice') }}</th>
                            <th scope="col">{{ t('publicModels.ownApiPrice') }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="row in pricingRows(detailPricingSource.longContext, detailPricingSource.multiplier)" :key="row.key">
                            <th scope="row">{{ row.label }}</th>
                            <td>{{ row.official }}</td>
                            <td>{{ row.ownApi }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Transition>
                </div>
                <ul v-if="pricingNotes.length" class="pricing-notes">
                  <li v-for="note in pricingNotes" :key="note">{{ note }}</li>
                </ul>
              </template>
              <template v-else-if="model.price">
                <div v-if="model.price.input != null" class="price-row"><span>{{ t('publicModels.input') }}</span><strong>${{ formatPrice(model.price.input) }}</strong><small>{{ t('publicModels.perMillion') }}</small></div>
                <div v-if="model.price.output != null" class="price-row"><span>{{ t('publicModels.output') }}</span><strong>${{ formatPrice(model.price.output) }}</strong><small>{{ t('publicModels.perMillion') }}</small></div>
                <div v-if="model.price.cacheRead != null" class="price-row"><span>{{ t('publicModels.cacheRead') }}</span><strong>${{ formatPrice(model.price.cacheRead) }}</strong><small>{{ t('publicModels.perMillion') }}</small></div>
                <div v-if="model.price.perRequest != null" class="price-row"><span>{{ t('publicModels.request') }}</span><strong>${{ formatPrice(model.price.perRequest) }}</strong><small>{{ t('publicModels.perRequest') }}</small></div>
              </template>
              <p v-else>{{ t('publicModels.priceUnavailable') }}</p>
            </aside>
          </div>
        </section>

        <section v-if="related.length" class="related-section">
          <div class="related-heading"><h2>{{ t('publicModels.related') }}</h2><router-link to="/models">{{ t('publicModels.backToModels') }} <Icon name="arrowRight" size="xs" /></router-link></div>
          <div class="related-grid">
            <router-link v-for="item in related" :key="item.modelId" :to="`/models/${item.slug}`">
              <img :src="item.artwork" alt="" /><div><span>{{ item.provider }}</span><h3>{{ item.displayName }}</h3><code>{{ item.modelId }}</code></div>
            </router-link>
          </div>
        </section>
      </template>

      <section v-else class="not-found">
        <span>404</span><h1>{{ t('publicModels.notFoundTitle') }}</h1><p>{{ t('publicModels.notFoundDescription') }}</p><router-link to="/models">{{ t('publicModels.backToModels') }}</router-link>
      </section>
    </main>
  </PublicSiteLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores'
import Icon from '@/components/icons/Icon.vue'
import PublicSiteLayout from '@/components/public/PublicSiteLayout.vue'
import ModelCodeExamples from '@/components/models/ModelCodeExamples.vue'
import modelDisplayAPI from '@/api/modelDisplay'
import {
  buildModelCatalog,
  calculateOwnApiPricing,
  findCatalogModel,
  formatCatalogPrice,
  relatedCatalogModels,
  type ModelCatalogEntry,
  type ModelPricingSource,
  type OfficialTokenPricing,
} from '@/data/modelCatalog'

const { t } = useI18n()
const route = useRoute()
const authStore = useAuthStore()
const entries = ref<ModelCatalogEntry[]>(buildModelCatalog())
const loading = ref(true)
const modelCopied = ref(false)
let modelCopyResetTimer: number | undefined

const model = computed(() => findCatalogModel(entries.value, String(route.params.modelId || '')))
const related = computed(() => model.value ? relatedCatalogModels(entries.value, model.value) : [])
const isAuthenticated = computed(() => authStore.isAuthenticated)
const primaryActionPath = computed(() => isAuthenticated.value ? '/keys' : '/register')
const detailPricingEntry = computed(() => model.value ? pricingSourceEntryFor(model.value) : undefined)
const detailPricingSource = computed(() => detailPricingEntry.value?.pricingSource ?? null)
const detailPricingSourceUrl = computed(() => detailPricingSource.value?.sourceUrl ?? '#')
const pricingNotes = computed(() => {
  if (!model.value) return []
  const notes: string[] = []
  if (model.value.provider === 'OpenAI') {
    if (['gpt-5.4', 'gpt-5.5', 'codex-auto-review'].includes(model.value.modelId)) {
      notes.push(t('publicModels.pricingNotes.openAiLongContext'))
    }
    notes.push(t('publicModels.pricingNotes.openAiRegional'))
  }
  if (model.value.provider === 'Anthropic') {
    notes.push(t('publicModels.pricingNotes.anthropicCacheWrite'))
    notes.push(t('publicModels.pricingNotes.anthropicDataResidency'))
  }
  return notes
})

onMounted(loadCatalog)
onBeforeUnmount(() => window.clearTimeout(modelCopyResetTimer))
watch(() => route.params.modelId, () => { window.scrollTo({ top: 0, behavior: 'smooth' }) })

async function loadCatalog() {
  try {
    entries.value = buildModelCatalog(await modelDisplayAPI.getModelDisplayConfig())
  } catch {
    entries.value = buildModelCatalog()
  } finally {
    loading.value = false
  }
}

async function copyModelId() {
  if (!model.value) return
  await navigator.clipboard.writeText(model.value.modelId)
  modelCopied.value = true
  window.clearTimeout(modelCopyResetTimer)
  modelCopyResetTimer = window.setTimeout(() => { modelCopied.value = false }, 1500)
}

function formatPrice(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 6 })
}

function pricingSourceEntryFor(entry: ModelCatalogEntry): ModelCatalogEntry {
  if (entry.modelId === 'codex-auto-review') {
    return entries.value.find((item) => item.modelId === 'gpt-5.4') ?? entry
  }
  return entry
}

function pricingRows(pricing: OfficialTokenPricing, multiplier: ModelPricingSource['multiplier']) {
  const ownApi = calculateOwnApiPricing(pricing, multiplier)
  return [
    priceRow('input', t('publicModels.input'), pricing.input, ownApi.input),
    priceRow('cachedInput', t('publicModels.cachedInput'), pricing.cachedInput, ownApi.cachedInput),
    priceRow('output', t('publicModels.output'), pricing.output, ownApi.output),
  ]
}

function pricingTierKey(entry: ModelCatalogEntry, tier: 'short' | 'long', pricing: OfficialTokenPricing): string {
  return [entry.platform, entry.modelId, tier, pricing.input, pricing.cachedInput, pricing.output].join(':')
}

function priceRow(key: string, label: string, official: number | null, ownApi: number | null) {
  return {
    key,
    label,
    official: formatTokenPrice(official),
    ownApi: formatTokenPrice(ownApi),
  }
}

function formatTokenPrice(value: number | null): string {
  const formatted = formatCatalogPrice(value)
  return formatted == null ? t('publicModels.notPublished') : `$${formatted} ${t('publicModels.usdPerMillion')}`
}
</script>

<style scoped>
.detail-page{min-height:100vh;background:#fafafa;color:#171717}.detail-loading{min-height:800px;background:linear-gradient(100deg,#f2f2f2 30%,#fafafa 45%,#f2f2f2 60%);background-size:200% 100%;animation:shimmer 1.4s infinite}.detail-hero{width:min(100% - 48px,1392px);margin:0 auto;padding:48px 0 70px}.back-link{display:inline-flex;align-items:center;gap:8px;color:#666;font-size:12px;text-decoration:none}.detail-hero-grid{display:grid;grid-template-columns:1fr 1.05fr;align-items:center;gap:70px;margin-top:58px}.provider-line{display:flex;align-items:center;gap:10px;color:#555;font-size:13px}.provider-line img{width:25px;height:25px;object-fit:contain}.provider-line small{border:1px solid #ddd;border-radius:999px;padding:5px 8px;font-size:10px}.detail-identity h1{max-width:640px;margin:28px 0 22px;font-size:clamp(58px,7vw,102px);font-weight:520;letter-spacing:-.07em;line-height:.94}.detail-identity>p{max-width:630px;margin:0;color:#666;font-size:16px;line-height:1.7}.detail-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:34px}.primary-action,.detail-actions button{display:inline-flex;min-height:46px;align-items:center;justify-content:center;gap:8px;border:1px solid #171717;border-radius:999px;padding:0 19px;font:inherit;font-size:13px;text-decoration:none;cursor:pointer}.primary-action{background:#171717;color:#fff}.detail-actions button{background:#fff;color:#171717}.copy-model-button{min-inline-size:154px}.copy-model-feedback{display:inline-flex;align-items:center;gap:8px}.detail-art{aspect-ratio:16/11;overflow:hidden;border:1px solid #ddd;border-radius:20px;background:#eee}.detail-art img{width:100%;height:100%;object-fit:cover}.detail-overview{width:min(100% - 48px,1392px);margin:0 auto;padding:0 0 160px}.metadata-grid{display:grid;grid-template-columns:2fr 1fr 1fr;border-top:1px solid #ddd;border-bottom:1px solid #ddd}.metadata-grid article{display:grid;gap:10px;min-height:128px;align-content:center;padding:24px;border-right:1px solid #ddd}.metadata-grid article:last-child{border-right:0}.metadata-grid span,.section-label{color:#777;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em}.metadata-grid code{font-size:14px}.metadata-grid strong{font-size:18px;font-weight:570}.detail-content-grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(260px,.72fr);gap:42px;padding-top:70px}.detail-content-grid>div{display:grid;gap:48px}.capability-section{display:grid;gap:20px}.capability-list{display:flex;flex-wrap:wrap;gap:8px}.capability-list span{border:1px solid #ddd;border-radius:999px;background:#fff;padding:9px 12px;font-size:12px}.pricing-panel{align-self:start;position:sticky;top:94px;border:1px solid #ddd;border-radius:15px;background:#fff;padding:24px}.pricing-panel>.section-label{display:block;margin-bottom:20px}.pricing-panel>p{margin:0;color:#777;font-size:13px}.pricing-panel .alias-note{margin:0 0 18px;border-left:2px solid #d7d7d7;padding-left:11px;color:#666;font-size:12px;line-height:1.5}.pricing-source{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px;color:#777;font-size:11px;line-height:1.4}.pricing-source a{color:#171717;text-align:right;text-decoration:none}.pricing-source a:hover{text-decoration:underline}.pricing-tier{display:grid;gap:12px;padding:18px 0;border-top:1px solid #e8e8e8}.pricing-tier:last-child{padding-bottom:0}.pricing-tier-heading{display:grid;gap:4px}.pricing-tier-heading strong{font-size:14px;font-weight:650}.pricing-tier-heading span{color:#777;font-size:11px;line-height:1.4}.pricing-tier table{width:100%;border-collapse:collapse;font-size:11px;line-height:1.4}.pricing-tier th,.pricing-tier td{border-top:1px solid #efefef;padding:10px 0;text-align:right;vertical-align:top}.pricing-tier thead th{color:#777;font-weight:600}.pricing-tier th:first-child,.pricing-tier td:first-child{text-align:left}.pricing-tier tbody th{color:#555;font-weight:500}.pricing-tier tbody td:last-child{color:#111;font-weight:650}.price-row{display:grid;grid-template-columns:1fr auto;gap:5px;padding:17px 0;border-top:1px solid #e8e8e8}.price-row span{color:#555;font-size:12px}.price-row strong{font-size:17px;font-weight:600}.price-row small{grid-column:1/-1;color:#888;font-size:10px}.related-section{width:min(100% - 48px,1392px);margin:0 auto;padding-bottom:160px}.related-heading{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:30px}.related-heading h2{margin:0;font-size:42px;font-weight:540;letter-spacing:-.05em}.related-heading a{display:inline-flex;align-items:center;gap:7px;color:#333;font-size:12px;text-decoration:none}.related-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.related-grid>a{overflow:hidden;border:1px solid #ddd;border-radius:14px;background:#fff;color:inherit;text-decoration:none}.related-grid img{width:100%;aspect-ratio:16/8;object-fit:cover}.related-grid>a>div{padding:18px}.related-grid span{color:#777;font-size:11px}.related-grid h3{margin:8px 0 5px;font-size:20px}.related-grid code{color:#777;font-size:10px}.not-found{display:flex;min-height:720px;flex-direction:column;align-items:center;justify-content:center;padding:80px 24px;text-align:center}.not-found>span{color:#aaa;font-family:ui-monospace,monospace;font-size:13px}.not-found h1{margin:18px 0 12px;font-size:clamp(48px,8vw,86px);font-weight:520;letter-spacing:-.06em}.not-found p{max-width:520px;margin:0;color:#777}.not-found a{margin-top:28px;border-radius:999px;background:#171717;padding:12px 17px;color:#fff;text-decoration:none}@keyframes shimmer{to{background-position:-200% 0}}
.pricing-notes{display:grid;gap:8px;margin:0;padding:18px 0 0 18px;border-top:1px solid #e8e8e8;color:#777;font-size:11px;line-height:1.5}
@media(max-width:800px){.detail-hero,.detail-overview,.related-section{width:calc(100% - 32px)}.detail-hero-grid{grid-template-columns:1fr;gap:42px;margin-top:40px}.detail-art{grid-row:1}.detail-identity h1{font-size:clamp(52px,15vw,76px)}.metadata-grid{grid-template-columns:1fr}.metadata-grid article{min-height:96px;border-right:0;border-bottom:1px solid #ddd}.metadata-grid article:last-child{border-bottom:0}.detail-content-grid{grid-template-columns:1fr}.pricing-panel{position:static;grid-row:1}.related-grid{grid-template-columns:1fr}.related-heading{align-items:flex-start;flex-direction:column;gap:18px}}
@media(prefers-reduced-motion:reduce){.detail-loading{animation:none}.detail-page *{scroll-behavior:auto!important}}
</style>
