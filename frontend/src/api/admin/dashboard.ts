/**
 * Admin Dashboard API endpoints
 * Provides system-wide statistics and metrics
 */

import { apiClient } from '../client'
import type {
  DashboardStats,
  TrendDataPoint,
  ModelStat,
  GroupStat,
  ApiKeyUsageTrendPoint,
  UserUsageTrendPoint,
  UserSpendingRankingResponse,
  UserBreakdownItem,
  UsageRequestType
} from '@/types'

/**
 * Get dashboard statistics
 * @returns Dashboard statistics including users, keys, accounts, and token usage
 */
export async function getStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>('/admin/dashboard/stats')
  return data
}

/**
 * Get real-time metrics
 * @returns Real-time system metrics
 */
export async function getRealtimeMetrics(): Promise<{
  active_requests: number
  requests_per_minute: number
  average_response_time: number
  error_rate: number
}> {
  const { data } = await apiClient.get<{
    active_requests: number
    requests_per_minute: number
    average_response_time: number
    error_rate: number
  }>('/admin/dashboard/realtime')
  return data
}

export interface TrendParams {
  start_date?: string
  end_date?: string
  granularity?: 'day' | 'hour'
  user_id?: number
  api_key_id?: number
  model?: string
  account_id?: number
  group_id?: number
  request_type?: UsageRequestType
  stream?: boolean
  billing_type?: number | null
}

export interface TrendResponse {
  trend: TrendDataPoint[]
  start_date: string
  end_date: string
  granularity: string
}

/**
 * Get usage trend data
 * @param params - Query parameters for filtering
 * @returns Usage trend data
 */
export async function getUsageTrend(params?: TrendParams): Promise<TrendResponse> {
  const { data } = await apiClient.get<TrendResponse>('/admin/dashboard/trend', { params })
  return data
}

export interface ModelStatsParams {
  start_date?: string
  end_date?: string
  user_id?: number
  api_key_id?: number
  model?: string
  model_source?: 'requested' | 'upstream' | 'mapping'
  account_id?: number
  group_id?: number
  request_type?: UsageRequestType
  stream?: boolean
  billing_type?: number | null
}

export interface ModelStatsResponse {
  models: ModelStat[]
  start_date: string
  end_date: string
}

/**
 * Get model usage statistics
 * @param params - Query parameters for filtering
 * @returns Model usage statistics
 */
export async function getModelStats(params?: ModelStatsParams): Promise<ModelStatsResponse> {
  const { data } = await apiClient.get<ModelStatsResponse>('/admin/dashboard/models', { params })
  return data
}

export interface GroupStatsParams {
  start_date?: string
  end_date?: string
  user_id?: number
  api_key_id?: number
  account_id?: number
  group_id?: number
  request_type?: UsageRequestType
  stream?: boolean
  billing_type?: number | null
}

export interface GroupStatsResponse {
  groups: GroupStat[]
  start_date: string
  end_date: string
}

export interface DashboardSnapshotV2Params extends TrendParams {
  include_stats?: boolean
  include_trend?: boolean
  include_model_stats?: boolean
  include_group_stats?: boolean
  include_users_trend?: boolean
  users_trend_limit?: number
}

export interface DashboardSnapshotV2Stats extends DashboardStats {
  uptime: number
}

export interface DashboardSnapshotV2Response {
  generated_at: string
  start_date: string
  end_date: string
  granularity: string
  stats?: DashboardSnapshotV2Stats
  trend?: TrendDataPoint[]
  models?: ModelStat[]
  groups?: GroupStat[]
  users_trend?: UserUsageTrendPoint[]
}

/**
 * Get group usage statistics
 * @param params - Query parameters for filtering
 * @returns Group usage statistics
 */
export async function getGroupStats(params?: GroupStatsParams): Promise<GroupStatsResponse> {
  const { data } = await apiClient.get<GroupStatsResponse>('/admin/dashboard/groups', { params })
  return data
}

export interface UserBreakdownParams {
  start_date?: string
  end_date?: string
  group_id?: number
  model?: string
  model_source?: 'requested' | 'upstream' | 'mapping'
  endpoint?: string
  endpoint_type?: 'inbound' | 'upstream' | 'path'
  limit?: number
  // Additional filter conditions
  user_id?: number
  api_key_id?: number
  account_id?: number
  request_type?: number
  stream?: boolean
  billing_type?: number | null
}

export interface UserBreakdownResponse {
  users: UserBreakdownItem[]
  start_date: string
  end_date: string
}

export async function getUserBreakdown(params: UserBreakdownParams): Promise<UserBreakdownResponse> {
  const { data } = await apiClient.get<UserBreakdownResponse>('/admin/dashboard/user-breakdown', {
    params
  })
  return data
}

/**
 * Get dashboard snapshot v2 (aggregated response for heavy admin pages).
 */
export async function getSnapshotV2(params?: DashboardSnapshotV2Params): Promise<DashboardSnapshotV2Response> {
  const { data } = await apiClient.get<DashboardSnapshotV2Response>('/admin/dashboard/snapshot-v2', {
    params
  })
  return data
}

export interface ApiKeyTrendParams extends TrendParams {
  limit?: number
}

export interface ApiKeyTrendResponse {
  trend: ApiKeyUsageTrendPoint[]
  start_date: string
  end_date: string
  granularity: string
}

/**
 * Get API key usage trend data
 * @param params - Query parameters for filtering
 * @returns API key usage trend data
 */
export async function getApiKeyUsageTrend(
  params?: ApiKeyTrendParams
): Promise<ApiKeyTrendResponse> {
  const { data } = await apiClient.get<ApiKeyTrendResponse>('/admin/dashboard/api-keys-trend', {
    params
  })
  return data
}

export interface UserTrendParams extends TrendParams {
  limit?: number
}

export interface UserTrendResponse {
  trend: UserUsageTrendPoint[]
  start_date: string
  end_date: string
  granularity: string
}

export interface UserSpendingRankingParams
  extends Pick<TrendParams, 'start_date' | 'end_date'> {
  limit?: number
}

/**
 * Get user usage trend data
 * @param params - Query parameters for filtering
 * @returns User usage trend data
 */
export async function getUserUsageTrend(params?: UserTrendParams): Promise<UserTrendResponse> {
  const { data } = await apiClient.get<UserTrendResponse>('/admin/dashboard/users-trend', {
    params
  })
  return data
}

/**
 * Get user spending ranking data
 * @param params - Query parameters for filtering
 * @returns User spending ranking data
 */
export async function getUserSpendingRanking(
  params?: UserSpendingRankingParams
): Promise<UserSpendingRankingResponse> {
  const { data } = await apiClient.get<UserSpendingRankingResponse>('/admin/dashboard/users-ranking', {
    params
  })
  return data
}

export interface BatchUserUsageStats {
  user_id: number
  today_actual_cost: number
  total_actual_cost: number
}

export interface BatchUsersUsageResponse {
  stats: Record<string, BatchUserUsageStats>
}

/**
 * Get batch usage stats for multiple users
 * @param userIds - Array of user IDs
 * @returns Usage stats map keyed by user ID
 */
export async function getBatchUsersUsage(userIds: number[]): Promise<BatchUsersUsageResponse> {
  const { data } = await apiClient.post<BatchUsersUsageResponse>('/admin/dashboard/users-usage', {
    user_ids: userIds
  })
  return data
}

export interface BatchApiKeyUsageStats {
  api_key_id: number
  today_actual_cost: number
  total_actual_cost: number
}

export interface BatchApiKeysUsageResponse {
  stats: Record<string, BatchApiKeyUsageStats>
}

/**
 * Get batch usage stats for multiple API keys
 * @param apiKeyIds - Array of API key IDs
 * @returns Usage stats map keyed by API key ID
 */
export async function getBatchApiKeysUsage(
  apiKeyIds: number[]
): Promise<BatchApiKeysUsageResponse> {
  const { data } = await apiClient.post<BatchApiKeysUsageResponse>(
    '/admin/dashboard/api-keys-usage',
    {
      api_key_ids: apiKeyIds
    }
  )
  return data
}

const realDashboardAPI = {
  getStats,
  getRealtimeMetrics,
  getUsageTrend,
  getModelStats,
  getGroupStats,
  getSnapshotV2,
  getApiKeyUsageTrend,
  getUserUsageTrend,
  getUserSpendingRanking,
  getBatchUsersUsage,
  getBatchApiKeysUsage
}

const LOCAL_PREVIEW_TOKEN_PREFIX = 'local-preview-'

function isLocalPreviewDashboardSession(): boolean {
  if (
    typeof localStorage === 'undefined' ||
    (!import.meta.env.DEV && !['127.0.0.1', 'localhost', '::1'].includes(window.location.hostname))
  ) return false
  return !!localStorage.getItem('auth_token')?.startsWith(LOCAL_PREVIEW_TOKEN_PREFIX)
}

function previewStats(): DashboardSnapshotV2Stats {
  const now = new Date().toISOString()
  return {
    total_users: 24,
    today_new_users: 3,
    active_users: 9,
    hourly_active_users: 4,
    stats_updated_at: now,
    stats_stale: false,
    total_api_keys: 38,
    active_api_keys: 31,
    total_accounts: 8,
    normal_accounts: 7,
    error_accounts: 0,
    ratelimit_accounts: 1,
    overload_accounts: 0,
    total_requests: 128640,
    total_input_tokens: 18240000,
    total_output_tokens: 9120000,
    total_cache_creation_tokens: 580000,
    total_cache_read_tokens: 2120000,
    total_tokens: 30060000,
    total_cost: 1280.5,
    total_actual_cost: 768.3,
    total_account_cost: 612.4,
    today_requests: 1840,
    today_input_tokens: 286000,
    today_output_tokens: 142000,
    today_cache_creation_tokens: 12000,
    today_cache_read_tokens: 36000,
    today_tokens: 476000,
    today_cost: 20.8,
    today_actual_cost: 12.48,
    today_account_cost: 9.9,
    average_duration_ms: 820,
    uptime: 86400,
    rpm: 72,
    tpm: 18600
  }
}

function previewTrend(): TrendDataPoint[] {
  const now = Date.now()
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now - (11 - index) * 60 * 60 * 1000).toISOString().slice(0, 13) + ':00'
    const requests = 90 + index * 8
    const input = requests * 120
    const output = requests * 68
    return {
      date,
      requests,
      input_tokens: input,
      output_tokens: output,
      cache_creation_tokens: Math.round(requests * 4),
      cache_read_tokens: Math.round(requests * 12),
      total_tokens: input + output,
      cost: Number((requests * 0.011).toFixed(3)),
      actual_cost: Number((requests * 0.0066).toFixed(3))
    }
  })
}

function previewModels(): ModelStat[] {
  return [
    {
      model: 'gpt-5.5',
      requests: 680,
      input_tokens: 108000,
      output_tokens: 56000,
      cache_creation_tokens: 4600,
      cache_read_tokens: 15000,
      total_tokens: 183600,
      cost: 8.6,
      actual_cost: 5.16,
      account_cost: 4.3
    },
    {
      model: 'gpt-5.4',
      requests: 520,
      input_tokens: 82000,
      output_tokens: 42000,
      cache_creation_tokens: 3200,
      cache_read_tokens: 11800,
      total_tokens: 139000,
      cost: 6.4,
      actual_cost: 3.84,
      account_cost: 3.1
    },
    {
      model: 'claude-4.7',
      requests: 410,
      input_tokens: 66000,
      output_tokens: 31000,
      cache_creation_tokens: 2400,
      cache_read_tokens: 9200,
      total_tokens: 108600,
      cost: 4.9,
      actual_cost: 2.94,
      account_cost: 2.2
    }
  ]
}

function previewUserTrend(): UserUsageTrendPoint[] {
  const users = [
    { user_id: 1, email: 'admin@ownapi.dev', username: 'Admin' },
    { user_id: 2, email: 'user@ownapi.dev', username: 'User' }
  ]
  return previewTrend().flatMap((point) =>
    users.map((user, userIndex) => ({
      date: point.date,
      ...user,
      requests: Math.round(point.requests / (userIndex + 2)),
      tokens: Math.round(point.total_tokens / (userIndex + 2)),
      cost: Number((point.cost / (userIndex + 2)).toFixed(3)),
      actual_cost: Number((point.actual_cost / (userIndex + 2)).toFixed(3))
    }))
  )
}

const localPreviewDashboardAPI: Partial<Record<keyof typeof realDashboardAPI, (...args: any[]) => any>> = {
  getStats: async () => previewStats(),
  getRealtimeMetrics: async () => ({
    active_requests: 0,
    requests_per_minute: 72,
    average_response_time: 820,
    error_rate: 0
  }),
  getUsageTrend: async (params?: TrendParams) => ({
    trend: previewTrend(),
    start_date: params?.start_date || '',
    end_date: params?.end_date || '',
    granularity: params?.granularity || 'hour'
  }),
  getModelStats: async (params?: ModelStatsParams) => ({
    models: previewModels(),
    start_date: params?.start_date || '',
    end_date: params?.end_date || ''
  }),
  getGroupStats: async (params?: GroupStatsParams) => ({
    groups: [
      { group_id: 1, group_name: 'GPT 主力分组', requests: 1200, total_tokens: 310000, cost: 14.2, actual_cost: 8.52, account_cost: 6.9 },
      { group_id: 2, group_name: 'Claude 高级分组', requests: 640, total_tokens: 166000, cost: 6.6, actual_cost: 3.96, account_cost: 3.0 }
    ],
    start_date: params?.start_date || '',
    end_date: params?.end_date || ''
  }),
  getSnapshotV2: async (params?: DashboardSnapshotV2Params) => ({
    generated_at: new Date().toISOString(),
    start_date: params?.start_date || '',
    end_date: params?.end_date || '',
    granularity: params?.granularity || 'hour',
    stats: params?.include_stats === false ? undefined : previewStats(),
    trend: previewTrend(),
    models: previewModels(),
    groups: [],
    users_trend: []
  }),
  getApiKeyUsageTrend: async (params?: ApiKeyTrendParams) => ({
    trend: [],
    start_date: params?.start_date || '',
    end_date: params?.end_date || '',
    granularity: params?.granularity || 'hour'
  }),
  getUserUsageTrend: async (params?: UserTrendParams) => ({
    trend: previewUserTrend(),
    start_date: params?.start_date || '',
    end_date: params?.end_date || '',
    granularity: params?.granularity || 'hour'
  }),
  getUserSpendingRanking: async (params?: UserSpendingRankingParams) => ({
    ranking: [
      { user_id: 1, email: 'admin@ownapi.dev', actual_cost: 7.2, requests: 980, tokens: 266000 },
      { user_id: 2, email: 'user@ownapi.dev', actual_cost: 5.28, requests: 860, tokens: 210000 }
    ],
    total_actual_cost: 12.48,
    total_requests: 1840,
    total_tokens: 476000,
    start_date: params?.start_date || '',
    end_date: params?.end_date || ''
  }),
  getBatchUsersUsage: async (userIds: number[]) => ({
    stats: Object.fromEntries(userIds.map(id => [String(id), { user_id: id, today_actual_cost: 0, total_actual_cost: 0 }]))
  }),
  getBatchApiKeysUsage: async (apiKeyIds: number[]) => ({
    stats: Object.fromEntries(apiKeyIds.map(id => [String(id), { api_key_id: id, today_actual_cost: 0, total_actual_cost: 0 }]))
  })
}

export const dashboardAPI = new Proxy(realDashboardAPI, {
  get(target, prop: keyof typeof realDashboardAPI, receiver) {
    if (isLocalPreviewDashboardSession() && prop in localPreviewDashboardAPI) {
      return localPreviewDashboardAPI[prop]
    }
    return Reflect.get(target, prop, receiver)
  }
}) as typeof realDashboardAPI

export default dashboardAPI
