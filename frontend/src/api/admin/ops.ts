/**
 * Admin Ops API endpoints (vNext)
 * - Error logs list/detail + retry (client/upstream)
 * - Dashboard overview (raw path)
 */

import { apiClient } from '../client'
import type { PaginatedResponse } from '@/types'

export type OpsRetryMode = 'client' | 'upstream'
export type OpsQueryMode = 'auto' | 'raw' | 'preagg'

export interface OpsRequestOptions {
  signal?: AbortSignal
}

export interface OpsRetryRequest {
  mode: OpsRetryMode
  pinned_account_id?: number
  force?: boolean
}

export interface OpsRetryAttempt {
  id: number
  created_at: string
  requested_by_user_id: number
  source_error_id: number
  mode: string
  pinned_account_id?: number | null
  pinned_account_name?: string

  status: string
  started_at?: string | null
  finished_at?: string | null
  duration_ms?: number | null

  success?: boolean | null
  http_status_code?: number | null
  upstream_request_id?: string | null
  used_account_id?: number | null
  used_account_name?: string
  response_preview?: string | null
  response_truncated?: boolean | null

  result_request_id?: string | null
  result_error_id?: number | null
  error_message?: string | null
}

export type OpsUpstreamErrorEvent = {
  at_unix_ms?: number
  platform?: string
  account_id?: number
  account_name?: string
  upstream_status_code?: number
  upstream_request_id?: string
  upstream_request_body?: string
  kind?: string
  message?: string
  detail?: string
}

export interface OpsRetryResult {
  attempt_id: number
  mode: OpsRetryMode
  status: 'running' | 'succeeded' | 'failed' | string

  pinned_account_id?: number | null
  used_account_id?: number | null

  http_status_code: number
  upstream_request_id: string

  response_preview: string
  response_truncated: boolean

  error_message: string

  started_at: string
  finished_at: string
  duration_ms: number
}

export interface OpsDashboardOverview {
  start_time: string
  end_time: string
  platform: string
  group_id?: number | null

  health_score?: number

  system_metrics?: OpsSystemMetricsSnapshot | null
  job_heartbeats?: OpsJobHeartbeat[] | null

  success_count: number
  error_count_total: number
  business_limited_count: number
  error_count_sla: number
  request_count_total: number
  request_count_sla: number

  token_consumed: number

  sla: number
  error_rate: number
  upstream_error_rate: number
  upstream_error_count_excl_429_529: number
  upstream_429_count: number
  upstream_529_count: number

  qps: {
    current: number
    peak: number
    avg: number
  }
  tps: {
    current: number
    peak: number
    avg: number
  }

  duration: OpsPercentiles
  ttft: OpsPercentiles
}

export interface OpsPercentiles {
  p50_ms?: number | null
  p90_ms?: number | null
  p95_ms?: number | null
  p99_ms?: number | null
  avg_ms?: number | null
  max_ms?: number | null
}

export interface OpsThroughputTrendPoint {
  bucket_start: string
  request_count: number
  token_consumed: number
  switch_count?: number
  qps: number
  tps: number
}

export interface OpsThroughputPlatformBreakdownItem {
  platform: string
  request_count: number
  token_consumed: number
}

export interface OpsThroughputGroupBreakdownItem {
  group_id: number
  group_name: string
  request_count: number
  token_consumed: number
}

export interface OpsThroughputTrendResponse {
  bucket: string
  points: OpsThroughputTrendPoint[]
  by_platform?: OpsThroughputPlatformBreakdownItem[]
  top_groups?: OpsThroughputGroupBreakdownItem[]
}

export type OpsRequestKind = 'success' | 'error'
export type OpsRequestDetailsKind = OpsRequestKind | 'all'
export type OpsRequestDetailsSort = 'created_at_desc' | 'duration_desc'

export interface OpsRequestDetail {
  kind: OpsRequestKind
  created_at: string
  request_id: string

  platform?: string
  model?: string
  duration_ms?: number | null
  status_code?: number | null

  error_id?: number | null
  phase?: string
  severity?: string
  message?: string

  user_id?: number | null
  api_key_id?: number | null
  account_id?: number | null
  group_id?: number | null

  stream?: boolean
}

export interface OpsRequestDetailsParams {
  time_range?: '5m' | '30m' | '1h' | '6h' | '24h'
  start_time?: string
  end_time?: string

  kind?: OpsRequestDetailsKind

  platform?: string
  group_id?: number | null

  user_id?: number
  api_key_id?: number
  account_id?: number

  model?: string
  request_id?: string
  q?: string

  min_duration_ms?: number
  max_duration_ms?: number

  sort?: OpsRequestDetailsSort

  page?: number
  page_size?: number
}

export type OpsRequestDetailsResponse = PaginatedResponse<OpsRequestDetail>

export interface OpsLatencyHistogramBucket {
  range: string
  count: number
}

export interface OpsLatencyHistogramResponse {
  start_time: string
  end_time: string
  platform: string
  group_id?: number | null

  total_requests: number
  buckets: OpsLatencyHistogramBucket[]
}

export interface OpsErrorTrendPoint {
  bucket_start: string
  error_count_total: number
  business_limited_count: number
  error_count_sla: number
  upstream_error_count_excl_429_529: number
  upstream_429_count: number
  upstream_529_count: number
}

export interface OpsErrorTrendResponse {
  bucket: string
  points: OpsErrorTrendPoint[]
}

export interface OpsErrorDistributionItem {
  status_code: number
  total: number
  sla: number
  business_limited: number
}

export interface OpsErrorDistributionResponse {
  total: number
  items: OpsErrorDistributionItem[]
}

export interface OpsDashboardSnapshotV2Response {
  generated_at: string
  overview: OpsDashboardOverview
  throughput_trend: OpsThroughputTrendResponse
  error_trend: OpsErrorTrendResponse
}

export type OpsOpenAITokenStatsTimeRange = '30m' | '1h' | '1d' | '15d' | '30d'

export interface OpsOpenAITokenStatsItem {
  model: string
  request_count: number
  avg_tokens_per_sec?: number | null
  avg_first_token_ms?: number | null
  total_output_tokens: number
  avg_duration_ms: number
  requests_with_first_token: number
}

export interface OpsOpenAITokenStatsResponse {
  time_range: OpsOpenAITokenStatsTimeRange
  start_time: string
  end_time: string
  platform?: string
  group_id?: number | null
  items: OpsOpenAITokenStatsItem[]
  total: number
  page?: number
  page_size?: number
  top_n?: number | null
}

export interface OpsOpenAITokenStatsParams {
  time_range?: OpsOpenAITokenStatsTimeRange
  platform?: string
  group_id?: number | null
  page?: number
  page_size?: number
  top_n?: number
}

export interface OpsSystemMetricsSnapshot {
  id: number
  created_at: string
  window_minutes: number

  cpu_usage_percent?: number | null
  memory_used_mb?: number | null
  memory_total_mb?: number | null
  memory_usage_percent?: number | null

  db_ok?: boolean | null
  redis_ok?: boolean | null

  // Config-derived limits (best-effort) for rendering "current vs max".
  db_max_open_conns?: number | null
  redis_pool_size?: number | null

  redis_conn_total?: number | null
  redis_conn_idle?: number | null

  db_conn_active?: number | null
  db_conn_idle?: number | null
  db_conn_waiting?: number | null

  goroutine_count?: number | null
  concurrency_queue_depth?: number | null
  account_switch_count?: number | null
}

export interface OpsJobHeartbeat {
  job_name: string
  last_run_at?: string | null
  last_success_at?: string | null
  last_error_at?: string | null
  last_error?: string | null
  last_duration_ms?: number | null
  last_result?: string | null
  updated_at: string
}

export interface PlatformConcurrencyInfo {
  platform: string
  current_in_use: number
  max_capacity: number
  load_percentage: number
  waiting_in_queue: number
}

export interface GroupConcurrencyInfo {
  group_id: number
  group_name: string
  platform: string
  current_in_use: number
  max_capacity: number
  load_percentage: number
  waiting_in_queue: number
}

export interface AccountConcurrencyInfo {
  account_id: number
  account_name?: string
  platform: string
  group_id: number
  group_name: string
  current_in_use: number
  max_capacity: number
  load_percentage: number
  waiting_in_queue: number
}

export interface OpsConcurrencyStatsResponse {
  enabled: boolean
  platform: Record<string, PlatformConcurrencyInfo>
  group: Record<string, GroupConcurrencyInfo>
  account: Record<string, AccountConcurrencyInfo>
  timestamp?: string
}

export interface UserConcurrencyInfo {
  user_id: number
  user_email: string
  username: string
  current_in_use: number
  max_capacity: number
  load_percentage: number
  waiting_in_queue: number
}

export interface OpsUserConcurrencyStatsResponse {
  enabled: boolean
  user: Record<string, UserConcurrencyInfo>
  timestamp?: string
}

export async function getConcurrencyStats(platform?: string, groupId?: number | null): Promise<OpsConcurrencyStatsResponse> {
  const params: Record<string, any> = {}
  if (platform) {
    params.platform = platform
  }
  if (typeof groupId === 'number' && groupId > 0) {
    params.group_id = groupId
  }

  const { data } = await apiClient.get<OpsConcurrencyStatsResponse>('/admin/ops/concurrency', { params })
  return data
}

export async function getUserConcurrencyStats(): Promise<OpsUserConcurrencyStatsResponse> {
  const { data } = await apiClient.get<OpsUserConcurrencyStatsResponse>('/admin/ops/user-concurrency')
  return data
}

export interface PlatformAvailability {
  platform: string
  total_accounts: number
  available_count: number
  rate_limit_count: number
  error_count: number
}

export interface GroupAvailability {
  group_id: number
  group_name: string
  platform: string
  total_accounts: number
  available_count: number
  rate_limit_count: number
  error_count: number
}

export interface AccountAvailability {
  account_id: number
  account_name: string
  platform: string
  group_id: number
  group_name: string
  status: string
  is_available: boolean
  is_rate_limited: boolean
  rate_limit_reset_at?: string
  rate_limit_remaining_sec?: number
  is_overloaded: boolean
  overload_until?: string
  overload_remaining_sec?: number
  has_error: boolean
  error_message?: string
}

export interface OpsAccountAvailabilityStatsResponse {
  enabled: boolean
  platform: Record<string, PlatformAvailability>
  group: Record<string, GroupAvailability>
  account: Record<string, AccountAvailability>
  timestamp?: string
}

export async function getAccountAvailabilityStats(platform?: string, groupId?: number | null): Promise<OpsAccountAvailabilityStatsResponse> {
  const params: Record<string, any> = {}
  if (platform) {
    params.platform = platform
  }
  if (typeof groupId === 'number' && groupId > 0) {
    params.group_id = groupId
  }
  const { data } = await apiClient.get<OpsAccountAvailabilityStatsResponse>('/admin/ops/account-availability', { params })
  return data
}

export interface OpsRateSummary {
  current: number
  peak: number
  avg: number
}

export interface OpsRealtimeTrafficSummary {
  window: string
  start_time: string
  end_time: string
  platform: string
  group_id?: number | null
  qps: OpsRateSummary
  tps: OpsRateSummary
}

export interface OpsRealtimeTrafficSummaryResponse {
  enabled: boolean
  summary: OpsRealtimeTrafficSummary | null
  timestamp?: string
}

export async function getRealtimeTrafficSummary(
  window: string,
  platform?: string,
  groupId?: number | null
): Promise<OpsRealtimeTrafficSummaryResponse> {
  const params: Record<string, any> = { window }
  if (platform) {
    params.platform = platform
  }
  if (typeof groupId === 'number' && groupId > 0) {
    params.group_id = groupId
  }

  const { data } = await apiClient.get<OpsRealtimeTrafficSummaryResponse>('/admin/ops/realtime-traffic', { params })
  return data
}

/**
 * Subscribe to realtime QPS updates via WebSocket.
 *
 * Note: browsers cannot set Authorization headers for WebSockets.
 * We authenticate via Sec-WebSocket-Protocol using a prefixed token item:
 *   ["sub2api-admin", "jwt.<token>"]
 */
export interface SubscribeQPSOptions {
  token?: string | null
  onOpen?: () => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
  /**
   * Called when the server closes with an application close code that indicates
   * reconnecting is not useful (e.g. feature flag disabled).
   */
  onFatalClose?: (event: CloseEvent) => void
  /**
   * More granular status updates for UI (connecting/reconnecting/offline/etc).
   */
  onStatusChange?: (status: OpsWSStatus) => void
  /**
   * Called when a reconnect is scheduled (helps display "retry in Xs").
   */
  onReconnectScheduled?: (info: { attempt: number, delayMs: number }) => void
  wsBaseUrl?: string
  /**
   * Maximum reconnect attempts. Defaults to Infinity to keep the dashboard live.
   * Set to 0 to disable reconnect.
   */
  maxReconnectAttempts?: number
  reconnectBaseDelayMs?: number
  reconnectMaxDelayMs?: number
  /**
   * Stale connection detection (heartbeat-by-observation).
   * If no messages are received within this window, the socket is closed to trigger a reconnect.
   * Set to 0 to disable.
   */
  staleTimeoutMs?: number
  /**
   * How often to check staleness. Only used when `staleTimeoutMs > 0`.
   */
  staleCheckIntervalMs?: number
}

export type OpsWSStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline' | 'closed'

export const OPS_WS_CLOSE_CODES = {
  REALTIME_DISABLED: 4001
} as const

const OPS_WS_BASE_PROTOCOL = 'sub2api-admin'

export function subscribeQPS(onMessage: (data: any) => void, options: SubscribeQPSOptions = {}): () => void {
  let ws: WebSocket | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = Number.isFinite(options.maxReconnectAttempts as number)
    ? (options.maxReconnectAttempts as number)
    : Infinity
  const baseDelayMs = options.reconnectBaseDelayMs ?? 1000
  const maxDelayMs = options.reconnectMaxDelayMs ?? 30000
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let shouldReconnect = true
  let isConnecting = false
  let hasConnectedOnce = false
  let lastMessageAt = 0
  const staleTimeoutMs = options.staleTimeoutMs ?? 120_000
  const staleCheckIntervalMs = options.staleCheckIntervalMs ?? 30_000
  let staleTimer: ReturnType<typeof setInterval> | null = null

  const setStatus = (status: OpsWSStatus) => {
    options.onStatusChange?.(status)
  }

  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  const clearStaleTimer = () => {
    if (staleTimer) {
      clearInterval(staleTimer)
      staleTimer = null
    }
  }

  const startStaleTimer = () => {
    clearStaleTimer()
    if (!staleTimeoutMs || staleTimeoutMs <= 0) return
    staleTimer = setInterval(() => {
      if (!shouldReconnect) return
      if (!ws || ws.readyState !== WebSocket.OPEN) return
      if (!lastMessageAt) return
      const ageMs = Date.now() - lastMessageAt
      if (ageMs > staleTimeoutMs) {
        // Treat as a half-open connection; closing triggers the normal reconnect path.
        ws.close()
      }
    }, staleCheckIntervalMs)
  }

  const scheduleReconnect = () => {
    if (!shouldReconnect) return
    if (hasConnectedOnce && reconnectAttempts >= maxReconnectAttempts) return

    // If we're offline, wait for the browser to come back online.
    if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
      setStatus('offline')
      return
    }

    const expDelay = baseDelayMs * Math.pow(2, reconnectAttempts)
    const delay = Math.min(expDelay, maxDelayMs)
    const jitter = Math.floor(Math.random() * 250)
    clearReconnectTimer()
    reconnectTimer = setTimeout(() => {
      reconnectAttempts++
      connect()
    }, delay + jitter)
    options.onReconnectScheduled?.({ attempt: reconnectAttempts + 1, delayMs: delay + jitter })
  }

  const handleOnline = () => {
    if (!shouldReconnect) return
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return
    connect()
  }

  const handleOffline = () => {
    setStatus('offline')
  }

  const connect = () => {
    if (!shouldReconnect) return
    if (isConnecting) return
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return
    if (hasConnectedOnce && reconnectAttempts >= maxReconnectAttempts) return

    isConnecting = true
    setStatus(hasConnectedOnce ? 'reconnecting' : 'connecting')
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsBaseUrl = options.wsBaseUrl || import.meta.env.VITE_WS_BASE_URL || window.location.host
    const wsURL = new URL(`${protocol}//${wsBaseUrl}/api/v1/admin/ops/ws/qps`)

    // Do NOT put admin JWT in the URL query string (it can leak via access logs, proxies, etc).
    // Browsers cannot set Authorization headers for WebSockets, so we pass the token via
    // Sec-WebSocket-Protocol (subprotocol list): ["sub2api-admin", "jwt.<token>"].
    const rawToken = String(options.token ?? localStorage.getItem('auth_token') ?? '').trim()
    const protocols: string[] = [OPS_WS_BASE_PROTOCOL]
    if (rawToken) protocols.push(`jwt.${rawToken}`)

    ws = new WebSocket(wsURL.toString(), protocols)

    ws.onopen = () => {
      reconnectAttempts = 0
      isConnecting = false
      hasConnectedOnce = true
      clearReconnectTimer()
      lastMessageAt = Date.now()
      startStaleTimer()
      setStatus('connected')
      options.onOpen?.()
    }

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        lastMessageAt = Date.now()
        onMessage(data)
      } catch (err) {
        console.warn('[OpsWS] Failed to parse message:', err)
      }
    }

    ws.onerror = (error) => {
      console.error('[OpsWS] Connection error:', error)
      options.onError?.(error)
    }

    ws.onclose = (event) => {
      isConnecting = false
      options.onClose?.(event)
      clearStaleTimer()
      ws = null

      // If the server explicitly tells us to stop reconnecting, honor it.
      if (event && typeof event.code === 'number' && event.code === OPS_WS_CLOSE_CODES.REALTIME_DISABLED) {
        shouldReconnect = false
        clearReconnectTimer()
        setStatus('closed')
        options.onFatalClose?.(event)
        return
      }

      scheduleReconnect()
    }
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  connect()

  return () => {
    shouldReconnect = false
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    clearReconnectTimer()
    clearStaleTimer()
    if (ws) ws.close()
    ws = null
    setStatus('closed')
  }
}

export type OpsSeverity = string
export type OpsPhase = string

export type AlertSeverity = 'critical' | 'warning' | 'info'
export type ThresholdMode = 'count' | 'percentage' | 'both'
export type MetricType =
  | 'success_rate'
  | 'error_rate'
  | 'upstream_error_rate'
  | 'cpu_usage_percent'
  | 'memory_usage_percent'
  | 'concurrency_queue_depth'
  | 'group_available_accounts'
  | 'group_available_ratio'
  | 'group_rate_limit_ratio'
  | 'account_rate_limited_count'
  | 'account_error_count'
  | 'account_error_ratio'
  | 'overload_account_count'
export type Operator = '>' | '>=' | '<' | '<=' | '==' | '!='

export interface AlertRule {
  id?: number
  name: string
  description?: string
  enabled: boolean
  metric_type: MetricType
  operator: Operator
  threshold: number
  window_minutes: number
  sustained_minutes: number
  severity: OpsSeverity
  cooldown_minutes: number
  notify_email: boolean
  filters?: Record<string, any>
  created_at?: string
  updated_at?: string
  last_triggered_at?: string | null
}

export interface AlertEvent {
  id: number
  rule_id: number
  severity: OpsSeverity | string
  status: 'firing' | 'resolved' | 'manual_resolved' | string
  title?: string
  description?: string
  metric_value?: number
  threshold_value?: number
  dimensions?: Record<string, any>
  fired_at: string
  resolved_at?: string | null
  email_sent: boolean
  created_at: string
}

export interface EmailNotificationConfig {
  alert: {
    enabled: boolean
    recipients: string[]
    min_severity: AlertSeverity | ''
    rate_limit_per_hour: number
    batching_window_seconds: number
    include_resolved_alerts: boolean
  }
  report: {
    enabled: boolean
    recipients: string[]
    daily_summary_enabled: boolean
    daily_summary_schedule: string
    weekly_summary_enabled: boolean
    weekly_summary_schedule: string
    error_digest_enabled: boolean
    error_digest_schedule: string
    error_digest_min_count: number
    account_health_enabled: boolean
    account_health_schedule: string
    account_health_error_rate_threshold: number
  }
}

export interface OpsMetricThresholds {
  sla_percent_min?: number | null                 // SLA低于此值变红
  ttft_p99_ms_max?: number | null                 // TTFT P99高于此值变红
  request_error_rate_percent_max?: number | null  // 请求错误率高于此值变红
  upstream_error_rate_percent_max?: number | null // 上游错误率高于此值变红
}

export interface OpsDistributedLockSettings {
  enabled: boolean
  key: string
  ttl_seconds: number
}

export interface OpsAlertRuntimeSettings {
  evaluation_interval_seconds: number
  distributed_lock: OpsDistributedLockSettings
  silencing: {
    enabled: boolean
    global_until_rfc3339: string
    global_reason: string
    entries?: Array<{
      rule_id?: number
      severities?: Array<OpsSeverity | string>
      until_rfc3339: string
      reason: string
    }>
  }
  thresholds: OpsMetricThresholds // 指标阈值配置
}

export interface OpsAdvancedSettings {
  data_retention: OpsDataRetentionSettings
  aggregation: OpsAggregationSettings
  ignore_count_tokens_errors: boolean
  ignore_context_canceled: boolean
  ignore_no_available_accounts: boolean
  ignore_invalid_api_key_errors: boolean
  ignore_insufficient_balance_errors: boolean
  display_openai_token_stats: boolean
  display_alert_events: boolean
  auto_refresh_enabled: boolean
  auto_refresh_interval_seconds: number
}

export interface OpsDataRetentionSettings {
  cleanup_enabled: boolean
  cleanup_schedule: string
  error_log_retention_days: number
  minute_metrics_retention_days: number
  hourly_metrics_retention_days: number
}

export interface OpsAggregationSettings {
  aggregation_enabled: boolean
}

export interface OpsRuntimeLogConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  enable_sampling: boolean
  sampling_initial: number
  sampling_thereafter: number
  caller: boolean
  stacktrace_level: 'none' | 'error' | 'fatal'
  retention_days: number
  source?: string
  updated_at?: string
  updated_by_user_id?: number
}

export interface OpsSystemLog {
  id: number
  created_at: string
  level: string
  component: string
  message: string
  request_id?: string
  client_request_id?: string
  user_id?: number | null
  account_id?: number | null
  platform?: string
  model?: string
  extra?: Record<string, any>
}

export type OpsSystemLogListResponse = PaginatedResponse<OpsSystemLog>

export interface OpsSystemLogQuery {
  page?: number
  page_size?: number
  time_range?: '5m' | '30m' | '1h' | '6h' | '24h' | '7d' | '30d'
  start_time?: string
  end_time?: string
  level?: string
  component?: string
  request_id?: string
  client_request_id?: string
  user_id?: number | null
  account_id?: number | null
  platform?: string
  model?: string
  q?: string
}

export interface OpsSystemLogCleanupRequest {
  start_time?: string
  end_time?: string
  level?: string
  component?: string
  request_id?: string
  client_request_id?: string
  user_id?: number | null
  account_id?: number | null
  platform?: string
  model?: string
  q?: string
}

export interface OpsSystemLogSinkHealth {
  queue_depth: number
  queue_capacity: number
  dropped_count: number
  write_failed_count: number
  written_count: number
  avg_write_delay_ms: number
  last_error?: string
}

export interface OpsErrorLog {
  id: number
  created_at: string

  // Standardized classification
  phase: OpsPhase
  type: string
  error_owner: 'client' | 'provider' | 'platform' | string
  error_source: 'client_request' | 'upstream_http' | 'gateway' | string

  severity: OpsSeverity
  status_code: number
  platform: string
  model: string

  is_retryable: boolean
  retry_count: number

  resolved: boolean
  resolved_at?: string | null
  resolved_by_user_id?: number | null
  resolved_retry_id?: number | null

  client_request_id: string
  request_id: string
  message: string

  user_id?: number | null
  user_email: string
  api_key_id?: number | null
  account_id?: number | null
  account_name: string
  group_id?: number | null
  group_name: string

  client_ip?: string | null
  request_path?: string
  stream?: boolean

  // Error observability context (endpoint + model mapping)
  inbound_endpoint?: string
  upstream_endpoint?: string
  requested_model?: string
  upstream_model?: string
  request_type?: number | null
}

export interface OpsErrorDetail extends OpsErrorLog {
  error_body: string
  user_agent: string

  // Upstream context (optional; enriched by gateway services)
  upstream_status_code?: number | null
  upstream_error_message?: string
  upstream_error_detail?: string
  upstream_errors?: string

  auth_latency_ms?: number | null
  routing_latency_ms?: number | null
  upstream_latency_ms?: number | null
  response_latency_ms?: number | null
  time_to_first_token_ms?: number | null

  request_body: string
  request_body_truncated: boolean
  request_body_bytes?: number | null

  is_business_limited: boolean
}

export type OpsErrorLogsResponse = PaginatedResponse<OpsErrorLog>

export async function getDashboardOverview(
  params: {
  time_range?: '5m' | '30m' | '1h' | '6h' | '24h'
  start_time?: string
  end_time?: string
  platform?: string
  group_id?: number | null
  mode?: OpsQueryMode
  },
  options: OpsRequestOptions = {}
): Promise<OpsDashboardOverview> {
  const { data } = await apiClient.get<OpsDashboardOverview>('/admin/ops/dashboard/overview', {
    params,
    signal: options.signal
  })
  return data
}

export async function getDashboardSnapshotV2(
  params: {
  time_range?: '5m' | '30m' | '1h' | '6h' | '24h'
  start_time?: string
  end_time?: string
  platform?: string
  group_id?: number | null
  mode?: OpsQueryMode
  },
  options: OpsRequestOptions = {}
): Promise<OpsDashboardSnapshotV2Response> {
  const { data } = await apiClient.get<OpsDashboardSnapshotV2Response>('/admin/ops/dashboard/snapshot-v2', {
    params,
    signal: options.signal
  })
  return data
}

export async function getThroughputTrend(
  params: {
  time_range?: '5m' | '30m' | '1h' | '6h' | '24h'
  start_time?: string
  end_time?: string
  platform?: string
  group_id?: number | null
  mode?: OpsQueryMode
  },
  options: OpsRequestOptions = {}
): Promise<OpsThroughputTrendResponse> {
  const { data } = await apiClient.get<OpsThroughputTrendResponse>('/admin/ops/dashboard/throughput-trend', {
    params,
    signal: options.signal
  })
  return data
}

export async function getLatencyHistogram(
  params: {
  time_range?: '5m' | '30m' | '1h' | '6h' | '24h'
  start_time?: string
  end_time?: string
  platform?: string
  group_id?: number | null
  mode?: OpsQueryMode
  },
  options: OpsRequestOptions = {}
): Promise<OpsLatencyHistogramResponse> {
  const { data } = await apiClient.get<OpsLatencyHistogramResponse>('/admin/ops/dashboard/latency-histogram', {
    params,
    signal: options.signal
  })
  return data
}

export async function getErrorTrend(
  params: {
  time_range?: '5m' | '30m' | '1h' | '6h' | '24h'
  start_time?: string
  end_time?: string
  platform?: string
  group_id?: number | null
  mode?: OpsQueryMode
  },
  options: OpsRequestOptions = {}
): Promise<OpsErrorTrendResponse> {
  const { data } = await apiClient.get<OpsErrorTrendResponse>('/admin/ops/dashboard/error-trend', {
    params,
    signal: options.signal
  })
  return data
}

export async function getErrorDistribution(
  params: {
  time_range?: '5m' | '30m' | '1h' | '6h' | '24h'
  start_time?: string
  end_time?: string
  platform?: string
  group_id?: number | null
  mode?: OpsQueryMode
  },
  options: OpsRequestOptions = {}
): Promise<OpsErrorDistributionResponse> {
  const { data } = await apiClient.get<OpsErrorDistributionResponse>('/admin/ops/dashboard/error-distribution', {
    params,
    signal: options.signal
  })
  return data
}

export async function getOpenAITokenStats(
  params: OpsOpenAITokenStatsParams,
  options: OpsRequestOptions = {}
): Promise<OpsOpenAITokenStatsResponse> {
  const { data } = await apiClient.get<OpsOpenAITokenStatsResponse>('/admin/ops/dashboard/openai-token-stats', {
    params,
    signal: options.signal
  })
  return data
}

export type OpsErrorListView = 'errors' | 'excluded' | 'all'

export type OpsErrorListQueryParams = {
  page?: number
  page_size?: number
  time_range?: string
  start_time?: string
  end_time?: string
  platform?: string
  group_id?: number | null
  account_id?: number | null

  phase?: string
  error_owner?: string
  error_source?: string
  resolved?: string
  view?: OpsErrorListView

  q?: string
  status_codes?: string
  status_codes_other?: string
}

// Legacy unified endpoints
export async function listErrorLogs(params: OpsErrorListQueryParams): Promise<OpsErrorLogsResponse> {
  const { data } = await apiClient.get<OpsErrorLogsResponse>('/admin/ops/errors', { params })
  return data
}

export async function getErrorLogDetail(id: number): Promise<OpsErrorDetail> {
  const { data } = await apiClient.get<OpsErrorDetail>(`/admin/ops/errors/${id}`)
  return data
}

export async function retryErrorRequest(id: number, req: OpsRetryRequest): Promise<OpsRetryResult> {
  const { data } = await apiClient.post<OpsRetryResult>(`/admin/ops/errors/${id}/retry`, req)
  return data
}

export async function listRetryAttempts(errorId: number, limit = 50): Promise<OpsRetryAttempt[]> {
  const { data } = await apiClient.get<OpsRetryAttempt[]>(`/admin/ops/errors/${errorId}/retries`, { params: { limit } })
  return data
}

export async function updateErrorResolved(errorId: number, resolved: boolean): Promise<void> {
  await apiClient.put(`/admin/ops/errors/${errorId}/resolve`, { resolved })
}

// New split endpoints
export async function listRequestErrors(params: OpsErrorListQueryParams): Promise<OpsErrorLogsResponse> {
  const { data } = await apiClient.get<OpsErrorLogsResponse>('/admin/ops/request-errors', { params })
  return data
}

export async function listUpstreamErrors(params: OpsErrorListQueryParams): Promise<OpsErrorLogsResponse> {
  const { data } = await apiClient.get<OpsErrorLogsResponse>('/admin/ops/upstream-errors', { params })
  return data
}

export async function getRequestErrorDetail(id: number): Promise<OpsErrorDetail> {
  const { data } = await apiClient.get<OpsErrorDetail>(`/admin/ops/request-errors/${id}`)
  return data
}

export async function getUpstreamErrorDetail(id: number): Promise<OpsErrorDetail> {
  const { data } = await apiClient.get<OpsErrorDetail>(`/admin/ops/upstream-errors/${id}`)
  return data
}

export async function retryRequestErrorClient(id: number): Promise<OpsRetryResult> {
  const { data } = await apiClient.post<OpsRetryResult>(`/admin/ops/request-errors/${id}/retry-client`, {})
  return data
}

export async function retryRequestErrorUpstreamEvent(id: number, idx: number): Promise<OpsRetryResult> {
  const { data } = await apiClient.post<OpsRetryResult>(`/admin/ops/request-errors/${id}/upstream-errors/${idx}/retry`, {})
  return data
}

export async function retryUpstreamError(id: number): Promise<OpsRetryResult> {
  const { data } = await apiClient.post<OpsRetryResult>(`/admin/ops/upstream-errors/${id}/retry`, {})
  return data
}

export async function updateRequestErrorResolved(errorId: number, resolved: boolean): Promise<void> {
  await apiClient.put(`/admin/ops/request-errors/${errorId}/resolve`, { resolved })
}

export async function updateUpstreamErrorResolved(errorId: number, resolved: boolean): Promise<void> {
  await apiClient.put(`/admin/ops/upstream-errors/${errorId}/resolve`, { resolved })
}

export async function listRequestErrorUpstreamErrors(
  id: number,
  params: OpsErrorListQueryParams = {},
  options: { include_detail?: boolean } = {}
): Promise<PaginatedResponse<OpsErrorDetail>> {
  const query: Record<string, any> = { ...params }
  if (options.include_detail) query.include_detail = '1'
  const { data } = await apiClient.get<PaginatedResponse<OpsErrorDetail>>(`/admin/ops/request-errors/${id}/upstream-errors`, { params: query })
  return data
}

export async function listRequestDetails(params: OpsRequestDetailsParams): Promise<OpsRequestDetailsResponse> {
  const { data } = await apiClient.get<OpsRequestDetailsResponse>('/admin/ops/requests', { params })
  return data
}

// Alert rules
export async function listAlertRules(): Promise<AlertRule[]> {
  const { data } = await apiClient.get<AlertRule[]>('/admin/ops/alert-rules')
  return data
}

export async function createAlertRule(rule: AlertRule): Promise<AlertRule> {
  const { data } = await apiClient.post<AlertRule>('/admin/ops/alert-rules', rule)
  return data
}

export async function updateAlertRule(id: number, rule: Partial<AlertRule>): Promise<AlertRule> {
  const { data } = await apiClient.put<AlertRule>(`/admin/ops/alert-rules/${id}`, rule)
  return data
}

export async function deleteAlertRule(id: number): Promise<void> {
  await apiClient.delete(`/admin/ops/alert-rules/${id}`)
}

export interface AlertEventsQuery {
  limit?: number
  status?: string
  severity?: string
  email_sent?: boolean
  time_range?: string
  start_time?: string
  end_time?: string
  before_fired_at?: string
  before_id?: number
  platform?: string
  group_id?: number
}

export async function listAlertEvents(params: AlertEventsQuery = {}): Promise<AlertEvent[]> {
  const { data } = await apiClient.get<AlertEvent[]>('/admin/ops/alert-events', { params })
  return data
}

export async function getAlertEvent(id: number): Promise<AlertEvent> {
  const { data } = await apiClient.get<AlertEvent>(`/admin/ops/alert-events/${id}`)
  return data
}

export async function updateAlertEventStatus(id: number, status: 'resolved' | 'manual_resolved'): Promise<void> {
  await apiClient.put(`/admin/ops/alert-events/${id}/status`, { status })
}

export async function createAlertSilence(payload: {
  rule_id: number
  platform: string
  group_id?: number | null
  region?: string | null
  until: string
  reason?: string
}): Promise<void> {
  await apiClient.post('/admin/ops/alert-silences', payload)
}

// Email notification config
export async function getEmailNotificationConfig(): Promise<EmailNotificationConfig> {
  const { data } = await apiClient.get<EmailNotificationConfig>('/admin/ops/email-notification/config')
  return data
}

export async function updateEmailNotificationConfig(config: EmailNotificationConfig): Promise<EmailNotificationConfig> {
  const { data } = await apiClient.put<EmailNotificationConfig>('/admin/ops/email-notification/config', config)
  return data
}

// Runtime settings (DB-backed)
export async function getAlertRuntimeSettings(): Promise<OpsAlertRuntimeSettings> {
  const { data } = await apiClient.get<OpsAlertRuntimeSettings>('/admin/ops/runtime/alert')
  return data
}

export async function updateAlertRuntimeSettings(config: OpsAlertRuntimeSettings): Promise<OpsAlertRuntimeSettings> {
  const { data } = await apiClient.put<OpsAlertRuntimeSettings>('/admin/ops/runtime/alert', config)
  return data
}

export async function getRuntimeLogConfig(): Promise<OpsRuntimeLogConfig> {
  const { data } = await apiClient.get<OpsRuntimeLogConfig>('/admin/ops/runtime/logging')
  return data
}

export async function updateRuntimeLogConfig(config: OpsRuntimeLogConfig): Promise<OpsRuntimeLogConfig> {
  const { data } = await apiClient.put<OpsRuntimeLogConfig>('/admin/ops/runtime/logging', config)
  return data
}

export async function resetRuntimeLogConfig(): Promise<OpsRuntimeLogConfig> {
  const { data } = await apiClient.post<OpsRuntimeLogConfig>('/admin/ops/runtime/logging/reset')
  return data
}

export async function listSystemLogs(params: OpsSystemLogQuery): Promise<OpsSystemLogListResponse> {
  const { data } = await apiClient.get<OpsSystemLogListResponse>('/admin/ops/system-logs', { params })
  return data
}

export async function cleanupSystemLogs(payload: OpsSystemLogCleanupRequest): Promise<{ deleted: number }> {
  const { data } = await apiClient.post<{ deleted: number }>('/admin/ops/system-logs/cleanup', payload)
  return data
}

export async function getSystemLogSinkHealth(): Promise<OpsSystemLogSinkHealth> {
  const { data } = await apiClient.get<OpsSystemLogSinkHealth>('/admin/ops/system-logs/health')
  return data
}

// Advanced settings (DB-backed)
export async function getAdvancedSettings(): Promise<OpsAdvancedSettings> {
  const { data } = await apiClient.get<OpsAdvancedSettings>('/admin/ops/advanced-settings')
  return data
}

export async function updateAdvancedSettings(config: OpsAdvancedSettings): Promise<OpsAdvancedSettings> {
  const { data } = await apiClient.put<OpsAdvancedSettings>('/admin/ops/advanced-settings', config)
  return data
}

// ==================== Metric Thresholds ====================

async function getMetricThresholds(): Promise<OpsMetricThresholds> {
  const { data } = await apiClient.get<OpsMetricThresholds>('/admin/ops/settings/metric-thresholds')
  return data
}

async function updateMetricThresholds(thresholds: OpsMetricThresholds): Promise<void> {
  await apiClient.put('/admin/ops/settings/metric-thresholds', thresholds)
}

const realOpsAPI = {
  getDashboardSnapshotV2,
  getDashboardOverview,
  getThroughputTrend,
  getLatencyHistogram,
  getErrorTrend,
  getErrorDistribution,
  getOpenAITokenStats,
  getConcurrencyStats,
  getUserConcurrencyStats,
  getAccountAvailabilityStats,
  getRealtimeTrafficSummary,
  subscribeQPS,

  // Legacy unified endpoints
  listErrorLogs,
  getErrorLogDetail,
  retryErrorRequest,
  listRetryAttempts,
  updateErrorResolved,

  // New split endpoints
  listRequestErrors,
  listUpstreamErrors,
  getRequestErrorDetail,
  getUpstreamErrorDetail,
  retryRequestErrorClient,
  retryRequestErrorUpstreamEvent,
  retryUpstreamError,
  updateRequestErrorResolved,
  updateUpstreamErrorResolved,
  listRequestErrorUpstreamErrors,

  listRequestDetails,
  listAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  listAlertEvents,
  getAlertEvent,
  updateAlertEventStatus,
  createAlertSilence,
  getEmailNotificationConfig,
  updateEmailNotificationConfig,
  getAlertRuntimeSettings,
  updateAlertRuntimeSettings,
  getRuntimeLogConfig,
  updateRuntimeLogConfig,
  resetRuntimeLogConfig,
  getAdvancedSettings,
  updateAdvancedSettings,
  getMetricThresholds,
  updateMetricThresholds,
  listSystemLogs,
  cleanupSystemLogs,
  getSystemLogSinkHealth
}

const LOCAL_PREVIEW_TOKEN_PREFIX = 'local-preview-'

function isLocalPreviewOpsSession(): boolean {
  if (
    typeof localStorage === 'undefined' ||
    (!import.meta.env.DEV && !['127.0.0.1', 'localhost', '::1'].includes(window.location.hostname))
  ) return false
  return !!localStorage.getItem('auth_token')?.startsWith(LOCAL_PREVIEW_TOKEN_PREFIX)
}

function emptyPage<T>(page = 1, pageSize = 20): PaginatedResponse<T> {
  return {
    items: [],
    total: 0,
    page,
    page_size: pageSize,
    pages: 0
  }
}

function previewWindow(params?: { time_range?: string; start_time?: string; end_time?: string }) {
  const end = params?.end_time || new Date().toISOString()
  const endMs = new Date(end).getTime()
  const start = params?.start_time || new Date(endMs - 60 * 60 * 1000).toISOString()
  return { start, end }
}

function previewOverview(params?: {
  time_range?: '5m' | '30m' | '1h' | '6h' | '24h'
  start_time?: string
  end_time?: string
  platform?: string
  group_id?: number | null
}): OpsDashboardOverview {
  const { start, end } = previewWindow(params)
  return {
    start_time: start,
    end_time: end,
    platform: params?.platform || '',
    group_id: params?.group_id ?? null,
    health_score: 92,
    system_metrics: {
      id: 1,
      created_at: end,
      window_minutes: 60,
      cpu_usage_percent: 42,
      memory_used_mb: 2860,
      memory_total_mb: 8192,
      memory_usage_percent: 35,
      db_ok: true,
      redis_ok: true,
      db_max_open_conns: 120,
      redis_pool_size: 64,
      redis_conn_total: 31,
      redis_conn_idle: 24,
      db_conn_active: 18,
      db_conn_idle: 42,
      db_conn_waiting: 0,
      goroutine_count: 138,
      concurrency_queue_depth: 6,
      account_switch_count: 19
    },
    job_heartbeats: [
      { job_name: 'metrics-rollup', last_run_at: end, last_success_at: end, last_error_at: null, last_error: null, last_duration_ms: 420, last_result: 'ok', updated_at: end },
      { job_name: 'account-health-check', last_run_at: end, last_success_at: end, last_error_at: null, last_error: null, last_duration_ms: 860, last_result: 'ok', updated_at: end },
      { job_name: 'alert-evaluator', last_run_at: end, last_success_at: end, last_error_at: null, last_error: null, last_duration_ms: 310, last_result: 'ok', updated_at: end }
    ],
    success_count: 1784,
    error_count_total: 50,
    business_limited_count: 18,
    error_count_sla: 32,
    request_count_total: 1834,
    request_count_sla: 1802,
    token_consumed: 682500,
    sla: 99.18,
    error_rate: 2.73,
    upstream_error_rate: 1.2,
    upstream_error_count_excl_429_529: 14,
    upstream_429_count: 18,
    upstream_529_count: 4,
    qps: { current: 3.4, peak: 8.9, avg: 4.1 },
    tps: { current: 1280, peak: 3140, avg: 1568 },
    duration: { p50_ms: 760, p90_ms: 1820, p95_ms: 2460, p99_ms: 3920, avg_ms: 1180, max_ms: 6120 },
    ttft: { p50_ms: 420, p90_ms: 980, p95_ms: 1280, p99_ms: 2100, avg_ms: 610, max_ms: 3300 }
  }
}

function previewTrendPoints(): OpsThroughputTrendPoint[] {
  const now = Date.now()
  const samples = [118, 136, 152, 147, 169, 182, 176, 194, 208, 221, 214, 236]
  return samples.map((count, index) => {
    const tokenConsumed = count * (320 + (index % 4) * 38)
    return {
      bucket_start: new Date(now - (samples.length - 1 - index) * 10 * 60 * 1000).toISOString(),
      request_count: count,
      token_consumed: tokenConsumed,
      switch_count: [2, 3, 3, 4, 5, 4, 6, 5, 7, 6, 5, 8][index],
      qps: Number((count / 600).toFixed(2)),
      tps: Number((tokenConsumed / 600).toFixed(1))
    }
  })
}

function previewErrorTrendPoints(): OpsErrorTrendPoint[] {
  const now = Date.now()
  const samples = [
    [3, 1, 2, 1, 1, 0],
    [4, 1, 3, 1, 2, 0],
    [2, 0, 2, 1, 1, 0],
    [5, 2, 3, 2, 1, 0],
    [6, 2, 4, 2, 2, 0],
    [4, 1, 3, 1, 2, 0],
    [7, 3, 4, 2, 2, 1],
    [5, 1, 4, 2, 2, 0],
    [8, 3, 5, 2, 2, 1],
    [6, 2, 4, 2, 2, 0],
    [4, 1, 3, 1, 1, 1],
    [7, 2, 5, 2, 2, 1]
  ]
  return samples.map(([total, businessLimited, sla, upstream, upstream429, upstream529], index) => ({
    bucket_start: new Date(now - (samples.length - 1 - index) * 10 * 60 * 1000).toISOString(),
    error_count_total: total,
    business_limited_count: businessLimited,
    error_count_sla: sla,
    upstream_error_count_excl_429_529: upstream,
    upstream_429_count: upstream429,
    upstream_529_count: upstream529
  }))
}

function previewThroughputBreakdown() {
  return {
    by_platform: [
      { platform: 'openai', request_count: 824, token_consumed: 328600 },
      { platform: 'claude', request_count: 512, token_consumed: 215400 },
      { platform: 'gemini', request_count: 286, token_consumed: 84200 },
      { platform: 'deepseek', request_count: 212, token_consumed: 54300 }
    ],
    top_groups: [
      { group_id: 1, group_name: '默认分组', request_count: 746, token_consumed: 286900 },
      { group_id: 2, group_name: '高并发分组', request_count: 584, token_consumed: 238100 },
      { group_id: 3, group_name: 'Claude 专用', request_count: 318, token_consumed: 112600 }
    ]
  }
}

function previewLatencyHistogram(params?: { time_range?: string; start_time?: string; end_time?: string; platform?: string; group_id?: number | null }): OpsLatencyHistogramResponse {
  const { start, end } = previewWindow(params)
  return {
    start_time: start,
    end_time: end,
    platform: params?.platform || '',
    group_id: params?.group_id ?? null,
    total_requests: 1834,
    buckets: [
      { range: '0-500ms', count: 386 },
      { range: '500ms-1s', count: 724 },
      { range: '1s-3s', count: 548 },
      { range: '3s-8s', count: 148 },
      { range: '>8s', count: 28 }
    ]
  }
}

function previewErrorDistribution(): OpsErrorDistributionResponse {
  return {
    total: 50,
    items: [
      { status_code: 429, total: 18, sla: 8, business_limited: 18 },
      { status_code: 500, total: 12, sla: 12, business_limited: 0 },
      { status_code: 529, total: 8, sla: 8, business_limited: 0 },
      { status_code: 408, total: 7, sla: 7, business_limited: 0 },
      { status_code: 401, total: 5, sla: 0, business_limited: 0 }
    ]
  }
}

function previewOpenAITokenStats(params?: OpsOpenAITokenStatsParams): OpsOpenAITokenStatsResponse {
  const { start, end } = previewWindow(params)
  const items: OpsOpenAITokenStatsItem[] = [
    { model: 'gpt-5.5', request_count: 246, avg_tokens_per_sec: 78.4, avg_first_token_ms: 580, total_output_tokens: 185600, avg_duration_ms: 1680, requests_with_first_token: 239 },
    { model: 'gpt-5.4', request_count: 318, avg_tokens_per_sec: 82.1, avg_first_token_ms: 520, total_output_tokens: 204300, avg_duration_ms: 1420, requests_with_first_token: 312 },
    { model: 'gpt-4.1-mini', request_count: 188, avg_tokens_per_sec: 96.7, avg_first_token_ms: 390, total_output_tokens: 82700, avg_duration_ms: 980, requests_with_first_token: 187 },
    { model: 'o4-mini', request_count: 72, avg_tokens_per_sec: 61.2, avg_first_token_ms: 760, total_output_tokens: 56000, avg_duration_ms: 2120, requests_with_first_token: 69 }
  ]
  return {
    time_range: params?.time_range || '1h',
    start_time: start,
    end_time: end,
    platform: params?.platform,
    group_id: params?.group_id ?? null,
    items,
    total: items.length,
    page: params?.page || 1,
    page_size: params?.page_size || 20,
    top_n: params?.top_n ?? null
  }
}

const previewAccounts = [
  { account_id: 101, account_name: 'openai-main-01', platform: 'openai', group_id: 1, group_name: '默认分组', current_in_use: 18, max_capacity: 40, waiting_in_queue: 1, is_available: true, is_rate_limited: false, is_overloaded: false, has_error: false },
  { account_id: 102, account_name: 'openai-main-02', platform: 'openai', group_id: 2, group_name: '高并发分组', current_in_use: 31, max_capacity: 50, waiting_in_queue: 2, is_available: true, is_rate_limited: false, is_overloaded: false, has_error: false },
  { account_id: 103, account_name: 'openai-fallback', platform: 'openai', group_id: 2, group_name: '高并发分组', current_in_use: 8, max_capacity: 35, waiting_in_queue: 0, is_available: false, is_rate_limited: true, rate_limit_remaining_sec: 420, is_overloaded: false, has_error: false },
  { account_id: 201, account_name: 'claude-main-01', platform: 'claude', group_id: 3, group_name: 'Claude 专用', current_in_use: 26, max_capacity: 45, waiting_in_queue: 2, is_available: true, is_rate_limited: false, is_overloaded: false, has_error: false },
  { account_id: 202, account_name: 'claude-backup', platform: 'claude', group_id: 3, group_name: 'Claude 专用', current_in_use: 38, max_capacity: 42, waiting_in_queue: 3, is_available: false, is_rate_limited: false, is_overloaded: true, overload_remaining_sec: 180, has_error: false },
  { account_id: 301, account_name: 'gemini-main', platform: 'gemini', group_id: 4, group_name: 'Gemini 分组', current_in_use: 12, max_capacity: 30, waiting_in_queue: 0, is_available: true, is_rate_limited: false, is_overloaded: false, has_error: false },
  { account_id: 401, account_name: 'deepseek-main', platform: 'deepseek', group_id: 5, group_name: 'DeepSeek 分组', current_in_use: 9, max_capacity: 25, waiting_in_queue: 0, is_available: false, is_rate_limited: false, is_overloaded: false, has_error: true, error_message: '上游 5xx 波动' }
]

function filteredPreviewAccounts(platform?: string, groupId?: number | null) {
  return previewAccounts.filter((account) => {
    if (platform && account.platform !== platform) return false
    if (typeof groupId === 'number' && groupId > 0 && account.group_id !== groupId) return false
    return true
  })
}

function previewConcurrencyStats(platform?: string, groupId?: number | null): OpsConcurrencyStatsResponse {
  const accounts = filteredPreviewAccounts(platform, groupId)
  const platformMap: Record<string, PlatformConcurrencyInfo> = {}
  const groupMap: Record<string, GroupConcurrencyInfo> = {}
  const accountMap: Record<string, AccountConcurrencyInfo> = {}

  for (const account of accounts) {
    accountMap[String(account.account_id)] = {
      account_id: account.account_id,
      account_name: account.account_name,
      platform: account.platform,
      group_id: account.group_id,
      group_name: account.group_name,
      current_in_use: account.current_in_use,
      max_capacity: account.max_capacity,
      load_percentage: Math.round((account.current_in_use / account.max_capacity) * 100),
      waiting_in_queue: account.waiting_in_queue
    }

    const p = platformMap[account.platform] || {
      platform: account.platform,
      current_in_use: 0,
      max_capacity: 0,
      load_percentage: 0,
      waiting_in_queue: 0
    }
    p.current_in_use += account.current_in_use
    p.max_capacity += account.max_capacity
    p.waiting_in_queue += account.waiting_in_queue
    p.load_percentage = p.max_capacity > 0 ? Math.round((p.current_in_use / p.max_capacity) * 100) : 0
    platformMap[account.platform] = p

    const gid = String(account.group_id)
    const g = groupMap[gid] || {
      group_id: account.group_id,
      group_name: account.group_name,
      platform: account.platform,
      current_in_use: 0,
      max_capacity: 0,
      load_percentage: 0,
      waiting_in_queue: 0
    }
    g.current_in_use += account.current_in_use
    g.max_capacity += account.max_capacity
    g.waiting_in_queue += account.waiting_in_queue
    g.load_percentage = g.max_capacity > 0 ? Math.round((g.current_in_use / g.max_capacity) * 100) : 0
    groupMap[gid] = g
  }

  return {
    enabled: true,
    platform: platformMap,
    group: groupMap,
    account: accountMap,
    timestamp: new Date().toISOString()
  }
}

function previewAccountAvailabilityStats(platform?: string, groupId?: number | null): OpsAccountAvailabilityStatsResponse {
  const accounts = filteredPreviewAccounts(platform, groupId)
  const platformMap: Record<string, PlatformAvailability> = {}
  const groupMap: Record<string, GroupAvailability> = {}
  const accountMap: Record<string, AccountAvailability> = {}

  for (const account of accounts) {
    accountMap[String(account.account_id)] = {
      account_id: account.account_id,
      account_name: account.account_name,
      platform: account.platform,
      group_id: account.group_id,
      group_name: account.group_name,
      status: account.is_available ? 'available' : account.is_rate_limited ? 'rate_limited' : account.is_overloaded ? 'overloaded' : 'error',
      is_available: account.is_available,
      is_rate_limited: account.is_rate_limited,
      rate_limit_remaining_sec: 'rate_limit_remaining_sec' in account ? account.rate_limit_remaining_sec : undefined,
      is_overloaded: account.is_overloaded,
      overload_remaining_sec: 'overload_remaining_sec' in account ? account.overload_remaining_sec : undefined,
      has_error: account.has_error,
      error_message: 'error_message' in account ? account.error_message : undefined
    }

    const p = platformMap[account.platform] || {
      platform: account.platform,
      total_accounts: 0,
      available_count: 0,
      rate_limit_count: 0,
      error_count: 0
    }
    p.total_accounts += 1
    p.available_count += account.is_available ? 1 : 0
    p.rate_limit_count += account.is_rate_limited ? 1 : 0
    p.error_count += account.has_error || account.is_overloaded ? 1 : 0
    platformMap[account.platform] = p

    const gid = String(account.group_id)
    const g = groupMap[gid] || {
      group_id: account.group_id,
      group_name: account.group_name,
      platform: account.platform,
      total_accounts: 0,
      available_count: 0,
      rate_limit_count: 0,
      error_count: 0
    }
    g.total_accounts += 1
    g.available_count += account.is_available ? 1 : 0
    g.rate_limit_count += account.is_rate_limited ? 1 : 0
    g.error_count += account.has_error || account.is_overloaded ? 1 : 0
    groupMap[gid] = g
  }

  return {
    enabled: true,
    platform: platformMap,
    group: groupMap,
    account: accountMap,
    timestamp: new Date().toISOString()
  }
}

function previewUserConcurrencyStats(): OpsUserConcurrencyStatsResponse {
  return {
    enabled: true,
    user: {
      '1001': { user_id: 1001, user_email: 'ops-user-a@example.com', username: 'ops-user-a', current_in_use: 9, max_capacity: 20, load_percentage: 45, waiting_in_queue: 0 },
      '1002': { user_id: 1002, user_email: 'team-api@example.com', username: 'team-api', current_in_use: 18, max_capacity: 30, load_percentage: 60, waiting_in_queue: 1 },
      '1003': { user_id: 1003, user_email: 'heavy-user@example.com', username: 'heavy-user', current_in_use: 28, max_capacity: 32, load_percentage: 88, waiting_in_queue: 4 }
    },
    timestamp: new Date().toISOString()
  }
}

function previewAlertEvents(): AlertEvent[] {
  const now = Date.now()
  return [
    {
      id: 3001,
      rule_id: 12,
      severity: 'P1',
      status: 'firing',
      title: 'OpenAI 上游错误率高于阈值',
      description: '最近 10 分钟 OpenAI 上游 5xx 占比升高，需要观察 fallback 是否生效。',
      metric_value: 6.8,
      threshold_value: 5,
      dimensions: { platform: 'openai', group_id: 2, region: 'global' },
      fired_at: new Date(now - 18 * 60 * 1000).toISOString(),
      resolved_at: null,
      email_sent: true,
      created_at: new Date(now - 18 * 60 * 1000).toISOString()
    },
    {
      id: 3002,
      rule_id: 8,
      severity: 'P2',
      status: 'resolved',
      title: 'Claude 专用分组并发接近上限',
      description: 'Claude 专用分组短时并发达到 90%，已自动回落。',
      metric_value: 90,
      threshold_value: 85,
      dimensions: { platform: 'claude', group_id: 3, region: 'global' },
      fired_at: new Date(now - 54 * 60 * 1000).toISOString(),
      resolved_at: new Date(now - 36 * 60 * 1000).toISOString(),
      email_sent: false,
      created_at: new Date(now - 54 * 60 * 1000).toISOString()
    },
    {
      id: 3003,
      rule_id: 17,
      severity: 'P3',
      status: 'manual_resolved',
      title: 'DeepSeek 账号健康检查失败',
      description: '一个 DeepSeek 账号健康检查失败，已切到备用通道。',
      metric_value: 1,
      threshold_value: 1,
      dimensions: { platform: 'deepseek', group_id: 5, region: 'global' },
      fired_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      resolved_at: new Date(now - 96 * 60 * 1000).toISOString(),
      email_sent: false,
      created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString()
    }
  ]
}

function previewSystemLogs(): OpsSystemLog[] {
  const now = Date.now()
  return [
    { id: 4101, created_at: new Date(now - 2 * 60 * 1000).toISOString(), level: 'info', component: 'http.access', message: 'request completed', request_id: 'req_preview_4101', client_request_id: 'client_preview_01', user_id: 1002, account_id: 102, platform: 'openai', model: 'gpt-5.5', extra: { status_code: 200, latency_ms: 1280, method: 'POST', path: '/v1/chat/completions', client_ip: '127.0.0.1', protocol: 'HTTP/2' } },
    { id: 4102, created_at: new Date(now - 5 * 60 * 1000).toISOString(), level: 'warn', component: 'router', message: 'account switched because primary account was near concurrency limit', request_id: 'req_preview_4102', user_id: 1003, account_id: 202, platform: 'claude', model: 'claude-4.7', extra: { status_code: 200, latency_ms: 2140, method: 'POST', path: '/v1/messages' } },
    { id: 4103, created_at: new Date(now - 9 * 60 * 1000).toISOString(), level: 'error', component: 'upstream', message: 'upstream returned temporary error', request_id: 'req_preview_4103', user_id: 1001, account_id: 401, platform: 'deepseek', model: 'deepseek-chat', extra: { status_code: 529, latency_ms: 3300, method: 'POST', path: '/v1/chat/completions', error: 'provider temporary unavailable' } },
    { id: 4104, created_at: new Date(now - 12 * 60 * 1000).toISOString(), level: 'info', component: 'metrics-rollup', message: 'minute metrics rollup completed', platform: 'openai', model: 'gpt-5.4', extra: { latency_ms: 420 } },
    { id: 4105, created_at: new Date(now - 18 * 60 * 1000).toISOString(), level: 'warn', component: 'rate-limit', message: 'business rate limit applied', request_id: 'req_preview_4105', user_id: 1002, account_id: 103, platform: 'openai', model: 'gpt-5.4', extra: { status_code: 429, latency_ms: 90, method: 'POST', path: '/v1/responses' } },
    { id: 4106, created_at: new Date(now - 24 * 60 * 1000).toISOString(), level: 'info', component: 'alert-evaluator', message: 'alert evaluation finished', extra: { latency_ms: 310 } }
  ]
}

function paginatePreview<T>(items: T[], page = 1, pageSize = 20): PaginatedResponse<T> {
  const safePage = Math.max(1, page || 1)
  const safePageSize = Math.max(1, pageSize || 20)
  const start = (safePage - 1) * safePageSize
  return {
    items: items.slice(start, start + safePageSize),
    total: items.length,
    page: safePage,
    page_size: safePageSize,
    pages: Math.max(1, Math.ceil(items.length / safePageSize))
  }
}

function previewRuntimeSettings(): OpsAlertRuntimeSettings {
  return {
    evaluation_interval_seconds: 60,
    distributed_lock: {
      enabled: false,
      key: 'ownapi:ops:alerts',
      ttl_seconds: 120
    },
    silencing: {
      enabled: false,
      global_until_rfc3339: '',
      global_reason: '',
      entries: []
    },
    thresholds: previewMetricThresholds()
  }
}

function previewMetricThresholds(): OpsMetricThresholds {
  return {
    sla_percent_min: 99,
    ttft_p99_ms_max: 5000,
    request_error_rate_percent_max: 5,
    upstream_error_rate_percent_max: 5
  }
}

function previewEmailConfig(): EmailNotificationConfig {
  return {
    alert: {
      enabled: false,
      recipients: [],
      min_severity: '',
      rate_limit_per_hour: 5,
      batching_window_seconds: 300,
      include_resolved_alerts: false
    },
    report: {
      enabled: false,
      recipients: [],
      daily_summary_enabled: false,
      daily_summary_schedule: '09:00',
      weekly_summary_enabled: false,
      weekly_summary_schedule: 'MON 09:00',
      error_digest_enabled: false,
      error_digest_schedule: '09:00',
      error_digest_min_count: 10,
      account_health_enabled: false,
      account_health_schedule: '09:00',
      account_health_error_rate_threshold: 5
    }
  }
}

function previewAdvancedSettings(): OpsAdvancedSettings {
  return {
    data_retention: {
      cleanup_enabled: false,
      cleanup_schedule: '0 3 * * *',
      error_log_retention_days: 30,
      minute_metrics_retention_days: 7,
      hourly_metrics_retention_days: 90
    },
    aggregation: {
      aggregation_enabled: false
    },
    ignore_count_tokens_errors: true,
    ignore_context_canceled: true,
    ignore_no_available_accounts: false,
    ignore_invalid_api_key_errors: false,
    ignore_insufficient_balance_errors: false,
    display_openai_token_stats: true,
    display_alert_events: true,
    auto_refresh_enabled: false,
    auto_refresh_interval_seconds: 30
  }
}

const localPreviewOpsAPI: Partial<Record<keyof typeof realOpsAPI, (...args: any[]) => any>> = {
  getDashboardOverview: async (params) => previewOverview(params),
  getDashboardSnapshotV2: async (params) => ({
    generated_at: new Date().toISOString(),
    overview: previewOverview(params),
    throughput_trend: { bucket: '10m', points: previewTrendPoints(), ...previewThroughputBreakdown() },
    error_trend: { bucket: '10m', points: previewErrorTrendPoints() }
  }),
  getThroughputTrend: async () => ({ bucket: '10m', points: previewTrendPoints(), ...previewThroughputBreakdown() }),
  getLatencyHistogram: async (params) => previewLatencyHistogram(params),
  getErrorTrend: async () => ({ bucket: '10m', points: previewErrorTrendPoints() }),
  getErrorDistribution: async () => previewErrorDistribution(),
  getOpenAITokenStats: async (params) => previewOpenAITokenStats(params),
  getConcurrencyStats: async (platform, groupId) => previewConcurrencyStats(platform, groupId),
  getUserConcurrencyStats: async () => previewUserConcurrencyStats(),
  getAccountAvailabilityStats: async (platform, groupId) => previewAccountAvailabilityStats(platform, groupId),
  getRealtimeTrafficSummary: async (window) => {
    const now = new Date().toISOString()
    return {
      enabled: true,
      summary: {
        window,
        start_time: new Date(Date.now() - 60 * 1000).toISOString(),
        end_time: now,
        platform: '',
        group_id: null,
        qps: { current: 3.4, peak: 8.9, avg: 4.1 },
        tps: { current: 1280, peak: 3140, avg: 1568 }
      },
      timestamp: now
    }
  },
  subscribeQPS: () => () => undefined,
  listErrorLogs: async (params) => emptyPage<OpsErrorLog>(params?.page, params?.page_size),
  listRequestErrors: async (params) => emptyPage<OpsErrorLog>(params?.page, params?.page_size),
  listUpstreamErrors: async (params) => emptyPage<OpsErrorLog>(params?.page, params?.page_size),
  listRequestErrorUpstreamErrors: async (_id, params) => emptyPage<OpsErrorDetail>(params?.page, params?.page_size),
  listRequestDetails: async (params) => emptyPage<OpsRequestDetail>(params?.page, params?.page_size),
  listAlertRules: async () => [],
  createAlertRule: async (rule) => ({ ...rule, id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
  updateAlertRule: async (id, rule) => ({ id, enabled: true, metric_type: 'error_rate', operator: '>', threshold: 5, window_minutes: 5, sustained_minutes: 1, severity: 'warning', cooldown_minutes: 10, notify_email: false, ...rule }),
  deleteAlertRule: async () => undefined,
  listAlertEvents: async (params = {}) => {
    let items = previewAlertEvents()
    if (params.status) items = items.filter((item) => String(item.status).toLowerCase() === String(params.status).toLowerCase())
    if (params.severity) items = items.filter((item) => String(item.severity).toLowerCase() === String(params.severity).toLowerCase())
    if (typeof params.email_sent === 'boolean') items = items.filter((item) => item.email_sent === params.email_sent)
    if (params.platform) items = items.filter((item) => item.dimensions?.platform === params.platform)
    if (typeof params.group_id === 'number') items = items.filter((item) => item.dimensions?.group_id === params.group_id)
    if (params.before_id) items = items.filter((item) => item.id < params.before_id)
    return items.slice(0, params.limit || 10)
  },
  getAlertEvent: async (id) => previewAlertEvents().find((item) => item.id === id) || previewAlertEvents()[0],
  updateAlertEventStatus: async () => undefined,
  createAlertSilence: async () => undefined,
  getEmailNotificationConfig: async () => previewEmailConfig(),
  updateEmailNotificationConfig: async (config) => config,
  getAlertRuntimeSettings: async () => previewRuntimeSettings(),
  updateAlertRuntimeSettings: async (config) => config,
  getRuntimeLogConfig: async () => ({
    level: 'info',
    enable_sampling: false,
    sampling_initial: 100,
    sampling_thereafter: 100,
    caller: false,
    stacktrace_level: 'error',
    retention_days: 30,
    source: 'local-preview',
    updated_at: new Date().toISOString()
  }),
  updateRuntimeLogConfig: async (config) => config,
  resetRuntimeLogConfig: async () => localPreviewOpsAPI.getRuntimeLogConfig?.(),
  getAdvancedSettings: async () => previewAdvancedSettings(),
  updateAdvancedSettings: async (config) => config,
  getMetricThresholds: async () => previewMetricThresholds(),
  updateMetricThresholds: async () => undefined,
  listSystemLogs: async (params = {}) => {
    let items = previewSystemLogs()
    if (params.level) items = items.filter((item) => item.level === params.level)
    if (params.platform) items = items.filter((item) => item.platform === params.platform)
    if (params.model) items = items.filter((item) => item.model === params.model)
    if (params.component) items = items.filter((item) => item.component.includes(params.component))
    if (params.q) {
      const q = String(params.q).toLowerCase()
      items = items.filter((item) => `${item.message} ${item.request_id || ''} ${item.client_request_id || ''}`.toLowerCase().includes(q))
    }
    return paginatePreview<OpsSystemLog>(items, params.page, params.page_size)
  },
  cleanupSystemLogs: async () => ({ deleted: 0 }),
  getSystemLogSinkHealth: async () => ({
    queue_depth: 8,
    queue_capacity: 500,
    dropped_count: 2,
    write_failed_count: 1,
    written_count: 8420,
    avg_write_delay_ms: 12,
    last_error: 'preview: 1 条写入失败用于展示异常状态'
  })
}

export const opsAPI = new Proxy(realOpsAPI, {
  get(target, prop: keyof typeof realOpsAPI, receiver) {
    if (isLocalPreviewOpsSession() && prop in localPreviewOpsAPI) {
      return localPreviewOpsAPI[prop]
    }
    return Reflect.get(target, prop, receiver)
  }
}) as typeof realOpsAPI

export default opsAPI
