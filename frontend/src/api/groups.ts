/**
 * User Groups API endpoints (non-admin)
 * Handles group-related operations for regular users
 */

import { apiClient } from './client'
import type { Group } from '@/types'

const LOCAL_PREVIEW_TOKEN_PREFIX = 'local-preview-'

function isLocalPreviewHost(): boolean {
  return ['127.0.0.1', 'localhost', '::1'].includes(window.location.hostname)
}

function isLocalPreviewSession(): boolean {
  return (
    (import.meta.env.DEV || isLocalPreviewHost()) &&
    !!localStorage.getItem('auth_token')?.startsWith(LOCAL_PREVIEW_TOKEN_PREFIX)
  )
}

function previewGroups(): Group[] {
  const now = new Date().toISOString()
  return [
    {
      id: 1,
      name: 'GPT 主力分组',
      description: 'GPT 5.4、GPT 5.5 默认调用分组',
      platform: 'openai',
      rate_multiplier: 0.6,
      rpm_limit: 120,
      is_exclusive: false,
      status: 'active',
      subscription_type: 'standard',
      daily_limit_usd: null,
      weekly_limit_usd: null,
      monthly_limit_usd: null,
      allow_image_generation: true,
      image_rate_independent: false,
      image_rate_multiplier: 1,
      image_price_1k: null,
      image_price_2k: null,
      image_price_4k: null,
      claude_code_only: false,
      fallback_group_id: null,
      fallback_group_id_on_invalid_request: null,
      allow_messages_dispatch: true,
      default_mapped_model: '',
      messages_dispatch_model_config: {},
      require_oauth_only: false,
      require_privacy_set: false,
      created_at: now,
      updated_at: now
    },
    {
      id: 2,
      name: 'Claude 高级分组',
      description: 'Claude 4.6、Claude 4.7 默认调用分组',
      platform: 'anthropic',
      rate_multiplier: 0.6,
      rpm_limit: 100,
      is_exclusive: false,
      status: 'active',
      subscription_type: 'subscription',
      daily_limit_usd: 30,
      weekly_limit_usd: null,
      monthly_limit_usd: 500,
      allow_image_generation: false,
      image_rate_independent: false,
      image_rate_multiplier: 1,
      image_price_1k: null,
      image_price_2k: null,
      image_price_4k: null,
      claude_code_only: false,
      fallback_group_id: null,
      fallback_group_id_on_invalid_request: null,
      allow_messages_dispatch: false,
      default_mapped_model: '',
      messages_dispatch_model_config: {},
      require_oauth_only: false,
      require_privacy_set: false,
      created_at: now,
      updated_at: now
    }
  ]
}

/**
 * Get available groups that the current user can bind to API keys
 * This returns groups based on user's permissions:
 * - Standard groups: public (non-exclusive) or explicitly allowed
 * - Subscription groups: user has active subscription
 * @returns List of available groups
 */
export async function getAvailable(): Promise<Group[]> {
  if (isLocalPreviewSession()) {
    return previewGroups()
  }

  const { data } = await apiClient.get<Group[]>('/groups/available')
  return data
}

/**
 * Get current user's custom group rate multipliers
 * @returns Map of group_id to custom rate_multiplier
 */
export async function getUserGroupRates(): Promise<Record<number, number>> {
  if (isLocalPreviewSession()) {
    return { 1: 0.6, 2: 0.6 }
  }

  const { data } = await apiClient.get<Record<number, number> | null>('/groups/rates')
  return data || {}
}

export const userGroupsAPI = {
  getAvailable,
  getUserGroupRates
}

export default userGroupsAPI
