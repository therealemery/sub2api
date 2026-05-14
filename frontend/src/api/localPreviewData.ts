import {
  cloneModelCenterConfig,
  DEFAULT_MODEL_CENTER_CONFIG,
  normalizeModelCenterConfig,
  type ModelCenterConfig,
} from '@/constants/modelCenter'
import type { BillingMode } from '@/constants/channel'

const LOCAL_PREVIEW_TOKEN_PREFIX = 'local-preview-'
const MODEL_CENTER_STORAGE_KEY = 'ownapi_preview_model_center_config'
const CHANNELS_STORAGE_KEY = 'ownapi_preview_channels'

export function isLocalPreviewHost(): boolean {
  return (
    typeof window !== 'undefined' &&
    ['127.0.0.1', 'localhost', '::1'].includes(window.location.hostname)
  )
}

export function isLocalPreviewSession(): boolean {
  if (typeof window === 'undefined') return false
  return (
    (import.meta.env.DEV || isLocalPreviewHost()) &&
    !!localStorage.getItem('auth_token')?.startsWith(LOCAL_PREVIEW_TOKEN_PREFIX)
  )
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export function readPreviewModelCenterConfig(): ModelCenterConfig {
  return normalizeModelCenterConfig(
    readJson<ModelCenterConfig | null>(MODEL_CENTER_STORAGE_KEY, null)
  )
}

export function writePreviewModelCenterConfig(config: ModelCenterConfig): ModelCenterConfig {
  const normalized = normalizeModelCenterConfig(config)
  writeJson(MODEL_CENTER_STORAGE_KEY, normalized)
  return cloneModelCenterConfig(normalized)
}

export interface PreviewPricingInterval {
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

export interface PreviewModelPricing {
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
  intervals: PreviewPricingInterval[]
}

export interface PreviewChannel {
  id: number
  name: string
  description: string
  status: 'active' | 'disabled'
  billing_model_source: 'requested' | 'upstream' | 'channel_mapped'
  restrict_models: boolean
  features_config?: Record<string, unknown>
  group_ids: number[]
  model_pricing: PreviewModelPricing[]
  model_mapping: Record<string, Record<string, string>>
  apply_pricing_to_account_stats: boolean
  account_stats_pricing_rules: unknown[]
  created_at: string
  updated_at: string
}

export interface PreviewGroup {
  id: number
  name: string
  platform: string
  subscription_type: string
  rate_multiplier: number
  is_exclusive: boolean
}

const pointsPerMillion = (points: number) => points / 1_000_000

export const PREVIEW_GROUPS: PreviewGroup[] = [
  {
    id: 1,
    name: 'GPT 主力分组',
    platform: 'openai',
    subscription_type: 'standard',
    rate_multiplier: 1,
    is_exclusive: false,
  },
  {
    id: 2,
    name: 'Claude 高级分组',
    platform: 'anthropic',
    subscription_type: 'subscription',
    rate_multiplier: 1,
    is_exclusive: false,
  },
  {
    id: 3,
    name: 'Gemini 标准分组',
    platform: 'gemini',
    subscription_type: 'standard',
    rate_multiplier: 1,
    is_exclusive: false,
  },
]

const pricing = (
  platform: string,
  models: string[],
  inputPointsPerMillion: number,
  outputPointsPerMillion: number
): PreviewModelPricing => ({
  platform,
  models,
  billing_mode: 'token',
  input_price: pointsPerMillion(inputPointsPerMillion),
  output_price: pointsPerMillion(outputPointsPerMillion),
  cache_write_price: null,
  cache_read_price: null,
  image_output_price: null,
  per_request_price: null,
  intervals: [],
})

export function defaultPreviewChannels(): PreviewChannel[] {
  const now = new Date().toISOString()
  return [
    {
      id: 1,
      name: 'OwnAPI 主流模型接入',
      description: '本地预览渠道：管理员配置模型与积分价格后，用户侧会看到同一套可用模型与分组关系。',
      status: 'active',
      billing_model_source: 'requested',
      restrict_models: false,
      group_ids: [1, 2, 3],
      model_pricing: [
        pricing('openai', ['gpt-5.5', 'gpt-5.4', 'gpt-4.7'], 3, 9),
        pricing('anthropic', ['claude-4.7', 'claude-4.6'], 4, 12),
        pricing('gemini', ['gemini-2.5-pro', 'gemini-2.5-flash'], 1.5, 4.5),
        pricing('openai', ['deepseek-v3.1', 'deepseek-r1'], 0.8, 2.4),
        pricing('openai', ['qwen3-max', 'qwen3-coder'], 0.9, 2.7),
        pricing('openai', ['mistral-large', 'codestral'], 1.2, 3.6),
        pricing('openai', ['grok-4', 'kimi-k2', 'glm-4.5'], 1.4, 4.2),
      ],
      model_mapping: {},
      apply_pricing_to_account_stats: true,
      account_stats_pricing_rules: [],
      created_at: now,
      updated_at: now,
    },
  ]
}

export function readPreviewChannels(): PreviewChannel[] {
  if (typeof window !== 'undefined' && localStorage.getItem(CHANNELS_STORAGE_KEY) === '[]') {
    return []
  }
  const channels = readJson<PreviewChannel[] | null>(CHANNELS_STORAGE_KEY, null)
  if (!Array.isArray(channels)) {
    return defaultPreviewChannels()
  }
  return channels
}

export function writePreviewChannels(channels: PreviewChannel[]): PreviewChannel[] {
  writeJson(CHANNELS_STORAGE_KEY, channels)
  return channels
}

export function resetPreviewModelCenterConfig(): ModelCenterConfig {
  return writePreviewModelCenterConfig(DEFAULT_MODEL_CENTER_CONFIG)
}
