/**
 * Deterministic string ordering for merges (Spike Ⓒ vectors 09–10).
 *
 * NFC-normalize, then compare by Unicode code point. Never localeCompare /
 * Intl.Collator: collation is engine- and OS-dependent, and a sync merge
 * resolved server-side must recompute to the same answer on every client
 * (D-025). Code-point order is spec-defined and byte-stable everywhere.
 *
 * Note: code-POINT order differs from JS's default code-UNIT order (`<`,
 * Array.prototype.sort) only for strings containing astral-plane characters
 * (e.g. emoji in station names); for BMP-only strings the two agree. This
 * comparator is the single source of truth for merge ordering — never use a
 * bare sort() on user strings in merge logic.
 */

/** Canonical Unicode composition; merge keys are always compared post-NFC. */
export function normalizeNfc(value: string): string {
  return value.normalize('NFC');
}

/** Pure code-point comparison. Does NOT normalize — callers pick the layer. */
export function compareCodePoints(a: string, b: string): -1 | 0 | 1 {
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const ca = a.codePointAt(i) as number;
    const cb = b.codePointAt(j) as number;
    if (ca !== cb) return ca < cb ? -1 : 1;
    i += ca > 0xffff ? 2 : 1;
    j += cb > 0xffff ? 2 : 1;
  }
  if (i < a.length) return 1;
  if (j < b.length) return -1;
  return 0;
}

/** NFC-normalize both sides, then compare by code point. */
export function compareForMerge(a: string, b: string): -1 | 0 | 1 {
  return compareCodePoints(normalizeNfc(a), normalizeNfc(b));
}

/**
 * The merge-deterministic sort: returns the values NFC-normalized and in
 * code-point order (mirrors Spike Ⓒ's codePointSort).
 */
export function sortForMerge(values: readonly string[]): string[] {
  return values.map(normalizeNfc).sort(compareCodePoints);
}
