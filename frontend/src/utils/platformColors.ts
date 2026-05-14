/**
 * Centralized platform color definitions.
 *
 * All components that need platform-specific styling should import from here
 * instead of defining their own color mappings.
 */

export type Platform = 'anthropic' | 'openai' | 'antigravity' | 'gemini'

// ── Badge (bg + text + border, for inline badges with border) ───────
const BADGE: Record<Platform, string> = {
  anthropic: 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border-[var(--border-default)]',
  openai: 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border-[var(--border-default)]',
  antigravity: 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border-[var(--border-default)]',
  gemini: 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border-[var(--border-default)]',
}
const BADGE_DEFAULT = 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border-[var(--border-default)]'

// ── Light badge (softer bg, no border) ──────────────────────────────
const BADGE_LIGHT: Record<Platform, string> = {
  anthropic: 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)]',
  openai: 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)]',
  antigravity: 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)]',
  gemini: 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)]',
}

// ── Border ──────────────────────────────────────────────────────────
const BORDER: Record<Platform, string> = {
  anthropic: 'border-[var(--border-default)]',
  openai: 'border-[var(--border-default)]',
  antigravity: 'border-[var(--border-default)]',
  gemini: 'border-[var(--border-default)]',
}
const BORDER_DEFAULT = 'border-[var(--border-default)]'

// ── Accent bar (gradient) ───────────────────────────────────────────
const ACCENT_BAR: Record<Platform, string> = {
  anthropic: 'bg-[var(--accent)]',
  openai: 'bg-[var(--accent)]',
  antigravity: 'bg-[var(--accent)]',
  gemini: 'bg-[var(--accent)]',
}
const ACCENT_BAR_DEFAULT = 'bg-[var(--accent)]'

// ── Text (price, icon) ─────────────────────────────────────────────
const TEXT: Record<Platform, string> = {
  anthropic: 'text-[var(--accent)]',
  openai: 'text-[var(--accent)]',
  antigravity: 'text-[var(--accent)]',
  gemini: 'text-[var(--accent)]',
}
const TEXT_DEFAULT = 'text-[var(--accent)]'

// ── Icon (check mark etc.) ──────────────────────────────────────────
const ICON: Record<Platform, string> = {
  anthropic: 'text-[var(--accent)]',
  openai: 'text-[var(--accent)]',
  antigravity: 'text-[var(--accent)]',
  gemini: 'text-[var(--accent)]',
}
const ICON_DEFAULT = 'text-[var(--accent)]'

// ── Button (solid bg) ───────────────────────────────────────────────
const BUTTON: Record<Platform, string> = {
  anthropic: 'bg-[var(--accent)] text-[var(--text-inverse)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-hover)]',
  openai: 'bg-[var(--accent)] text-[var(--text-inverse)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-hover)]',
  antigravity: 'bg-[var(--accent)] text-[var(--text-inverse)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-hover)]',
  gemini: 'bg-[var(--accent)] text-[var(--text-inverse)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-hover)]',
}
const BUTTON_DEFAULT = 'bg-[var(--accent)] text-[var(--text-inverse)] hover:bg-[var(--accent-hover)]'

// ── Discount badge ──────────────────────────────────────────────────
const DISCOUNT: Record<Platform, string> = {
  anthropic: 'bg-[var(--accent-soft)] text-[var(--accent)]',
  openai: 'bg-[var(--accent-soft)] text-[var(--accent)]',
  antigravity: 'bg-[var(--accent-soft)] text-[var(--accent)]',
  gemini: 'bg-[var(--accent-soft)] text-[var(--accent)]',
}
const DISCOUNT_DEFAULT = 'bg-red-100 text-red-700'

// ── Header gradient (subscription confirm) ─────────────────────────
const GRADIENT: Record<Platform, string> = {
  anthropic: 'from-[var(--accent)] to-[var(--accent)]',
  openai: 'from-[var(--accent)] to-[var(--accent)]',
  antigravity: 'from-[var(--accent)] to-[var(--accent)]',
  gemini: 'from-[var(--accent)] to-[var(--accent)]',
}
const GRADIENT_DEFAULT = 'from-[var(--accent)] to-[var(--accent)]'

// ── Header text (light text on gradient bg) ────────────────────────
const GRADIENT_TEXT: Record<Platform, string> = {
  anthropic: 'text-[var(--text-inverse)]',
  openai: 'text-[var(--text-inverse)]',
  antigravity: 'text-[var(--text-inverse)]',
  gemini: 'text-[var(--text-inverse)]',
}
const GRADIENT_TEXT_DEFAULT = 'text-[var(--text-inverse)]'

const GRADIENT_SUBTEXT: Record<Platform, string> = {
  anthropic: 'text-[var(--text-inverse)]',
  openai: 'text-[var(--text-inverse)]',
  antigravity: 'text-[var(--text-inverse)]',
  gemini: 'text-[var(--text-inverse)]',
}
const GRADIENT_SUBTEXT_DEFAULT = 'text-[var(--text-inverse)]'

// ── Public API ──────────────────────────────────────────────────────

function isPlatform(p: string): p is Platform {
  return p === 'anthropic' || p === 'openai' || p === 'antigravity' || p === 'gemini'
}

export function platformBadgeClass(p: string): string {
  return isPlatform(p) ? BADGE[p] : BADGE_DEFAULT
}

export function platformBadgeLightClass(p: string): string {
  return isPlatform(p) ? BADGE_LIGHT[p] : BADGE_DEFAULT
}

export function platformBorderClass(p: string): string {
  return isPlatform(p) ? BORDER[p] : BORDER_DEFAULT
}

export function platformAccentBarClass(p: string): string {
  return isPlatform(p) ? ACCENT_BAR[p] : ACCENT_BAR_DEFAULT
}

export function platformTextClass(p: string): string {
  return isPlatform(p) ? TEXT[p] : TEXT_DEFAULT
}

export function platformIconClass(p: string): string {
  return isPlatform(p) ? ICON[p] : ICON_DEFAULT
}

export function platformButtonClass(p: string): string {
  return isPlatform(p) ? BUTTON[p] : BUTTON_DEFAULT
}

export function platformDiscountClass(p: string): string {
  return isPlatform(p) ? DISCOUNT[p] : DISCOUNT_DEFAULT
}

export function platformGradientClass(p: string): string {
  return isPlatform(p) ? GRADIENT[p] : GRADIENT_DEFAULT
}

export function platformGradientTextClass(p: string): string {
  return isPlatform(p) ? GRADIENT_TEXT[p] : GRADIENT_TEXT_DEFAULT
}

export function platformGradientSubtextClass(p: string): string {
  return isPlatform(p) ? GRADIENT_SUBTEXT[p] : GRADIENT_SUBTEXT_DEFAULT
}

export function platformLabel(p: string): string {
  switch (p) {
    case 'anthropic': return 'Anthropic'
    case 'openai': return 'OpenAI'
    case 'antigravity': return 'Antigravity'
    case 'gemini': return 'Gemini'
    default: return p || 'API'
  }
}
