/**
 * Admin Channels API endpoints
 * Handles channel management for administrators
 */

import { apiClient } from '../client'
import type { BillingMode, ChannelStatus, BillingModelSource } from '@/constants/channel'
import {
  isLocalPreviewSession,
  readPreviewChannels,
  writePreviewChannels,
  type PreviewChannel,
} from '@/api/localPreviewData'

export type { BillingMode } from '@/constants/channel'

export interface PricingInterval {
  id?: number
  min_tokens: number
  max_tokens: number | null
  tier_label: string
  input_price: number | null
  output_price: number | null
  cache_write_price: number | null
  cache_read_price: number | null
  per_request_price: number | null
  sort_order: number
}

export interface ChannelModelPricing {
  id?: number
  platform: string
  models: string[]
  billing_mode: BillingMode
  input_price: number | null
  output_price: number | null
  cache_write_price: number | null
  cache_read_price: number | null
  image_output_price: number | null
  per_request_price: number | null
  intervals: PricingInterval[]
}

export interface AccountStatsPricingRule {
  id?: number
  name: string
  group_ids: number[]
  account_ids: number[]
  pricing: ChannelModelPricing[]
}

export interface Channel {
  id: number
  name: string
  description: string
  status: ChannelStatus
  billing_model_source: BillingModelSource
  restrict_models: boolean
  features_config?: Record<string, unknown>
  group_ids: number[]
  model_pricing: ChannelModelPricing[]
  model_mapping: Record<string, Record<string, string>> // platform → {src→dst}
  apply_pricing_to_account_stats: boolean
  account_stats_pricing_rules: AccountStatsPricingRule[]
  created_at: string
  updated_at: string
}

export interface CreateChannelRequest {
  name: string
  description?: string
  group_ids?: number[]
  model_pricing?: ChannelModelPricing[]
  model_mapping?: Record<string, Record<string, string>>
  billing_model_source?: string
  restrict_models?: boolean
  features_config?: Record<string, unknown>
  apply_pricing_to_account_stats?: boolean
  account_stats_pricing_rules?: AccountStatsPricingRule[]
}

export interface UpdateChannelRequest {
  name?: string
  description?: string
  status?: string
  group_ids?: number[]
  model_pricing?: ChannelModelPricing[]
  model_mapping?: Record<string, Record<string, string>>
  billing_model_source?: string
  restrict_models?: boolean
  features_config?: Record<string, unknown>
  apply_pricing_to_account_stats?: boolean
  account_stats_pricing_rules?: AccountStatsPricingRule[]
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
}

function toChannel(channel: PreviewChannel): Channel {
  return channel as Channel
}

function fromChannel(channel: Channel): PreviewChannel {
  return channel as PreviewChannel
}

function previewPage<T>(items: T[], page: number, pageSize: number): PaginatedResponse<T> {
  const safePage = Math.max(1, page)
  const safePageSize = Math.max(1, pageSize)
  const start = (safePage - 1) * safePageSize
  return {
    items: items.slice(start, start + safePageSize),
    total: items.length
  }
}

function filterPreviewChannels(
  channels: Channel[],
  filters?: {
    status?: string
    search?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }
): Channel[] {
  const search = filters?.search?.trim().toLowerCase()
  const direction = filters?.sort_order === 'desc' ? -1 : 1
  return channels
    .filter((channel) => {
      if (filters?.status && channel.status !== filters.status) return false
      if (!search) return true
      return (
        channel.name.toLowerCase().includes(search) ||
        channel.description.toLowerCase().includes(search) ||
        channel.model_pricing.some((item) =>
          [item.platform, ...item.models].some((value) => value.toLowerCase().includes(search))
        )
      )
    })
    .sort((left, right) => {
      const key = filters?.sort_by || 'id'
      const leftValue = String((left as unknown as Record<string, unknown>)[key] ?? left.id)
      const rightValue = String((right as unknown as Record<string, unknown>)[key] ?? right.id)
      return leftValue.localeCompare(rightValue) * direction
    })
}

function applyChannelUpdate(
  channel: Channel,
  req: CreateChannelRequest | UpdateChannelRequest
): Channel {
  const now = new Date().toISOString()
  return {
    ...channel,
    ...req,
    name: req.name ?? channel.name,
    description: req.description ?? channel.description,
    status: (req as UpdateChannelRequest).status
      ? ((req as UpdateChannelRequest).status as ChannelStatus)
      : channel.status,
    billing_model_source: (req.billing_model_source as BillingModelSource) ?? channel.billing_model_source,
    restrict_models: req.restrict_models ?? channel.restrict_models,
    group_ids: req.group_ids ?? channel.group_ids,
    model_pricing: req.model_pricing ?? channel.model_pricing,
    model_mapping: req.model_mapping ?? channel.model_mapping,
    features_config: req.features_config ?? channel.features_config,
    apply_pricing_to_account_stats:
      req.apply_pricing_to_account_stats ?? channel.apply_pricing_to_account_stats,
    account_stats_pricing_rules:
      req.account_stats_pricing_rules ?? channel.account_stats_pricing_rules,
    updated_at: now
  }
}

/**
 * List channels with pagination
 */
export async function list(
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: string
    search?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  },
  options?: { signal?: AbortSignal }
): Promise<PaginatedResponse<Channel>> {
  if (isLocalPreviewSession()) {
    const channels = readPreviewChannels().map(toChannel)
    return previewPage(filterPreviewChannels(channels, filters), page, pageSize)
  }

  const { data } = await apiClient.get<PaginatedResponse<Channel>>('/admin/channels', {
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
 * Get channel by ID
 */
export async function getById(id: number): Promise<Channel> {
  if (isLocalPreviewSession()) {
    return readPreviewChannels().map(toChannel).find((channel) => channel.id === id) ?? readPreviewChannels().map(toChannel)[0]
  }

  const { data } = await apiClient.get<Channel>(`/admin/channels/${id}`)
  return data
}

/**
 * Create a new channel
 */
export async function create(req: CreateChannelRequest): Promise<Channel> {
  if (isLocalPreviewSession()) {
    const channels = readPreviewChannels().map(toChannel)
    const now = new Date().toISOString()
    const nextId = Math.max(0, ...channels.map((channel) => channel.id)) + 1
    const created = applyChannelUpdate(
      {
        id: nextId,
        name: req.name,
        description: req.description ?? '',
        status: 'active',
        billing_model_source: 'requested',
        restrict_models: false,
        group_ids: [],
        model_pricing: [],
        model_mapping: {},
        apply_pricing_to_account_stats: true,
        account_stats_pricing_rules: [],
        created_at: now,
        updated_at: now
      },
      req
    )
    const nextChannels = [...channels, created]
    writePreviewChannels(nextChannels.map(fromChannel))
    return created
  }

  const { data } = await apiClient.post<Channel>('/admin/channels', req)
  return data
}

/**
 * Update a channel
 */
export async function update(id: number, req: UpdateChannelRequest): Promise<Channel> {
  if (isLocalPreviewSession()) {
    const channels = readPreviewChannels().map(toChannel)
    const index = channels.findIndex((channel) => channel.id === id)
    if (index < 0) return channels[0]
    channels[index] = applyChannelUpdate(channels[index], req)
    writePreviewChannels(channels.map(fromChannel))
    return channels[index]
  }

  const { data } = await apiClient.put<Channel>(`/admin/channels/${id}`, req)
  return data
}

/**
 * Delete a channel
 */
export async function remove(id: number): Promise<void> {
  if (isLocalPreviewSession()) {
    writePreviewChannels(readPreviewChannels().filter((channel) => channel.id !== id))
    return
  }

  await apiClient.delete(`/admin/channels/${id}`)
}

export interface ModelDefaultPricing {
  found: boolean
  input_price?: number    // per-token price
  output_price?: number
  cache_write_price?: number
  cache_read_price?: number
  image_output_price?: number
}

export async function getModelDefaultPricing(model: string): Promise<ModelDefaultPricing> {
  if (isLocalPreviewSession()) {
    const normalized = model.toLowerCase()
    const match = readPreviewChannels()
      .flatMap((channel) => channel.model_pricing)
      .find((item) => item.models.some((name) => name.toLowerCase() === normalized))
    if (!match) return { found: false }
    return {
      found: true,
      input_price: match.input_price ?? undefined,
      output_price: match.output_price ?? undefined,
      cache_write_price: match.cache_write_price ?? undefined,
      cache_read_price: match.cache_read_price ?? undefined,
      image_output_price: match.image_output_price ?? undefined,
    }
  }

  const { data } = await apiClient.get<ModelDefaultPricing>('/admin/channels/model-pricing', {
    params: { model }
  })
  return data
}

const channelsAPI = { list, getById, create, update, remove, getModelDefaultPricing }
export default channelsAPI
