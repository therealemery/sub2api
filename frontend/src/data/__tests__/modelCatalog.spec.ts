import { describe, expect, it } from 'vitest'
import type { ModelDisplayConfig } from '@/api/modelDisplay'
import {
  CATALOG_PROVIDER_ORDER,
  activeOfficialTier,
  buildModelCatalog,
  calculateOwnApiPricing,
  filterModelCatalog,
  formatCatalogPrice,
  findCatalogModel,
  getCatalogProviderSummaries,
  groupModelCatalog,
  normalizeCatalogSearch,
  relatedCatalogModels,
  scoreCatalogMatch,
  verifiedCatalogSeeds,
  verifiedModelSeedData,
} from '../modelCatalog'

const emptyConfig: ModelDisplayConfig = {
  featured_models: [],
  pricing_models: [],
  reference_discount: null,
}

describe('modelCatalog', () => {
  it('calculates OwnAPI pricing from official token rates', () => {
    expect(calculateOwnApiPricing({ input: 2.5, cachedInput: 0.25, output: 15 })).toEqual({
      input: 1.75,
      cachedInput: 0.175,
      output: 10.5,
    })
  })

  it('applies the approved Packy profit policy and excludes unprofitable models', () => {
    const catalog = buildModelCatalog(emptyConfig)
    expect(catalog.find((entry) => entry.modelId === 'gpt-5.4')?.pricingSource?.multiplier).toBe(0.8)
    expect(catalog.find((entry) => entry.modelId === 'gpt-5.4-mini')?.pricingSource?.multiplier).toBe(0.7)
    for (const modelId of ['gpt-daybreak-blue-latest', 'claude-fable-5', 'gemini-3.7-flash', 'kimi-k3']) {
      expect(catalog.some((entry) => entry.modelId === modelId)).toBe(false)
    }
  })

  it('never publishes Claude Code-only upstream models, including live config entries', () => {
    const restricted = ['Claude-Haiku-4-5-20251001', 'CLAUDE_SONNET_4_5_20250929']
    const catalog = buildModelCatalog({
      featured_models: [],
      reference_discount: null,
      pricing_models: restricted.map((model) => ({
        model,
        platform: 'anthropic',
        billing_mode: 'token',
        input_price: 0.000001,
        output_price: 0.000005,
        cache_write_price: null,
        cache_read_price: null,
        image_output_price: null,
        per_request_price: null,
        sort_order: 1,
      })),
    })

    expect(catalog).toHaveLength(44)
    expect(catalog.some((entry) => entry.modelId.toLowerCase().includes('claude-haiku-4-5'))).toBe(false)
    expect(catalog.some((entry) => entry.modelId.toLowerCase().includes('claude-sonnet-4-5'))).toBe(false)
  })

  it('merges dotted live Claude aliases into their canonical catalog entries', () => {
    const catalog = buildModelCatalog({
      featured_models: [],
      reference_discount: null,
      pricing_models: [{
        model: 'Claude-Opus-4.7',
        platform: 'anthropic',
        billing_mode: 'token',
        input_price: 0.000003,
        output_price: 0.000015,
        cache_write_price: 0.00000375,
        cache_read_price: 0.0000003,
        image_output_price: null,
        per_request_price: null,
        sort_order: 1,
      }],
    })

    expect(catalog).toHaveLength(44)
    expect(catalog.filter((entry) => entry.slug === 'claude-opus-4-7')).toHaveLength(1)
    expect(catalog.find((entry) => entry.slug === 'claude-opus-4-7')?.modelId).toBe('claude-opus-4-7')
  })

  it('distinguishes pricing states and selects generic official tiers', () => {
    expect(activeOfficialTier({
      status: 'paid',
      official: { input: 2, cachedInput: 0.2, output: 12 },
      tiers: [{
        id: 'long',
        minInputTokens: 200_000,
        minInclusive: false,
        maxInputTokens: null,
        maxInclusive: true,
        official: { input: 4, cachedInput: 0.4, output: 18 },
      }],
      multiplier: 0.7,
      sourceUrl: 'https://vendor.example/pricing',
      checkedAt: '2026-08-31',
      noteKey: null,
    }, 'long')).toEqual({ input: 4, cachedInput: 0.4, output: 18 })

    expect(calculateOwnApiPricing({ input: 0, cachedInput: 0, output: 0 })).toEqual({
      input: 0,
      cachedInput: 0,
      output: 0,
    })
  })

  it('formats catalog prices without grouping and preserves useful precision', () => {
    expect(formatCatalogPrice(0.0525)).toBe('0.0525')
    expect(formatCatalogPrice(null)).toBeNull()
  })

  it('uses curated entries when the API config is empty', () => {
    const result = buildModelCatalog(emptyConfig)

    expect(result).toHaveLength(44)
    expect(result.map((item) => item.family)).toEqual(
      expect.arrayContaining(['gpt', 'claude', 'grok']),
    )
    expect(result[0]?.available).toBeNull()
  })

  it('contains the complete verified catalog with traceable discounted pricing', () => {
    const requiredIds = [
      'gpt-6-astra', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.5', 'gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra', 'codex-auto-review',
      'claude-opus-4-6', 'claude-opus-4-7', 'claude-opus-4-8', 'claude-opus-5',
      'claude-sonnet-4-6', 'claude-sonnet-5', 'grok-4.5', 'grok-4.6',
    ]
    const catalog = buildModelCatalog(emptyConfig)

    expect(verifiedCatalogSeeds.map((model) => model.modelId)).toEqual(expect.arrayContaining(requiredIds))
    expect(requiredIds.every((id) => catalog.some((model) => model.modelId === id))).toBe(true)
    expect(new Set(requiredIds).size).toBe(16)
    expect(Object.fromEntries(['OpenAI', 'Anthropic', 'xAI'].map((provider) => [
      provider,
      catalog.filter((model) => model.provider === provider).length,
    ]))).toEqual({ OpenAI: 8, Anthropic: 6, xAI: 2 })

    for (const modelId of requiredIds) {
      const model = catalog.find((entry) => entry.modelId === modelId)
      expect(model?.slug).toBe(modelId.replace(/[^a-z0-9]+/g, '-'))
      expect(model?.pricingSource).toMatchObject({
        status: expect.stringMatching(/^(paid|free|unpublished)$/),
        sourceUrl: expect.stringMatching(/^https:\/\//),
        checkedAt: '2026-09-07',
        multiplier: expect.any(Number),
      })
      expect(model?.eligibilitySource).toMatchObject({
        source: 'packyapi',
        discountPercent: expect.any(Number),
        checkedAt: '2026-09-07',
        sourceUrl: 'https://www.packyapi.com/pricing',
      })
      expect(model?.searchAliases).toEqual(expect.any(Array))
      expect(model?.providerLogo).toMatch(/^\/brand\/(openai|claude|grok)\.svg$/)

      const derived = model?.pricingSource && calculateOwnApiPricing(model.pricingSource.official)
      if (model?.pricingSource?.status === 'paid') {
        expect(derived?.input).toBeGreaterThan(0)
        expect(derived?.cachedInput).toBeGreaterThan(0)
        expect(derived?.output).toBeGreaterThan(0)
      }
    }

    expect(Object.fromEntries(requiredIds.map((modelId) => {
      const model = catalog.find((entry) => entry.modelId === modelId)
      return [modelId, model?.pricingSource?.official]
    }))).toEqual({
      'gpt-6-astra': { input: 5, cachedInput: 0.5, output: 25 },
      'gpt-5.4': { input: 2.5, cachedInput: 0.25, output: 15 },
      'gpt-5.4-mini': { input: 0.75, cachedInput: 0.075, output: 4.5 },
      'gpt-5.5': { input: 5, cachedInput: 0.5, output: 30 },
      'gpt-5.6-luna': { input: 0.2, cachedInput: 0.02, output: 1.2 },
      'gpt-5.6-sol': { input: 4, cachedInput: 0.4, output: 20 },
      'gpt-5.6-terra': { input: 2, cachedInput: 0.2, output: 12 },
      'codex-auto-review': { input: 2.5, cachedInput: 0.25, output: 15 },
      'claude-opus-4-6': { input: 5, cachedInput: 0.5, output: 25 },
      'claude-opus-4-7': { input: 5, cachedInput: 0.5, output: 25 },
      'claude-opus-4-8': { input: 5, cachedInput: 0.5, output: 25 },
      'claude-opus-5': { input: 5, cachedInput: 0.5, output: 25 },
      'claude-sonnet-4-6': { input: 3, cachedInput: 0.3, output: 15 },
      'claude-sonnet-5': { input: 2, cachedInput: 0.2, output: 10 },
      'grok-4.5': { input: 2, cachedInput: 0.3, output: 6 },
      'grok-4.6': { input: 2, cachedInput: 0.5, output: 6 },
    })

    expect(Object.fromEntries(requiredIds.map((modelId) => {
      const model = catalog.find((entry) => entry.modelId === modelId)
      return [modelId, model?.pricingSource?.sourceUrl]
    }))).toEqual({
      'gpt-6-astra': 'https://www.packyapi.com/pricing',
      'gpt-5.4': 'https://developers.openai.com/api/docs/models/gpt-5.4',
      'gpt-5.4-mini': 'https://developers.openai.com/api/docs/models/gpt-5.4-mini',
      'gpt-5.5': 'https://developers.openai.com/api/docs/models/gpt-5.5',
      'gpt-5.6-luna': 'https://developers.openai.com/api/docs/models/compare',
      'gpt-5.6-sol': 'https://developers.openai.com/api/docs/models/compare',
      'gpt-5.6-terra': 'https://developers.openai.com/api/docs/models/compare',
      'codex-auto-review': 'https://help.openai.com/en/articles/20001415',
      'claude-opus-4-6': 'https://platform.claude.com/docs/en/about-claude/pricing',
      'claude-opus-4-7': 'https://platform.claude.com/docs/en/about-claude/pricing',
      'claude-opus-4-8': 'https://platform.claude.com/docs/en/about-claude/pricing',
      'claude-opus-5': 'https://platform.claude.com/docs/en/about-claude/pricing',
      'claude-sonnet-4-6': 'https://platform.claude.com/docs/en/about-claude/pricing',
      'claude-sonnet-5': 'https://platform.claude.com/docs/en/release-notes/overview',
      'grok-4.5': 'https://docs.x.ai/developers/pricing',
      'grok-4.6': 'https://docs.x.ai/developers/pricing',
    })

    expect(catalog.find((model) => model.modelId === 'codex-auto-review')).toMatchObject({
      isAlias: true,
      aliasNoteKey: 'publicModels.aliases.codexAutoReview',
    })
    expect(catalog.find((model) => model.modelId === 'gpt-5.4-mini')?.contextWindow).toBe('400K')
    expect(catalog.find((model) => model.modelId === 'grok-4.5')?.contextWindow).toBe('500K')
    expect(catalog.find((model) => model.modelId === 'grok-4.6')?.contextWindow).toBe('500K')
    expect(catalog.find((model) => model.modelId === 'grok-4.5')?.pricingSource?.tiers).toEqual([{
      id: 'long', minInputTokens: 200_000, minInclusive: true, maxInputTokens: null, maxInclusive: true,
      official: { input: 4, cachedInput: 0.6, output: 12 },
    }])
    expect(catalog.find((model) => model.modelId === 'grok-4.6')?.pricingSource?.tiers).toEqual([{
      id: 'long', minInputTokens: 200_000, minInclusive: true, maxInputTokens: null, maxInclusive: true,
      official: { input: 4, cachedInput: 1, output: 12 },
    }])
    expect(catalog.find((model) => model.modelId === 'gpt-5.4')?.pricingSource?.tiers).toEqual([{
      id: 'over-272k', minInputTokens: 272_000, minInclusive: false, maxInputTokens: null, maxInclusive: true,
      official: { input: 5, cachedInput: 0.5, output: 22.5 },
    }])
    expect(['gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra'].map((modelId) =>
      catalog.find((model) => model.modelId === modelId)?.pricingSource?.tiers[0],
    )).toEqual([
      { id: 'over-272k', minInputTokens: 272_000, minInclusive: false, maxInputTokens: null, maxInclusive: true, official: { input: 0.4, cachedInput: 0.04, output: 1.8 } },
      { id: 'over-272k', minInputTokens: 272_000, minInclusive: false, maxInputTokens: null, maxInclusive: true, official: { input: 8, cachedInput: 0.8, output: 30 } },
      { id: 'over-272k', minInputTokens: 272_000, minInclusive: false, maxInputTokens: null, maxInclusive: true, official: { input: 4, cachedInput: 0.4, output: 18 } },
    ])
  })

  it('contains the exact 44-model eligibility snapshot across nine providers', () => {
    const providerIds = {
      OpenAI: ['gpt-6-astra', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.5', 'gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra', 'codex-auto-review'],
      Anthropic: ['claude-opus-4-6', 'claude-opus-4-7', 'claude-opus-4-8', 'claude-opus-5', 'claude-sonnet-4-6', 'claude-sonnet-5'],
      xAI: ['grok-4.5', 'grok-4.6'],
      Google: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-3.1-pro-preview', 'gemini-3.5-flash'],
      Qwen: ['qwen3-coder-next', 'qwen3-max', 'qwen3-vl-flash', 'qwen3.5-flash', 'qwen3.5-plus', 'qwen3.6-max-preview', 'qwen3.6-plus', 'qwen3.7-max', 'qwen3.7-plus', 'qwen3.8-flash', 'qwen3.8-max'],
      'Z.AI': ['glm-5', 'glm-5.2', 'glm-5.3', 'glm-5.3-flash'],
      Moonshot: ['kimi-k2.5'],
      MiniMax: ['minimax-m2.5', 'MiniMax-M2.7', 'MiniMax-M3', 'MiniMax-H3'],
      Alibaba: ['wan3.0-video', 'wan3.0-video-prime'],
    }
    const catalog = buildModelCatalog(emptyConfig)
    const expectedIds = Object.values(providerIds).flat()

    expect(verifiedModelSeedData).toHaveLength(51)
    expect(new Set(verifiedModelSeedData.map((seed) => seed.modelId)).size).toBe(51)
    expect(new Set(expectedIds).size).toBe(44)
    expect(verifiedCatalogSeeds.map((seed) => seed.modelId)).toEqual(expectedIds)
    expect(Object.fromEntries(Object.entries(providerIds).map(([provider, ids]) => [
      provider,
      catalog.filter((model) => model.provider === provider && ids.includes(model.modelId)).length,
    ]))).toEqual({ OpenAI: 8, Anthropic: 6, xAI: 2, Google: 6, Qwen: 11, 'Z.AI': 4, Moonshot: 1, MiniMax: 4, Alibaba: 2 })

    const addedIds = expectedIds.slice(16)
    expect(Object.fromEntries(addedIds.map((modelId) => [
      modelId,
      catalog.find((entry) => entry.modelId === modelId)?.pricingSource?.official,
    ]))).toEqual({
      'gemini-2.5-flash': { input: 0.3, cachedInput: 0.03, output: 2.5 },
      'gemini-2.5-pro': { input: 1.25, cachedInput: 0.125, output: 10 },
      'gemini-3-flash-preview': { input: 0.5, cachedInput: 0.05, output: 3 },
      'gemini-3-pro-preview': { input: null, cachedInput: null, output: null },
      'gemini-3.1-pro-preview': { input: 2, cachedInput: 0.2, output: 12 },
      'gemini-3.5-flash': { input: 1.5, cachedInput: 0.15, output: 9 },
      'qwen3-coder-next': { input: 0.144, cachedInput: null, output: 0.574 },
      'qwen3-max': { input: 1.2, cachedInput: null, output: 6 },
      'qwen3-vl-flash': { input: 0.022, cachedInput: null, output: 0.215 },
      'qwen3.5-flash': { input: 0.029, cachedInput: null, output: 0.287 },
      'qwen3.5-plus': { input: 0.115, cachedInput: null, output: 0.688 },
      'qwen3.6-max-preview': { input: 1.3, cachedInput: null, output: 7.8 },
      'qwen3.6-plus': { input: 0.276, cachedInput: null, output: 1.651 },
      'qwen3.7-max': { input: 2.5, cachedInput: null, output: 7.5 },
      'qwen3.7-plus': { input: 0.4, cachedInput: null, output: 1.6 },
      'qwen3.8-flash': { input: 0.113, cachedInput: null, output: 0.382 },
      'qwen3.8-max': { input: 2, cachedInput: null, output: 6 },
      'glm-5': { input: 1, cachedInput: 0.2, output: 3.2 },
      'glm-5.2': { input: null, cachedInput: null, output: null },
      'glm-5.3': { input: 1.4, cachedInput: 0.26, output: 4.4 },
      'glm-5.3-flash': { input: 0.15, cachedInput: 0.03, output: 0.5 },
      'kimi-k2.5': { input: null, cachedInput: null, output: null },
      'minimax-m2.5': { input: 0.3, cachedInput: 0.03, output: 1.2 },
      'MiniMax-M2.7': { input: 0.3, cachedInput: 0.06, output: 1.2 },
      'MiniMax-M3': { input: 0.6, cachedInput: 0.12, output: 2.4 },
      'MiniMax-H3': { input: null, cachedInput: null, output: null },
      'wan3.0-video': { input: null, cachedInput: null, output: null },
      'wan3.0-video-prime': { input: null, cachedInput: null, output: null },
    })
    expect(['gemini-3-pro-preview', 'glm-5.2', 'kimi-k2.5'].map((modelId) =>
      catalog.find((entry) => entry.modelId === modelId)?.pricingSource?.status,
    )).toEqual(['unpublished', 'unpublished', 'unpublished'])
    expect(catalog.find((entry) => entry.modelId === 'gemini-2.5-pro')?.pricingSource?.tiers[0]).toMatchObject({
      id: 'over-200k', minInputTokens: 200_000, minInclusive: false,
      official: { input: 2.5, cachedInput: 0.25, output: 15 },
    })
    expect(catalog.find((entry) => entry.modelId === 'qwen3.5-plus')?.pricingSource?.tiers).toHaveLength(2)
    expect(catalog.find((entry) => entry.modelId === 'MiniMax-H3')).toMatchObject({
      modality: 'Video',
      endpoints: ['videos'],
      videoPricing: [
        { resolution: '768p', officialPerSecond: 0.0746268657, ownApiPerSecond: 0.0559701493 },
        { resolution: '2K', officialPerSecond: 0.1194029851, ownApiPerSecond: 0.0895522388 },
      ],
    })
    expect(catalog.find((entry) => entry.modelId === 'wan3.0-video')).toMatchObject({
      provider: 'Alibaba', modality: 'Video', endpoints: ['videos'],
      videoPricing: [
        { resolution: '480P', officialPerSecond: 0.041256, ownApiPerSecond: 0.0330048 },
        { resolution: '720P', officialPerSecond: 0.082513, ownApiPerSecond: 0.0660104 },
        { resolution: '1080P', officialPerSecond: 0.165025, ownApiPerSecond: 0.13202 },
      ],
    })
    expect(catalog.find((entry) => entry.modelId === 'wan3.0-video-prime')?.videoPricing).toEqual([
      { resolution: '480P', officialPerSecond: 0.0636, ownApiPerSecond: 0.05088 },
      { resolution: '720P', officialPerSecond: 0.127199, ownApiPerSecond: 0.1017592 },
      { resolution: '1080P', officialPerSecond: 0.254399, ownApiPerSecond: 0.2035192 },
    ])
    for (const modelId of ['wan3.0-video', 'wan3.0-video-prime']) {
      const entry = catalog.find((model) => model.modelId === modelId)
      expect(entry?.pricingSource.multiplier).toBe(0.8)
      expect(entry?.pricingSource.checkedAt).toBe('2026-09-11')
      expect(entry?.eligibilitySource.checkedAt).toBe('2026-09-11')
    }
    for (const entry of catalog) {
      expect(entry.eligibilitySource?.discountPercent).toBeGreaterThanOrEqual(28)
      expect(entry.available).toBeNull()
      expect(entry.providerLogo).toMatch(/^\/brand\/(openai|claude|grok|gemini|qwen|glm|kimi|minimax)\.svg$/)
    }
  })

  it('summarizes nonempty catalog providers for the homepage in stable order', () => {
    expect(getCatalogProviderSummaries()).toEqual([
      { provider: 'OpenAI', label: 'ChatGPT', logo: '/brand/openai.svg', count: 8 },
      { provider: 'Anthropic', label: 'Claude', logo: '/brand/claude.svg', count: 6 },
      { provider: 'xAI', label: 'Grok', logo: '/brand/grok.svg', count: 2 },
      { provider: 'Google', label: 'Gemini', logo: '/brand/gemini.svg', count: 6 },
      { provider: 'Qwen', label: 'Qwen', logo: '/brand/qwen.svg', count: 11 },
      { provider: 'Z.AI', label: 'GLM', logo: '/brand/glm.svg', count: 4 },
      { provider: 'Moonshot', label: 'Kimi', logo: '/brand/kimi.svg', count: 1 },
      { provider: 'MiniMax', label: 'MiniMax', logo: '/brand/minimax.svg', count: 4 },
      { provider: 'Alibaba', label: 'Wan', logo: '/brand/qwen.svg', count: 2 },
    ])

    const subset = buildModelCatalog(emptyConfig).filter((entry) => ['Google', 'MiniMax'].includes(entry.provider))
    expect(getCatalogProviderSummaries(subset).map((summary) => summary.provider)).toEqual(['Google', 'MiniMax'])
  })

  it('merges configured pricing into matching family metadata', () => {
    const result = buildModelCatalog({
      featured_models: [{ model: 'gpt-5.4', platform: 'openai', badge: 'Featured', sort_order: 1 }],
      pricing_models: [{
        model: 'gpt-5.4',
        platform: 'openai',
        billing_mode: 'token',
        input_price: 0.000001,
        output_price: 0.000004,
        cache_write_price: null,
        cache_read_price: null,
        image_output_price: null,
        per_request_price: null,
        sort_order: 1,
      }],
      reference_discount: null,
    })

    const model = result.find((item) => item.modelId === 'gpt-5.4')
    expect(model?.price?.input).toBe(0.000001)
    expect(model?.available).toBeNull()
    expect(model?.featured).toBe(true)
    expect(model?.artwork).toBe('/model-art/gpt.jpg')
    expect(model?.providerLogo).toBe('/brand/openai.svg')
    expect(model?.pricingSource).toMatchObject({
      official: { input: 2.5, cachedInput: 0.25, output: 15 },
      sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.4',
      checkedAt: '2026-09-07',
    })
  })

  it('adds unknown configured models with provider or OwnAPI fallback metadata', () => {
    const result = buildModelCatalog({
      ...emptyConfig,
      pricing_models: [{
        model: 'future-provider-model',
        platform: 'custom',
        billing_mode: 'token',
        input_price: null,
        output_price: null,
        cache_write_price: null,
        cache_read_price: null,
        image_output_price: null,
        per_request_price: null,
        sort_order: 100,
      }],
    })

    expect(result.find((item) => item.modelId === 'future-provider-model')).toMatchObject({
      provider: 'Custom',
      artwork: '/model-art/ownapi.jpg',
    })
  })

  it('filters by query, provider, class, and endpoint', () => {
    const result = filterModelCatalog(buildModelCatalog(emptyConfig), {
      query: 'claude',
      provider: 'Anthropic',
      modelClass: 'flagship',
      endpoint: 'anthropic',
      sort: 'featured',
    })

    expect(result.length).toBeGreaterThan(0)
    expect(result.every((item) => item.provider === 'Anthropic')).toBe(true)
    expect(result.every((item) => item.modelClass.includes('flagship'))).toBe(true)
    expect(result.every((item) => item.endpoints.includes('anthropic'))).toBe(true)
  })

  it('normalizes separators and applies multi-token AND search semantics', () => {
    const catalog = buildModelCatalog(emptyConfig)

    expect(normalizeCatalogSearch('  GPT_5.4/Mini  ')).toBe('gpt 5 4 mini')
    expect(filterModelCatalog(catalog, { query: 'gpt 5.4 mini' }).map((model) => model.modelId)).toContain('gpt-5.4-mini')
    expect(filterModelCatalog(catalog, { query: 'google flash' }).every((model) => model.provider === 'Google')).toBe(true)
    expect(filterModelCatalog(catalog, { query: '谷歌 flash' }).every((model) => model.provider === 'Google')).toBe(true)
    expect(filterModelCatalog(catalog, { query: 'qwen coder' })[0]?.modelId).toBe('qwen3-coder-next')
    expect(filterModelCatalog(catalog, { query: 'qwen nonexistent' })).toEqual([])
  })

  it('ranks exact, prefix, token-boundary, then substring matches', () => {
    const base = buildModelCatalog(emptyConfig).find((model) => model.provider === 'OpenAI')!
    const fixture = [
      { ...base, modelId: 'substring', displayName: 'Superalpha Model', searchAliases: [] },
      { ...base, modelId: 'boundary', displayName: 'Model Alpha Plus', searchAliases: [] },
      { ...base, modelId: 'prefix', displayName: 'Alpha Preview', searchAliases: [] },
      { ...base, modelId: 'exact', displayName: 'Exact Model', searchAliases: ['alpha'] },
    ]

    expect(fixture.map((entry) => scoreCatalogMatch(entry, 'alpha'))).toEqual([100, 200, 300, 400])
    expect(filterModelCatalog(fixture, { query: 'alpha', sort: 'name' }).map((entry) => entry.modelId)).toEqual([
      'exact', 'prefix', 'boundary', 'substring',
    ])
  })

  it('keeps providers grouped in the approved order for every sort', () => {
    const catalog = buildModelCatalog(emptyConfig)

    expect(groupModelCatalog(filterModelCatalog(catalog, {})).map((group) => group.provider)).toEqual(CATALOG_PROVIDER_ORDER)
    for (const sort of ['featured', 'name', 'input-price', 'output-price'] as const) {
      expect(groupModelCatalog(filterModelCatalog(catalog, { sort })).map((group) => group.provider)).toEqual(CATALOG_PROVIDER_ORDER)
    }
  })

  it('places backend-only providers alphabetically after known providers', () => {
    const catalog = buildModelCatalog({
      ...emptyConfig,
      pricing_models: [
        { model: 'zeta-model', platform: 'zeta', billing_mode: 'token', input_price: 1, output_price: 2, cache_write_price: null, cache_read_price: null, image_output_price: null, per_request_price: null, sort_order: 1 },
        { model: 'alpha-model', platform: 'alpha', billing_mode: 'token', input_price: 1, output_price: 2, cache_write_price: null, cache_read_price: null, image_output_price: null, per_request_price: null, sort_order: 1 },
      ],
    })

    expect(groupModelCatalog(filterModelCatalog(catalog, {})).map((group) => group.provider).slice(-2)).toEqual(['Alpha', 'Zeta'])
  })

  it('sorts by lowest OwnAPI input price inside each provider with missing values last', () => {
    const entries = buildModelCatalog(emptyConfig).map((item) => item.modelId === 'gpt-5.4'
      ? {
          ...item,
          pricingSource: item.pricingSource && {
            ...item.pricingSource,
            official: { ...item.pricingSource.official, input: null },
          },
        }
      : item)

    const result = filterModelCatalog(entries, {
      query: '',
      provider: '',
      modelClass: '',
      endpoint: '',
      sort: 'input-price',
    })

    expect(result.slice(0, 2).map((item) => item.modelId)).toEqual(['gpt-5.6-luna', 'gpt-5.4-mini'])
    for (const group of groupModelCatalog(result)) {
      const values = group.entries.map((entry) => entry.pricingSource?.official.input ?? null)
      const firstMissing = values.indexOf(null)
      if (firstMissing !== -1) expect(values.slice(firstMissing).every((value) => value == null)).toBe(true)
    }
  })

  it('sorts by lowest OwnAPI output price inside each provider with missing values last', () => {
    const entries = buildModelCatalog(emptyConfig).map((item, index) => ({
      ...item,
      pricingSource: index === 0 ? null : item.pricingSource,
    }))

    const result = filterModelCatalog(entries, {
      query: '',
      provider: '',
      modelClass: '',
      endpoint: '',
      sort: 'output-price',
    })

    expect(result.slice(0, 4).map((item) => item.modelId)).toEqual([
      'gpt-5.6-luna',
      'gpt-5.4-mini',
      'gpt-5.6-terra',
      'codex-auto-review',
    ])
    for (const group of groupModelCatalog(result)) {
      const values = group.entries.map((entry) => entry.pricingSource?.official.output ?? null)
      const firstMissing = values.indexOf(null)
      if (firstMissing !== -1) expect(values.slice(firstMissing).every((value) => value == null)).toBe(true)
    }
  })

  it('resolves a model by a stable URL-safe slug and finds related entries', () => {
    const catalog = buildModelCatalog(emptyConfig)
    const model = findCatalogModel(catalog, 'gpt-5-4')

    expect(model?.modelId).toBe('gpt-5.4')
    expect(model ? relatedCatalogModels(catalog, model) : []).not.toContainEqual(model)
  })
})
