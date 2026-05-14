/**
 * User API endpoints
 * Handles user profile management and password changes
 */

import { apiClient } from './client'
import {
  resolveWeChatOAuthStartStrict,
  prepareOAuthBindAccessTokenCookie,
  type WeChatOAuthPublicSettings,
} from './auth'
import type {
  User,
  ChangePasswordRequest,
  NotifyEmailEntry,
  UserAuthProvider,
  UserAffiliateDetail,
  AffiliateTransferResponse
} from '@/types'

const LOCAL_PREVIEW_TOKEN_PREFIX = 'local-preview-'
const LOCAL_PREVIEW_AFFILIATE_KEY = 'ownapi_local_preview_affiliate'
const AUTH_USER_KEY = 'auth_user'

function isLocalPreviewSession(): boolean {
  return (
    (import.meta.env.DEV || ['127.0.0.1', 'localhost', '::1'].includes(window.location.hostname)) &&
    !!localStorage.getItem('auth_token')?.startsWith(LOCAL_PREVIEW_TOKEN_PREFIX)
  )
}

function createPreviewAffiliateDetail(): UserAffiliateDetail {
  const now = new Date().toISOString()

  return {
    user_id: 2,
    aff_code: 'OWNAPI30',
    inviter_id: null,
    aff_count: 3,
    aff_quota: 120,
    aff_frozen_quota: 40,
    aff_history_quota: 360,
    effective_rebate_rate_percent: 10,
    invitees: [
      {
        user_id: 101,
        email: 'a***@gmail.com',
        username: 'GPT Power User',
        created_at: now,
        total_rebate: 180
      },
      {
        user_id: 102,
        email: 'c***@outlook.com',
        username: 'Claude Builder',
        created_at: now,
        total_rebate: 120
      },
      {
        user_id: 103,
        email: 't***@qq.com',
        username: 'Team Admin',
        created_at: now,
        total_rebate: 60
      }
    ]
  }
}

function readPreviewAffiliateDetail(): UserAffiliateDetail {
  const fallback = createPreviewAffiliateDetail()

  try {
    const raw = localStorage.getItem(LOCAL_PREVIEW_AFFILIATE_KEY)
    if (!raw) {
      localStorage.setItem(LOCAL_PREVIEW_AFFILIATE_KEY, JSON.stringify(fallback))
      return fallback
    }

    const parsed = JSON.parse(raw) as Partial<UserAffiliateDetail>
    return {
      ...fallback,
      ...parsed,
      invitees: Array.isArray(parsed.invitees) ? parsed.invitees : fallback.invitees
    }
  } catch {
    return fallback
  }
}

function writePreviewAffiliateDetail(detail: UserAffiliateDetail): void {
  try {
    localStorage.setItem(LOCAL_PREVIEW_AFFILIATE_KEY, JSON.stringify(detail))
  } catch {
    // Ignore preview persistence failures.
  }
}

function addPreviewUserPoints(amount: number): number {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    if (!raw) return amount

    const parsed = JSON.parse(raw) as Partial<User>
    const current = Number(parsed.points ?? parsed.balance ?? 0)
    const next = current + amount
    const updated = {
      ...parsed,
      balance: next,
      points: next,
      updated_at: new Date().toISOString()
    }
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated))
    return next
  } catch {
    return amount
  }
}

/**
 * Get current user profile
 * @returns User profile data
 */
export async function getProfile(): Promise<User> {
  const { data } = await apiClient.get<User>('/user/profile')
  return data
}

/**
 * Update current user profile
 * @param profile - Profile data to update
 * @returns Updated user profile data
 */
export async function updateProfile(profile: {
  username?: string
  avatar_url?: string | null
  balance_notify_enabled?: boolean
  balance_notify_threshold?: number | null
  balance_notify_extra_emails?: NotifyEmailEntry[]
}): Promise<User> {
  const { data } = await apiClient.put<User>('/user', profile)
  return data
}

/**
 * Change current user password
 * @param passwords - Old and new password
 * @returns Success message
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  const payload: ChangePasswordRequest = {
    old_password: oldPassword,
    new_password: newPassword
  }

  const { data } = await apiClient.put<{ message: string }>('/user/password', payload)
  return data
}

/**
 * Send verification code for adding a notify email
 * @param email - Email address to verify
 */
export async function sendNotifyEmailCode(email: string): Promise<void> {
  await apiClient.post('/user/notify-email/send-code', { email })
}

/**
 * Verify and add a notify email
 * @param email - Email address to add
 * @param code - Verification code
 */
export async function verifyNotifyEmail(email: string, code: string): Promise<void> {
  await apiClient.post('/user/notify-email/verify', { email, code })
}

/**
 * Remove a notify email
 * @param email - Email address to remove
 */
export async function removeNotifyEmail(email: string): Promise<void> {
  await apiClient.delete('/user/notify-email', { data: { email } })
}

/**
 * Toggle a notify email's disabled state
 * @param email - Email address (empty string for primary email placeholder)
 * @param disabled - Whether to disable the email
 */
export async function toggleNotifyEmail(email: string, disabled: boolean): Promise<User> {
  const { data } = await apiClient.put<User>('/user/notify-email/toggle', { email, disabled })
  return data
}

export async function sendEmailBindingCode(email: string): Promise<void> {
  await apiClient.post('/user/account-bindings/email/send-code', { email })
}

export async function bindEmailIdentity(payload: {
  email: string
  verify_code: string
  password: string
}): Promise<User> {
  const { data } = await apiClient.post<User>('/user/account-bindings/email', payload)
  return data
}

export async function unbindAuthIdentity(provider: BindableOAuthProvider): Promise<User> {
  const { data } = await apiClient.delete<User>(`/user/account-bindings/${provider}`)
  return data
}

export type BindableOAuthProvider = Exclude<UserAuthProvider, 'email'>

interface BuildOAuthBindingStartURLOptions {
  redirectTo?: string
  wechatOAuthSettings?: WeChatOAuthPublicSettings | null
}

export function resolveWeChatOAuthMode(): 'open' | 'mp' {
  if (typeof navigator === 'undefined') {
    return 'open'
  }
  return /MicroMessenger/i.test(navigator.userAgent) ? 'mp' : 'open'
}

function resolveWeChatOAuthBindingMode(
  settings?: WeChatOAuthPublicSettings | null
): 'open' | 'mp' | null {
  if (settings) {
    return resolveWeChatOAuthStartStrict(settings).mode
  }
  return resolveWeChatOAuthMode()
}

export function buildOAuthBindingStartURL(
  provider: BindableOAuthProvider,
  options: BuildOAuthBindingStartURLOptions = {}
): string | null {
  const redirectTo = options.redirectTo?.trim() || '/profile'
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api/v1'
  const normalized = apiBase.replace(/\/$/, '')
  const params = new URLSearchParams({
    redirect: redirectTo,
    intent: 'bind_current_user'
  })

  if (provider === 'wechat') {
    const mode = resolveWeChatOAuthBindingMode(options.wechatOAuthSettings)
    if (!mode) {
      return null
    }
    params.set('mode', mode)
  }

  return `${normalized}/auth/oauth/${provider}/bind/start?${params.toString()}`
}

export async function startOAuthBinding(
  provider: BindableOAuthProvider,
  options: BuildOAuthBindingStartURLOptions = {}
): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }
  const startURL = buildOAuthBindingStartURL(provider, options)
  if (!startURL) {
    return
  }
  await prepareOAuthBindAccessTokenCookie()
  window.location.href = startURL
}

export async function getAffiliateDetail(): Promise<UserAffiliateDetail> {
  if (isLocalPreviewSession()) {
    return readPreviewAffiliateDetail()
  }

  const { data } = await apiClient.get<UserAffiliateDetail>('/user/aff')
  return data
}

export async function transferAffiliateQuota(): Promise<AffiliateTransferResponse> {
  if (isLocalPreviewSession()) {
    const detail = readPreviewAffiliateDetail()
    const transferred = Math.max(0, Number(detail.aff_quota || 0))

    if (transferred <= 0) {
      return Promise.reject({
        code: 'AFFILIATE_QUOTA_EMPTY',
        message: '当前没有可转入的返利积分'
      })
    }

    writePreviewAffiliateDetail({
      ...detail,
      aff_quota: 0
    })

    return {
      transferred_quota: transferred,
      balance: addPreviewUserPoints(transferred)
    }
  }

  const { data } = await apiClient.post<AffiliateTransferResponse>('/user/aff/transfer')
  return data
}

export const userAPI = {
  getProfile,
  updateProfile,
  changePassword,
  sendNotifyEmailCode,
  verifyNotifyEmail,
  removeNotifyEmail,
  toggleNotifyEmail,
  sendEmailBindingCode,
  bindEmailIdentity,
  unbindAuthIdentity,
  buildOAuthBindingStartURL,
  startOAuthBinding,
  getAffiliateDetail,
  transferAffiliateQuota
}

export default userAPI
