import { describe, expect, it } from 'vitest'
import type { ModelDisplayConfig } from '@/api/modelDisplay'
import {
  activeOfficialTier,
  buildModelCatalog,
  calculateOwnApiPricing,
  filterModelCatalog,
  formatCatalogPrice,
  findCatalogModel,
  relatedCatalogModels,
  verifiedCatalogSeeds,
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

    expect(result).toHaveLength(20)
    expect(result.map((item) => item.family)).toEqual(
      expect.arrayContaining(['gpt', 'claude', 'grok']),
    )
    expect(result[0]?.available).toBeNull()
  })

  it('contains the complete verified catalog with traceable discounted pricing', () => {
    const requiredIds = [
      'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.5', 'gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-daybreak-blue-latest', 'codex-auto-review', 'omni-moderation-latest',
      'claude-fable-5', 'claude-haiku-4-5-20251001', 'claude-opus-4-6', 'claude-opus-4-7', 'claude-opus-4-8', 'claude-opus-5',
      'claude-sonnet-4-5-20250929', 'claude-sonnet-4-6', 'claude-sonnet-5', 'grok-4.5', 'grok-4.6',
    ]
    const catalog = buildModelCatalog(emptyConfig)

    expect(verifiedCatalogSeeds).toHaveLength(20)
    expect(new Set(verifiedCatalogSeeds.map((model) => model.modelId)).size).toBe(20)
    expect(verifiedCatalogSeeds.map((model) => model.modelId)).toEqual(requiredIds)
    expect(requiredIds.every((id) => catalog.some((model) => model.modelId === id))).toBe(true)
    expect(new Set(requiredIds).size).toBe(20)
    expect(Object.fromEntries(['OpenAI', 'Anthropic', 'xAI'].map((provider) => [
      provider,
      catalog.filter((model) => model.provider === provider).length,
    ]))).toEqual({ OpenAI: 9, Anthropic: 9, xAI: 2 })

    for (const modelId of requiredIds) {
      const model = catalog.find((entry) => entry.modelId === modelId)
      expect(model?.slug).toBe(modelId.replace(/[^a-z0-9]+/g, '-'))
      expect(model?.pricingSource).toMatchObject({
        status: expect.stringMatching(/^(paid|free|unpublished)$/),
        sourceUrl: expect.stringMatching(/^https:\/\//),
        checkedAt: '2026-08-31',
        multiplier: 0.7,
      })
      expect(model?.eligibilitySource).toMatchObject({
        source: 'packyapi',
        discountPercent: expect.any(Number),
        checkedAt: '2026-08-31',
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
      'gpt-5.4': { input: 2.5, cachedInput: 0.25, output: 15 },
      'gpt-5.4-mini': { input: 0.75, cachedInput: 0.075, output: 4.5 },
      'gpt-5.5': { input: 5, cachedInput: 0.5, output: 30 },
      'gpt-5.6-luna': { input: 0.2, cachedInput: 0.02, output: 1.2 },
      'gpt-5.6-sol': { input: 4, cachedInput: 0.4, output: 20 },
      'gpt-5.6-terra': { input: 2, cachedInput: 0.2, output: 12 },
      'gpt-daybreak-blue-latest': { input: null, cachedInput: null, output: null },
      'codex-auto-review': { input: 2.5, cachedInput: 0.25, output: 15 },
      'omni-moderation-latest': { input: 0, cachedInput: 0, output: 0 },
      'claude-fable-5': { input: 10, cachedInput: 1, output: 50 },
      'claude-haiku-4-5-20251001': { input: 1, cachedInput: 0.1, output: 5 },
      'claude-opus-4-6': { input: 5, cachedInput: 0.5, output: 25 },
      'claude-opus-4-7': { input: 5, cachedInput: 0.5, output: 25 },
      'claude-opus-4-8': { input: 5, cachedInput: 0.5, output: 25 },
      'claude-opus-5': { input: 5, cachedInput: 0.5, output: 25 },
      'claude-sonnet-4-5-20250929': { input: 3, cachedInput: 0.3, output: 15 },
      'claude-sonnet-4-6': { input: 3, cachedInput: 0.3, output: 15 },
      'claude-sonnet-5': { input: 2, cachedInput: 0.2, output: 10 },
      'grok-4.5': { input: 2, cachedInput: 0.3, output: 6 },
      'grok-4.6': { input: 2, cachedInput: 0.5, output: 6 },
    })

    expect(Object.fromEntries(requiredIds.map((modelId) => {
      const model = catalog.find((entry) => entry.modelId === modelId)
      return [modelId, model?.pricingSource?.sourceUrl]
    }))).toEqual({
      'gpt-5.4': 'https://developers.openai.com/api/docs/models/gpt-5.4',
      'gpt-5.4-mini': 'https://developers.openai.com/api/docs/models/gpt-5.4-mini',
      'gpt-5.5': 'https://developers.openai.com/api/docs/models/gpt-5.5',
      'gpt-5.6-luna': 'https://developers.openai.com/api/docs/models/compare',
      'gpt-5.6-sol': 'https://developers.openai.com/api/docs/models/compare',
      'gpt-5.6-terra': 'https://developers.openai.com/api/docs/models/compare',
      'gpt-daybreak-blue-latest': 'https://developers.openai.com/api/docs/models/all',
      'codex-auto-review': 'https://help.openai.com/en/articles/20001415',
      'omni-moderation-latest': 'https://developers.openai.com/api/docs/models/omni-moderation-latest',
      'claude-fable-5': 'https://platform.claude.com/docs/en/about-claude/pricing',
      'claude-haiku-4-5-20251001': 'https://platform.claude.com/docs/en/about-claude/pricing',
      'claude-opus-4-6': 'https://platform.claude.com/docs/en/about-claude/pricing',
      'claude-opus-4-7': 'https://platform.claude.com/docs/en/about-claude/pricing',
      'claude-opus-4-8': 'https://platform.claude.com/docs/en/about-claude/pricing',
      'claude-opus-5': 'https://platform.claude.com/docs/en/about-claude/pricing',
      'claude-sonnet-4-5-20250929': 'https://platform.claude.com/docs/en/about-claude/pricing',
      'claude-sonnet-4-6': 'https://platform.claude.com/docs/en/about-claude/pricing',
      'claude-sonnet-5': 'https://platform.claude.com/docs/en/release-notes/overview',
      'grok-4.5': 'https://docs.x.ai/developers/pricing',
      'grok-4.6': 'https://docs.x.ai/developers/pricing',
    })

    expect(catalog.find((model) => model.modelId === 'codex-auto-review')).toMatchObject({
      isAlias: true,
      aliasNoteKey: 'publicModels.aliases.codexAutoReview',
    })
    expect(catalog.find((model) => model.modelId === 'claude-haiku-4-5-20251001')?.contextWindow).toBe('200K')
    expect(catalog.find((model) => model.modelId === 'gpt-5.4-mini')?.contextWindow).toBe('400K')
    expect(catalog.find((model) => model.modelId === 'claude-fable-5')?.contextWindow).toBe('1M')
    expect(catalog.find((model) => model.modelId === 'claude-sonnet-4-5-20250929')?.contextWindow).toBe('200K')
    expect(catalog.find((model) => model.modelId === 'omni-moderation-latest')?.pricingSource).toMatchObject({
      status: 'free', official: { input: 0, cachedInput: 0, output: 0 },
    })
    expect(catalog.find((model) => model.modelId === 'gpt-daybreak-blue-latest')?.pricingSource).toMatchObject({
      status: 'unpublished', official: { input: null, cachedInput: null, output: null },
    })
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
      checkedAt: '2026-08-31',
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

  it('sorts by lowest OwnAPI input price with missing values last', () => {
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

    expect(result.slice(0, 2).map((item) => item.modelId)).toEqual(['omni-moderation-latest', 'gpt-5.6-luna'])
    expect(result.slice(-2).map((item) => item.modelId)).toEqual(expect.arrayContaining(['gpt-5.4', 'gpt-daybreak-blue-latest']))
  })

  it('sorts by lowest OwnAPI output price with missing values last', () => {
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
      'omni-moderation-latest',
      'gpt-5.6-luna',
      'gpt-5.4-mini',
      'claude-haiku-4-5-20251001',
    ])
    expect(result.at(-1)?.pricingSource?.official.output ?? null).toBeNull()
  })

  it('resolves a model by a stable URL-safe slug and finds related entries', () => {
    const catalog = buildModelCatalog(emptyConfig)
    const model = findCatalogModel(catalog, 'gpt-5-4')

    expect(model?.modelId).toBe('gpt-5.4')
    expect(model ? relatedCatalogModels(catalog, model) : []).not.toContainEqual(model)
  })
})
