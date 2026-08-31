<template>
  <PublicSiteLayout>
    <main class="models-page">
      <section class="catalog-hero">
        <span class="eyebrow">{{ t('publicModels.eyebrow') }}</span>
        <h1>{{ t('publicModels.title') }}</h1>
        <p>{{ t('publicModels.description') }}</p>
        <div class="proof-row" aria-hidden="true">
          <span>{{ t('publicModels.proofModels') }}</span>
          <span>{{ t('publicModels.proofBilling') }}</span>
          <span>{{ t('publicModels.proofApi') }}</span>
        </div>
      </section>

      <section class="catalog-workspace" aria-labelledby="catalog-results-title">
        <div class="search-row">
          <label class="search-box">
            <Icon name="search" size="sm" />
            <input v-model="filters.query" type="search" :placeholder="t('publicModels.searchPlaceholder')" />
          </label>
          <button type="button" class="filter-toggle" :aria-expanded="filtersOpen" @click="filtersOpen = !filtersOpen">
            {{ filtersOpen ? t('publicModels.hideFilters') : t('publicModels.showFilters') }}
          </button>
        </div>

        <div v-if="fallbackMode" class="catalog-notice">{{ t('publicModels.fallbackNotice') }}</div>

        <div class="catalog-grid">
          <aside class="filter-rail" :class="{ 'filter-rail-open': filtersOpen }">
            <div class="filter-heading"><strong>{{ t('publicModels.filters') }}</strong><button type="button" @click="clearFilters">{{ t('publicModels.clear') }}</button></div>
            <fieldset>
              <legend>{{ t('publicModels.provider') }}</legend>
              <label><input v-model="filters.provider" type="radio" value="" />{{ t('publicModels.allProviders') }}</label>
              <label v-for="provider in providers" :key="provider"><input v-model="filters.provider" type="radio" :value="provider" />{{ provider }}</label>
            </fieldset>
            <fieldset>
              <legend>{{ t('publicModels.modelClass') }}</legend>
              <label><input v-model="filters.modelClass" type="radio" value="" />{{ t('publicModels.allClasses') }}</label>
              <label v-for="modelClass in modelClasses" :key="modelClass"><input v-model="filters.modelClass" type="radio" :value="modelClass" />{{ formatFilterLabel(modelClass) }}</label>
            </fieldset>
            <fieldset>
              <legend>{{ t('publicModels.endpoint') }}</legend>
              <label><input v-model="filters.endpoint" type="radio" value="" />{{ t('publicModels.allEndpoints') }}</label>
              <label v-for="endpoint in endpoints" :key="endpoint"><input v-model="filters.endpoint" type="radio" :value="endpoint" />{{ formatFilterLabel(endpoint) }}</label>
            </fieldset>
          </aside>

          <div class="catalog-results">
            <div class="results-toolbar">
              <div><h2 id="catalog-results-title">{{ t('publicModels.available', { count: filteredModels.length }) }}</h2><p>{{ t('publicModels.resultHint') }}</p></div>
              <label>{{ t('publicModels.sort') }}
                <select v-model="filters.sort">
                  <option value="featured">{{ t('publicModels.sortFeatured') }}</option>
                  <option value="name">{{ t('publicModels.sortName') }}</option>
                  <option value="input-price">{{ t('publicModels.sortInputPrice') }}</option>
                  <option value="output-price">{{ t('publicModels.sortOutputPrice') }}</option>
                </select>
              </label>
            </div>

            <div v-if="loading" class="model-card-grid" aria-busy="true">
              <div v-for="index in 6" :key="index" class="model-card model-card-skeleton"></div>
            </div>

            <div v-else-if="filteredModels.length" class="model-card-grid">
              <article v-for="model in filteredModels" :key="`${model.platform}:${model.modelId}`" class="model-card">
                <router-link :to="`/models/${model.slug}`" class="model-art model-card-link" :aria-label="`${t('publicModels.viewModel')} ${model.displayName}`"><img :src="model.artwork" alt="" loading="lazy" /><span v-if="model.featured">{{ model.featuredBadge || t('publicModels.featured') }}</span></router-link>
                <div class="model-card-body">
                  <div class="provider-line"><img :src="model.providerLogo" alt="" /><span>{{ model.provider }}</span><small>{{ model.modality }}</small></div>
                  <router-link :to="`/models/${model.slug}`" class="model-title-link"><h3>{{ model.displayName }}</h3><code>{{ model.modelId }}</code></router-link>
                  <p>{{ t(model.summaryKey) }}</p>
                  <div class="capability-row"><span v-for="capability in model.capabilities.slice(0, 3)" :key="capability">{{ capability }}</span></div>
                  <p v-if="model.isAlias && model.aliasNoteKey" class="alias-note">{{ t(model.aliasNoteKey) }}</p>
                  <div v-if="model.pricingSource" class="pricing-card">
                    <div class="pricing-card-heading">
                      <span>{{ t('publicModels.ownApiPrice') }}</span>
                      <small>{{ t('publicModels.officialListPrice') }}</small>
                    </div>
                    <div class="pricing-badge">{{ t('publicModels.officialSeventyPercent') }}</div>
                    <div v-if="model.pricingSource.longContext" class="context-toggle" :aria-label="`${model.displayName} ${t('publicModels.longContextThreshold', { count: model.pricingSource.longContext.thresholdTokens.toLocaleString('en-US') })}`">
                      <button type="button" :class="{ active: contextMode(model) === 'short' }" :aria-pressed="contextMode(model) === 'short'" @click="setContextMode(model, 'short')">{{ t('publicModels.shortContext') }}</button>
                      <button type="button" :class="{ active: contextMode(model) === 'long' }" :aria-pressed="contextMode(model) === 'long'" @click="setContextMode(model, 'long')">{{ t('publicModels.longContext') }}</button>
                    </div>
                    <div class="price-lines">
                      <div v-for="metric in pricingMetrics(model)" :key="metric.key" class="price-line" :aria-label="metric.ariaLabel">
                        <span>{{ metric.label }}</span>
                        <div>
                          <small>{{ t('publicModels.officialListPrice') }} <s>{{ metric.official }}</s></small>
                          <strong>{{ metric.ownApi }} <span class="price-unit">{{ metric.unit }}</span></strong>
                        </div>
                      </div>
                    </div>
                    <small class="pricing-checked">{{ t('publicModels.pricingCheckedAt', { date: model.pricingSource.checkedAt }) }}</small>
                  </div>
                  <div v-else class="pricing-card pricing-card-empty">{{ t('publicModels.notPublished') }}</div>
                  <router-link :to="`/models/${model.slug}`" class="model-card-footer"><strong>{{ t('publicModels.viewModel') }} <Icon name="arrowRight" size="xs" /></strong></router-link>
                </div>
              </article>

              <article class="growth-card"><span>+</span><h3>{{ t('publicModels.growthTitle') }}</h3><p>{{ t('publicModels.growthDescription') }}</p></article>
            </div>

            <div v-else class="empty-state"><h3>{{ t('publicModels.noResults') }}</h3><p>{{ t('publicModels.noResultsHint') }}</p><button type="button" @click="clearFilters">{{ t('publicModels.clear') }}</button></div>
          </div>
        </div>
      </section>
    </main>
  </PublicSiteLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import PublicSiteLayout from '@/components/public/PublicSiteLayout.vue'
import modelDisplayAPI from '@/api/modelDisplay'
import {
  buildModelCatalog,
  calculateOwnApiPricing,
  filterModelCatalog,
  formatCatalogPrice,
  type ModelCatalogEntry,
  type CatalogFilters,
  type OfficialTokenPricing,
} from '@/data/modelCatalog'

const { t } = useI18n()
const models = ref<ModelCatalogEntry[]>(buildModelCatalog())
const loading = ref(true)
const fallbackMode = ref(false)
const filtersOpen = ref(false)
const filters = reactive<CatalogFilters>({ query: '', provider: '', modelClass: '', endpoint: '', sort: 'featured' })
const contextModes = reactive<Record<string, 'short' | 'long'>>({})

const providers = computed(() => [...new Set(models.value.map((model) => model.provider))].sort())
const modelClasses = computed(() => [...new Set(models.value.flatMap((model) => model.modelClass))].sort())
const endpoints = computed(() => [...new Set(models.value.flatMap((model) => model.endpoints))].sort())
const filteredModels = computed(() => filterModelCatalog(models.value, filters))

onMounted(async () => {
  try {
    const config = await modelDisplayAPI.getModelDisplayConfig()
    models.value = buildModelCatalog(config)
    fallbackMode.value = !config.pricing_models?.length
  } catch {
    models.value = buildModelCatalog()
    fallbackMode.value = true
  } finally {
    loading.value = false
  }
})

function clearFilters() {
  filters.query = ''
  filters.provider = ''
  filters.modelClass = ''
  filters.endpoint = ''
  filters.sort = 'featured'
}

function contextMode(model: ModelCatalogEntry): 'short' | 'long' {
  return contextModes[contextKey(model)] ?? 'short'
}

function setContextMode(model: ModelCatalogEntry, mode: 'short' | 'long') {
  contextModes[contextKey(model)] = mode
}

function pricingMetrics(model: ModelCatalogEntry) {
  const official = activeOfficialPricing(model)
  const ownApi = model.pricingSource
    ? calculateOwnApiPricing(official, model.pricingSource.multiplier)
    : { input: null, cachedInput: null, output: null }

  return [
    priceMetric('input', t('publicModels.input'), official.input, ownApi.input),
    priceMetric('cachedInput', t('publicModels.cachedInput'), official.cachedInput, ownApi.cachedInput),
    priceMetric('output', t('publicModels.output'), official.output, ownApi.output),
  ]
}

function priceMetric(
  key: keyof OfficialTokenPricing,
  label: string,
  official: number | null,
  ownApi: number | null,
) {
  const unit = t('publicModels.perMillion')
  return {
    key,
    label,
    official: formatPriceValue(official),
    ownApi: formatPriceValue(ownApi),
    unit,
    ariaLabel: `${label}: ${t('publicModels.officialListPrice')} ${formatPriceValue(official)} ${unit}; ${t('publicModels.ownApiPrice')} ${formatPriceValue(ownApi)} ${unit}`,
  }
}

function activeOfficialPricing(model: ModelCatalogEntry): OfficialTokenPricing {
  if (contextMode(model) === 'long' && model.pricingSource?.longContext) {
    return model.pricingSource.longContext
  }
  return model.pricingSource?.official ?? { input: null, cachedInput: null, output: null }
}

function formatPriceValue(value: number | null): string {
  const formatted = formatCatalogPrice(value)
  return formatted == null ? t('publicModels.notPublished') : `$${formatted}`
}

function contextKey(model: ModelCatalogEntry): string {
  return `${model.platform}:${model.modelId}`
}

function formatFilterLabel(value: string): string {
  const labels: Record<string, string> = {
    anthropic: 'Anthropic',
    balanced: 'Balanced',
    coding: 'Coding',
    fast: 'Fast',
    flagship: 'Flagship',
    openai: 'OpenAI',
    reasoning: 'Reasoning',
  }
  return labels[value] ?? value
}
</script>

<style scoped>
.models-page{min-height:100vh;background:#fafafa;color:#171717}.catalog-hero{display:flex;min-height:530px;flex-direction:column;align-items:center;justify-content:center;width:min(100% - 48px,1120px);margin:0 auto;padding:90px 0 64px;text-align:center}.eyebrow{margin-bottom:22px;color:#666;font-size:13px;font-weight:620}.catalog-hero h1{max-width:900px;margin:0;font-size:clamp(56px,7vw,98px);font-weight:520;letter-spacing:-.065em;line-height:.98}.catalog-hero>p{max-width:690px;margin:26px 0 0;color:#666;font-size:17px;line-height:1.65}.proof-row{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:36px}.proof-row span{border:1px solid #dedede;border-radius:999px;background:#fff;padding:7px 11px;color:#555;font-size:11px}.catalog-workspace{width:min(100% - 48px,1392px);margin:0 auto;padding-bottom:160px}.search-row{display:flex;gap:12px;margin-bottom:20px}.search-box{display:flex;min-height:54px;flex:1;align-items:center;gap:12px;border:1px solid #dcdcdc;border-radius:12px;background:#fff;padding:0 17px;color:#777}.search-box:focus-within{border-color:#999;box-shadow:0 0 0 3px rgba(0,0,0,.05)}.search-box input{width:100%;border:0;outline:0;background:transparent;font:inherit;font-size:15px}.filter-toggle{display:none;border:1px solid #dcdcdc;border-radius:10px;background:#fff;padding:0 16px;font:inherit}.catalog-notice{margin-bottom:20px;border:1px solid #e7dfc8;border-radius:10px;background:#fffdf5;padding:12px 15px;color:#725d27;font-size:12px}.catalog-grid{display:grid;grid-template-columns:230px minmax(0,1fr);gap:42px}.filter-rail{align-self:start;position:sticky;top:90px}.filter-heading{display:flex;align-items:center;justify-content:space-between;padding-bottom:18px;border-bottom:1px solid #dedede}.filter-heading strong{font-size:14px}.filter-heading button{border:0;background:transparent;color:#777;font:inherit;font-size:11px;cursor:pointer}.filter-rail fieldset{display:grid;gap:10px;margin:0;padding:24px 0;border:0;border-bottom:1px solid #dedede}.filter-rail legend{margin-bottom:14px;font-size:12px;font-weight:650}.filter-rail label{display:flex;align-items:center;gap:9px;color:#555;font-size:13px;cursor:pointer}.filter-rail input{accent-color:#171717}.results-toolbar{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:24px}.results-toolbar h2{margin:0;font-size:21px;font-weight:590;letter-spacing:-.03em}.results-toolbar p{margin:7px 0 0;color:#777;font-size:12px}.results-toolbar label{display:flex;align-items:center;gap:10px;color:#666;font-size:12px}.results-toolbar select{min-height:38px;border:1px solid #ddd;border-radius:9px;background:#fff;padding:0 34px 0 11px;color:#222;font:inherit}.model-card-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.model-card{overflow:hidden;border:1px solid #dedede;border-radius:16px;background:#fff;color:inherit;text-decoration:none;transition:transform 180ms ease,border-color 180ms ease,box-shadow 180ms ease}.model-card:hover{transform:translateY(-3px);border-color:#bdbdbd;box-shadow:0 18px 40px rgba(0,0,0,.07)}.model-art{position:relative;aspect-ratio:16/9;overflow:hidden;background:#eee}.model-art>img{width:100%;height:100%;object-fit:cover;transition:transform 300ms ease}.model-card:hover .model-art>img{transform:scale(1.025)}.model-art>span{position:absolute;top:14px;left:14px;border:1px solid rgba(255,255,255,.55);border-radius:999px;background:rgba(20,20,20,.72);padding:6px 9px;color:#fff;font-size:10px;backdrop-filter:blur(8px)}.model-card-body{padding:20px}.provider-line{display:flex;align-items:center;gap:8px;color:#555;font-size:11px}.provider-line img{width:18px;height:18px;object-fit:contain}.provider-line small{margin-left:auto;border-radius:999px;background:#f1f1f1;padding:4px 7px;color:#777}.model-card h3{margin:20px 0 7px;font-size:24px;font-weight:590;letter-spacing:-.045em}.model-card code{color:#777;font-size:11px}.model-card p{min-height:66px;margin:18px 0;color:#666;font-size:13px;line-height:1.65}.capability-row{display:flex;min-height:50px;align-content:flex-start;flex-wrap:wrap;gap:6px}.capability-row span{height:fit-content;border:1px solid #e5e5e5;border-radius:999px;padding:5px 8px;color:#555;font-size:10px}.model-card-footer{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-top:20px;padding-top:17px;border-top:1px solid #ececec}.model-card-footer>span{max-width:145px;color:#666;font-size:11px;line-height:1.4}.model-card-footer strong{display:inline-flex;align-items:center;gap:6px;font-size:11px}.growth-card{display:flex;min-height:460px;flex-direction:column;justify-content:flex-end;border:1px dashed #cfcfcf;border-radius:16px;padding:26px;color:#666}.growth-card>span{margin-bottom:auto;font-size:44px;font-weight:200}.growth-card h3{margin:0 0 10px;color:#222;font-size:20px;font-weight:550}.growth-card p{margin:0;font-size:13px;line-height:1.65}.model-card-skeleton{min-height:450px;background:linear-gradient(100deg,#f2f2f2 30%,#fafafa 45%,#f2f2f2 60%);background-size:200% 100%;animation:shimmer 1.4s infinite}.empty-state{display:flex;min-height:420px;flex-direction:column;align-items:center;justify-content:center;border:1px dashed #d5d5d5;border-radius:16px;text-align:center}.empty-state h3{margin:0;font-size:24px}.empty-state p{margin:12px 0 24px;color:#777}.empty-state button{border:1px solid #222;border-radius:9px;background:#222;padding:10px 14px;color:#fff;font:inherit;cursor:pointer}@keyframes shimmer{to{background-position:-200% 0}}
.model-card-link,.model-title-link,.model-card-footer{color:inherit;text-decoration:none}.model-card-link,.model-title-link{display:block}.model-title-link{width:fit-content}.model-card .alias-note{min-height:0;margin:12px 0 0;border-left:2px solid #d7d7d7;padding-left:10px;color:#666;font-size:11px;line-height:1.5}.pricing-card{display:grid;gap:12px;margin-top:18px;border-top:1px solid #ececec;padding-top:17px}.pricing-card-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}.pricing-card-heading>span{color:#222;font-size:12px;font-weight:650}.pricing-card-heading small,.pricing-checked{color:#777;font-size:10px}.pricing-badge{width:fit-content;border:1px solid #d7d7d7;border-radius:999px;background:#f7f7f7;padding:5px 8px;color:#333;font-size:10px;font-weight:650}.context-toggle{display:grid;grid-template-columns:1fr 1fr;overflow:hidden;border:1px solid #dedede;border-radius:9px;background:#fafafa}.context-toggle button{min-height:30px;border:0;background:transparent;color:#666;font:inherit;font-size:11px;cursor:pointer}.context-toggle button.active{background:#171717;color:#fff}.price-lines{display:grid;gap:8px}.price-line{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.price-line>span{color:#555;font-size:11px}.price-line>div{display:grid;justify-items:end;gap:2px;text-align:right}.price-line small{color:#777;font-size:10px;line-height:1.3}.price-line s{color:#999;text-decoration-color:#999}.price-line strong{color:#111;font-size:15px;font-weight:650;line-height:1.1}.price-unit{color:#777;font-size:10px;font-weight:500;white-space:nowrap}.pricing-card-empty{color:#666;font-size:12px;line-height:1.5}.model-card-footer{align-items:center;justify-content:flex-end;margin-top:16px;padding-top:16px}
@media(max-width:1100px){.model-card-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){.catalog-hero{min-height:460px;width:calc(100% - 32px);padding-top:64px}.catalog-hero h1{font-size:clamp(48px,14vw,68px)}.catalog-hero>p{font-size:15px}.catalog-workspace{width:calc(100% - 32px)}.filter-toggle{display:block}.catalog-grid{grid-template-columns:1fr;gap:24px}.filter-rail{display:none;position:static}.filter-rail-open{display:block}.results-toolbar{align-items:flex-start;flex-direction:column}.model-card-grid{grid-template-columns:1fr}.model-card p{min-height:0}.growth-card{min-height:320px}}
@media(prefers-reduced-motion:reduce){.model-card,.model-art>img,.model-card-skeleton{animation:none!important;transition:none!important}}
</style>
