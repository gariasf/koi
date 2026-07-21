/**
 * Money primitives (koi-core-spec.md §B2 inv.13–20).
 *
 * Amounts move through the domain as integer minor units (cents); floats
 * appear only at the parse/derive edge and are rounded exactly once. Parsing
 * and formatting are parameterized by explicit separators — the locale
 * convention is injected by the caller, never sniffed from the environment
 * (inv.20: "20.000" under an es-ES convention is 20000, never 20.0 — the
 * 1000× corruption class).
 */

export interface NumberSeparators {
  /** The locale's decimal mark, e.g. "," for es-ES. */
  readonly decimal: string;
  /** The locale's grouping mark, e.g. "." for es-ES. */
  readonly group: string;
}

/**
 * Parse a human-entered amount under an explicit separator convention.
 * Grouping marks are stripped, the decimal mark becomes ".", and the result
 * must be a finite number — anything else is null (never NaN, never a guess).
 */
export function parseAmount(input: string, separators: NumberSeparators): number | null {
  const cleaned = input
    .split(separators.group)
    .join('')
    .split(separators.decimal)
    .join('.');
  if (cleaned.trim() === '') return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/**
 * Deterministic fixed-decimal formatting under an explicit separator
 * convention. This is the domain's only formatter — engine-stable because it
 * never touches Intl. Richer locale formatting (currency symbols, plural
 * rules) lives at the app edge.
 */
export function formatAmount(value: number, decimals: number, separators: NumberSeparators): string {
  const negative = value < 0;
  const parts = Math.abs(value).toFixed(decimals).split('.');
  const intPart = parts[0] ?? '0';
  const decPart = parts[1] ?? '';
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separators.group);
  const body = decimals > 0 ? grouped + separators.decimal + decPart : grouped;
  return negative ? '-' + body : body;
}

/**
 * Convert a major-unit float (e.g. euros) to integer minor units (cents),
 * rounding exactly once. Survives the IEEE-754 traps: 68.40 → 6840,
 * 0.1 + 0.2 → 30, 1.005 → 100 (Spike Ⓒ vector 03).
 */
export function toMinorUnits(amount: number, minorPerMajor = 100): number {
  return Math.round(amount * minorPerMajor);
}

/** Minor-unit amounts must stay inside the safe-integer range to be exact. */
export function isSafeMinorUnits(value: number): boolean {
  return Number.isSafeInteger(value);
}

/**
 * Sum integer minor units under Number.isSafeInteger guards: every input and
 * the result must be a safe integer, or the sum would silently lose exactness.
 */
export function sumMinorUnits(values: readonly number[]): number {
  let sum = 0;
  for (const value of values) {
    if (!Number.isSafeInteger(value)) {
      throw new TypeError('minor units must be safe integers, got: ' + String(value));
    }
    sum += value;
  }
  if (!Number.isSafeInteger(sum)) {
    throw new RangeError('minor-unit sum left the safe-integer range');
  }
  return sum;
}
