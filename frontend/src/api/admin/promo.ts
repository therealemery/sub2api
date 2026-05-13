/**
 * Admin Promo Codes API endpoints
 */

import { apiClient } from '../client'
import type {
  PromoCode,
  PromoCodeUsage,
  CreatePromoCodeRequest,
  UpdatePromoCodeRequest,
  BasePaginationResponse
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

function previewPromoCodes(): PromoCode[] {
  const now = new Date().toISOString()
  return [
    {
      id: 1,
      code: 'OWNAPI30',
      bonus_amount: 30,
      max_uses: 200,
      used_count: 48,
      status: 'active',
      expires_at: null,
      notes: '本地预览优惠码',
      created_at: now,
      updated_at: now
    },
    {
      id: 2,
      code: 'AGENT2026',
      bonus_amount: 100,
      max_uses: 50,
      used_count: 12,
      status: 'active',
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      notes: '代理招募活动预览',
      created_at: now,
      updated_at: now
    }
  ]
}

export async function list(
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: string
    search?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  },
  options?: {
    signal?: AbortSignal
  }
): Promise<BasePaginationResponse<PromoCode>> {
  if (isLocalPreviewSession()) {
    const items = previewPromoCodes()
    return {
      items,
      total: items.length,
      page,
      page_size: pageSize,
      pages: 1
    }
  }

  const { data } = await apiClient.get<BasePaginationResponse<PromoCode>>('/admin/promo-codes', {
    params: { page, page_size: pageSize, ...filters },
    signal: options?.signal
  })
  return data
}

export async function getById(id: number): Promise<PromoCode> {
  if (isLocalPreviewSession()) {
    return previewPromoCodes().find((item) => item.id === id) ?? previewPromoCodes()[0]
  }

  const { data } = await apiClient.get<PromoCode>(`/admin/promo-codes/${id}`)
  return data
}

export async function create(request: CreatePromoCodeRequest): Promise<PromoCode> {
  const { data } = await apiClient.post<PromoCode>('/admin/promo-codes', request)
  return data
}

export async function update(id: number, request: UpdatePromoCodeRequest): Promise<PromoCode> {
  const { data } = await apiClient.put<PromoCode>(`/admin/promo-codes/${id}`, request)
  return data
}

export async function deleteCode(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(`/admin/promo-codes/${id}`)
  return data
}

export async function getUsages(
  id: number,
  page: number = 1,
  pageSize: number = 20
): Promise<BasePaginationResponse<PromoCodeUsage>> {
  if (isLocalPreviewSession()) {
    return {
      items: [],
      total: 0,
      page,
      page_size: pageSize,
      pages: 0
    }
  }

  const { data } = await apiClient.get<BasePaginationResponse<PromoCodeUsage>>(
    `/admin/promo-codes/${id}/usages`,
    { params: { page, page_size: pageSize } }
  )
  return data
}

const promoAPI = {
  list,
  getById,
  create,
  update,
  delete: deleteCode,
  getUsages
}

export default promoAPI
