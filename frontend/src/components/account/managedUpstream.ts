export type ManagedUpstreamProvider = '' | 'packyapi' | 'dc-api' | 'alibaba-video'

export const DC_API_BASE_URL = 'https://console.dc-api.com'
export const DC_API_VIDEO_MODEL = 'MiniMax-H3'
export const ALIBABA_VIDEO_MODELS = ['wan3.0-video', 'wan3.0-video-prime'] as const

export function normalizeDCAPIBaseURL(value: string): string {
  const normalized = value.trim().replace(/\/+$/, '')
  if (/\/v1\/videos$/i.test(normalized)) {
    return normalized.replace(/\/v1\/videos$/i, '')
  }
  return normalized || DC_API_BASE_URL
}

export function normalizeAlibabaVideoBaseURL(value: string): string {
  const normalized = value.trim().replace(/\/+$/, '')
  if (/\/compatible-mode\/v1$/i.test(normalized)) {
    return normalized.replace(/\/compatible-mode\/v1$/i, '/api/v1')
  }
  const serviceIndex = normalized.toLowerCase().indexOf('/api/v1/services/')
  if (serviceIndex >= 0) return normalized.slice(0, serviceIndex + '/api/v1'.length)
  return normalized
}

export function isManagedVideoProvider(provider: ManagedUpstreamProvider): boolean {
  return provider === 'dc-api' || provider === 'alibaba-video'
}

export function applyManagedUpstreamCredentials(
  provider: ManagedUpstreamProvider,
  credentials: Record<string, unknown>,
  previousProvider: ManagedUpstreamProvider = ''
): Record<string, unknown> {
  const next = { ...credentials }
  if (provider === 'dc-api') {
    next.base_url = DC_API_BASE_URL
    next.model = DC_API_VIDEO_MODEL
    next.model_mapping = { [DC_API_VIDEO_MODEL]: DC_API_VIDEO_MODEL }
    delete next.compact_model_mapping
    return next
  }
  if (provider === 'alibaba-video') {
    next.base_url = normalizeAlibabaVideoBaseURL(String(next.base_url || ''))
    next.model_mapping = Object.fromEntries(ALIBABA_VIDEO_MODELS.map(model => [model, model]))
    delete next.model
    delete next.compact_model_mapping
    return next
  }
  if (isManagedVideoProvider(previousProvider)) {
    delete next.model
  }
  return next
}

export function applyManagedUpstreamExtra(
  provider: ManagedUpstreamProvider,
  extra?: Record<string, unknown>
): Record<string, unknown> | undefined {
  const next = { ...(extra || {}) }
  if (provider) {
    next.upstream_provider = provider
  } else {
    delete next.upstream_provider
  }

  if (isManagedVideoProvider(provider)) {
    delete next.openai_passthrough
    delete next.openai_oauth_passthrough
    delete next.openai_compact_mode
    delete next.openai_compact_supported
    delete next.openai_apikey_responses_websockets_v2_mode
    delete next.openai_apikey_responses_websockets_v2_enabled
    delete next.openai_oauth_responses_websockets_v2_mode
    delete next.openai_oauth_responses_websockets_v2_enabled
    delete next.responses_websockets_v2_enabled
    delete next.openai_ws_enabled
    delete next.codex_image_generation_bridge
    delete next.codex_image_generation_bridge_enabled
    delete next.codex_cli_only
  }

  return Object.keys(next).length > 0 ? next : undefined
}
