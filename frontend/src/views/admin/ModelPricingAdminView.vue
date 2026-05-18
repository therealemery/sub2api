<template>
  <div class="admin-model-pricing-page">
    <section class="admin-model-toolbar">
      <div class="relative w-full sm:max-w-sm">
        <Icon
          name="search"
          size="md"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />
        <input
          v-model="searchQuery"
          type="text"
          class="input pl-10"
          :placeholder="t('admin.modelPricing.searchPlaceholder')"
        />
      </div>
      <div class="toolbar-actions">
        <select v-model="selectedPlatform" class="input platform-select">
          <option value="">{{ t('modelPricing.filters.allPlatforms') }}</option>
          <option v-for="platform in platformOptions" :key="platform" :value="platform">
            {{ platformLabel(platform) }}
          </option>
        </select>
        <button type="button" class="btn btn-secondary" :disabled="loading" @click="loadData">
          <Icon name="refresh" size="md" :class="{ 'animate-spin': loading }" />
        </button>
        <button type="button" class="btn btn-primary" :disabled="loading" @click="openCreate">
          <Icon name="plus" size="md" />
          {{ t('admin.modelPricing.addPricing') }}
        </button>
      </div>
    </section>

    <section class="reference-discount-panel">
      <div>
        <h3>{{ t('admin.modelPricing.referenceTitle') }}</h3>
        <p>{{ t('admin.modelPricing.referenceDescription') }}</p>
      </div>
      <div class="reference-actions">
        <label>
          <span>{{ t('admin.modelPricing.fields.discount') }}</span>
          <input
            v-model="referenceDiscountInput"
            class="input discount-input"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.6"
          />
        </label>
        <button type="button" class="btn btn-secondary" :disabled="savingDisplay" @click="applyReferencePricing">
          <Icon name="download" size="md" />
          {{ t('admin.modelPricing.fetchReference') }}
        </button>
      </div>
    </section>

    <section class="featured-admin-panel">
      <div>
        <h3>{{ t('admin.modelPricing.featuredTitle') }}</h3>
        <p>{{ t('admin.modelPricing.featuredDescription') }}</p>
      </div>
      <button type="button" class="btn btn-secondary" :disabled="savingDisplay" @click="saveDisplayConfig">
        <Icon name="check" size="md" />
        {{ t('common.save') }}
      </button>
    </section>

    <section class="card admin-model-table-card">
      <div v-if="loading" class="pricing-state">
        <Icon name="refresh" size="lg" class="animate-spin" />
        <span>{{ t('common.loading') }}</span>
      </div>
      <div v-else-if="filteredRows.length === 0" class="pricing-state">
        <Icon name="infoCircle" size="lg" />
        <span>{{ t('admin.modelPricing.empty') }}</span>
      </div>
      <div v-else class="table-wrapper">
        <table class="admin-model-table">
          <thead>
            <tr>
              <th>{{ t('admin.modelPricing.columns.featured') }}</th>
              <th>{{ t('admin.modelPricing.columns.model') }}</th>
              <th>{{ t('admin.modelPricing.columns.price') }}</th>
              <th>{{ t('admin.modelPricing.columns.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredRows" :key="row.id" class="data-table-row">
              <td>
                <label class="featured-toggle">
                  <input
                    type="checkbox"
                    :checked="isFeatured(row)"
                    @change="toggleFeatured(row, ($event.target as HTMLInputElement).checked)"
                  />
                  <span>{{ isFeatured(row) ? t('admin.modelPricing.featured') : t('admin.modelPricing.notFeatured') }}</span>
                </label>
                <div v-if="isFeatured(row)" class="featured-sort-actions">
                  <button
                    type="button"
                    class="btn btn-secondary btn-sm sort-button"
                    :disabled="featuredIndex(row) <= 0"
                    :title="t('admin.modelPricing.moveUp')"
                    @click="moveFeatured(row, -1)"
                  >
                    <Icon name="arrowUp" size="sm" />
                  </button>
                  <button
                    type="button"
                    class="btn btn-secondary btn-sm sort-button"
                    :disabled="featuredIndex(row) === displayConfig.featured_models.length - 1"
                    :title="t('admin.modelPricing.moveDown')"
                    @click="moveFeatured(row, 1)"
                  >
                    <Icon name="arrowDown" size="sm" />
                  </button>
                </div>
              </td>
              <td>
                <div class="model-cell">
                  <span class="platform-mark" :class="platformBadgeClass(row.platform)">
                    <PlatformIcon :platform="row.platform as GroupPlatform" size="xs" />
                    {{ platformLabel(row.platform) }}
                  </span>
                  <strong>{{ row.model }}</strong>
                  <input
                    v-if="isFeatured(row)"
                    :value="featuredBadge(row)"
                    class="input badge-input"
                    :placeholder="t('admin.modelPricing.badgePlaceholder')"
                    @change="setFeaturedBadge(row, ($event.target as HTMLInputElement).value)"
                  />
                </div>
              </td>
              <td>
                <PriceStack :pricing="row.pricing" />
              </td>
              <td>
                <div class="row-actions">
                  <button type="button" class="btn btn-secondary btn-sm" @click="openEdit(row)">
                    <Icon name="edit" size="sm" />
                    {{ t('common.edit') }}
                  </button>
                  <button type="button" class="btn btn-danger btn-sm" :disabled="savingEntry" @click="removeEntry(row)">
                    <Icon name="trash" size="sm" />
                    {{ t('common.delete') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="editorOpen" class="modal-backdrop" @click.self="closeEditor">
      <section class="pricing-editor">
        <header>
          <div>
            <h3>{{ editorMode === 'create' ? t('admin.modelPricing.createTitle') : t('admin.modelPricing.editTitle') }}</h3>
            <p>{{ t('admin.modelPricing.editorDescription') }}</p>
          </div>
          <button type="button" class="btn btn-icon" @click="closeEditor">
            <Icon name="x" size="md" />
          </button>
        </header>

        <div class="editor-grid">
          <label>
            <span>{{ t('admin.modelPricing.fields.platform') }}</span>
            <select v-model="editor.platform" class="input">
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Gemini</option>
              <option value="antigravity">Antigravity</option>
            </select>
          </label>
          <label>
            <span>{{ t('admin.modelPricing.fields.billingMode') }}</span>
            <select v-model="editor.billing_mode" class="input">
              <option :value="BILLING_MODE_TOKEN">{{ t('admin.modelPricing.displayMode.token') }}</option>
              <option :value="BILLING_MODE_PER_REQUEST">{{ t('admin.modelPricing.displayMode.perRequest') }}</option>
              <option :value="BILLING_MODE_IMAGE">{{ t('admin.modelPricing.displayMode.image') }}</option>
            </select>
          </label>
          <label class="editor-wide">
            <span>{{ t('admin.modelPricing.fields.model') }}</span>
            <input
              v-model="editor.model"
              class="input"
              type="text"
              :placeholder="t('admin.modelPricing.modelPlaceholder')"
            />
          </label>
          <label>
            <span>{{ t('modelPricing.price.input') }} USD / 1M</span>
            <input v-model="editor.inputPerMillion" type="number" step="0.000001" min="0" class="input" />
          </label>
          <label>
            <span>{{ t('modelPricing.price.output') }} USD / 1M</span>
            <input v-model="editor.outputPerMillion" type="number" step="0.000001" min="0" class="input" />
          </label>
          <label>
            <span>{{ t('modelPricing.price.cacheRead') }} USD / 1M</span>
            <input v-model="editor.cacheReadPerMillion" type="number" step="0.000001" min="0" class="input" />
          </label>
          <label>
            <span>{{ t('availableChannels.pricing.cacheWritePrice') }} USD / 1M</span>
            <input v-model="editor.cacheWritePerMillion" type="number" step="0.000001" min="0" class="input" />
          </label>
          <label>
            <span>{{ t('modelPricing.price.request') }} / {{ t('modelPricing.price.image') }} USD</span>
            <input v-model="editor.perRequestPrice" type="number" step="0.000001" min="0" class="input" />
          </label>
          <label>
            <span>{{ t('modelPricing.price.image') }} USD / 1M</span>
            <input v-model="editor.imageOutputPrice" type="number" step="0.000001" min="0" class="input" />
          </label>
        </div>

        <footer>
          <button type="button" class="btn btn-secondary" @click="closeEditor">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" :disabled="savingEntry" @click="saveEditor">
            <Icon name="check" size="md" />
            {{ t('common.save') }}
          </button>
        </footer>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import PlatformIcon from '@/components/common/PlatformIcon.vue'
import adminModelDisplayAPI, {
  type FeaturedModelConfig,
  type ModelDisplayConfig,
  type ModelDisplayPricingConfig,
} from '@/api/admin/modelDisplay'
import { BILLING_MODE_IMAGE, BILLING_MODE_PER_REQUEST, BILLING_MODE_TOKEN, type BillingMode } from '@/constants/channel'
import type { GroupPlatform } from '@/types'
import { useAppStore } from '@/stores/app'
import { extractApiErrorMessage } from '@/utils/apiError'
import { formatScaled } from '@/utils/pricing'
import { platformBadgeClass, platformLabel } from '@/utils/platformColors'
import { applyReferenceDiscount, officialModelPricingReferences } from '@/utils/modelPricingReference'

interface PricingRow {
  id: string
  index: number
  model: string
  platform: string
  pricing: ModelDisplayPricingConfig
}

interface PricingEditor {
  index: number
  model: string
  platform: string
  billing_mode: BillingMode
  inputPerMillion: string
  outputPerMillion: string
  cacheWritePerMillion: string
  cacheReadPerMillion: string
  imageOutputPrice: string
  perRequestPrice: string
}

const MILLION = 1_000_000

const { t } = useI18n()
const appStore = useAppStore()

const displayConfig = ref<ModelDisplayConfig>(emptyDisplayConfig())
const loading = ref(false)
const savingEntry = ref(false)
const savingDisplay = ref(false)
const searchQuery = ref('')
const selectedPlatform = ref('')
const referenceDiscountInput = ref('0.6')
const editorOpen = ref(false)
const editorMode = ref<'create' | 'edit'>('create')

const editor = reactive<PricingEditor>({
  index: -1,
  model: '',
  platform: 'anthropic',
  billing_mode: BILLING_MODE_TOKEN,
  inputPerMillion: '',
  outputPerMillion: '',
  cacheWritePerMillion: '',
  cacheReadPerMillion: '',
  imageOutputPrice: '',
  perRequestPrice: '',
})

const rows = computed<PricingRow[]>(() =>
  displayConfig.value.pricing_models.map((pricing, index) => ({
    id: `${pricing.platform || 'model'}:${pricing.model}:${index}`,
    index,
    model: pricing.model,
    platform: pricing.platform || 'anthropic',
    pricing,
  })),
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

async function loadData() {
  loading.value = true
  try {
    displayConfig.value = withDisplayDefaults(await adminModelDisplayAPI.getModelDisplayConfig())
    syncReferenceDiscountInput(displayConfig.value)
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('common.error')))
  } finally {
    loading.value = false
  }
}

async function applyReferencePricing() {
  const discount = Number(referenceDiscountInput.value)
  if (!Number.isFinite(discount) || discount <= 0) {
    appStore.showError(t('admin.modelPricing.discountRequired'))
    return
  }

  savingDisplay.value = true
  try {
    const nextConfig = cloneDisplayConfig(displayConfig.value)
    nextConfig.reference_discount = discount
    nextConfig.pricing_models = officialModelPricingReferences.map((reference, index) => ({
      model: reference.model,
      platform: reference.platform,
      billing_mode: reference.billing_mode,
      ...applyReferenceDiscount(reference.pricing, discount),
      sort_order: index + 1,
    }))
    nextConfig.featured_models = normalizeFeatured(
      nextConfig.featured_models.filter((item) =>
        nextConfig.pricing_models.some(
          (pricing) =>
            normalize(pricing.model) === normalize(item.model) &&
            (!item.platform || normalize(pricing.platform || '') === normalize(item.platform)),
        ),
      ),
    )
    displayConfig.value = withDisplayDefaults(await adminModelDisplayAPI.updateModelDisplayConfig(nextConfig))
    syncReferenceDiscountInput(displayConfig.value)
    appStore.showSuccess(t('admin.modelPricing.referenceApplied', { count: nextConfig.pricing_models.length }))
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('common.error')))
  } finally {
    savingDisplay.value = false
  }
}

function openCreate() {
  editorMode.value = 'create'
  Object.assign(editor, emptyEditor(selectedPlatform.value || 'anthropic'))
  editorOpen.value = true
}

function openEdit(row: PricingRow) {
  editorMode.value = 'edit'
  Object.assign(editor, editorFromEntry(row.index, row.pricing))
  editorOpen.value = true
}

function closeEditor() {
  editorOpen.value = false
}

async function saveEditor() {
  const entry = editorToEntry()
  if (!entry.model) {
    appStore.showError(t('admin.modelPricing.modelRequired'))
    return
  }

  savingEntry.value = true
  try {
    const nextConfig = cloneDisplayConfig(displayConfig.value)
    const nextPricing = [...nextConfig.pricing_models]
    if (editorMode.value === 'edit' && editor.index >= 0) {
      nextPricing.splice(editor.index, 1, entry)
    } else {
      nextPricing.push(entry)
    }
    nextConfig.pricing_models = normalizePricingModels(nextPricing)
    displayConfig.value = withDisplayDefaults(await adminModelDisplayAPI.updateModelDisplayConfig(nextConfig))
    editorOpen.value = false
    appStore.showSuccess(t('admin.modelPricing.saved'))
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('common.error')))
  } finally {
    savingEntry.value = false
  }
}

async function removeEntry(row: PricingRow) {
  savingEntry.value = true
  try {
    const nextConfig = cloneDisplayConfig(displayConfig.value)
    nextConfig.pricing_models.splice(row.index, 1)
    nextConfig.pricing_models = normalizePricingModels(nextConfig.pricing_models)
    nextConfig.featured_models = nextConfig.featured_models.filter((item) => !matchesFeatured(row, item))
    displayConfig.value = withDisplayDefaults(await adminModelDisplayAPI.updateModelDisplayConfig(nextConfig))
    appStore.showSuccess(t('admin.modelPricing.deleted'))
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('common.error')))
  } finally {
    savingEntry.value = false
  }
}

async function saveDisplayConfig() {
  savingDisplay.value = true
  try {
    const nextConfig = cloneDisplayConfig(displayConfig.value)
    nextConfig.featured_models = normalizeFeatured(nextConfig.featured_models)
    displayConfig.value = withDisplayDefaults(await adminModelDisplayAPI.updateModelDisplayConfig(nextConfig))
    appStore.showSuccess(t('admin.modelPricing.featuredSaved'))
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('common.error')))
  } finally {
    savingDisplay.value = false
  }
}

function toggleFeatured(row: PricingRow, checked: boolean) {
  const items = displayConfig.value.featured_models.filter((item) => !matchesFeatured(row, item))
  if (checked) {
    items.push({
      model: row.model,
      platform: row.platform,
      badge: t('admin.modelPricing.defaultBadge'),
      sort_order: items.length + 1,
    })
  }
  displayConfig.value.featured_models = normalizeFeatured(items)
}

function setFeaturedBadge(row: PricingRow, badge: string) {
  displayConfig.value.featured_models = normalizeFeatured(
    displayConfig.value.featured_models.map((item) =>
      matchesFeatured(row, item) ? { ...item, badge: badge.trim() } : item,
    ),
  )
}

function featuredIndex(row: PricingRow): number {
  return displayConfig.value.featured_models.findIndex((item) => matchesFeatured(row, item))
}

function moveFeatured(row: PricingRow, direction: -1 | 1) {
  const items = [...displayConfig.value.featured_models]
  const index = items.findIndex((item) => matchesFeatured(row, item))
  const targetIndex = index + direction
  if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return
  const [item] = items.splice(index, 1)
  items.splice(targetIndex, 0, item)
  displayConfig.value.featured_models = normalizeFeatured(items)
}

function isFeatured(row: PricingRow): boolean {
  return displayConfig.value.featured_models.some((item) => matchesFeatured(row, item))
}

function featuredBadge(row: PricingRow): string {
  return displayConfig.value.featured_models.find((item) => matchesFeatured(row, item))?.badge || ''
}

function matchesFeatured(row: PricingRow, item: FeaturedModelConfig): boolean {
  const platformMatches = !item.platform || normalize(item.platform) === normalize(row.platform)
  return platformMatches && normalize(item.model) === normalize(row.model)
}

function normalizeFeatured(items: FeaturedModelConfig[]): FeaturedModelConfig[] {
  return items
    .filter((item) => item.model.trim())
    .map((item, index) => ({ ...item, sort_order: index + 1 }))
}

function emptyEditor(platform: string): PricingEditor {
  return {
    index: -1,
    model: '',
    platform,
    billing_mode: BILLING_MODE_TOKEN,
    inputPerMillion: '',
    outputPerMillion: '',
    cacheWritePerMillion: '',
    cacheReadPerMillion: '',
    imageOutputPrice: '',
    perRequestPrice: '',
  }
}

function editorFromEntry(index: number, entry: ModelDisplayPricingConfig): PricingEditor {
  return {
    index,
    model: entry.model,
    platform: entry.platform || 'anthropic',
    billing_mode: (entry.billing_mode || BILLING_MODE_TOKEN) as BillingMode,
    inputPerMillion: fromTokenPrice(entry.input_price),
    outputPerMillion: fromTokenPrice(entry.output_price),
    cacheWritePerMillion: fromTokenPrice(entry.cache_write_price),
    cacheReadPerMillion: fromTokenPrice(entry.cache_read_price),
    imageOutputPrice: fromTokenPrice(entry.image_output_price),
    perRequestPrice: fromRawPrice(entry.per_request_price),
  }
}

function editorToEntry(): ModelDisplayPricingConfig {
  return {
    model: editor.model.trim(),
    platform: editor.platform,
    billing_mode: editor.billing_mode,
    input_price: toTokenPrice(editor.inputPerMillion),
    output_price: toTokenPrice(editor.outputPerMillion),
    cache_write_price: toTokenPrice(editor.cacheWritePerMillion),
    cache_read_price: toTokenPrice(editor.cacheReadPerMillion),
    image_output_price: toTokenPrice(editor.imageOutputPrice),
    per_request_price: toRawPrice(editor.perRequestPrice),
    sort_order: editorMode.value === 'edit' ? editor.index + 1 : displayConfig.value.pricing_models.length + 1,
  }
}

function normalizePricingModels(items: ModelDisplayPricingConfig[]): ModelDisplayPricingConfig[] {
  return items.map((item, index) => ({ ...item, sort_order: index + 1 }))
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

function cloneDisplayConfig(config: ModelDisplayConfig): ModelDisplayConfig {
  return JSON.parse(JSON.stringify(withDisplayDefaults(config))) as ModelDisplayConfig
}

function syncReferenceDiscountInput(config: ModelDisplayConfig) {
  referenceDiscountInput.value = String(config.reference_discount ?? 0.6)
}

function toTokenPrice(value: string): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed / MILLION : null
}

function toRawPrice(value: string): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function fromTokenPrice(value: number | null): string {
  return value == null ? '' : String(value * MILLION)
}

function fromRawPrice(value: number | null): string {
  return value == null ? '' : String(value)
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/_/g, '-')
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function priceLine(label: string, value: number | null, scale: number, unit: string) {
  return h('span', { class: 'price-line' }, [
    h('span', { class: 'price-label' }, label),
    h('strong', value == null ? '-' : `${formatScaled(value, scale)}${unit}`),
  ])
}

const PriceStack = defineComponent({
  name: 'AdminModelPriceStack',
  props: {
    pricing: {
      type: Object as PropType<ModelDisplayPricingConfig>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n()
    return () => {
      if (props.pricing.billing_mode === BILLING_MODE_PER_REQUEST) {
        return h('div', { class: 'price-stack' }, [
          priceLine(t('modelPricing.price.request'), props.pricing.per_request_price, 1, ''),
        ])
      }
      if (props.pricing.billing_mode === BILLING_MODE_IMAGE) {
        return h('div', { class: 'price-stack' }, [
          priceLine(t('modelPricing.price.image'), props.pricing.per_request_price, 1, ''),
        ])
      }
      return h('div', { class: 'price-stack' }, [
        priceLine(t('modelPricing.price.input'), props.pricing.input_price, MILLION, ' / 1M'),
        priceLine(t('modelPricing.price.output'), props.pricing.output_price, MILLION, ' / 1M'),
      ])
    }
  },
})

onMounted(loadData)
</script>

<style scoped>
.admin-model-pricing-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-model-toolbar,
.featured-admin-panel,
.reference-discount-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  padding: 12px;
}

.toolbar-actions,
.row-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.platform-select {
  width: 220px;
}

.featured-admin-panel {
  border-color: color-mix(in srgb, var(--accent) 28%, var(--border-default));
  background: color-mix(in srgb, var(--accent-soft) 24%, var(--bg-surface));
}

.reference-discount-panel {
  border-color: color-mix(in srgb, var(--accent) 18%, var(--border-default));
}

.featured-admin-panel h3,
.reference-discount-panel h3 {
  margin: 0 0 4px;
  color: var(--text-primary);
  font-size: 15px;
}

.featured-admin-panel p,
.reference-discount-panel p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
}

.reference-actions {
  display: flex;
  align-items: end;
  gap: 10px;
}

.reference-actions label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 650;
}

.discount-input {
  width: 132px;
}

.admin-model-table-card {
  overflow: hidden;
  border-radius: var(--radius-lg);
}

.table-wrapper {
  overflow-x: auto;
}

.admin-model-table {
  width: 100%;
  min-width: 840px;
  border-collapse: separate;
  border-spacing: 0;
}

.admin-model-table th,
.admin-model-table td {
  border-bottom: 1px solid var(--border-default);
  padding: 14px 16px;
  text-align: left;
  vertical-align: top;
}

.admin-model-table th {
  background: var(--bg-surface-alt);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.model-cell,
:deep(.price-stack) {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.platform-mark {
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

.featured-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 650;
}

.featured-sort-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.sort-button {
  width: 32px;
  padding: 0 !important;
}

.badge-input {
  width: 160px;
  height: 32px;
  font-size: 12px;
}

:deep(.price-line) {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  min-width: 150px;
}

:deep(.price-label) {
  color: var(--text-muted);
  font-size: 12px;
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

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.46);
  padding: 20px;
}

.pricing-editor {
  width: min(780px, 100%);
  max-height: 88vh;
  overflow: auto;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  box-shadow: 0 18px 60px rgba(15, 23, 42, 0.22);
}

.pricing-editor header,
.pricing-editor footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--border-default);
  padding: 16px;
}

.pricing-editor footer {
  justify-content: flex-end;
  border-top: 1px solid var(--border-default);
  border-bottom: 0;
}

.pricing-editor h3,
.pricing-editor p {
  margin: 0;
}

.pricing-editor p {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 12px;
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
}

.editor-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 650;
}

.editor-wide {
  grid-column: 1 / -1;
}

@media (max-width: 900px) {
  .admin-model-toolbar,
  .featured-admin-panel,
  .reference-discount-panel {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar-actions,
  .reference-actions {
    flex-wrap: wrap;
  }

  .platform-select {
    width: 100%;
  }

  .editor-grid {
    grid-template-columns: 1fr;
  }
}
</style>
