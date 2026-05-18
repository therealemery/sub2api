<template>
  <div class="model-pricing-page">
    <section class="model-pricing-summary" aria-label="Model pricing summary">
      <div class="summary-card summary-card-primary">
        <span class="summary-icon"><Icon name="cpu" size="md" /></span>
        <div>
          <p>{{ t('modelPricing.metrics.models') }}</p>
          <strong>{{ filteredRows.length }}</strong>
        </div>
      </div>
      <div class="summary-card">
        <span class="summary-icon"><Icon name="server" size="md" /></span>
        <div>
          <p>{{ t('modelPricing.metrics.platforms') }}</p>
          <strong>{{ platformOptions.length }}</strong>
        </div>
      </div>
      <div class="summary-card">
        <span class="summary-icon"><Icon name="dollar" size="md" /></span>
        <div>
          <p>{{ t('modelPricing.metrics.compared') }}</p>
          <strong>{{ comparableRows }}</strong>
        </div>
      </div>
    </section>

    <div class="model-pricing-toolbar">
      <div class="relative w-full sm:max-w-sm">
        <Icon
          name="search"
          size="md"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('modelPricing.searchPlaceholder')"
          class="input pl-10"
        />
      </div>

      <div class="toolbar-actions">
        <select v-model="selectedPlatform" class="input platform-select">
          <option value="">{{ t('modelPricing.filters.allPlatforms') }}</option>
          <option v-for="platform in platformOptions" :key="platform" :value="platform">
            {{ platformLabel(platform) }}
          </option>
        </select>
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="loading"
          :title="t('common.refresh', 'Refresh')"
          @click="loadChannels"
        >
          <Icon name="refresh" size="md" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <section v-if="featuredRows.length > 0" class="featured-models">
      <div class="featured-heading">
        <Icon name="sparkles" size="md" />
        <span>{{ t('modelPricing.featured.title') }}</span>
      </div>
      <div class="featured-grid">
        <article v-for="row in featuredRows" :key="`featured-${row.id}`" class="featured-model-card">
          <span class="platform-mark" :class="platformBadgeClass(row.platform)">
            <PlatformIcon :platform="row.platform as GroupPlatform" size="xs" />
            {{ platformLabel(row.platform) }}
          </span>
          <strong>{{ row.model }}</strong>
          <span>{{ featuredBadge(row) || t('modelPricing.featured.defaultBadge') }}</span>
          <PriceStack :pricing="row.currentPricing" />
        </article>
      </div>
    </section>

    <section class="card model-pricing-table-card">
      <div v-if="loading" class="pricing-state">
        <Icon name="refresh" size="lg" class="animate-spin" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="filteredRows.length === 0" class="pricing-state">
        <Icon name="infoCircle" size="lg" />
        <span>{{ t('modelPricing.empty') }}</span>
      </div>

      <div v-else class="model-pricing-table-wrapper">
        <table class="model-pricing-table">
          <thead>
            <tr>
              <th>{{ t('modelPricing.columns.model') }}</th>
              <th>{{ t('modelPricing.columns.currentPrice') }}</th>
              <th>{{ t('modelPricing.columns.officialPrice') }}</th>
              <th>{{ t('modelPricing.columns.savings') }}</th>
              <th>{{ t('modelPricing.columns.access') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in displayRows"
              :key="row.id"
              class="data-table-row"
              :class="{ 'featured-row': isFeatured(row) }"
            >
              <td>
                <div class="model-cell">
                  <span class="platform-mark" :class="platformBadgeClass(row.platform)">
                    <PlatformIcon :platform="row.platform as GroupPlatform" size="xs" />
                    {{ platformLabel(row.platform) }}
                  </span>
                  <strong>
                    {{ row.model }}
                    <span v-if="isFeatured(row)" class="featured-inline">
                      {{ featuredBadge(row) || t('modelPricing.featured.defaultBadge') }}
                    </span>
                  </strong>
                  <span class="model-source">{{ row.official?.sourceLabel || t('modelPricing.unknownOfficial') }}</span>
                </div>
              </td>
              <td>
                <PriceStack :pricing="row.currentPricing" />
              </td>
              <td>
                <PriceStack v-if="row.official" :pricing="row.official.pricing" />
                <span v-else class="muted-text">{{ t('modelPricing.officialPending') }}</span>
              </td>
              <td>
                <div class="savings-stack">
                  <SavingsPill :value="row.inputDiscount" :label="t('modelPricing.price.input')" />
                  <SavingsPill :value="row.outputDiscount" :label="t('modelPricing.price.output')" />
                </div>
              </td>
              <td>
                <div class="access-cell">
                  <span class="multiplier-pill">{{ t('modelPricing.configuredSource') }}</span>
                  <span class="muted-text">{{ t('modelPricing.configuredSourceHint') }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <p class="pricing-footnote">
      {{ t('modelPricing.footnote') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import PlatformIcon from '@/components/common/PlatformIcon.vue'
import modelDisplayAPI, {
  type FeaturedModelConfig,
  type ModelDisplayConfig,
  type ModelDisplayPricingConfig,
} from '@/api/modelDisplay'
import { BILLING_MODE_IMAGE, BILLING_MODE_PER_REQUEST, BILLING_MODE_TOKEN } from '@/constants/channel'
import type { GroupPlatform } from '@/types'
import { useAppStore } from '@/stores/app'
import { extractApiErrorMessage } from '@/utils/apiError'
import { formatScaled } from '@/utils/pricing'
import { platformBadgeClass, platformLabel } from '@/utils/platformColors'
import { MILLION, officialPricingFor, type ReferencePriceShape } from '@/utils/modelPricingReference'

interface ModelPricingRow {
  id: string
  model: string
  platform: string
  currentPricing: ModelDisplayPricingConfig
  official: { sourceLabel: string; pricing: ReferencePriceShape } | null
  inputDiscount: number | null
  outputDiscount: number | null
}

const { t } = useI18n()
const appStore = useAppStore()

const displayConfig = ref<ModelDisplayConfig>(emptyDisplayConfig())
const loading = ref(false)
const searchQuery = ref('')
const selectedPlatform = ref('')

const rows = computed<ModelPricingRow[]>(() =>
  displayConfig.value.pricing_models.map(configPricingToRow).sort((a, b) => {
    const platformCompare = platformLabel(a.platform).localeCompare(platformLabel(b.platform))
    if (platformCompare !== 0) return platformCompare
    return a.model.localeCompare(b.model)
  }),
)

const platformOptions = computed(() => unique(rows.value.map((row) => row.platform)).sort())

const filteredRows = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    const matchesPlatform = !selectedPlatform.value || row.platform === selectedPlatform.value
    const matchesSearch =
      !q ||
      row.model.toLowerCase().includes(q) ||
      platformLabel(row.platform).toLowerCase().includes(q)
    return matchesPlatform && matchesSearch
  })
})

const displayRows = computed(() => {
  return [...filteredRows.value].sort((a, b) => {
    const aFeatured = featuredConfig(a)
    const bFeatured = featuredConfig(b)
    if (aFeatured && bFeatured) return aFeatured.sort_order - bFeatured.sort_order
    if (aFeatured) return -1
    if (bFeatured) return 1
    return 0
  })
})

const featuredRows = computed(() => {
  return displayConfig.value.featured_models
    .map((item) => rows.value.find((row) => matchesFeatured(row, item)))
    .filter((row): row is ModelPricingRow => Boolean(row))
})

const comparableRows = computed(() => rows.value.filter((row) => row.official !== null).length)

async function loadChannels() {
  loading.value = true
  try {
    displayConfig.value = withDisplayDefaults(await modelDisplayAPI.getModelDisplayConfig())
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('common.error')))
  } finally {
    loading.value = false
  }
}

function featuredConfig(row: ModelPricingRow): FeaturedModelConfig | null {
  return displayConfig.value.featured_models.find((item) => matchesFeatured(row, item)) || null
}

function featuredBadge(row: ModelPricingRow): string {
  return featuredConfig(row)?.badge || ''
}

function isFeatured(row: ModelPricingRow): boolean {
  return featuredConfig(row) !== null
}

function matchesFeatured(row: ModelPricingRow, item: FeaturedModelConfig): boolean {
  const platformMatches = !item.platform || normalize(item.platform) === normalize(row.platform)
  return platformMatches && normalize(item.model) === normalize(row.model)
}

function configPricingToRow(item: ModelDisplayPricingConfig, index: number): ModelPricingRow {
  const platform = item.platform || 'anthropic'
  const official = officialPricingFor(item.model, platform)
  const currentPricing = { ...item, billing_mode: item.billing_mode || BILLING_MODE_TOKEN }
  return {
    id: `configured:${platform}:${item.model}:${index}`,
    model: item.model,
    platform,
    currentPricing,
    official,
    inputDiscount: discount(currentPricing.input_price, official?.pricing.input_price),
    outputDiscount: discount(currentPricing.output_price, official?.pricing.output_price),
  }
}

function emptyDisplayConfig(): ModelDisplayConfig {
  return { featured_models: [], pricing_models: [], reference_discount: null }
}

function withDisplayDefaults(config: ModelDisplayConfig): ModelDisplayConfig {
  return {
    featured_models: config.featured_models || [],
    pricing_models: config.pricing_models || [],
    reference_discount: config.reference_discount ?? null,
  }
}

function discount(current: number | null | undefined, official: number | null | undefined): number | null {
  if (current == null || official == null || official <= 0) return null
  return (official - current) / official
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/_/g, '-')
}

function priceLine(label: string, value: number | null, unit: string) {
  return h('span', { class: 'price-line' }, [
    h('span', { class: 'price-label' }, label),
    h('strong', value == null ? '-' : `${formatScaled(value, unit === 'million' ? MILLION : 1)}${unit === 'million' ? ' / 1M' : ''}`),
  ])
}

const PriceStack = defineComponent({
  name: 'PriceStack',
  props: {
    pricing: {
      type: Object as PropType<ReferencePriceShape & { billing_mode?: string }>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n()
    return () => {
      const billingMode = props.pricing.billing_mode || BILLING_MODE_TOKEN
      if (billingMode === BILLING_MODE_PER_REQUEST) {
        return h('div', { class: 'price-stack' }, [
          priceLine(t('modelPricing.price.request'), props.pricing.per_request_price, 'request'),
        ])
      }

      if (billingMode === BILLING_MODE_IMAGE) {
        return h('div', { class: 'price-stack' }, [
          priceLine(t('modelPricing.price.image'), props.pricing.per_request_price, 'request'),
        ])
      }

      return h('div', { class: 'price-stack' }, [
        priceLine(t('modelPricing.price.input'), props.pricing.input_price, 'million'),
        priceLine(t('modelPricing.price.output'), props.pricing.output_price, 'million'),
        props.pricing.cache_read_price != null
          ? priceLine(t('modelPricing.price.cacheRead'), props.pricing.cache_read_price, 'million')
          : null,
      ])
    }
  },
})

const SavingsPill = defineComponent({
  name: 'SavingsPill',
  props: {
    label: {
      type: String,
      required: true,
    },
    value: {
      type: Number as PropType<number | null>,
      default: null,
    },
  },
  setup(props) {
    const { t } = useI18n()
    return () => {
      const className =
        props.value == null
          ? 'savings-pill savings-pill-muted'
          : props.value > 0.005
            ? 'savings-pill savings-pill-positive'
            : props.value < -0.005
              ? 'savings-pill savings-pill-negative'
              : 'savings-pill savings-pill-neutral'

      const text =
        props.value == null
          ? t('modelPricing.savings.unknown')
          : props.value > 0.005
            ? t('modelPricing.savings.cheaper', { percent: Math.round(props.value * 100) })
            : props.value < -0.005
              ? t('modelPricing.savings.higher', { percent: Math.round(Math.abs(props.value) * 100) })
              : t('modelPricing.savings.same')

      return h('span', { class: className }, [h('span', props.label), h('strong', text)])
    }
  },
})

onMounted(loadChannels)
</script>

<style scoped>
.model-pricing-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.model-pricing-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 82px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  padding: 14px;
}

.summary-card-primary {
  border-color: color-mix(in srgb, var(--accent) 34%, var(--border-default));
  background: color-mix(in srgb, var(--accent-soft) 36%, var(--bg-surface));
}

.summary-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  color: var(--accent);
  background: var(--accent-soft);
}

.summary-card p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 650;
}

.summary-card strong {
  display: block;
  margin-top: 2px;
  color: var(--text-primary);
  font-size: 24px;
  line-height: 1;
}

.model-pricing-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  padding: 12px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.platform-select {
  width: 180px;
}

.model-pricing-table-card {
  overflow: hidden;
  border-radius: var(--radius-lg);
}

.featured-models {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid color-mix(in srgb, var(--accent) 28%, var(--border-default));
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--accent-soft) 24%, var(--bg-surface));
  padding: 12px;
}

.featured-heading {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--accent);
  font-size: 13px;
  font-weight: 800;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 10px;
}

.featured-model-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--border-default);
  border-radius: 10px;
  background: var(--bg-surface);
  padding: 12px;
}

.featured-model-card strong {
  word-break: break-word;
}

.featured-model-card > span:last-of-type {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 650;
}

.model-pricing-table-wrapper {
  overflow-x: auto;
}

.model-pricing-table {
  width: 100%;
  min-width: 980px;
  border-collapse: separate;
  border-spacing: 0;
}

.model-pricing-table th {
  border-bottom: 1px solid var(--border-default);
  background: var(--bg-surface-alt);
  padding: 13px 16px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  text-align: left;
  text-transform: uppercase;
}

.model-pricing-table td {
  border-bottom: 1px solid var(--border-default);
  padding: 16px;
  color: var(--text-primary);
  vertical-align: top;
}

.model-pricing-table tr:last-child td {
  border-bottom: 0;
}

.featured-row td {
  background: color-mix(in srgb, var(--accent-soft) 20%, transparent);
}

.featured-inline {
  display: inline-flex;
  margin-left: 6px;
  border-radius: 6px;
  background: var(--accent-soft);
  color: var(--accent);
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 800;
  vertical-align: middle;
}

.model-cell,
.access-cell,
.savings-stack {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.model-cell strong {
  font-size: 14px;
  line-height: 1.35;
}

.platform-mark,
.multiplier-pill {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
  border: 1px solid currentColor;
  border-radius: 7px;
  padding: 3px 7px;
  font-size: 12px;
  font-weight: 650;
}

.model-source,
.muted-text,
.group-list {
  color: var(--text-muted);
  font-size: 12px;
}

.group-list {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.price-stack) {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

:deep(.price-line) {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 160px;
}

:deep(.price-label) {
  color: var(--text-muted);
  font-size: 12px;
}

:deep(.price-line strong) {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 750;
}

:deep(.savings-pill) {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 7px;
  border-radius: 7px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 650;
}

:deep(.savings-pill strong) {
  font-weight: 800;
}

:deep(.savings-pill-positive) {
  color: #047857;
  background: color-mix(in srgb, #10b981 16%, var(--bg-surface));
}

:deep(.savings-pill-neutral) {
  color: var(--text-secondary);
  background: var(--bg-surface-alt);
}

:deep(.savings-pill-muted) {
  color: var(--text-muted);
  background: var(--bg-surface-alt);
}

:deep(.savings-pill-negative) {
  color: #b45309;
  background: color-mix(in srgb, #f59e0b 16%, var(--bg-surface));
}

.pricing-state {
  display: flex;
  min-height: 260px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-secondary);
  font-weight: 650;
}

.pricing-footnote {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 900px) {
  .model-pricing-summary {
    grid-template-columns: 1fr;
  }

  .model-pricing-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar-actions {
    justify-content: space-between;
  }

  .platform-select {
    width: 100%;
  }
}
</style>
