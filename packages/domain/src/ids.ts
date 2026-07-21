/**
 * Ids (D-025): injected, never generated here — the domain has no crypto and
 * no randomness (Hermes lacks `crypto` entirely; determinism is the point).
 *
 * The app edge supplies UUIDv7 ids (uuid v14+). The v7 time-ordered prefix
 * means lexical order == creation order, which merge and dedup logic rely on
 * (Spike Ⓒ vector 11).
 */

export type Uuid = string;

/** Shell-provided id factory; every layer that creates records takes one. */
export type IdSource = () => Uuid;

const UUID_V7_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Strict UUIDv7 shape check: lowercase hex, version nibble 7, RFC variant. */
export function isUuidV7(value: string): boolean {
  return UUID_V7_RE.test(value);
}

/**
 * Lexical id comparison. UUIDs are lowercase ASCII hex, so plain string
 * order is code-point order — and for v7, creation-time order.
 */
export function compareIds(a: Uuid, b: Uuid): -1 | 0 | 1 {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function sortIds(ids: readonly Uuid[]): Uuid[] {
  return [...ids].sort(compareIds);
}
