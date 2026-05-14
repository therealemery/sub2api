/**
 * User Channels API endpoints.
 * Aggregates available model channels, groups, and model pricing for user-facing pages.
 */

import { apiClient } from './client'
import type { BillingMode } from '@/constants/channel'
import {
  isLocalPreviewSession,
  PREVIEW_GROUPS,
  readPreviewChannels,
} from '@/api/localPreviewData'

export interface UserAvailableGroup {
  id: number
  name: string
  platform: string
  subscription_type: string
  rate_multiplier: number
  is_exclusive: boolean
}

export interface UserPricingInterval {
  min_tokens: number
  max_tokens: number | null
  tier_label?: string
  input_price: number | null
  output_price: number | null
  cache_write_price: number | null
  cache_read_price: number | null
  per_request_price: number | null
}

export interface UserSupportedModelPricing {
  billing_mode: BillingMode
  input_price: number | null
  output_price: number | null
  cache_write_price: number | null
  cache_read_price: number | null
  image_output_price: number | null
  per_request_price: number | null
  intervals: UserPricingInterval[]
}

export interface UserSupportedModel {
  name: string
  platform: string
  pricing: UserSupportedModelPricing | null
}

export interface UserChannelPlatformSection {
  platform: string
  groups: UserAvailableGroup[]
  supported_models: UserSupportedModel[]
}

export interface UserAvailableChannel {
  name: string
  description: string
  platforms: UserChannelPlatformSection[]
}

function previewAvailableChannels(): UserAvailableChannel[] {
  return readPreviewChannels()
    .filter((channel) => channel.status === 'active')
    .map((channel) => {
      const platformMap = new Map<string, UserChannelPlatformSection>()

      channel.model_pricing.forEach((pricingItem) => {
        const section =
          platformMap.get(pricingItem.platform) ??
          {
            platform: pricingItem.platform,
            groups: PREVIEW_GROUPS.filter((group) =>
              channel.group_ids.includes(group.id) && group.platform === pricingItem.platform
            ),
            supported_models: []
          }

        pricingItem.models.forEach((model) => {
          section.supported_models.push({
            name: model,
            platform: pricingItem.platform,
            pricing: {
              billing_mode: pricingItem.billing_mode,
              input_price: pricingItem.input_price,
              output_price: pricingItem.output_price,
              cache_write_price: pricingItem.cache_write_price,
              cache_read_price: pricingItem.cache_read_price,
              image_output_price: pricingItem.image_output_price,
              per_request_price: pricingItem.per_request_price,
              intervals: pricingItem.intervals.map((interval) => ({
                min_tokens: interval.min_tokens,
                max_tokens: interval.max_tokens,
                tier_label: interval.tier_label,
                input_price: interval.input_price,
                output_price: interval.output_price,
                cache_write_price: interval.cache_write_price,
                cache_read_price: interval.cache_read_price,
                per_request_price: interval.per_request_price,
              })),
            },
          })
        })

        platformMap.set(pricingItem.platform, section)
      })

      return {
        name: channel.name,
        description: channel.description,
        platforms: Array.from(platformMap.values()),
      }
    })
}

export async function getAvailable(options?: { signal?: AbortSignal }): Promise<UserAvailableChannel[]> {
  if (isLocalPreviewSession()) {
    return previewAvailableChannels()
  }

  const { data } = await apiClient.get<UserAvailableChannel[]>('/channels/available', {
    signal: options?.signal
  })
  return data
}

export const userChannelsAPI = { getAvailable }

export default userChannelsAPI
