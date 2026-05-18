import { apiClient } from './client'

export interface FeaturedModelConfig {
  model: string
  platform?: string
  badge?: string
  sort_order: number
}

export interface ModelDisplayPricingConfig {
  model: string
  platform?: string
  billing_mode: string
  input_price: number | null
  output_price: number | null
  cache_write_price: number | null
  cache_read_price: number | null
  image_output_price: number | null
  per_request_price: number | null
  sort_order: number
}

export interface ModelDisplayConfig {
  featured_models: FeaturedModelConfig[]
  pricing_models: ModelDisplayPricingConfig[]
  reference_discount?: number | null
}

export async function getModelDisplayConfig(): Promise<ModelDisplayConfig> {
  const { data } = await apiClient.get<ModelDisplayConfig>('/settings/model-display')
  return data
}

export const modelDisplayAPI = { getModelDisplayConfig }

export default modelDisplayAPI
