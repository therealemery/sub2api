/**
 * API Keys management endpoints
 * Handles CRUD operations for user API keys
 */

import { apiClient } from './client'
import type { ApiKey, CreateApiKeyRequest, UpdateApiKeyRequest, PaginatedResponse } from '@/types'

const LOCAL_PREVIEW_TOKEN_PREFIX = 'local-preview-'

function isLocalPreviewSession(): boolean {
  return (
    (import.meta.env.DEV || ['127.0.0.1', 'localhost', '::1'].includes(window.location.hostname)) &&
    !!localStorage.getItem('auth_token')?.startsWith(LOCAL_PREVIEW_TOKEN_PREFIX)
  )
}

function previewApiKeys(): ApiKey[] {
  const now = new Date().toISOString()
  return [
    {
      id: 1,
      user_id: 2,
      key: 'sk-ownapi-preview-gpt',
      name: 'GPT 5.5 主力密钥',
      group_id: 1,
      status: 'active',
      ip_whitelist: [],
      ip_blacklist: [],
      last_used_at: now,
      quota: 0,
      quota_used: 4.2,
      expires_at: null,
      created_at: now,
      updated_at: now,
      rate_limit_5h: 0,
      rate_limit_1d: 0,
      rate_limit_7d: 0,
      usage_5h: 12,
      usage_1d: 38,
      usage_7d: 184,
      window_5h_start: null,
      window_1d_start: null,
      window_7d_start: null,
      reset_5h_at: null,
      reset_1d_at: null,
      reset_7d_at: null
    },
    {
      id: 2,
      user_id: 2,
      key: 'sk-ownapi-preview-claude',
      name: 'Claude 4.7 备用密钥',
      group_id: 2,
      status: 'active',
      ip_whitelist: [],
      ip_blacklist: [],
      last_used_at: now,
      quota: 50,
      quota_used: 8.6,
      expires_at: null,
      created_at: now,
      updated_at: now,
      rate_limit_5h: 0,
      rate_limit_1d: 0,
      rate_limit_7d: 0,
      usage_5h: 6,
      usage_1d: 21,
      usage_7d: 90,
      window_5h_start: null,
      window_1d_start: null,
      window_7d_start: null,
      reset_5h_at: null,
      reset_1d_at: null,
      reset_7d_at: null
    }
  ]
}

/**
 * List all API keys for current user
 * @param page - Page number (default: 1)
 * @param pageSize - Items per page (default: 10)
 * @param filters - Optional filter parameters
 * @param options - Optional request options
 * @returns Paginated list of API keys
 */
export async function list(
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    search?: string
    status?: string
    group_id?: number | string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  },
  options?: {
    signal?: AbortSignal
  }
): Promise<PaginatedResponse<ApiKey>> {
  if (isLocalPreviewSession()) {
    const items = previewApiKeys()
    return {
      items,
      total: items.length,
      page,
      page_size: pageSize,
      pages: 1
    }
  }

  const { data } = await apiClient.get<PaginatedResponse<ApiKey>>('/keys', {
    params: { page, page_size: pageSize, ...filters },
    signal: options?.signal
  })
  return data
}

/**
 * Get API key by ID
 * @param id - API key ID
 * @returns API key details
 */
export async function getById(id: number): Promise<ApiKey> {
  if (isLocalPreviewSession()) {
    return previewApiKeys().find((item) => item.id === id) ?? previewApiKeys()[0]
  }

  const { data } = await apiClient.get<ApiKey>(`/keys/${id}`)
  return data
}

/**
 * Create new API key
 * @param name - Key name
 * @param groupId - Optional group ID
 * @param customKey - Optional custom key value
 * @param ipWhitelist - Optional IP whitelist
 * @param ipBlacklist - Optional IP blacklist
 * @param quota - Optional quota limit in USD (0 = unlimited)
 * @param expiresInDays - Optional days until expiry (undefined = never expires)
 * @param rateLimitData - Optional rate limit fields
 * @returns Created API key
 */
export async function create(
  name: string,
  groupId?: number | null,
  customKey?: string,
  ipWhitelist?: string[],
  ipBlacklist?: string[],
  quota?: number,
  expiresInDays?: number,
  rateLimitData?: { rate_limit_5h?: number; rate_limit_1d?: number; rate_limit_7d?: number }
): Promise<ApiKey> {
  if (isLocalPreviewSession()) {
    const now = new Date().toISOString()
    return {
      ...previewApiKeys()[0],
      id: Date.now(),
      name,
      group_id: groupId ?? null,
      key: customKey || 'sk-ownapi-preview-created',
      ip_whitelist: ipWhitelist ?? [],
      ip_blacklist: ipBlacklist ?? [],
      quota: quota ?? 0,
      expires_at: expiresInDays ? new Date(Date.now() + expiresInDays * 86400000).toISOString() : null,
      created_at: now,
      updated_at: now,
      rate_limit_5h: rateLimitData?.rate_limit_5h ?? 0,
      rate_limit_1d: rateLimitData?.rate_limit_1d ?? 0,
      rate_limit_7d: rateLimitData?.rate_limit_7d ?? 0
    }
  }

  const payload: CreateApiKeyRequest = { name }
  if (groupId !== undefined) {
    payload.group_id = groupId
  }
  if (customKey) {
    payload.custom_key = customKey
  }
  if (ipWhitelist && ipWhitelist.length > 0) {
    payload.ip_whitelist = ipWhitelist
  }
  if (ipBlacklist && ipBlacklist.length > 0) {
    payload.ip_blacklist = ipBlacklist
  }
  if (quota !== undefined && quota > 0) {
    payload.quota = quota
  }
  if (expiresInDays !== undefined && expiresInDays > 0) {
    payload.expires_in_days = expiresInDays
  }
  if (rateLimitData?.rate_limit_5h && rateLimitData.rate_limit_5h > 0) {
    payload.rate_limit_5h = rateLimitData.rate_limit_5h
  }
  if (rateLimitData?.rate_limit_1d && rateLimitData.rate_limit_1d > 0) {
    payload.rate_limit_1d = rateLimitData.rate_limit_1d
  }
  if (rateLimitData?.rate_limit_7d && rateLimitData.rate_limit_7d > 0) {
    payload.rate_limit_7d = rateLimitData.rate_limit_7d
  }

  const { data } = await apiClient.post<ApiKey>('/keys', payload)
  return data
}

/**
 * Update API key
 * @param id - API key ID
 * @param updates - Fields to update
 * @returns Updated API key
 */
export async function update(id: number, updates: UpdateApiKeyRequest): Promise<ApiKey> {
  if (isLocalPreviewSession()) {
    return {
      ...(previewApiKeys().find((item) => item.id === id) ?? previewApiKeys()[0]),
      ...updates,
      updated_at: new Date().toISOString()
    }
  }

  const { data } = await apiClient.put<ApiKey>(`/keys/${id}`, updates)
  return data
}

/**
 * Delete API key
 * @param id - API key ID
 * @returns Success confirmation
 */
export async function deleteKey(id: number): Promise<{ message: string }> {
  if (isLocalPreviewSession()) {
    return { message: '本地预览模式：密钥删除已模拟完成。' }
  }

  const { data } = await apiClient.delete<{ message: string }>(`/keys/${id}`)
  return data
}

/**
 * Toggle API key status (active/inactive)
 * @param id - API key ID
 * @param status - New status
 * @returns Updated API key
 */
export async function toggleStatus(id: number, status: 'active' | 'inactive'): Promise<ApiKey> {
  return update(id, { status })
}

export const keysAPI = {
  list,
  getById,
  create,
  update,
  delete: deleteKey,
  toggleStatus
}

export default keysAPI
