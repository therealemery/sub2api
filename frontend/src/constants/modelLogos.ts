export interface ModelLogoOption {
  id: string
  name: string
  logo: string
  status: 'available' | 'featured' | 'ecosystem'
  aliases: string[]
  sampleModels: string[]
}

export const MODEL_LOGO_OPTIONS: ModelLogoOption[] = [
  {
    id: 'openai',
    name: 'ChatGPT',
    logo: '/brand/openai.svg',
    status: 'featured',
    aliases: ['openai', 'chatgpt', 'gpt', 'o1', 'o3', 'o4'],
    sampleModels: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
  },
  {
    id: 'claude',
    name: 'Claude',
    logo: '/brand/claude.svg',
    status: 'featured',
    aliases: ['claude', 'anthropic', 'sonnet', 'opus', 'haiku'],
    sampleModels: ['claude-3-5-sonnet', 'claude-3-haiku'],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    logo: '/brand/gemini.svg',
    status: 'available',
    aliases: ['gemini', 'google', 'palm'],
    sampleModels: ['gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    logo: '/brand/deepseek.svg',
    status: 'ecosystem',
    aliases: ['deepseek'],
    sampleModels: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    id: 'qwen',
    name: 'Qwen',
    logo: '/brand/qwen.svg',
    status: 'ecosystem',
    aliases: ['qwen', 'qwq', 'tongyi', '通义'],
    sampleModels: ['qwen-plus', 'qwen-max'],
  },
  {
    id: 'mistral',
    name: 'Mistral',
    logo: '/brand/mistral.svg',
    status: 'ecosystem',
    aliases: ['mistral', 'mixtral', 'codestral'],
    sampleModels: ['mistral-large', 'codestral-latest'],
  },
]

export function resolveModelLogo(model: string | null | undefined): ModelLogoOption | null {
  if (!model) return null
  const value = model.toLowerCase()
  return MODEL_LOGO_OPTIONS.find((option) =>
    option.aliases.some((alias) => value.includes(alias.toLowerCase()))
  ) ?? null
}

export function getModelLogo(model: string | null | undefined): string {
  return resolveModelLogo(model)?.logo ?? ''
}

export function getModelDisplayName(model: string | null | undefined): string {
  return resolveModelLogo(model)?.name ?? (model || '')
}

const PLATFORM_LOGO_ALIASES: Record<string, string> = {
  anthropic: 'claude',
  openai: 'openai',
  gemini: 'gemini',
  antigravity: 'gemini',
}

export function getPlatformLogo(platform: string | null | undefined): string {
  if (!platform) return ''
  return getModelLogo(PLATFORM_LOGO_ALIASES[platform] ?? platform)
}

export function getPlatformDisplayName(platform: string | null | undefined): string {
  if (!platform) return ''
  return getModelDisplayName(PLATFORM_LOGO_ALIASES[platform] ?? platform)
}
