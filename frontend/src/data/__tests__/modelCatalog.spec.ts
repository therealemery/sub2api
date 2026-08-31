import { describe, expect, it } from 'vitest'
import type { ModelDisplayConfig } from '@/api/modelDisplay'
import {
  buildModelCatalog,
  calculateOwnApiPricing,
  filterModelCatalog,
  formatCatalogPrice,
  findCatalogModel,
  relatedCatalogModels,
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

  it('formats catalog prices without grouping and preserves useful precision', () => {
    expect(formatCatalogPrice(0.0525)).toBe('0.0525')
    expect(formatCatalogPrice(null)).toBeNull()
  })

  it('uses curated entries when the API config is empty', () => {
    const result = buildModelCatalog(emptyConfig)

    expect(result.length).toBeGreaterThanOrEqual(8)
    expect(result.map((item) => item.family)).toEqual(
      expect.arrayContaining(['gpt', 'claude', 'gemini', 'deepseek', 'grok', 'qwen', 'glm', 'kimi']),
    )
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
    expect(model?.featured).toBe(true)
    expect(model?.artwork).toBe('/model-art/gpt.jpg')
    expect(model?.providerLogo).toBe('/brand/openai.svg')
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

  it('filters by query, provider, and capability', () => {
    const result = filterModelCatalog(buildModelCatalog(emptyConfig), {
      query: 'claude',
      provider: 'Anthropic',
      capability: 'Reasoning',
      sort: 'featured',
    })

    expect(result.length).toBeGreaterThan(0)
    expect(result.every((item) => item.provider === 'Anthropic')).toBe(true)
  })

  it('sorts by lowest input price without moving unavailable prices first', () => {
    const entries = buildModelCatalog(emptyConfig).slice(0, 2).map((item, index) => ({
      ...item,
      price: index === 0 ? null : {
        billingMode: 'token',
        input: 0.000001,
        output: null,
        cacheRead: null,
        cacheWrite: null,
        imageOutput: null,
        perRequest: null,
      },
    }))

    const result = filterModelCatalog(entries, {
      query: '',
      provider: '',
      capability: '',
      sort: 'price',
    })

    expect(result[0]?.price?.input).toBe(0.000001)
  })

  it('resolves a model by a stable URL-safe slug and finds related entries', () => {
    const catalog = buildModelCatalog(emptyConfig)
    const model = findCatalogModel(catalog, 'gpt-5-4')

    expect(model?.modelId).toBe('gpt-5.4')
    expect(model ? relatedCatalogModels(catalog, model) : []).not.toContainEqual(model)
  })
})
