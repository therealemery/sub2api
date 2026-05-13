import { MODEL_LOGO_OPTIONS, type ModelLogoOption } from './modelLogos'

export type ModelCenterStatus = 'featured' | 'available' | 'ecosystem'

export interface ModelCenterModel {
  id: string
  name: string
  logo: string
  status: ModelCenterStatus
  statusLabel: string
  description: string
  highlights: string[]
  versions: string[]
  visible: boolean
}

export interface ModelCenterConfig {
  eyebrow: string
  title: string
  description: string
  featuredTitle: string
  featuredDescription: string
  ecosystemTitle: string
  ecosystemDescription: string
  guideTitle: string
  guideDescription: string
  models: ModelCenterModel[]
}

const STATUS_LABELS: Record<ModelCenterStatus, string> = {
  featured: '主推',
  available: '已接入',
  ecosystem: '生态展示',
}

const DEFAULT_MODEL_COPY: Record<string, { description: string; highlights: string[] }> = {
  openai: {
    description: '通用能力强，适合问答、写作、代码、分析和日常生产力任务。',
    highlights: ['新手容易上手', '通用场景覆盖广', '适合高频使用'],
  },
  claude: {
    description: '长文本、复杂指令和深度思考表现稳定，适合进阶工作流。',
    highlights: ['长文本友好', '复杂任务稳定', '适合专业工作流'],
  },
  gemini: {
    description: 'Gemini 已可用，适合多模态、搜索和 Google 生态相关工作流。',
    highlights: ['多模态生态', '搜索场景友好', '已接入可用'],
  },
  deepseek: {
    description: 'DeepSeek 适合代码、推理和高性价比中文场景。',
    highlights: ['代码场景', '推理任务', '中文友好'],
  },
  qwen: {
    description: 'Qwen 中文能力和工具调用生态友好，适合国内使用习惯。',
    highlights: ['中文能力强', '工具生态友好', '适合国内场景'],
  },
  mistral: {
    description: 'Mistral 轻量、快速，适合低延迟和工程化调用场景。',
    highlights: ['低延迟', '轻量调用', '工程化友好'],
  },
}

const DEFAULT_MODEL_VERSIONS: Record<string, string[]> = {
  openai: ['GPT-5.5', 'GPT-5.4', 'GPT-4.7', 'GPT-4o'],
  claude: ['Claude 4.7', 'Claude 4.6', 'Claude 4.5 Sonnet', 'Claude 4 Opus'],
  gemini: ['Gemini 2.5 Pro', 'Gemini 2.5 Flash', 'Gemini 1.5 Pro'],
  deepseek: ['DeepSeek V3.1', 'DeepSeek R1', 'deepseek-chat'],
  qwen: ['Qwen3 Max', 'Qwen3 Coder', 'Qwen Plus'],
  mistral: ['Mistral Large', 'Codestral', 'Mixtral'],
}

function statusForLogo(option: ModelLogoOption): ModelCenterStatus {
  return option.status
}

export function createModelCenterModel(option: ModelLogoOption, suffix = ''): ModelCenterModel {
  const copy = DEFAULT_MODEL_COPY[option.id] ?? {
    description: '已准备对应 logo 和展示样式，可用于模型中心展示。',
    highlights: ['Logo 已准备', '可统一展示', '后台可维护'],
  }

  const status = statusForLogo(option)

  return {
    id: suffix ? `${option.id}-${suffix}` : option.id,
    name: option.name,
    logo: option.logo,
    status,
    statusLabel: STATUS_LABELS[status],
    description: copy.description,
    highlights: [...copy.highlights],
    versions: [...(DEFAULT_MODEL_VERSIONS[option.id] ?? option.sampleModels)],
    visible: true,
  }
}

export const DEFAULT_MODEL_CENTER_CONFIG: ModelCenterConfig = {
  eyebrow: '模型中心',
  title: '主流 AI 模型统一展示',
  description:
    '当前主推 GPT-5.5、GPT-5.4、Claude 4.7 和 Claude 4.6，Gemini 等主流模型也已纳入统一展示。用户可先在 API 密钥页面完成配置，再按同一入口使用更多模型生态。',
  featuredTitle: '主推模型',
  featuredDescription:
    '新手可以直接从常用模型开始，熟练用户也能保留更细的模型选择空间。',
  ecosystemTitle: '主流模型生态',
  ecosystemDescription:
    '这些模型会在用户展示和管理员配置中保持一致的 logo 与说明，方便后续渠道、分组和监控页面统一识别。',
  guideTitle: '怎么开始使用',
  guideDescription:
    '创建或选择一个 API 密钥后，在支持 OpenAI 兼容接口的客户端里填入即可。不同模型会按密钥、分组和管理员配置保持原有调用逻辑。',
  models: MODEL_LOGO_OPTIONS.map((option) => createModelCenterModel(option)),
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function cleanString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function cleanStatus(value: unknown, fallback: ModelCenterStatus): ModelCenterStatus {
  return value === 'featured' || value === 'available' || value === 'ecosystem'
    ? value
    : fallback
}

function cleanStringList(value: unknown, fallback: string[], maxLength: number): string[] {
  const source = Array.isArray(value) ? value : fallback
  const list = source
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxLength)

  return list.length > 0 ? list : [...fallback]
}

function normalizeModel(input: unknown, index: number): ModelCenterModel | null {
  if (!input || typeof input !== 'object') return null

  const raw = input as Partial<ModelCenterModel>
  const fallback =
    DEFAULT_MODEL_CENTER_CONFIG.models[index] ??
    createModelCenterModel(MODEL_LOGO_OPTIONS[0], String(index))
  const status = cleanStatus(raw.status, fallback.status)
  const highlights = cleanStringList(raw.highlights, fallback.highlights, 4)
  const versions = cleanStringList(raw.versions, fallback.versions, 6)

  return {
    id: cleanString(raw.id, fallback.id || `model-${index}`),
    name: cleanString(raw.name, fallback.name),
    logo: cleanString(raw.logo, fallback.logo),
    status,
    statusLabel: cleanString(raw.statusLabel, STATUS_LABELS[status]),
    description: cleanString(raw.description, fallback.description),
    highlights,
    versions,
    visible: raw.visible !== false,
  }
}

export function cloneModelCenterConfig(config: ModelCenterConfig): ModelCenterConfig {
  return clone(config)
}

export function normalizeModelCenterConfig(input: unknown): ModelCenterConfig {
  if (!input || typeof input !== 'object') {
    return clone(DEFAULT_MODEL_CENTER_CONFIG)
  }

  const raw = input as Partial<ModelCenterConfig>
  const rawModels = Array.isArray(raw.models) ? raw.models : []
  const normalizedModels = rawModels
    .map((model, index) => normalizeModel(model, index))
    .filter((model): model is ModelCenterModel => Boolean(model))

  return {
    eyebrow: cleanString(raw.eyebrow, DEFAULT_MODEL_CENTER_CONFIG.eyebrow),
    title: cleanString(raw.title, DEFAULT_MODEL_CENTER_CONFIG.title),
    description: cleanString(raw.description, DEFAULT_MODEL_CENTER_CONFIG.description),
    featuredTitle: cleanString(raw.featuredTitle, DEFAULT_MODEL_CENTER_CONFIG.featuredTitle),
    featuredDescription: cleanString(
      raw.featuredDescription,
      DEFAULT_MODEL_CENTER_CONFIG.featuredDescription
    ),
    ecosystemTitle: cleanString(raw.ecosystemTitle, DEFAULT_MODEL_CENTER_CONFIG.ecosystemTitle),
    ecosystemDescription: cleanString(
      raw.ecosystemDescription,
      DEFAULT_MODEL_CENTER_CONFIG.ecosystemDescription
    ),
    guideTitle: cleanString(raw.guideTitle, DEFAULT_MODEL_CENTER_CONFIG.guideTitle),
    guideDescription: cleanString(
      raw.guideDescription,
      DEFAULT_MODEL_CENTER_CONFIG.guideDescription
    ),
    models:
      normalizedModels.length > 0 ? normalizedModels : clone(DEFAULT_MODEL_CENTER_CONFIG.models),
  }
}
