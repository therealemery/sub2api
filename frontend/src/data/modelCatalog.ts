import type {
  FeaturedModelConfig,
  ModelDisplayConfig,
  ModelDisplayPricingConfig,
} from '@/api/modelDisplay'

export type ModelFamily = 'gpt' | 'claude' | 'gemini' | 'deepseek' | 'grok' | 'qwen' | 'glm' | 'kimi' | 'ownapi'
export type ModelCatalogSort = 'featured' | 'name' | 'price'

export interface OfficialTokenPricing {
  input: number | null
  cachedInput: number | null
  output: number | null
}

export interface LongContextPricing extends OfficialTokenPricing {
  thresholdTokens: number
}

export interface ModelPricingSource {
  official: OfficialTokenPricing
  longContext?: LongContextPricing
  multiplier: 0.7
  sourceUrl: string
  checkedAt: '2026-08-31'
}

export function calculateOwnApiPricing(
  pricing: OfficialTokenPricing,
  multiplier = 0.7,
): OfficialTokenPricing {
  const multiply = (value: number | null) => value == null ? null : value * multiplier
  return {
    input: multiply(pricing.input),
    cachedInput: multiply(pricing.cachedInput),
    output: multiply(pricing.output),
  }
}

export function formatCatalogPrice(value: number | null): string | null {
  return value == null
    ? null
    : value.toLocaleString('en-US', { maximumFractionDigits: 4, useGrouping: false })
}

export interface ModelCatalogPrice {
  billingMode: string
  input: number | null
  output: number | null
  cacheRead: number | null
  cacheWrite: number | null
  imageOutput: number | null
  perRequest: number | null
}

export interface ModelCatalogEntry {
  slug: string
  modelId: string
  displayName: string
  provider: string
  platform: string
  family: ModelFamily
  modality: 'Text' | 'Multimodal' | 'Image' | 'Audio' | 'Video'
  capabilities: string[]
  summaryKey: string
  descriptionKey: string
  artwork: string
  providerLogo: string
  contextWindow: string | null
  featured: boolean
  featuredBadge: string
  sortOrder: number
  price: ModelCatalogPrice | null
  pricingSource: ModelPricingSource | null
  modelClass: string[]
  endpoints: string[]
  isAlias: boolean
  aliasNoteKey: string | null
  available: boolean | null
}

export interface CatalogFilters {
  query: string
  provider: string
  capability: string
  sort: ModelCatalogSort
}

interface FamilyMetadata {
  family: ModelFamily
  provider: string
  platform: string
  match: RegExp
  artwork: string
  providerLogo: string
  modality: ModelCatalogEntry['modality']
  capabilities: string[]
  summaryKey: string
  descriptionKey: string
  contextWindow: string | null
}

interface CuratedSeed extends FamilyMetadata {
  modelId: string
  displayName: string
  featured: boolean
  sortOrder: number
}

const families: FamilyMetadata[] = [
  family('gpt', 'OpenAI', 'openai', /(^|[.:/-])(gpt|o\d|codex)|^(gpt|o\d|codex)/i, 'openai', 'Multimodal', ['Reasoning', 'Coding', 'Vision'], '1M'),
  family('claude', 'Anthropic', 'anthropic', /claude/i, 'claude', 'Multimodal', ['Reasoning', 'Coding', 'Vision'], '1M'),
  family('gemini', 'Google', 'gemini', /gemini|antigravity/i, 'gemini', 'Multimodal', ['Reasoning', 'Vision', 'Long context'], '1M'),
  family('deepseek', 'DeepSeek', 'deepseek', /deepseek/i, 'deepseek', 'Text', ['Reasoning', 'Coding', 'Text'], '128K'),
  family('grok', 'xAI', 'xai', /grok/i, 'grok', 'Multimodal', ['Reasoning', 'Vision', 'Text'], '256K'),
  family('qwen', 'Qwen', 'qwen', /qwen|qwq/i, 'qwen', 'Multimodal', ['Reasoning', 'Coding', 'Vision'], '1M'),
  family('glm', 'Z.AI', 'zhipu', /glm|chatglm/i, 'glm', 'Multimodal', ['Reasoning', 'Coding', 'Vision'], '128K'),
  family('kimi', 'Moonshot', 'moonshot', /kimi|moonshot/i, 'kimi', 'Text', ['Long context', 'Reasoning', 'Text'], '128K'),
]

const fallbackFamily: FamilyMetadata = {
  family: 'ownapi',
  provider: 'OwnAPI',
  platform: 'custom',
  match: /$^/,
  artwork: '/model-art/ownapi.jpg',
  providerLogo: '/brand/ownapi-logo-clean.png',
  modality: 'Text',
  capabilities: ['Unified API', 'OpenAI compatible'],
  summaryKey: 'publicModels.families.ownapi.summary',
  descriptionKey: 'publicModels.families.ownapi.description',
  contextWindow: null,
}

const curatedSeeds: CuratedSeed[] = [
  seed('gpt-5.4', 'GPT-5.4', 'gpt', true, 10),
  seed('claude-sonnet-4.6', 'Claude Sonnet 4.6', 'claude', true, 20),
  seed('gemini-3.1-flash-image', 'Gemini 3.1 Flash Image', 'gemini', true, 30),
  seed('deepseek-reasoner', 'DeepSeek Reasoner', 'deepseek', false, 40),
  seed('grok-4', 'Grok 4', 'grok', false, 50),
  seed('qwen3-235b-a22b', 'Qwen3 235B', 'qwen', false, 60),
  seed('glm-4.6', 'GLM-4.6', 'glm', false, 70),
  seed('kimi-latest', 'Kimi Latest', 'kimi', false, 80),
]

export function buildModelCatalog(config?: ModelDisplayConfig | null): ModelCatalogEntry[] {
  const featured = config?.featured_models ?? []
  const configured = config?.pricing_models ?? []
  const byIdentity = new Map<string, ModelCatalogEntry>()

  for (const item of curatedSeeds) {
    byIdentity.set(identity(item.platform, item.modelId), entryFromSeed(item, featured))
  }

  for (const [index, pricing] of configured.entries()) {
    const metadata = metadataFor(pricing.model, pricing.platform)
    const key = identity(normalizePlatform(pricing.platform, metadata), pricing.model)
    const existing = byIdentity.get(key)
    const featuredConfig = findFeatured(featured, pricing.model, pricing.platform)

    byIdentity.set(key, {
      ...(existing ?? entryFromConfigured(pricing, metadata, index)),
      price: priceFromConfig(pricing),
      featured: Boolean(featuredConfig) || existing?.featured === true,
      featuredBadge: featuredConfig?.badge || existing?.featuredBadge || '',
      sortOrder: featuredConfig?.sort_order ?? pricing.sort_order ?? existing?.sortOrder ?? 100 + index,
      available: null,
    })
  }

  return Array.from(byIdentity.values()).sort(compareFeatured)
}

export function filterModelCatalog(entries: ModelCatalogEntry[], filters: CatalogFilters): ModelCatalogEntry[] {
  const query = normalize(filters.query)
  const result = entries.filter((entry) => {
    const queryTarget = normalize([
      entry.modelId,
      entry.displayName,
      entry.provider,
      ...entry.capabilities,
    ].join(' '))
    return (!query || queryTarget.includes(query))
      && (!filters.provider || entry.provider === filters.provider)
      && (!filters.capability || entry.capabilities.includes(filters.capability))
  })

  return [...result].sort((a, b) => {
    if (filters.sort === 'name') return a.displayName.localeCompare(b.displayName)
    if (filters.sort === 'price') return compareNullablePrice(a.price?.input ?? a.price?.perRequest, b.price?.input ?? b.price?.perRequest)
    return compareFeatured(a, b)
  })
}

export function findCatalogModel(entries: ModelCatalogEntry[], slug: string): ModelCatalogEntry | undefined {
  const normalizedSlug = normalizeSlug(slug)
  return entries.find((entry) => entry.slug === normalizedSlug || normalizeSlug(entry.modelId) === normalizedSlug)
}

export function relatedCatalogModels(
  entries: ModelCatalogEntry[],
  entry: ModelCatalogEntry,
  limit = 3,
): ModelCatalogEntry[] {
  return entries
    .filter((candidate) => candidate.modelId !== entry.modelId)
    .sort((a, b) => relationScore(b, entry) - relationScore(a, entry) || compareFeatured(a, b))
    .slice(0, limit)
}

export function normalizeModelSlug(modelId: string): string {
  return normalizeSlug(modelId)
}

function family(
  familyName: Exclude<ModelFamily, 'ownapi'>,
  provider: string,
  platform: string,
  match: RegExp,
  assetName: string,
  modality: ModelCatalogEntry['modality'],
  capabilities: string[],
  contextWindow: string,
): FamilyMetadata {
  return {
    family: familyName,
    provider,
    platform,
    match,
    artwork: `/model-art/${familyName}.jpg`,
    providerLogo: `/brand/${assetName}.svg`,
    modality,
    capabilities,
    summaryKey: `publicModels.families.${familyName}.summary`,
    descriptionKey: `publicModels.families.${familyName}.description`,
    contextWindow,
  }
}

function seed(
  modelId: string,
  displayName: string,
  familyName: Exclude<ModelFamily, 'ownapi'>,
  featured: boolean,
  sortOrder: number,
): CuratedSeed {
  const metadata = families.find((item) => item.family === familyName)
  if (!metadata) throw new Error(`Missing model family metadata: ${familyName}`)
  return { ...metadata, modelId, displayName, featured, sortOrder }
}

function entryFromSeed(item: CuratedSeed, featured: FeaturedModelConfig[]): ModelCatalogEntry {
  const featuredConfig = findFeatured(featured, item.modelId, item.platform)
  return {
    ...item,
    slug: normalizeSlug(item.modelId),
    featured: Boolean(featuredConfig) || item.featured,
    featuredBadge: featuredConfig?.badge || '',
    sortOrder: featuredConfig?.sort_order ?? item.sortOrder,
    price: null,
    pricingSource: null,
    modelClass: [],
    endpoints: [],
    isAlias: false,
    aliasNoteKey: null,
    available: null,
  }
}

function entryFromConfigured(
  pricing: ModelDisplayPricingConfig,
  metadata: FamilyMetadata,
  index: number,
): ModelCatalogEntry {
  const platform = normalizePlatform(pricing.platform, metadata)
  return {
    ...metadata,
    platform,
    provider: metadata === fallbackFamily ? titleCase(platform) : metadata.provider,
    slug: normalizeSlug(pricing.model),
    modelId: pricing.model,
    displayName: displayNameFor(pricing.model),
    featured: false,
    featuredBadge: '',
    sortOrder: pricing.sort_order ?? 100 + index,
    price: priceFromConfig(pricing),
    pricingSource: null,
    modelClass: [],
    endpoints: [],
    isAlias: false,
    aliasNoteKey: null,
    available: null,
  }
}

function metadataFor(modelId: string, platform?: string): FamilyMetadata {
  const haystack = `${platform ?? ''}:${modelId}`
  return families.find((item) => item.match.test(haystack)) ?? fallbackFamily
}

function normalizePlatform(platform: string | undefined, metadata: FamilyMetadata): string {
  return normalize(platform || metadata.platform) || metadata.platform
}

function priceFromConfig(pricing: ModelDisplayPricingConfig): ModelCatalogPrice {
  return {
    billingMode: pricing.billing_mode || 'token',
    input: pricing.input_price,
    output: pricing.output_price,
    cacheRead: pricing.cache_read_price,
    cacheWrite: pricing.cache_write_price,
    imageOutput: pricing.image_output_price,
    perRequest: pricing.per_request_price,
  }
}

function findFeatured(
  featured: FeaturedModelConfig[],
  modelId: string,
  platform?: string,
): FeaturedModelConfig | undefined {
  return featured.find((item) => normalize(item.model) === normalize(modelId)
    && (!item.platform || !platform || normalize(item.platform) === normalize(platform)))
}

function compareFeatured(a: ModelCatalogEntry, b: ModelCatalogEntry): number {
  if (a.featured !== b.featured) return a.featured ? -1 : 1
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
  return a.displayName.localeCompare(b.displayName)
}

function compareNullablePrice(a: number | null | undefined, b: number | null | undefined): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return a - b
}

function relationScore(candidate: ModelCatalogEntry, entry: ModelCatalogEntry): number {
  if (candidate.family === entry.family) return 3
  if (candidate.provider === entry.provider) return 2
  if (candidate.modality === entry.modality) return 1
  return 0
}

function identity(platform: string, modelId: string): string {
  return `${normalize(platform)}:${normalize(modelId)}`
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, '-')
}

function normalizeSlug(value: string): string {
  return normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function displayNameFor(modelId: string): string {
  return modelId
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => (/^\d/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ')
}

function titleCase(value: string): string {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
