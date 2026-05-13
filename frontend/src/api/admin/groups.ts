/**
 * Admin Groups API endpoints
 * Handles API key group management for administrators
 */

import { apiClient } from '../client'
import type {
  AdminGroup,
  GroupPlatform,
  CreateGroupRequest,
  UpdateGroupRequest,
  PaginatedResponse
} from '@/types'

/**
 * List all groups with pagination
 * @param page - Page number (default: 1)
 * @param pageSize - Items per page (default: 20)
 * @param filters - Optional filters (platform, status, is_exclusive, search)
 * @returns Paginated list of groups
 */
export async function list(
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    platform?: GroupPlatform
    status?: 'active' | 'inactive'
    is_exclusive?: boolean
    search?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  },
  options?: {
    signal?: AbortSignal
  }
): Promise<PaginatedResponse<AdminGroup>> {
  const { data } = await apiClient.get<PaginatedResponse<AdminGroup>>('/admin/groups', {
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
 * Get all active groups (without pagination)
 * @param platform - Optional platform filter
 * @returns List of all active groups
 */
export async function getAll(platform?: GroupPlatform): Promise<AdminGroup[]> {
  const { data } = await apiClient.get<AdminGroup[]>('/admin/groups/all', {
    params: platform ? { platform } : undefined
  })
  return data
}

/**
 * Get active groups by platform
 * @param platform - Platform to filter by
 * @returns List of groups for the specified platform
 */
export async function getByPlatform(platform: GroupPlatform): Promise<AdminGroup[]> {
  return getAll(platform)
}

/**
 * Get group by ID
 * @param id - Group ID
 * @returns Group details
 */
export async function getById(id: number): Promise<AdminGroup> {
  const { data } = await apiClient.get<AdminGroup>(`/admin/groups/${id}`)
  return data
}

/**
 * Create new group
 * @param groupData - Group data
 * @returns Created group
 */
export async function create(groupData: CreateGroupRequest): Promise<AdminGroup> {
  const { data } = await apiClient.post<AdminGroup>('/admin/groups', groupData)
  return data
}

/**
 * Update group
 * @param id - Group ID
 * @param updates - Fields to update
 * @returns Updated group
 */
export async function update(id: number, updates: UpdateGroupRequest): Promise<AdminGroup> {
  const { data } = await apiClient.put<AdminGroup>(`/admin/groups/${id}`, updates)
  return data
}

/**
 * Delete group
 * @param id - Group ID
 * @returns Success confirmation
 */
export async function deleteGroup(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(`/admin/groups/${id}`)
  return data
}

/**
 * Toggle group status
 * @param id - Group ID
 * @param status - New status
 * @returns Updated group
 */
export async function toggleStatus(id: number, status: 'active' | 'inactive'): Promise<AdminGroup> {
  return update(id, { status })
}

/**
 * Get group statistics
 * @param id - Group ID
 * @returns Group usage statistics
 */
export async function getStats(id: number): Promise<{
  total_api_keys: number
  active_api_keys: number
  total_requests: number
  total_cost: number
}> {
  const { data } = await apiClient.get<{
    total_api_keys: number
    active_api_keys: number
    total_requests: number
    total_cost: number
  }>(`/admin/groups/${id}/stats`)
  return data
}

/**
 * Get API keys in a group
 * @param id - Group ID
 * @param page - Page number
 * @param pageSize - Items per page
 * @returns Paginated list of API keys in the group
 */
export async function getGroupApiKeys(
  id: number,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<any>> {
  const { data } = await apiClient.get<PaginatedResponse<any>>(`/admin/groups/${id}/api-keys`, {
    params: { page, page_size: pageSize }
  })
  return data
}

/**
 * Rate multiplier entry for a user in a group
 */
export interface GroupRateMultiplierEntry {
  user_id: number
  user_name: string
  user_email: string
  user_notes: string
  user_status: string
  rate_multiplier?: number | null
  rpm_override?: number | null
}

/**
 * Get rate multipliers for users in a group
 * @param id - Group ID
 * @returns List of user rate multiplier entries
 */
export async function getGroupRateMultipliers(id: number): Promise<GroupRateMultiplierEntry[]> {
  const { data } = await apiClient.get<GroupRateMultiplierEntry[]>(
    `/admin/groups/${id}/rate-multipliers`
  )
  return data
}

/**
 * Update group sort orders
 * @param updates - Array of { id, sort_order } objects
 * @returns Success confirmation
 */
export async function updateSortOrder(
  updates: Array<{ id: number; sort_order: number }>
): Promise<{ message: string }> {
  const { data } = await apiClient.put<{ message: string }>('/admin/groups/sort-order', {
    updates
  })
  return data
}

/**
 * Clear all rate multipliers for a group
 * @param id - Group ID
 * @returns Success confirmation
 */
export async function clearGroupRateMultipliers(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(`/admin/groups/${id}/rate-multipliers`)
  return data
}

/**
 * Batch set rate multipliers for users in a group
 * Only touches rate_multiplier column; preserves rpm_override on existing rows.
 */
export async function batchSetGroupRateMultipliers(
  id: number,
  entries: Array<{ user_id: number; rate_multiplier: number }>
): Promise<{ message: string }> {
  const { data } = await apiClient.put<{ message: string }>(
    `/admin/groups/${id}/rate-multipliers`,
    { entries }
  )
  return data
}

/**
 * RPM override entry for a user in a group
 */
export interface GroupRPMOverrideEntry {
  user_id: number
  user_name: string
  user_email: string
  user_notes: string
  user_status: string
  rpm_override: number
}

/**
 * Get RPM overrides for users in a group (subset of rate-multipliers endpoint).
 */
export async function getGroupRPMOverrides(id: number): Promise<GroupRPMOverrideEntry[]> {
  const { data } = await apiClient.get<GroupRateMultiplierEntry[]>(
    `/admin/groups/${id}/rate-multipliers`
  )
  return data
    .filter(e => e.rpm_override != null)
    .map(e => ({
      user_id: e.user_id,
      user_name: e.user_name,
      user_email: e.user_email,
      user_notes: e.user_notes,
      user_status: e.user_status,
      rpm_override: e.rpm_override as number
    }))
}

/**
 * Batch set RPM overrides for users in a group.
 * Only touches rpm_override column; preserves rate_multiplier on existing rows.
 */
export async function batchSetGroupRPMOverrides(
  id: number,
  entries: Array<{ user_id: number; rpm_override: number }>
): Promise<{ message: string }> {
  const { data } = await apiClient.put<{ message: string }>(
    `/admin/groups/${id}/rpm-overrides`,
    { entries }
  )
  return data
}

/**
 * Clear all RPM overrides for a group (preserves rate_multiplier).
 */
export async function clearGroupRPMOverrides(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(`/admin/groups/${id}/rpm-overrides`)
  return data
}

/**
 * Get usage summary (today + cumulative cost) for all groups
 * @param timezone - IANA timezone string (e.g. "Asia/Shanghai")
 * @returns Array of group usage summaries
 */
export async function getUsageSummary(
  timezone?: string
): Promise<{ group_id: number; today_cost: number; total_cost: number }[]> {
  const { data } = await apiClient.get<
    { group_id: number; today_cost: number; total_cost: number }[]
  >('/admin/groups/usage-summary', {
    params: timezone ? { timezone } : undefined
  })
  return data
}

/**
 * Get capacity summary (concurrency/sessions/RPM) for all active groups
 */
export async function getCapacitySummary(): Promise<
  { group_id: number; concurrency_used: number; concurrency_max: number; sessions_used: number; sessions_max: number; rpm_used: number; rpm_max: number }[]
> {
  const { data } = await apiClient.get<
    { group_id: number; concurrency_used: number; concurrency_max: number; sessions_used: number; sessions_max: number; rpm_used: number; rpm_max: number }[]
  >('/admin/groups/capacity-summary')
  return data
}

const realGroupsAPI = {
  list,
  getAll,
  getByPlatform,
  getById,
  create,
  update,
  delete: deleteGroup,
  toggleStatus,
  getStats,
  getGroupApiKeys,
  getGroupRateMultipliers,
  clearGroupRateMultipliers,
  batchSetGroupRateMultipliers,
  getGroupRPMOverrides,
  clearGroupRPMOverrides,
  batchSetGroupRPMOverrides,
  updateSortOrder,
  getUsageSummary,
  getCapacitySummary
}

const LOCAL_PREVIEW_TOKEN_PREFIX = 'local-preview-'

function isLocalPreviewGroupsSession(): boolean {
  if (
    typeof localStorage === 'undefined' ||
    (!import.meta.env.DEV && !['127.0.0.1', 'localhost', '::1'].includes(window.location.hostname))
  ) return false
  return !!localStorage.getItem('auth_token')?.startsWith(LOCAL_PREVIEW_TOKEN_PREFIX)
}

function previewGroup(overrides: Partial<AdminGroup> & Pick<AdminGroup, 'id' | 'name' | 'platform'>): AdminGroup {
  const now = new Date().toISOString()
  return {
    id: overrides.id,
    name: overrides.name,
    description: overrides.description ?? null,
    platform: overrides.platform,
    rate_multiplier: overrides.rate_multiplier ?? 0.6,
    rpm_limit: overrides.rpm_limit ?? 120,
    is_exclusive: overrides.is_exclusive ?? false,
    status: overrides.status ?? 'active',
    subscription_type: overrides.subscription_type ?? 'standard',
    daily_limit_usd: overrides.daily_limit_usd ?? null,
    weekly_limit_usd: overrides.weekly_limit_usd ?? null,
    monthly_limit_usd: overrides.monthly_limit_usd ?? null,
    allow_image_generation: overrides.allow_image_generation ?? overrides.platform === 'openai',
    image_rate_independent: overrides.image_rate_independent ?? false,
    image_rate_multiplier: overrides.image_rate_multiplier ?? 1,
    image_price_1k: overrides.image_price_1k ?? null,
    image_price_2k: overrides.image_price_2k ?? null,
    image_price_4k: overrides.image_price_4k ?? null,
    claude_code_only: overrides.claude_code_only ?? false,
    fallback_group_id: overrides.fallback_group_id ?? null,
    fallback_group_id_on_invalid_request: overrides.fallback_group_id_on_invalid_request ?? null,
    allow_messages_dispatch: overrides.allow_messages_dispatch ?? overrides.platform === 'openai',
    default_mapped_model: overrides.default_mapped_model ?? '',
    messages_dispatch_model_config: overrides.messages_dispatch_model_config ?? {},
    require_oauth_only: overrides.require_oauth_only ?? false,
    require_privacy_set: overrides.require_privacy_set ?? false,
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now,
    model_routing: overrides.model_routing ?? null,
    model_routing_enabled: overrides.model_routing_enabled ?? false,
    mcp_xml_inject: overrides.mcp_xml_inject ?? false,
    supported_model_scopes: overrides.supported_model_scopes ?? [],
    account_count: overrides.account_count ?? 0,
    active_account_count: overrides.active_account_count ?? 0,
    rate_limited_account_count: overrides.rate_limited_account_count ?? 0,
    sort_order: overrides.sort_order ?? overrides.id
  }
}

const previewGroups: AdminGroup[] = [
  previewGroup({
    id: 1,
    name: 'GPT 主力分组',
    description: '用于 GPT 5.4、GPT 5.5 等 OpenAI 兼容模型的默认分组。',
    platform: 'openai',
    account_count: 3,
    active_account_count: 2,
    sort_order: 10
  }),
  previewGroup({
    id: 2,
    name: 'Claude 高级分组',
    description: '用于 Claude 4.6、Claude 4.7 与 Claude Code 场景。',
    platform: 'anthropic',
    account_count: 2,
    active_account_count: 2,
    sort_order: 20
  }),
  previewGroup({
    id: 3,
    name: 'Gemini 标准分组',
    description: '用于 Gemini 系列模型的标准调用分组。',
    platform: 'gemini',
    account_count: 1,
    active_account_count: 1,
    sort_order: 30
  }),
  previewGroup({
    id: 4,
    name: 'Antigravity 测试分组',
    description: '用于 Antigravity 平台的测试配置。',
    platform: 'antigravity',
    status: 'inactive',
    rpm_limit: 60,
    sort_order: 40
  })
]

function sortValue(group: AdminGroup, field?: string): string | number {
  switch (field) {
    case 'name':
      return group.name
    case 'platform':
      return group.platform
    case 'status':
      return group.status
    case 'rate_multiplier':
      return group.rate_multiplier
    case 'created_at':
      return group.created_at
    case 'updated_at':
      return group.updated_at
    case 'sort_order':
    default:
      return group.sort_order
  }
}

function filterPreviewGroups(filters?: {
  platform?: GroupPlatform
  status?: 'active' | 'inactive'
  is_exclusive?: boolean
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}): AdminGroup[] {
  const search = filters?.search?.trim().toLowerCase()
  const direction = filters?.sort_order === 'desc' ? -1 : 1

  return previewGroups
    .filter(group => {
      if (filters?.platform && group.platform !== filters.platform) return false
      if (filters?.status && group.status !== filters.status) return false
      if (typeof filters?.is_exclusive === 'boolean' && group.is_exclusive !== filters.is_exclusive) return false
      if (!search) return true
      return (
        group.name.toLowerCase().includes(search) ||
        group.platform.toLowerCase().includes(search) ||
        (group.description || '').toLowerCase().includes(search)
      )
    })
    .sort((left, right) => {
      const leftValue = sortValue(left, filters?.sort_by)
      const rightValue = sortValue(right, filters?.sort_by)
      if (leftValue < rightValue) return -1 * direction
      if (leftValue > rightValue) return 1 * direction
      return 0
    })
}

function previewPage<T>(items: T[], page = 1, pageSize = 20): PaginatedResponse<T> {
  const safePage = Math.max(1, page)
  const safePageSize = Math.max(1, pageSize)
  const start = (safePage - 1) * safePageSize
  const pagedItems = items.slice(start, start + safePageSize)
  return {
    items: pagedItems,
    total: items.length,
    page: safePage,
    page_size: safePageSize,
    pages: Math.ceil(items.length / safePageSize)
  }
}

function applyPreviewGroupUpdate(group: AdminGroup, updates: UpdateGroupRequest | CreateGroupRequest): AdminGroup {
  const now = new Date().toISOString()
  return {
    ...group,
    ...updates,
    description: updates.description !== undefined ? updates.description : group.description,
    platform: updates.platform ?? group.platform,
    rate_multiplier: updates.rate_multiplier ?? group.rate_multiplier,
    is_exclusive: updates.is_exclusive ?? group.is_exclusive,
    subscription_type: updates.subscription_type ?? group.subscription_type,
    updated_at: now
  }
}

const localPreviewGroupsAPI: Partial<Record<keyof typeof realGroupsAPI, (...args: any[]) => any>> = {
  list: async (page = 1, pageSize = 20, filters) => previewPage(filterPreviewGroups(filters), page, pageSize),
  getAll: async (platform?: GroupPlatform) =>
    previewGroups.filter(group => group.status === 'active' && (!platform || group.platform === platform)),
  getByPlatform: async (platform: GroupPlatform) =>
    previewGroups.filter(group => group.status === 'active' && group.platform === platform),
  getById: async (id: number) => previewGroups.find(group => group.id === id) ?? previewGroups[0],
  create: async (groupData: CreateGroupRequest) => {
    const nextId = Math.max(0, ...previewGroups.map(group => group.id)) + 1
    const created = applyPreviewGroupUpdate(
      previewGroup({
        id: nextId,
        name: groupData.name,
        platform: groupData.platform ?? 'openai',
        sort_order: nextId * 10
      }),
      groupData
    )
    previewGroups.push(created)
    return created
  },
  update: async (id: number, updates: UpdateGroupRequest) => {
    const index = previewGroups.findIndex(group => group.id === id)
    if (index < 0) return previewGroups[0]
    previewGroups[index] = applyPreviewGroupUpdate(previewGroups[index], updates)
    return previewGroups[index]
  },
  delete: async (id: number) => {
    const index = previewGroups.findIndex(group => group.id === id)
    if (index >= 0) previewGroups.splice(index, 1)
    return { message: 'ok' }
  },
  toggleStatus: async (id: number, status: 'active' | 'inactive') => {
    const index = previewGroups.findIndex(group => group.id === id)
    if (index < 0) return previewGroups[0]
    previewGroups[index] = { ...previewGroups[index], status, updated_at: new Date().toISOString() }
    return previewGroups[index]
  },
  getStats: async (id: number) => {
    const group = previewGroups.find(item => item.id === id)
    return {
      total_api_keys: group?.account_count ?? 0,
      active_api_keys: group?.active_account_count ?? 0,
      total_requests: 0,
      total_cost: 0
    }
  },
  getGroupApiKeys: async (_id: number, page = 1, pageSize = 20) => previewPage<any>([], page, pageSize),
  getGroupRateMultipliers: async () => [],
  clearGroupRateMultipliers: async () => ({ message: 'ok' }),
  batchSetGroupRateMultipliers: async () => ({ message: 'ok' }),
  getGroupRPMOverrides: async () => [],
  clearGroupRPMOverrides: async () => ({ message: 'ok' }),
  batchSetGroupRPMOverrides: async () => ({ message: 'ok' }),
  updateSortOrder: async (updates: Array<{ id: number; sort_order: number }>) => {
    updates.forEach(updateItem => {
      const group = previewGroups.find(item => item.id === updateItem.id)
      if (group) group.sort_order = updateItem.sort_order
    })
    return { message: 'ok' }
  },
  getUsageSummary: async () =>
    previewGroups.map(group => ({
      group_id: group.id,
      today_cost: 0,
      total_cost: 0
    })),
  getCapacitySummary: async () =>
    previewGroups.map(group => ({
      group_id: group.id,
      concurrency_used: 0,
      concurrency_max: group.active_account_count || 0,
      sessions_used: 0,
      sessions_max: group.account_count || 0,
      rpm_used: 0,
      rpm_max: group.rpm_limit || 0
    }))
}

export const groupsAPI = new Proxy(realGroupsAPI, {
  get(target, prop: keyof typeof realGroupsAPI, receiver) {
    if (isLocalPreviewGroupsSession() && prop in localPreviewGroupsAPI) {
      return localPreviewGroupsAPI[prop]
    }
    return Reflect.get(target, prop, receiver)
  }
}) as typeof realGroupsAPI

export default groupsAPI
