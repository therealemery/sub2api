/**
 * Usage tracking API endpoints
 * Handles usage logs and statistics retrieval
 */

import { apiClient } from './client'
import type {
  UsageLog,
  UsageQueryParams,
  UsageStatsResponse,
  PaginatedResponse,
  TrendDataPoint,
  ModelStat
} from '@/types'

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

function previewTrendData(): TrendDataPoint[] {
  const now = Date.now()
  return Array.from({ length: 7 }, (_, index) => {
    const requests = 80 + index * 18
    const input = requests * 140
    const output = requests * 72
    return {
      date: new Date(now - (6 - index) * 86400000).toISOString().slice(0, 10),
      requests,
      input_tokens: input,
      output_tokens: output,
      cache_creation_tokens: Math.round(requests * 5),
      cache_read_tokens: Math.round(requests * 16),
      total_tokens: input + output,
      cost: Number((requests * 0.012).toFixed(3)),
      actual_cost: Number((requests * 0.0072).toFixed(3))
    }
  })
}

function previewModelStats(): ModelStat[] {
  return [
    {
      model: 'gpt-5.5',
      requests: 420,
      input_tokens: 78000,
      output_tokens: 39000,
      cache_creation_tokens: 2600,
      cache_read_tokens: 9800,
      total_tokens: 129400,
      cost: 6.8,
      actual_cost: 4.08,
      account_cost: 3.4
    },
    {
      model: 'claude-4.7',
      requests: 310,
      input_tokens: 61000,
      output_tokens: 33000,
      cache_creation_tokens: 1800,
      cache_read_tokens: 7200,
      total_tokens: 103000,
      cost: 5.2,
      actual_cost: 3.12,
      account_cost: 2.6
    }
  ]
}

function previewUsageLogs(): UsageLog[] {
  const now = new Date().toISOString()
  return previewModelStats().map((item, index) => ({
    id: index + 1,
    user_id: 2,
    api_key_id: index + 1,
    account_id: null,
    request_id: `preview-${index + 1}`,
    model: item.model,
    service_tier: null,
    reasoning_effort: null,
    inbound_endpoint: '/v1/chat/completions',
    upstream_endpoint: null,
    group_id: index + 1,
    subscription_id: null,
    input_tokens: Math.round(item.input_tokens / 20),
    output_tokens: Math.round(item.output_tokens / 20),
    cache_creation_tokens: Math.round(item.cache_creation_tokens / 20),
    cache_read_tokens: Math.round(item.cache_read_tokens / 20),
    cache_creation_5m_tokens: 0,
    cache_creation_1h_tokens: 0,
    input_cost: 0.12,
    output_cost: 0.18,
    cache_creation_cost: 0.02,
    cache_read_cost: 0.01,
    total_cost: 0.33,
    actual_cost: 0.2,
    rate_multiplier: 0.6,
    billing_type: 1,
    stream: true,
    duration_ms: 860 + index * 120,
    first_token_ms: 320 + index * 40,
    image_count: 0,
    image_size: null,
    user_agent: 'Local Preview',
    cache_ttl_overridden: false,
    billing_mode: 'standard',
    created_at: now
  }))
}

function previewUsageStats(period = 'today'): UsageStatsResponse {
  const logs = previewUsageLogs()
  const totalInput = logs.reduce((sum, item) => sum + item.input_tokens, 0)
  const totalOutput = logs.reduce((sum, item) => sum + item.output_tokens, 0)
  const totalCache = logs.reduce(
    (sum, item) => sum + item.cache_creation_tokens + item.cache_read_tokens,
    0
  )
  return {
    period,
    total_requests: logs.length,
    total_input_tokens: totalInput,
    total_output_tokens: totalOutput,
    total_cache_tokens: totalCache,
    total_tokens: totalInput + totalOutput + totalCache,
    total_cost: Number(logs.reduce((sum, item) => sum + item.total_cost, 0).toFixed(3)),
    total_actual_cost: Number(logs.reduce((sum, item) => sum + item.actual_cost, 0).toFixed(3)),
    average_duration_ms: Math.round(
      logs.reduce((sum, item) => sum + item.duration_ms, 0) / Math.max(1, logs.length)
    ),
    models: logs.reduce<Record<string, number>>((acc, item) => {
      acc[item.model] = (acc[item.model] ?? 0) + 1
      return acc
    }, {})
  }
}

// ==================== Dashboard Types ====================

export interface UserDashboardStats {
  total_api_keys: number
  active_api_keys: number
  total_requests: number
  total_input_tokens: number
  total_output_tokens: number
  total_cache_creation_tokens: number
  total_cache_read_tokens: number
  total_tokens: number
  total_cost: number // 标准计费
  total_actual_cost: number // 实际扣除
  today_requests: number
  today_input_tokens: number
  today_output_tokens: number
  today_cache_creation_tokens: number
  today_cache_read_tokens: number
  today_tokens: number
  today_cost: number // 今日标准计费
  today_actual_cost: number // 今日实际扣除
  average_duration_ms: number
  rpm: number // 近5分钟平均每分钟请求数
  tpm: number // 近5分钟平均每分钟Token数
}

export interface TrendParams {
  start_date?: string
  end_date?: string
  granularity?: 'day' | 'hour'
}

export interface TrendResponse {
  trend: TrendDataPoint[]
  start_date: string
  end_date: string
  granularity: string
}

export interface ModelStatsResponse {
  models: ModelStat[]
  start_date: string
  end_date: string
}

/**
 * List usage logs with optional filters
 * @param page - Page number (default: 1)
 * @param pageSize - Items per page (default: 20)
 * @param apiKeyId - Filter by API key ID
 * @returns Paginated list of usage logs
 */
export async function list(
  page: number = 1,
  pageSize: number = 20,
  apiKeyId?: number
): Promise<PaginatedResponse<UsageLog>> {
  if (isLocalPreviewSession()) {
    const items = previewUsageLogs().filter((item) => apiKeyId === undefined || item.api_key_id === apiKeyId)
    return {
      items,
      total: items.length,
      page,
      page_size: pageSize,
      pages: 1
    }
  }

  const params: UsageQueryParams = {
    page,
    page_size: pageSize
  }

  if (apiKeyId !== undefined) {
    params.api_key_id = apiKeyId
  }

  const { data } = await apiClient.get<PaginatedResponse<UsageLog>>('/usage', {
    params
  })
  return data
}

/**
 * Get usage logs with advanced query parameters
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated list of usage logs
 */
export async function query(
  params: UsageQueryParams & { sort_by?: string; sort_order?: 'asc' | 'desc' },
  config: { signal?: AbortSignal } = {}
): Promise<PaginatedResponse<UsageLog>> {
  if (isLocalPreviewSession()) {
    const items = previewUsageLogs()
    return {
      items,
      total: items.length,
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
      pages: 1
    }
  }

  const { data } = await apiClient.get<PaginatedResponse<UsageLog>>('/usage', {
    ...config,
    params
  })
  return data
}

/**
 * Get usage statistics for a specific period
 * @param period - Time period ('today', 'week', 'month', 'year')
 * @param apiKeyId - Optional API key ID filter
 * @returns Usage statistics
 */
export async function getStats(
  period: string = 'today',
  apiKeyId?: number
): Promise<UsageStatsResponse> {
  if (isLocalPreviewSession()) {
    return previewUsageStats(period)
  }

  const params: Record<string, unknown> = { period }

  if (apiKeyId !== undefined) {
    params.api_key_id = apiKeyId
  }

  const { data } = await apiClient.get<UsageStatsResponse>('/usage/stats', {
    params
  })
  return data
}

/**
 * Get usage statistics for a date range
 * @param startDate - Start date (YYYY-MM-DD format)
 * @param endDate - End date (YYYY-MM-DD format)
 * @param apiKeyId - Optional API key ID filter
 * @returns Usage statistics
 */
export async function getStatsByDateRange(
  startDate: string,
  endDate: string,
  apiKeyId?: number
): Promise<UsageStatsResponse> {
  if (isLocalPreviewSession()) {
    return previewUsageStats('range')
  }

  const params: Record<string, unknown> = {
    start_date: startDate,
    end_date: endDate
  }

  if (apiKeyId !== undefined) {
    params.api_key_id = apiKeyId
  }

  const { data } = await apiClient.get<UsageStatsResponse>('/usage/stats', {
    params
  })
  return data
}

/**
 * Get usage by date range
 * @param startDate - Start date (YYYY-MM-DD format)
 * @param endDate - End date (YYYY-MM-DD format)
 * @param apiKeyId - Optional API key ID filter
 * @returns Usage logs within date range
 */
export async function getByDateRange(
  startDate: string,
  endDate: string,
  apiKeyId?: number
): Promise<PaginatedResponse<UsageLog>> {
  if (isLocalPreviewSession()) {
    const items = previewUsageLogs()
    return {
      items,
      total: items.length,
      page: 1,
      page_size: 100,
      pages: 1
    }
  }

  const params: UsageQueryParams = {
    start_date: startDate,
    end_date: endDate,
    page: 1,
    page_size: 100
  }

  if (apiKeyId !== undefined) {
    params.api_key_id = apiKeyId
  }

  const { data } = await apiClient.get<PaginatedResponse<UsageLog>>('/usage', {
    params
  })
  return data
}

/**
 * Get detailed usage log by ID
 * @param id - Usage log ID
 * @returns Usage log details
 */
export async function getById(id: number): Promise<UsageLog> {
  if (isLocalPreviewSession()) {
    return previewUsageLogs().find((item) => item.id === id) ?? previewUsageLogs()[0]
  }

  const { data } = await apiClient.get<UsageLog>(`/usage/${id}`)
  return data
}

// ==================== Dashboard API ====================

/**
 * Get user dashboard statistics
 * @returns Dashboard statistics for current user
 */
export async function getDashboardStats(): Promise<UserDashboardStats> {
  if (isLocalPreviewSession()) {
    return {
      total_api_keys: 2,
      active_api_keys: 2,
      total_requests: 1280,
      total_input_tokens: 186000,
      total_output_tokens: 92000,
      total_cache_creation_tokens: 6400,
      total_cache_read_tokens: 24600,
      total_tokens: 309000,
      total_cost: 18.6,
      total_actual_cost: 11.16,
      today_requests: 184,
      today_input_tokens: 28600,
      today_output_tokens: 14200,
      today_cache_creation_tokens: 900,
      today_cache_read_tokens: 3600,
      today_tokens: 47300,
      today_cost: 2.8,
      today_actual_cost: 1.68,
      average_duration_ms: 840,
      rpm: 18,
      tpm: 4200
    }
  }

  const { data } = await apiClient.get<UserDashboardStats>('/usage/dashboard/stats')
  return data
}

/**
 * Get user usage trend data
 * @param params - Query parameters for filtering
 * @returns Usage trend data for current user
 */
export async function getDashboardTrend(params?: TrendParams): Promise<TrendResponse> {
  if (isLocalPreviewSession()) {
    return {
      trend: previewTrendData(),
      start_date: params?.start_date || '',
      end_date: params?.end_date || '',
      granularity: params?.granularity || 'day'
    }
  }

  const { data } = await apiClient.get<TrendResponse>('/usage/dashboard/trend', { params })
  return data
}

/**
 * Get user model usage statistics
 * @param params - Query parameters for filtering
 * @returns Model usage statistics for current user
 */
export async function getDashboardModels(params?: {
  start_date?: string
  end_date?: string
}): Promise<ModelStatsResponse> {
  if (isLocalPreviewSession()) {
    return {
      models: previewModelStats(),
      start_date: params?.start_date || '',
      end_date: params?.end_date || ''
    }
  }

  const { data } = await apiClient.get<ModelStatsResponse>('/usage/dashboard/models', { params })
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
 * Get batch usage stats for user's own API keys
 * @param apiKeyIds - Array of API key IDs
 * @param options - Optional request options
 * @returns Usage stats map keyed by API key ID
 */
export async function getDashboardApiKeysUsage(
  apiKeyIds: number[],
  options?: {
    signal?: AbortSignal
  }
): Promise<BatchApiKeysUsageResponse> {
  if (isLocalPreviewSession()) {
    return {
      stats: Object.fromEntries(
        apiKeyIds.map((id) => [
          String(id),
          {
            api_key_id: id,
            today_actual_cost: 0.48,
            total_actual_cost: 6.2
          }
        ])
      )
    }
  }

  const { data } = await apiClient.post<BatchApiKeysUsageResponse>(
    '/usage/dashboard/api-keys-usage',
    {
      api_key_ids: apiKeyIds
    },
    {
      signal: options?.signal
    }
  )
  return data
}

export const usageAPI = {
  list,
  query,
  getStats,
  getStatsByDateRange,
  getByDateRange,
  getById,
  // Dashboard
  getDashboardStats,
  getDashboardTrend,
  getDashboardModels,
  getDashboardApiKeysUsage
}

export default usageAPI
