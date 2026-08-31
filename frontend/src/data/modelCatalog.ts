import type {
  FeaturedModelConfig,
  ModelDisplayConfig,
  ModelDisplayPricingConfig,
} from '@/api/modelDisplay'

export type ModelFamily = 'gpt' | 'claude' | 'gemini' | 'deepseek' | 'grok' | 'qwen' | 'glm' | 'kimi' | 'ownapi'
export type ModelCatalogSort = 'featured' | 'name' | 'input-price' | 'output-price'

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
}

interface VerifiedSeedOptions {
  modelId: string
  displayName: string
  family: Exclude<ModelFamily, 'ownapi'>
  modelClass: string[]
  endpoints: string[]
  official: OfficialTokenPricing
  sourceUrl: string
  checkedAt: ModelPricingSource['checkedAt']
  longContext?: LongContextPricing
  contextWindow?: string | null
  isAlias?: boolean
  aliasNoteKey?: string
  featured?: boolean
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

export const verifiedCatalogSeeds: CuratedSeed[] = [
  verifiedSeed({
    modelId: 'gpt-5.4', displayName: 'GPT-5.4', family: 'gpt',
    modelClass: ['flagship', 'coding', 'reasoning'], endpoints: ['openai'],
    official: { input: 2.5, cachedInput: 0.25, output: 15 },
    sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.4', checkedAt: '2026-08-31', featured: true, sortOrder: 10,
  }),
  verifiedSeed({
    modelId: 'gpt-5.4-mini', displayName: 'GPT-5.4 Mini', family: 'gpt',
    modelClass: ['balanced', 'fast', 'coding'], endpoints: ['openai'],
    official: { input: 0.75, cachedInput: 0.075, output: 4.5 },
    sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.4-mini', checkedAt: '2026-08-31', sortOrder: 20,
  }),
  verifiedSeed({
    modelId: 'gpt-5.5', displayName: 'GPT-5.5', family: 'gpt',
    modelClass: ['flagship', 'coding', 'reasoning'], endpoints: ['openai'],
    official: { input: 5, cachedInput: 0.5, output: 30 },
    sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.5', checkedAt: '2026-08-31', featured: true, sortOrder: 30,
  }),
  verifiedSeed({
    modelId: 'gpt-5.6-luna', displayName: 'GPT-5.6 Luna', family: 'gpt',
    modelClass: ['fast', 'balanced'], endpoints: ['openai'],
    official: { input: 0.2, cachedInput: 0.02, output: 1.2 },
    sourceUrl: 'https://developers.openai.com/api/docs/models/compare', checkedAt: '2026-08-31', sortOrder: 40,
  }),
  verifiedSeed({
    modelId: 'gpt-5.6-sol', displayName: 'GPT-5.6 Sol', family: 'gpt',
    modelClass: ['flagship', 'coding', 'reasoning'], endpoints: ['openai'],
    official: { input: 4, cachedInput: 0.4, output: 20 },
    sourceUrl: 'https://developers.openai.com/api/docs/models/compare', checkedAt: '2026-08-31', featured: true, sortOrder: 50,
  }),
  verifiedSeed({
    modelId: 'gpt-5.6-terra', displayName: 'GPT-5.6 Terra', family: 'gpt',
    modelClass: ['balanced', 'coding', 'reasoning'], endpoints: ['openai'],
    official: { input: 2, cachedInput: 0.2, output: 12 },
    sourceUrl: 'https://developers.openai.com/api/docs/models/compare', checkedAt: '2026-08-31', sortOrder: 60,
  }),
  verifiedSeed({
    modelId: 'codex-auto-review', displayName: 'Codex Auto Review', family: 'gpt',
    modelClass: ['coding', 'reasoning'], endpoints: ['openai'],
    official: { input: 2.5, cachedInput: 0.25, output: 15 },
    sourceUrl: 'https://help.openai.com/en/articles/20001415', checkedAt: '2026-08-31',
    isAlias: true, aliasNoteKey: 'publicModels.aliases.codexAutoReview', sortOrder: 70,
  }),
  verifiedSeed({
    modelId: 'claude-haiku-4-5-20251001', displayName: 'Claude Haiku 4.5', family: 'claude',
    modelClass: ['fast', 'balanced'], endpoints: ['anthropic'],
    official: { input: 1, cachedInput: 0.1, output: 5 },
    sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing', checkedAt: '2026-08-31', contextWindow: '200K', sortOrder: 80,
  }),
  verifiedSeed({
    modelId: 'claude-opus-4-6', displayName: 'Claude Opus 4.6', family: 'claude',
    modelClass: ['flagship', 'coding', 'reasoning'], endpoints: ['anthropic'],
    official: { input: 5, cachedInput: 0.5, output: 25 },
    sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing', checkedAt: '2026-08-31', featured: true, sortOrder: 90,
  }),
  verifiedSeed({
    modelId: 'claude-opus-4-7', displayName: 'Claude Opus 4.7', family: 'claude',
    modelClass: ['flagship', 'coding', 'reasoning'], endpoints: ['anthropic'],
    official: { input: 5, cachedInput: 0.5, output: 25 },
    sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing', checkedAt: '2026-08-31', sortOrder: 100,
  }),
  verifiedSeed({
    modelId: 'claude-opus-4-8', displayName: 'Claude Opus 4.8', family: 'claude',
    modelClass: ['flagship', 'coding', 'reasoning'], endpoints: ['anthropic'],
    official: { input: 5, cachedInput: 0.5, output: 25 },
    sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing', checkedAt: '2026-08-31', sortOrder: 110,
  }),
  verifiedSeed({
    modelId: 'claude-opus-5', displayName: 'Claude Opus 5', family: 'claude',
    modelClass: ['flagship', 'coding', 'reasoning'], endpoints: ['anthropic'],
    official: { input: 5, cachedInput: 0.5, output: 25 },
    sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing', checkedAt: '2026-08-31', sortOrder: 120,
  }),
  verifiedSeed({
    modelId: 'claude-sonnet-4-6', displayName: 'Claude Sonnet 4.6', family: 'claude',
    modelClass: ['balanced', 'coding', 'reasoning'], endpoints: ['anthropic'],
    official: { input: 3, cachedInput: 0.3, output: 15 },
    sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing', checkedAt: '2026-08-31', featured: true, sortOrder: 130,
  }),
  verifiedSeed({
    modelId: 'claude-sonnet-5', displayName: 'Claude Sonnet 5', family: 'claude',
    modelClass: ['balanced', 'coding', 'reasoning'], endpoints: ['anthropic'],
    official: { input: 2, cachedInput: 0.2, output: 10 },
    sourceUrl: 'https://platform.claude.com/docs/en/release-notes/overview', checkedAt: '2026-08-31', sortOrder: 140,
  }),
  verifiedSeed({
    modelId: 'grok-4.5', displayName: 'Grok 4.5', family: 'grok',
    modelClass: ['flagship', 'reasoning'], endpoints: ['openai'],
    official: { input: 2, cachedInput: 0.3, output: 6 },
    longContext: { input: 4, cachedInput: 0.6, output: 12, thresholdTokens: 200_000 },
    sourceUrl: 'https://docs.x.ai/developers/pricing', checkedAt: '2026-08-31', sortOrder: 150,
  }),
  verifiedSeed({
    modelId: 'grok-4.6', displayName: 'Grok 4.6', family: 'grok',
    modelClass: ['flagship', 'reasoning'], endpoints: ['openai'],
    official: { input: 2, cachedInput: 0.5, output: 6 },
    longContext: { input: 4, cachedInput: 1, output: 12, thresholdTokens: 200_000 },
    sourceUrl: 'https://docs.x.ai/developers/pricing', checkedAt: '2026-08-31', sortOrder: 160,
  }),
]

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
  const query = normalize(filters.query ?? '')
  const provider = filters.provider ?? ''
  const modelClass = filters.modelClass ?? ''
  const endpoint = filters.endpoint ?? ''
  const sort = filters.sort ?? 'featured'
  const result = entries.filter((entry) => {
    const queryTarget = normalize([
      entry.modelId,
      entry.displayName,
      entry.provider,
      ...entry.capabilities,
      ...entry.modelClass,
      ...entry.endpoints,
    ].join(' '))
    return (!query || queryTarget.includes(query))
      && (!provider || entry.provider === provider)
      && (!modelClass || entry.modelClass.includes(modelClass))
      && (!endpoint || entry.endpoints.includes(endpoint))
  })

  return [...result].sort((a, b) => {
    if (sort === 'name') return a.displayName.localeCompare(b.displayName)
    if (sort === 'input-price') return compareNullablePrice(ownApiSortPrice(a, 'input'), ownApiSortPrice(b, 'input'))
    if (sort === 'output-price') return compareNullablePrice(ownApiSortPrice(a, 'output'), ownApiSortPrice(b, 'output'))
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

function verifiedSeed(options: VerifiedSeedOptions): CuratedSeed {
  const metadata = families.find((item) => item.family === options.family)
  if (!metadata) throw new Error(`Missing model family metadata: ${options.family}`)
  return {
    ...metadata,
    contextWindow: options.contextWindow ?? metadata.contextWindow,
    modelId: options.modelId,
    displayName: options.displayName,
    featured: options.featured ?? false,
    sortOrder: options.sortOrder,
    pricingSource: {
      official: options.official,
      longContext: options.longContext,
      multiplier: 0.7,
      sourceUrl: options.sourceUrl,
      checkedAt: options.checkedAt,
    },
    modelClass: options.modelClass,
    endpoints: options.endpoints,
    isAlias: options.isAlias ?? false,
    aliasNoteKey: options.aliasNoteKey ?? null,
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
