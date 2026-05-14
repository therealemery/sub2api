/**
 * Format a per-token or per-request points price after applying the display scale.
 *
 * Example:
 *   formatScaled(0.000003, 1_000_000) -> "3 积分"
 *   formatScaled(0.5, 1) -> "0.5 积分"
 */
export function formatScaled(value: number | null, scale: number): string {
  if (value == null) return '-'
  return `${(value * scale).toPrecision(10).replace(/\.?0+$/, '')} 积分`
}
