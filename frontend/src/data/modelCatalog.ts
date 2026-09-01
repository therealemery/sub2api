import type {
  FeaturedModelConfig,
  ModelDisplayConfig,
  ModelDisplayPricingConfig,
} from '@/api/modelDisplay'
import { verifiedModelSeedData } from './verifiedModelSeeds'
import type {
  CatalogEligibilitySource,
  ModelPricingSource,
  OfficialTokenPricing,
  RawVerifiedModelSeed,
} from './verifiedModelSeeds'

export { verifiedModelSeedData } from './verifiedModelSeeds'
export type {
  CatalogEligibilitySource,
  ModelPricingSource,
  ModelPricingStatus,
  OfficialPricingTier,
  OfficialTokenPricing,
  RawVerifiedModelSeed,
} from './verifiedModelSeeds'

export type ModelFamily = 'gpt' | 'claude' | 'gemini' | 'deepseek' | 'grok' | 'qwen' | 'glm' | 'kimi' | 'minimax' | 'ownapi'
export type ModelCatalogSort = 'featured' | 'name' | 'input-price' | 'output-price'

export const CATALOG_PROVIDER_ORDER = [
  'OpenAI',
  'Anthropic',
  'xAI',
  'Google',
  'Qwen',
  'Z.AI',
  'Moonshot',
  'MiniMax',
] as const

export interface ModelProviderGroup {
  provider: string
  providerLogo: string
  entries: ModelCatalogEntry[]
}

export interface CatalogProviderSummary {
  provider: string
  label: string
  logo: string
  count: number
}

const catalogProviderPresentation: Record<typeof CATALOG_PROVIDER_ORDER[number], { label: string; logo: string }> = {
  OpenAI: { label: 'ChatGPT', logo: '/brand/openai.svg' },
  Anthropic: { label: 'Claude', logo: '/brand/claude.svg' },
  xAI: { label: 'Grok', logo: '/brand/grok.svg' },
  Google: { label: 'Gemini', logo: '/brand/gemini.svg' },
  Qwen: { label: 'Qwen', logo: '/brand/qwen.svg' },
  'Z.AI': { label: 'GLM', logo: '/brand/glm.svg' },
  Moonshot: { label: 'Kimi', logo: '/brand/kimi.svg' },
  MiniMax: { label: 'MiniMax', logo: '/brand/minimax.svg' },
}

const providerSearchAliases: Record<string, string[]> = {
  OpenAI: ['open ai', '开放人工智能'],
  Anthropic: ['claude', '克劳德'],
  xAI: ['x ai', 'grok'],
  Google: ['google', '谷歌'],
  Qwen: ['qwen', '通义千问', '千问', 'alibaba', '阿里云'],
  'Z.AI': ['z ai', 'zhipu', '智谱', 'glm'],
  Moonshot: ['moonshot', '月之暗面', 'kimi'],
  MiniMax: ['minimax', '稀宇科技'],
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

export function activeOfficialTier(
  pricing: ModelPricingSource,
  tierId?: string | null,
): OfficialTokenPricing {
  return pricing.tiers?.find((tier) => tier.id === tierId)?.official ?? pricing.official
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
  eligibilitySource: CatalogEligibilitySource | null
  searchAliases: string[]
  modelClass: string[]
  endpoints: string[]
  isAlias: boolean
  aliasNoteKey: string | null
  available: boolean | null
}

export interface CatalogFilters {
  query: string
  provider: string
  modelClass: string
  endpoint: string
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
  pricingSource: ModelPricingSource
  modelClass: string[]
  endpoints: string[]
  isAlias: boolean
  aliasNoteKey: string | null
  eligibilitySource: CatalogEligibilitySource
  searchAliases: string[]
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
  family('minimax', 'MiniMax', 'minimax', /minimax/i, 'minimax', 'Text', ['Reasoning', 'Coding', 'Text'], '1M', 'ownapi'),
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

export const verifiedCatalogSeeds: CuratedSeed[] = verifiedModelSeedData.map(seedFromRawData)

export function buildModelCatalog(config?: ModelDisplayConfig | null): ModelCatalogEntry[] {
  const featured = config?.featured_models ?? []
  const configured = config?.pricing_models ?? []
  const byIdentity = new Map<string, ModelCatalogEntry>()

  for (const item of verifiedCatalogSeeds) {
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

export function filterModelCatalog(entries: ModelCatalogEntry[], filters: Partial<CatalogFilters>): ModelCatalogEntry[] {
  const query = normalizeCatalogSearch(filters.query ?? '')
  const provider = filters.provider ?? ''
  const modelClass = filters.modelClass ?? ''
  const endpoint = filters.endpoint ?? ''
  const sort = filters.sort ?? 'featured'
  const result = entries.filter((entry) => {
    return (!query || scoreCatalogMatch(entry, query) > 0)
      && (!provider || entry.provider === provider)
      && (!modelClass || entry.modelClass.includes(modelClass))
      && (!endpoint || entry.endpoints.includes(endpoint))
  })

  return [...result].sort((a, b) => {
    const providerOrder = compareProviders(a.provider, b.provider)
    if (providerOrder !== 0) return providerOrder
    if (query) {
      const relevance = scoreCatalogMatch(b, query) - scoreCatalogMatch(a, query)
      if (relevance !== 0) return relevance
    }
    return compareCatalogSort(a, b, sort)
  })
}

export function normalizeCatalogSearch(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s._/\-]+/g, ' ')
    .trim()
}

export function scoreCatalogMatch(entry: ModelCatalogEntry, query: string): number {
  const tokens = normalizeCatalogSearch(query).split(' ').filter(Boolean)
  if (tokens.length === 0) return 0
  const fields = [
    entry.modelId,
    entry.displayName,
    entry.provider,
    ...entry.searchAliases,
    ...entry.capabilities,
    ...entry.modelClass,
    ...entry.endpoints,
  ].map(normalizeCatalogSearch).filter(Boolean)

  let total = 0
  for (const token of tokens) {
    let best = 0
    for (const field of fields) {
      if (field === token) best = Math.max(best, 400)
      else if (field.startsWith(`${token} `)) best = Math.max(best, 300)
      else if (field.split(' ').includes(token)) best = Math.max(best, 200)
      else if (field.includes(token)) best = Math.max(best, 100)
    }
    if (best === 0) return 0
    total += best
  }
  return total
}

export function groupModelCatalog(entries: ModelCatalogEntry[]): ModelProviderGroup[] {
  const groups = new Map<string, ModelProviderGroup>()
  for (const entry of entries) {
    const existing = groups.get(entry.provider)
    if (existing) existing.entries.push(entry)
    else groups.set(entry.provider, {
      provider: entry.provider,
      providerLogo: entry.providerLogo,
      entries: [entry],
    })
  }
  return [...groups.values()].sort((a, b) => compareProviders(a.provider, b.provider))
}

export function getCatalogProviderSummaries(
  entries: ModelCatalogEntry[] = buildModelCatalog(),
): CatalogProviderSummary[] {
  return CATALOG_PROVIDER_ORDER.flatMap((provider) => {
    const count = entries.filter((entry) => entry.provider === provider).length
    if (count === 0) return []
    const presentation = catalogProviderPresentation[provider]
    return [{ provider, ...presentation, count }]
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
  artworkName: string = familyName,
): FamilyMetadata {
  return {
    family: familyName,
    provider,
    platform,
    match,
    artwork: `/model-art/${artworkName}.jpg`,
    providerLogo: `/brand/${assetName}.svg`,
    modality,
    capabilities,
    summaryKey: `publicModels.families.${familyName}.summary`,
    descriptionKey: `publicModels.families.${familyName}.description`,
    contextWindow,
  }
}

function seedFromRawData(raw: RawVerifiedModelSeed): CuratedSeed {
  const metadata = families.find((item) => item.family === raw.family)
  if (!metadata) throw new Error(`Missing model family metadata: ${raw.family}`)
  return {
    ...metadata,
    contextWindow: raw.contextWindow ?? metadata.contextWindow,
    modelId: raw.modelId,
    displayName: raw.displayName,
    featured: raw.featured ?? false,
    sortOrder: raw.sortOrder,
    pricingSource: {
      status: raw.pricingStatus,
      official: raw.official,
      tiers: raw.tiers ?? [],
      multiplier: 0.7,
      sourceUrl: raw.sourceUrl,
      checkedAt: '2026-08-31',
      noteKey: raw.noteKey ?? null,
    },
    eligibilitySource: {
      source: 'packyapi',
      discountPercent: raw.discountPercent,
      checkedAt: '2026-08-31',
      sourceUrl: 'https://www.packyapi.com/pricing',
    },
    searchAliases: [...(providerSearchAliases[metadata.provider] ?? []), ...(raw.searchAliases ?? [])],
    modelClass: raw.modelClass,
    endpoints: raw.endpoints,
    isAlias: raw.isAlias ?? false,
    aliasNoteKey: raw.aliasNoteKey ?? null,
  }
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
    pricingSource: item.pricingSource,
    eligibilitySource: item.eligibilitySource,
    searchAliases: item.searchAliases,
    modelClass: item.modelClass,
    endpoints: item.endpoints,
    isAlias: item.isAlias,
    aliasNoteKey: item.aliasNoteKey,
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
    eligibilitySource: null,
    searchAliases: [],
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

function compareCatalogSort(a: ModelCatalogEntry, b: ModelCatalogEntry, sort: ModelCatalogSort): number {
  if (sort === 'name') return a.displayName.localeCompare(b.displayName)
  if (sort === 'input-price') {
    return compareNullablePrice(ownApiSortPrice(a, 'input'), ownApiSortPrice(b, 'input'))
      || a.displayName.localeCompare(b.displayName)
  }
  if (sort === 'output-price') {
    return compareNullablePrice(ownApiSortPrice(a, 'output'), ownApiSortPrice(b, 'output'))
      || a.displayName.localeCompare(b.displayName)
  }
  return compareFeatured(a, b)
}

function compareProviders(a: string, b: string): number {
  const aIndex = CATALOG_PROVIDER_ORDER.indexOf(a as typeof CATALOG_PROVIDER_ORDER[number])
  const bIndex = CATALOG_PROVIDER_ORDER.indexOf(b as typeof CATALOG_PROVIDER_ORDER[number])
  if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
  if (aIndex !== -1) return -1
  if (bIndex !== -1) return 1
  return a.localeCompare(b)
}

function compareNullablePrice(a: number | null | undefined, b: number | null | undefined): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return a - b
}

function ownApiSortPrice(entry: ModelCatalogEntry, kind: 'input' | 'output'): number | null {
  if (!entry.pricingSource) return null
  return calculateOwnApiPricing(entry.pricingSource.official, entry.pricingSource.multiplier)[kind]
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
