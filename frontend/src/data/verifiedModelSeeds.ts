export type VerifiedModelFamily = 'gpt' | 'claude' | 'gemini' | 'deepseek' | 'grok' | 'qwen' | 'glm' | 'kimi' | 'minimax'
export type ModelPricingStatus = 'paid' | 'free' | 'unpublished'

export interface OfficialTokenPricing {
  input: number | null
  cachedInput: number | null
  output: number | null
}

export interface OfficialPricingTier {
  id: string
  minInputTokens: number
  minInclusive: boolean
  maxInputTokens: number | null
  maxInclusive: boolean
  official: OfficialTokenPricing
}

export interface CatalogEligibilitySource {
  source: 'packyapi'
  discountPercent: number
  checkedAt: '2026-08-31'
  sourceUrl: 'https://www.packyapi.com/pricing'
}

export interface ModelPricingSource {
  status: ModelPricingStatus
  official: OfficialTokenPricing
  tiers: OfficialPricingTier[]
  multiplier: 0.7
  sourceUrl: string
  checkedAt: '2026-08-31'
  noteKey: string | null
}

export interface RawVerifiedModelSeed {
  modelId: string
  displayName: string
  family: VerifiedModelFamily
  modelClass: string[]
  endpoints: string[]
  pricingStatus: ModelPricingStatus
  official: OfficialTokenPricing
  tiers?: OfficialPricingTier[]
  sourceUrl: string
  noteKey?: string
  discountPercent: number
  searchAliases?: string[]
  contextWindow?: string | null
  isAlias?: boolean
  aliasNoteKey?: string
  featured?: boolean
  sortOrder: number
}

export const verifiedModelSeedData: RawVerifiedModelSeed[] = [
  seed('gpt-5.4', 'GPT-5.4', 'gpt', ['flagship', 'coding', 'reasoning'], ['openai'], { input: 2.5, cachedInput: 0.25, output: 15 }, 'https://developers.openai.com/api/docs/models/gpt-5.4', 93, 10, { featured: true }),
  seed('gpt-5.4-mini', 'GPT-5.4 Mini', 'gpt', ['balanced', 'fast', 'coding'], ['openai'], { input: 0.75, cachedInput: 0.075, output: 4.5 }, 'https://developers.openai.com/api/docs/models/gpt-5.4-mini', 93, 20, { contextWindow: '400K' }),
  seed('gpt-5.5', 'GPT-5.5', 'gpt', ['flagship', 'coding', 'reasoning'], ['openai'], { input: 5, cachedInput: 0.5, output: 30 }, 'https://developers.openai.com/api/docs/models/gpt-5.5', 93, 30, { featured: true }),
  seed('gpt-5.6-luna', 'GPT-5.6 Luna', 'gpt', ['fast', 'balanced'], ['openai'], { input: 0.2, cachedInput: 0.02, output: 1.2 }, 'https://developers.openai.com/api/docs/models/compare', 93, 40),
  seed('gpt-5.6-sol', 'GPT-5.6 Sol', 'gpt', ['flagship', 'coding', 'reasoning'], ['openai'], { input: 4, cachedInput: 0.4, output: 20 }, 'https://developers.openai.com/api/docs/models/compare', 93, 50, { featured: true }),
  seed('gpt-5.6-terra', 'GPT-5.6 Terra', 'gpt', ['balanced', 'coding', 'reasoning'], ['openai'], { input: 2, cachedInput: 0.2, output: 12 }, 'https://developers.openai.com/api/docs/models/compare', 93, 60),
  seed('codex-auto-review', 'Codex Auto Review', 'gpt', ['coding', 'reasoning'], ['openai'], { input: 2.5, cachedInput: 0.25, output: 15 }, 'https://help.openai.com/en/articles/20001415', 93, 70, { isAlias: true, aliasNoteKey: 'publicModels.aliases.codexAutoReview', searchAliases: ['codex review'] }),
  seed('claude-haiku-4-5-20251001', 'Claude Haiku 4.5', 'claude', ['fast', 'balanced'], ['anthropic'], { input: 1, cachedInput: 0.1, output: 5 }, 'https://platform.claude.com/docs/en/about-claude/pricing', 96, 80, { contextWindow: '200K' }),
  seed('claude-opus-4-6', 'Claude Opus 4.6', 'claude', ['flagship', 'coding', 'reasoning'], ['anthropic'], { input: 5, cachedInput: 0.5, output: 25 }, 'https://platform.claude.com/docs/en/about-claude/pricing', 96, 90, { featured: true }),
  seed('claude-opus-4-7', 'Claude Opus 4.7', 'claude', ['flagship', 'coding', 'reasoning'], ['anthropic'], { input: 5, cachedInput: 0.5, output: 25 }, 'https://platform.claude.com/docs/en/about-claude/pricing', 96, 100),
  seed('claude-opus-4-8', 'Claude Opus 4.8', 'claude', ['flagship', 'coding', 'reasoning'], ['anthropic'], { input: 5, cachedInput: 0.5, output: 25 }, 'https://platform.claude.com/docs/en/about-claude/pricing', 96, 110),
  seed('claude-opus-5', 'Claude Opus 5', 'claude', ['flagship', 'coding', 'reasoning'], ['anthropic'], { input: 5, cachedInput: 0.5, output: 25 }, 'https://platform.claude.com/docs/en/about-claude/pricing', 96, 120),
  seed('claude-sonnet-4-6', 'Claude Sonnet 4.6', 'claude', ['balanced', 'coding', 'reasoning'], ['anthropic'], { input: 3, cachedInput: 0.3, output: 15 }, 'https://platform.claude.com/docs/en/about-claude/pricing', 96, 130, { featured: true }),
  seed('claude-sonnet-5', 'Claude Sonnet 5', 'claude', ['balanced', 'coding', 'reasoning'], ['anthropic'], { input: 2, cachedInput: 0.2, output: 10 }, 'https://platform.claude.com/docs/en/release-notes/overview', 96, 140),
  seed('grok-4.5', 'Grok 4.5', 'grok', ['flagship', 'reasoning'], ['openai'], { input: 2, cachedInput: 0.3, output: 6 }, 'https://docs.x.ai/developers/pricing', 99, 150, {
    contextWindow: '500K',
    tiers: [{ id: 'long', minInputTokens: 200_000, minInclusive: true, maxInputTokens: null, maxInclusive: true, official: { input: 4, cachedInput: 0.6, output: 12 } }],
  }),
  seed('grok-4.6', 'Grok 4.6', 'grok', ['flagship', 'reasoning'], ['openai'], { input: 2, cachedInput: 0.5, output: 6 }, 'https://docs.x.ai/developers/pricing', 99, 160, {
    contextWindow: '500K',
    tiers: [{ id: 'long', minInputTokens: 200_000, minInclusive: true, maxInputTokens: null, maxInclusive: true, official: { input: 4, cachedInput: 1, output: 12 } }],
  }),
]

interface SeedOverrides {
  tiers?: OfficialPricingTier[]
  noteKey?: string
  searchAliases?: string[]
  contextWindow?: string | null
  isAlias?: boolean
  aliasNoteKey?: string
  featured?: boolean
}

function seed(
  modelId: string,
  displayName: string,
  family: VerifiedModelFamily,
  modelClass: string[],
  endpoints: string[],
  official: OfficialTokenPricing,
  sourceUrl: string,
  discountPercent: number,
  sortOrder: number,
  overrides: SeedOverrides = {},
): RawVerifiedModelSeed {
  return {
    modelId,
    displayName,
    family,
    modelClass,
    endpoints,
    pricingStatus: 'paid',
    official,
    sourceUrl,
    discountPercent,
    sortOrder,
    ...overrides,
  }
}
