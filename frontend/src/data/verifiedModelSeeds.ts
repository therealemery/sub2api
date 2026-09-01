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
  seed('gpt-daybreak-blue-latest', 'GPT Daybreak Blue', 'gpt', ['preview', 'reasoning'], ['openai'], { input: null, cachedInput: null, output: null }, 'https://developers.openai.com/api/docs/models/all', 91, 65, {
    pricingStatus: 'unpublished', searchAliases: ['daybreak blue', 'gpt daybreak'],
  }),
  seed('codex-auto-review', 'Codex Auto Review', 'gpt', ['coding', 'reasoning'], ['openai'], { input: 2.5, cachedInput: 0.25, output: 15 }, 'https://help.openai.com/en/articles/20001415', 93, 70, { isAlias: true, aliasNoteKey: 'publicModels.aliases.codexAutoReview', searchAliases: ['codex review'] }),
  seed('omni-moderation-latest', 'Omni Moderation', 'gpt', ['moderation', 'fast'], ['openai'], { input: 0, cachedInput: 0, output: 0 }, 'https://developers.openai.com/api/docs/models/omni-moderation-latest', 86, 75, {
    pricingStatus: 'free', searchAliases: ['moderation', 'omni moderation'], contextWindow: null,
  }),
  seed('claude-fable-5', 'Claude Fable 5', 'claude', ['flagship', 'reasoning', 'long-context'], ['anthropic'], { input: 10, cachedInput: 1, output: 50 }, 'https://platform.claude.com/docs/en/about-claude/pricing', 71, 77, { contextWindow: '1M' }),
  seed('claude-haiku-4-5-20251001', 'Claude Haiku 4.5', 'claude', ['fast', 'balanced'], ['anthropic'], { input: 1, cachedInput: 0.1, output: 5 }, 'https://platform.claude.com/docs/en/about-claude/pricing', 96, 80, { contextWindow: '200K' }),
  seed('claude-opus-4-6', 'Claude Opus 4.6', 'claude', ['flagship', 'coding', 'reasoning'], ['anthropic'], { input: 5, cachedInput: 0.5, output: 25 }, 'https://platform.claude.com/docs/en/about-claude/pricing', 96, 90, { featured: true }),
  seed('claude-opus-4-7', 'Claude Opus 4.7', 'claude', ['flagship', 'coding', 'reasoning'], ['anthropic'], { input: 5, cachedInput: 0.5, output: 25 }, 'https://platform.claude.com/docs/en/about-claude/pricing', 96, 100),
  seed('claude-opus-4-8', 'Claude Opus 4.8', 'claude', ['flagship', 'coding', 'reasoning'], ['anthropic'], { input: 5, cachedInput: 0.5, output: 25 }, 'https://platform.claude.com/docs/en/about-claude/pricing', 96, 110),
  seed('claude-opus-5', 'Claude Opus 5', 'claude', ['flagship', 'coding', 'reasoning'], ['anthropic'], { input: 5, cachedInput: 0.5, output: 25 }, 'https://platform.claude.com/docs/en/about-claude/pricing', 96, 120),
  seed('claude-sonnet-4-5-20250929', 'Claude Sonnet 4.5', 'claude', ['balanced', 'coding', 'reasoning'], ['anthropic'], { input: 3, cachedInput: 0.3, output: 15 }, 'https://platform.claude.com/docs/en/about-claude/pricing', 71, 125, { contextWindow: '200K' }),
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
  seed('gemini-2.5-flash', 'Gemini 2.5 Flash', 'gemini', ['fast', 'multimodal'], ['openai'], { input: 0.3, cachedInput: 0.03, output: 2.5 }, 'https://ai.google.dev/gemini-api/docs/pricing', 57, 170, { contextWindow: '1M' }),
  seed('gemini-2.5-pro', 'Gemini 2.5 Pro', 'gemini', ['flagship', 'reasoning', 'multimodal'], ['openai'], { input: 1.25, cachedInput: 0.125, output: 10 }, 'https://ai.google.dev/gemini-api/docs/pricing', 57, 180, {
    contextWindow: '1M',
    tiers: [{ id: 'over-200k', minInputTokens: 200_000, minInclusive: false, maxInputTokens: null, maxInclusive: true, official: { input: 2.5, cachedInput: 0.25, output: 15 } }],
  }),
  seed('gemini-3-flash-preview', 'Gemini 3 Flash Preview', 'gemini', ['fast', 'preview', 'multimodal'], ['openai'], { input: 0.5, cachedInput: 0.05, output: 3 }, 'https://ai.google.dev/gemini-api/docs/pricing', 57, 190, { contextWindow: null }),
  seed('gemini-3-pro-preview', 'Gemini 3 Pro Preview', 'gemini', ['flagship', 'preview', 'reasoning'], ['openai'], { input: null, cachedInput: null, output: null }, 'https://ai.google.dev/gemini-api/docs/pricing', 57, 200, { pricingStatus: 'unpublished', contextWindow: null }),
  seed('gemini-3.1-pro-preview', 'Gemini 3.1 Pro Preview', 'gemini', ['flagship', 'preview', 'reasoning'], ['openai'], { input: 2, cachedInput: 0.2, output: 12 }, 'https://ai.google.dev/gemini-api/docs/pricing', 57, 210, {
    contextWindow: '1M',
    tiers: [{ id: 'over-200k', minInputTokens: 200_000, minInclusive: false, maxInputTokens: null, maxInclusive: true, official: { input: 4, cachedInput: 0.4, output: 18 } }],
  }),
  seed('gemini-3.5-flash', 'Gemini 3.5 Flash', 'gemini', ['fast', 'multimodal'], ['openai'], { input: 1.5, cachedInput: 0.15, output: 9 }, 'https://ai.google.dev/gemini-api/docs/pricing', 57, 220, { contextWindow: null }),
  seed('gemini-3.7-flash', 'Gemini 3.7 Flash', 'gemini', ['fast', 'multimodal'], ['openai'], { input: 1.5, cachedInput: 0.15, output: 7.5 }, 'https://ai.google.dev/gemini-api/docs/pricing', 57, 230, { contextWindow: null, noteKey: 'publicModels.pricingNotes.googleIntroductory' }),
  seed('qwen3-coder-next', 'Qwen3 Coder Next', 'qwen', ['coding', 'reasoning'], ['openai'], { input: 0.144, cachedInput: null, output: 0.574 }, 'https://www.alibabacloud.com/help/en/model-studio/model-pricing', 50, 240, {
    contextWindow: '256K', noteKey: 'publicModels.pricingNotes.alibabaGlobal',
    tiers: [
      { id: '32k-128k', minInputTokens: 32_000, minInclusive: false, maxInputTokens: 128_000, maxInclusive: true, official: { input: 0.216, cachedInput: null, output: 0.861 } },
      { id: '128k-256k', minInputTokens: 128_000, minInclusive: false, maxInputTokens: 256_000, maxInclusive: true, official: { input: 0.359, cachedInput: null, output: 1.434 } },
    ],
  }),
  seed('qwen3-max', 'Qwen3 Max', 'qwen', ['flagship', 'reasoning'], ['openai'], { input: 1.2, cachedInput: null, output: 6 }, 'https://www.alibabacloud.com/help/en/model-studio/model-pricing', 50, 250, {
    contextWindow: '256K', noteKey: 'publicModels.pricingNotes.alibabaGlobal',
    tiers: [
      { id: '32k-128k', minInputTokens: 32_000, minInclusive: false, maxInputTokens: 128_000, maxInclusive: true, official: { input: 2.4, cachedInput: null, output: 12 } },
      { id: '128k-256k', minInputTokens: 128_000, minInclusive: false, maxInputTokens: 256_000, maxInclusive: true, official: { input: 3, cachedInput: null, output: 15 } },
    ],
  }),
  seed('qwen3-vl-flash', 'Qwen3 VL Flash', 'qwen', ['fast', 'vision', 'multimodal'], ['openai'], { input: 0.022, cachedInput: null, output: 0.215 }, 'https://www.alibabacloud.com/help/en/model-studio/model-pricing', 50, 260, {
    contextWindow: '256K', noteKey: 'publicModels.pricingNotes.alibabaGlobal',
    tiers: [
      { id: '32k-128k', minInputTokens: 32_000, minInclusive: false, maxInputTokens: 128_000, maxInclusive: true, official: { input: 0.043, cachedInput: null, output: 0.43 } },
      { id: '128k-256k', minInputTokens: 128_000, minInclusive: false, maxInputTokens: 256_000, maxInclusive: true, official: { input: 0.086, cachedInput: null, output: 0.859 } },
    ],
  }),
  seed('qwen3.5-flash', 'Qwen3.5 Flash', 'qwen', ['fast', 'multimodal'], ['openai'], { input: 0.029, cachedInput: null, output: 0.287 }, 'https://www.alibabacloud.com/help/en/model-studio/model-pricing', 50, 270, {
    contextWindow: '1M', noteKey: 'publicModels.pricingNotes.alibabaGlobal',
    tiers: [
      { id: '128k-256k', minInputTokens: 128_000, minInclusive: false, maxInputTokens: 256_000, maxInclusive: true, official: { input: 0.115, cachedInput: null, output: 1.147 } },
      { id: '256k-1m', minInputTokens: 256_000, minInclusive: false, maxInputTokens: 1_000_000, maxInclusive: true, official: { input: 0.172, cachedInput: null, output: 1.72 } },
    ],
  }),
  seed('qwen3.5-plus', 'Qwen3.5 Plus', 'qwen', ['balanced', 'reasoning', 'multimodal'], ['openai'], { input: 0.115, cachedInput: null, output: 0.688 }, 'https://www.alibabacloud.com/help/en/model-studio/model-pricing', 50, 280, {
    contextWindow: '1M', noteKey: 'publicModels.pricingNotes.alibabaGlobal',
    tiers: [
      { id: '128k-256k', minInputTokens: 128_000, minInclusive: false, maxInputTokens: 256_000, maxInclusive: true, official: { input: 0.287, cachedInput: null, output: 1.72 } },
      { id: '256k-1m', minInputTokens: 256_000, minInclusive: false, maxInputTokens: 1_000_000, maxInclusive: true, official: { input: 0.573, cachedInput: null, output: 3.44 } },
    ],
  }),
  seed('qwen3.6-max-preview', 'Qwen3.6 Max Preview', 'qwen', ['flagship', 'preview', 'reasoning'], ['openai'], { input: 1.3, cachedInput: null, output: 7.8 }, 'https://www.alibabacloud.com/help/en/model-studio/model-pricing', 50, 290, {
    contextWindow: '256K', noteKey: 'publicModels.pricingNotes.alibabaGlobal',
    tiers: [{ id: '128k-256k', minInputTokens: 128_000, minInclusive: false, maxInputTokens: 256_000, maxInclusive: true, official: { input: 2, cachedInput: null, output: 12 } }],
  }),
  seed('qwen3.6-plus', 'Qwen3.6 Plus', 'qwen', ['balanced', 'reasoning'], ['openai'], { input: 0.276, cachedInput: null, output: 1.651 }, 'https://www.alibabacloud.com/help/en/model-studio/model-pricing', 50, 300, {
    contextWindow: '1M', noteKey: 'publicModels.pricingNotes.alibabaGlobal',
    tiers: [{ id: '256k-1m', minInputTokens: 256_000, minInclusive: false, maxInputTokens: 1_000_000, maxInclusive: true, official: { input: 1.101, cachedInput: null, output: 6.602 } }],
  }),
  seed('qwen3.7-max', 'Qwen3.7 Max', 'qwen', ['flagship', 'reasoning'], ['openai'], { input: 2.5, cachedInput: null, output: 7.5 }, 'https://www.alibabacloud.com/help/en/model-studio/model-pricing', 50, 310, { contextWindow: null, noteKey: 'publicModels.pricingNotes.alibabaGlobal' }),
  seed('qwen3.7-plus', 'Qwen3.7 Plus', 'qwen', ['balanced', 'reasoning'], ['openai'], { input: 0.4, cachedInput: null, output: 1.6 }, 'https://www.alibabacloud.com/help/en/model-studio/model-pricing', 50, 320, {
    contextWindow: '1M', noteKey: 'publicModels.pricingNotes.alibabaGlobal',
    tiers: [{ id: '256k-1m', minInputTokens: 256_000, minInclusive: false, maxInputTokens: 1_000_000, maxInclusive: true, official: { input: 1.2, cachedInput: null, output: 4.8 } }],
  }),
  seed('qwen3.8-flash', 'Qwen3.8 Flash', 'qwen', ['fast', 'multimodal'], ['openai'], { input: 0.113, cachedInput: null, output: 0.382 }, 'https://www.alibabacloud.com/help/en/model-studio/model-pricing', 50, 330, { contextWindow: null, noteKey: 'publicModels.pricingNotes.alibabaGlobal' }),
  seed('qwen3.8-max', 'Qwen3.8 Max', 'qwen', ['flagship', 'reasoning'], ['openai'], { input: 2, cachedInput: null, output: 6 }, 'https://www.alibabacloud.com/help/en/model-studio/model-pricing', 50, 340, { contextWindow: null, noteKey: 'publicModels.pricingNotes.alibabaGlobal' }),
  seed('glm-5', 'GLM-5', 'glm', ['flagship', 'reasoning', 'coding'], ['openai'], { input: 1, cachedInput: 0.2, output: 3.2 }, 'https://docs.z.ai/guides/overview/pricing', 50, 350, { contextWindow: null }),
  seed('glm-5.2', 'GLM-5.2', 'glm', ['flagship', 'reasoning'], ['openai'], { input: null, cachedInput: null, output: null }, 'https://docs.z.ai/guides/overview/pricing', 50, 360, { pricingStatus: 'unpublished', contextWindow: null }),
  seed('kimi-k2.5', 'Kimi K2.5', 'kimi', ['balanced', 'reasoning', 'long-context'], ['openai'], { input: null, cachedInput: null, output: null }, 'https://platform.kimi.com/docs/pricing/chat', 50, 380, { pricingStatus: 'unpublished', contextWindow: null }),
  seed('kimi-k3', 'Kimi K3', 'kimi', ['flagship', 'reasoning', 'long-context'], ['openai'], { input: 3, cachedInput: 0.3, output: 15 }, 'https://platform.kimi.com/docs/pricing/chat-k3', 65, 390, { contextWindow: '1M' }),
  seed('minimax-m2.5', 'MiniMax M2.5', 'minimax', ['balanced', 'reasoning'], ['openai'], { input: 0.3, cachedInput: 0.03, output: 1.2 }, 'https://platform.minimax.io/docs/guides/pricing-paygo', 50, 400, { contextWindow: null }),
  seed('MiniMax-M2.7', 'MiniMax M2.7', 'minimax', ['balanced', 'reasoning'], ['openai'], { input: 0.3, cachedInput: 0.06, output: 1.2 }, 'https://platform.minimax.io/docs/guides/pricing-paygo', 50, 410, { contextWindow: null }),
]

interface SeedOverrides {
  pricingStatus?: ModelPricingStatus
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
    pricingStatus: overrides.pricingStatus ?? 'paid',
    official,
    sourceUrl,
    discountPercent,
    sortOrder,
    ...overrides,
  }
}
