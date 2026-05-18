import { BILLING_MODE_TOKEN } from '@/constants/channel'

export interface ReferencePriceShape {
  input_price: number | null
  output_price: number | null
  cache_write_price: number | null
  cache_read_price: number | null
  image_output_price: number | null
  per_request_price: number | null
}

export interface OfficialModelPricingReference {
  model: string
  aliases: string[]
  platform: string
  sourceLabel: string
  billing_mode: typeof BILLING_MODE_TOKEN
  pricing: ReferencePriceShape
}

export const MILLION = 1_000_000

export const officialModelPricingReferences: OfficialModelPricingReference[] = [
  tokenReference('openai', 'gpt-5.5-pro', [], 'OpenAI', 30, 180, null),
  tokenReference('openai', 'gpt-5.5', [], 'OpenAI', 5, 30, 0.5),
  tokenReference('openai', 'gpt-5.4-pro', [], 'OpenAI', 30, 180, null),
  tokenReference('openai', 'gpt-5.4-mini', [], 'OpenAI', 0.75, 4.5, 0.075),
  tokenReference('openai', 'gpt-5.4-nano', [], 'OpenAI', 0.2, 1.25, 0.02),
  tokenReference('openai', 'gpt-5.4', [], 'OpenAI', 2.5, 15, 0.25),
  tokenReference('openai', 'gpt-5.3-codex', [], 'OpenAI', 1.75, 14, 0.175),

  tokenReference('anthropic', 'claude-opus-4.7', ['claude-opus-4-7'], 'Anthropic', 5, 25, 0.5, 6.25),
  tokenReference('anthropic', 'claude-opus-4.6', ['claude-opus-4-6'], 'Anthropic', 5, 25, 0.5, 6.25),
  tokenReference('anthropic', 'claude-opus-4.5', ['claude-opus-4-5'], 'Anthropic', 5, 25, 0.5, 6.25),
  tokenReference('anthropic', 'claude-opus-4.1', ['claude-opus-4-1', 'claude-3-opus'], 'Anthropic', 15, 75, 1.5, 18.75),
  tokenReference('anthropic', 'claude-sonnet-4.6', ['claude-sonnet-4-6'], 'Anthropic', 3, 15, 0.3, 3.75),
  tokenReference('anthropic', 'claude-sonnet-4.5', ['claude-sonnet-4-5'], 'Anthropic', 3, 15, 0.3, 3.75),
  tokenReference('anthropic', 'claude-sonnet-4', ['claude-3-5-sonnet'], 'Anthropic', 3, 15, 0.3, 3.75),
  tokenReference('anthropic', 'claude-haiku-4.5', ['claude-haiku-4-5'], 'Anthropic', 1, 5, 0.1, 1.25),
  tokenReference('anthropic', 'claude-3-5-haiku', [], 'Anthropic', 0.8, 4, 0.08, 1),

  tokenReference('gemini', 'gemini-3-pro-image', ['gemini-3.1-pro', 'gemini-3-pro'], 'Google AI', 2, 12, 0.2),
  tokenReference('gemini', 'gemini-3.1-flash-lite', [], 'Google AI', 0.25, 1.5, 0.025),
  tokenReference('gemini', 'gemini-3.1-flash-live', [], 'Google AI', 0.75, 4.5, null),
  tokenReference('gemini', 'gemini-3.1-flash-image', [], 'Google AI', 0.5, 3, null),
  tokenReference('gemini', 'gemini-3-flash', [], 'Google AI', 0.5, 3, 0.05),
  tokenReference('gemini', 'gemini-2.0-flash-lite', ['gemini-2-flash-lite'], 'Google AI', 0.075, 0.3, null),
]

export function officialPricingFor(model: string, platform: string): { sourceLabel: string; pricing: ReferencePriceShape } | null {
  const normalizedModel = normalizeModelPricingName(model)
  const normalizedPlatform = normalizeModelPricingName(platform)
  const reference = officialModelPricingReferences.find(
    (item) =>
      normalizeModelPricingName(item.platform) === normalizedPlatform &&
      [item.model, ...item.aliases].some((pattern) => normalizedModel.includes(normalizeModelPricingName(pattern))),
  )

  if (!reference) return null
  return {
    sourceLabel: reference.sourceLabel,
    pricing: reference.pricing,
  }
}

export function applyReferenceDiscount(pricing: ReferencePriceShape, discount: number): ReferencePriceShape {
  return {
    input_price: discountPrice(pricing.input_price, discount),
    output_price: discountPrice(pricing.output_price, discount),
    cache_write_price: discountPrice(pricing.cache_write_price, discount),
    cache_read_price: discountPrice(pricing.cache_read_price, discount),
    image_output_price: discountPrice(pricing.image_output_price, discount),
    per_request_price: discountPrice(pricing.per_request_price, discount),
  }
}

export function normalizeModelPricingName(value: string): string {
  return value.toLowerCase().replace(/_/g, '-')
}

function tokenReference(
  platform: string,
  model: string,
  aliases: string[],
  sourceLabel: string,
  inputPerMillion: number,
  outputPerMillion: number,
  cacheReadPerMillion: number | null,
  cacheWritePerMillion: number | null = null,
): OfficialModelPricingReference {
  return {
    model,
    aliases,
    platform,
    sourceLabel,
    billing_mode: BILLING_MODE_TOKEN,
    pricing: {
      input_price: inputPerMillion / MILLION,
      output_price: outputPerMillion / MILLION,
      cache_write_price: cacheWritePerMillion == null ? null : cacheWritePerMillion / MILLION,
      cache_read_price: cacheReadPerMillion == null ? null : cacheReadPerMillion / MILLION,
      image_output_price: null,
      per_request_price: null,
    },
  }
}

function discountPrice(value: number | null, discount: number): number | null {
  return value == null ? null : value * discount
}
