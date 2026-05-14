/**
 * User Groups API endpoints.
 * Handles the groups a regular user can bind to API keys.
 */

import { apiClient } from './client'
import type { Group, SubscriptionType } from '@/types'
import { isLocalPreviewSession, PREVIEW_GROUPS } from '@/api/localPreviewData'

function previewGroups(): Group[] {
  const now = new Date().toISOString()
  return PREVIEW_GROUPS.map((group) => ({
    id: group.id,
    name: group.name,
    description:
      group.platform === 'anthropic'
        ? 'Claude 4.6、Claude 4.7 默认调用分组'
        : group.platform === 'gemini'
          ? 'Gemini 系列模型默认调用分组'
          : 'GPT 5.4、GPT 5.5 与 OpenAI 兼容模型默认调用分组',
    platform: group.platform as Group['platform'],
    rate_multiplier: group.rate_multiplier,
    rpm_limit: group.platform === 'anthropic' ? 100 : 120,
    is_exclusive: group.is_exclusive,
    status: 'active',
    subscription_type: group.subscription_type as SubscriptionType,
    daily_limit_usd: null,
    weekly_limit_usd: null,
    monthly_limit_usd: null,
    allow_image_generation: group.platform === 'openai',
    image_rate_independent: false,
    image_rate_multiplier: 1,
    image_price_1k: null,
    image_price_2k: null,
    image_price_4k: null,
    claude_code_only: false,
    fallback_group_id: null,
    fallback_group_id_on_invalid_request: null,
    allow_messages_dispatch: group.platform === 'openai',
    default_mapped_model: '',
    messages_dispatch_model_config: {},
    require_oauth_only: false,
    require_privacy_set: false,
    created_at: now,
    updated_at: now,
  }))
}

export async function getAvailable(): Promise<Group[]> {
  if (isLocalPreviewSession()) {
    return previewGroups()
  }

  const { data } = await apiClient.get<Group[]>('/groups/available')
  return data
}

export async function getUserGroupRates(): Promise<Record<number, number>> {
  if (isLocalPreviewSession()) {
    return Object.fromEntries(PREVIEW_GROUPS.map((group) => [group.id, group.rate_multiplier]))
  }

  const { data } = await apiClient.get<Record<number, number> | null>('/groups/rates')
  return data || {}
}

export const userGroupsAPI = {
  getAvailable,
  getUserGroupRates
}

export default userGroupsAPI
