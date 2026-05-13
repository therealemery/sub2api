/**
 * User-facing Channel Monitor API endpoints
 * Read-only views for end users to inspect channel availability/status.
 */

import { apiClient } from './client'
import type { Provider, MonitorStatus } from './admin/channelMonitor'

export type { Provider, MonitorStatus } from './admin/channelMonitor'

const LOCAL_PREVIEW_TOKEN_PREFIX = 'local-preview-'

function isLocalPreviewSession(): boolean {
  if (
    typeof localStorage === 'undefined' ||
    (!import.meta.env.DEV && !['127.0.0.1', 'localhost', '::1'].includes(window.location.hostname))
  ) return false
  return !!localStorage.getItem('auth_token')?.startsWith(LOCAL_PREVIEW_TOKEN_PREFIX)
}

export interface UserMonitorExtraModel {
  model: string
  status: MonitorStatus
  latency_ms: number | null
}

export interface MonitorTimelinePoint {
  status: MonitorStatus
  latency_ms: number | null
  ping_latency_ms: number | null
  checked_at: string
}

export interface UserMonitorView {
  id: number
  name: string
  provider: Provider
  group_name: string
  primary_model: string
  primary_status: MonitorStatus
  primary_latency_ms: number | null
  primary_ping_latency_ms: number | null
  availability_7d: number
  extra_models: UserMonitorExtraModel[]
  timeline: MonitorTimelinePoint[]
}

export interface UserMonitorListResponse {
  items: UserMonitorView[]
}

export interface UserMonitorModelDetail {
  model: string
  latest_status: MonitorStatus
  latest_latency_ms: number | null
  availability_7d: number
  availability_15d: number
  availability_30d: number
  avg_latency_7d_ms: number | null
}

export interface UserMonitorDetail {
  id: number
  name: string
  provider: Provider
  group_name: string
  models: UserMonitorModelDetail[]
}

const previewNow = () => Date.now()

function createPreviewTimeline(status: MonitorStatus, baseLatency: number): MonitorTimelinePoint[] {
  const now = previewNow()
  return Array.from({ length: 24 }, (_, index) => {
    const drift = ((index % 5) - 2) * 16
    const isSoftDip = status === 'degraded' && index > 15 && index < 19
    return {
      status: isSoftDip ? 'degraded' : status,
      latency_ms: Math.max(180, baseLatency + drift),
      ping_latency_ms: Math.max(80, Math.round(baseLatency * 0.34) + drift),
      checked_at: new Date(now - (23 - index) * 30 * 60 * 1000).toISOString(),
    }
  })
}

const previewMonitorItems: UserMonitorView[] = [
  {
    id: 1,
    name: 'ChatGPT 主力通道',
    provider: 'openai',
    group_name: '默认分组',
    primary_model: 'gpt-5.5',
    primary_status: 'operational',
    primary_latency_ms: 1180,
    primary_ping_latency_ms: 260,
    availability_7d: 99.96,
    extra_models: [
      { model: 'gpt-5.4', status: 'operational', latency_ms: 1020 },
      { model: 'gpt-4.1', status: 'operational', latency_ms: 940 },
    ],
    timeline: createPreviewTimeline('operational', 1180),
  },
  {
    id: 2,
    name: 'Claude 高质量通道',
    provider: 'anthropic',
    group_name: 'Claude 分组',
    primary_model: 'claude-4.7',
    primary_status: 'operational',
    primary_latency_ms: 1360,
    primary_ping_latency_ms: 310,
    availability_7d: 99.91,
    extra_models: [
      { model: 'claude-4.6', status: 'operational', latency_ms: 1280 },
      { model: 'claude-sonnet-4.5', status: 'operational', latency_ms: 1210 },
    ],
    timeline: createPreviewTimeline('operational', 1360),
  },
  {
    id: 3,
    name: 'Gemini 备用通道',
    provider: 'gemini',
    group_name: '多模型分组',
    primary_model: 'gemini-2.5-pro',
    primary_status: 'degraded',
    primary_latency_ms: 1680,
    primary_ping_latency_ms: 420,
    availability_7d: 98.72,
    extra_models: [
      { model: 'gemini-2.5-flash', status: 'operational', latency_ms: 760 },
    ],
    timeline: createPreviewTimeline('degraded', 1680),
  },
]

function createPreviewDetail(item: UserMonitorView): UserMonitorDetail {
  const models = [
    {
      model: item.primary_model,
      latest_status: item.primary_status,
      latest_latency_ms: item.primary_latency_ms,
      availability_7d: item.availability_7d,
      availability_15d: Math.max(0, item.availability_7d - 0.18),
      availability_30d: Math.max(0, item.availability_7d - 0.32),
      avg_latency_7d_ms: item.primary_latency_ms,
    },
    ...item.extra_models.map((model, index) => ({
      model: model.model,
      latest_status: model.status,
      latest_latency_ms: model.latency_ms,
      availability_7d: Math.max(0, item.availability_7d - index * 0.08),
      availability_15d: Math.max(0, item.availability_7d - 0.2 - index * 0.08),
      availability_30d: Math.max(0, item.availability_7d - 0.4 - index * 0.08),
      avg_latency_7d_ms: model.latency_ms,
    })),
  ]
  return {
    id: item.id,
    name: item.name,
    provider: item.provider,
    group_name: item.group_name,
    models,
  }
}

/**
 * List all monitor views available to the current user.
 */
export async function list(options?: { signal?: AbortSignal }): Promise<UserMonitorListResponse> {
  if (isLocalPreviewSession()) {
    if (options?.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }
    return { items: previewMonitorItems }
  }

  const { data } = await apiClient.get<UserMonitorListResponse>('/channel-monitors', {
    signal: options?.signal,
  })
  return data
}

/**
 * Get detailed status (multi-window availability + latency) for a single monitor.
 */
export async function status(id: number): Promise<UserMonitorDetail> {
  if (isLocalPreviewSession()) {
    const item = previewMonitorItems.find((monitor) => monitor.id === id) || previewMonitorItems[0]
    return createPreviewDetail(item)
  }

  const { data } = await apiClient.get<UserMonitorDetail>(`/channel-monitors/${id}/status`)
  return data
}

export const channelMonitorUserAPI = {
  list,
  status,
}

export default channelMonitorUserAPI
