import { apiClient } from '../client'
import type { ModelDisplayConfig } from '../modelDisplay'

export type { FeaturedModelConfig, ModelDisplayConfig, ModelDisplayPricingConfig } from '../modelDisplay'

export async function getModelDisplayConfig(): Promise<ModelDisplayConfig> {
  const { data } = await apiClient.get<ModelDisplayConfig>('/admin/settings/model-display')
  return data
}

export async function updateModelDisplayConfig(config: ModelDisplayConfig): Promise<ModelDisplayConfig> {
  const { data } = await apiClient.put<ModelDisplayConfig>('/admin/settings/model-display', config)
  return data
}

export const adminModelDisplayAPI = {
  getModelDisplayConfig,
  updateModelDisplayConfig,
}

export default adminModelDisplayAPI
