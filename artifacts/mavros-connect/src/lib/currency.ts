/**
 * Format a number as Ghana Cedis (GHS / ₵)
 */
export function ghs(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  return `₵${n.toFixed(2)}`;
}

/**
 * Full locale-formatted GHS string (e.g. "GHS 10.00")
 */
export function ghsFull(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  return `GHS ${n.toFixed(2)}`;
}
