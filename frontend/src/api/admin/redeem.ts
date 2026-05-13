/**
 * Admin Redeem Codes API endpoints
 * Handles redeem code generation and management for administrators
 */

import { apiClient } from '../client'
import type {
  RedeemCode,
  GenerateRedeemCodesRequest,
  RedeemCodeType,
  PaginatedResponse
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

function previewRedeemCodes(): RedeemCode[] {
  const now = new Date().toISOString()
  return [
    {
      id: 1,
      code: 'WELCOME-OWNAPI',
      type: 'balance',
      value: 20,
      status: 'active',
      used_by: null,
      used_at: null,
      created_at: now,
      updated_at: now
    },
    {
      id: 2,
      code: 'CLAUDE-PREVIEW',
      type: 'subscription',
      value: 1,
      status: 'unused',
      used_by: null,
      used_at: null,
      created_at: now,
      updated_at: now,
      group_id: 2,
      validity_days: 30
    }
  ]
}

/**
 * List all redeem codes with pagination
 * @param page - Page number (default: 1)
 * @param pageSize - Items per page (default: 20)
 * @param filters - Optional filters
 * @returns Paginated list of redeem codes
 */
export async function list(
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    type?: RedeemCodeType
    status?: 'active' | 'used' | 'expired' | 'unused'
    search?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  },
  options?: {
    signal?: AbortSignal
  }
): Promise<PaginatedResponse<RedeemCode>> {
  if (isLocalPreviewSession()) {
    const items = previewRedeemCodes()
    return {
      items,
      total: items.length,
      page,
      page_size: pageSize,
      pages: 1
    }
  }

  const { data } = await apiClient.get<PaginatedResponse<RedeemCode>>('/admin/redeem-codes', {
    params: {
      page,
      page_size: pageSize,
      ...filters
    },
    signal: options?.signal
  })
  return data
}

/**
 * Get redeem code by ID
 * @param id - Redeem code ID
 * @returns Redeem code details
 */
export async function getById(id: number): Promise<RedeemCode> {
  if (isLocalPreviewSession()) {
    return previewRedeemCodes().find((item) => item.id === id) ?? previewRedeemCodes()[0]
  }

  const { data } = await apiClient.get<RedeemCode>(`/admin/redeem-codes/${id}`)
  return data
}

/**
 * Generate new redeem codes
 * @param count - Number of codes to generate
 * @param type - Type of redeem code
 * @param value - Value of the code
 * @param groupId - Group ID (required for subscription type)
 * @param validityDays - Validity days (for subscription type)
 * @returns Array of generated redeem codes
 */
export async function generate(
  count: number,
  type: RedeemCodeType,
  value: number,
  groupId?: number | null,
  validityDays?: number
): Promise<RedeemCode[]> {
  if (isLocalPreviewSession()) {
    const now = new Date().toISOString()
    return Array.from({ length: count }, (_, index) => ({
      id: 100 + index,
      code: `PREVIEW-${String(index + 1).padStart(4, '0')}`,
      type,
      value,
      status: 'active',
      used_by: null,
      used_at: null,
      created_at: now,
      updated_at: now,
      group_id: type === 'subscription' ? groupId ?? null : undefined,
      validity_days: type === 'subscription' ? validityDays ?? 30 : undefined
    }))
  }

  const payload: GenerateRedeemCodesRequest = {
    count,
    type,
    value
  }

  // 订阅类型专用字段
  if (type === 'subscription') {
    payload.group_id = groupId
    if (validityDays && validityDays > 0) {
      payload.validity_days = validityDays
    }
  }

  const { data } = await apiClient.post<RedeemCode[]>('/admin/redeem-codes/generate', payload)
  return data
}

/**
 * Delete redeem code
 * @param id - Redeem code ID
 * @returns Success confirmation
 */
export async function deleteCode(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(`/admin/redeem-codes/${id}`)
  return data
}

/**
 * Batch delete redeem codes
 * @param ids - Array of redeem code IDs
 * @returns Success confirmation
 */
export async function batchDelete(ids: number[]): Promise<{
  deleted: number
  message: string
}> {
  const { data } = await apiClient.post<{
    deleted: number
    message: string
  }>('/admin/redeem-codes/batch-delete', { ids })
  return data
}

/**
 * Expire redeem code
 * @param id - Redeem code ID
 * @returns Updated redeem code
 */
export async function expire(id: number): Promise<RedeemCode> {
  const { data } = await apiClient.post<RedeemCode>(`/admin/redeem-codes/${id}/expire`)
  return data
}

/**
 * Get redeem code statistics
 * @returns Statistics about redeem codes
 */
export async function getStats(): Promise<{
  total_codes: number
  active_codes: number
  used_codes: number
  expired_codes: number
  total_value_distributed: number
  by_type: Record<RedeemCodeType, number>
}> {
  if (isLocalPreviewSession()) {
    return {
      total_codes: 2,
      active_codes: 2,
      used_codes: 0,
      expired_codes: 0,
      total_value_distributed: 0,
      by_type: {
        balance: 1,
        concurrency: 0,
        subscription: 1,
        invitation: 0
      } as Record<RedeemCodeType, number>
    }
  }

  const { data } = await apiClient.get<{
    total_codes: number
    active_codes: number
    used_codes: number
    expired_codes: number
    total_value_distributed: number
    by_type: Record<RedeemCodeType, number>
  }>('/admin/redeem-codes/stats')
  return data
}

/**
 * Export redeem codes to CSV
 * @param filters - Optional filters
 * @returns CSV data as blob
 */
export async function exportCodes(filters?: {
  type?: RedeemCodeType
  status?: 'used' | 'expired' | 'unused'
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}): Promise<Blob> {
  const response = await apiClient.get('/admin/redeem-codes/export', {
    params: filters,
    responseType: 'blob'
  })
  return response.data
}

export const redeemAPI = {
  list,
  getById,
  generate,
  delete: deleteCode,
  batchDelete,
  expire,
  getStats,
  exportCodes
}

export default redeemAPI
