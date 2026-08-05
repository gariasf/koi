/**
 * The locale edge: every number, date and unit a Koi surface prints goes through
 * exactly one of these. `@koi/domain` supplies the deterministic core
 * (`formatAmount`, `parseAmount`, the civil-date primitives) and by its own
 * purity rules cannot host the rest; this is the rest, and it is still pure.
 *
 * **Never `toLocaleString('es-ES')` for a Koi figure.** `Intl` applies
 * `minimumGroupingDigits: 2`, so a four-digit value silently loses its separator —
 * `1148`, not `1.148` — and Koi groups every four-digit quantity. `Intl` is also
 * not uniform across engines (Hermes delegates to per-OS facilities), so the same
 * odometer would render differently on two phones. `formatAmount`'s own grouping
 * regex has no such threshold, which is why everything here delegates to it.
 * (amendments §C; wireframes §15.3.)
 *
 * Month names are English because Koi's copy is English; only the *numbers* are
 * es-ES (`1.234,56 €`, `43.465 km`). They are authored in sentence case —
 * `MONTH` labels are uppercased in the style layer so a screen reader has
 * something to strip.
 */

import { formatAmount, parseAmount, parseCivilDate } from '@koi/domain';

import type { CivilDate, NumberSeparators } from '@koi/domain';

/** es-ES: `.` groups, `,` decimates. The only convention Koi ships today. */
export const ES: NumberSeparators = { decimal: ',', group: '.' };

/** The approximation mark. Every projected or apportioned figure wears it. */
export const APPROX = '≈';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const monthName = (month: number, short: boolean): string => {
  const name = (short ? MONTHS_SHORT : MONTHS)[month - 1];
  if (name === undefined) throw new RangeError('month out of range 1-12: ' + String(month));
  return name;
};

export interface FormatOptions {
  readonly separators?: NumberSeparators;
}

const sep = (options?: FormatOptions): NumberSeparators => options?.separators ?? ES;

/** A grouped integer: `91240` → `91.240`. Four digits group too. */
export function integer(value: number, options?: FormatOptions): string {
  return formatAmount(Math.round(value), 0, sep(options));
}

/** A fixed-decimal quantity: `26.1` at 2 → `26,10`. */
export function decimal(value: number, decimals: number, options?: FormatOptions): string {
  return formatAmount(value, decimals, sep(options));
}

/** `91.240 km`. Distance is ink, never a domain hue — that is the caller's job. */
export function km(value: number, options?: FormatOptions): string {
  return integer(value, options) + ' km';
}

/**
 * A signed distance delta: `+132 km`, `-40 km`. Always signed — the sign is the
 * whole information, and a bare `132 km` beside a reading reads as the reading.
 */
export function kmDelta(value: number, options?: FormatOptions): string {
  const rounded = Math.round(value);
  return (rounded > 0 ? '+' : rounded < 0 ? '-' : '') + km(Math.abs(rounded), options);
}

/** `1.234,56 €`. Two decimals, always — money never abbreviates. */
export function amount(value: number, options?: FormatOptions): string {
  return decimal(value, 2, options) + ' €';
}

/** `26,10 L` — litres are a pump value with two decimals. */
export function litres(value: number, options?: FormatOptions): string {
  return decimal(value, 2, options) + ' L';
}

/** `6,9 L/100km` — one decimal, per §D4's own grammar. */
export function economy(value: number, options?: FormatOptions): string {
  return decimal(value, 1, options) + ' L/100km';
}

/** `1,370 €/L` — three decimals, because pumps price to the tenth of a cent. */
export function pricePerLitre(value: number, options?: FormatOptions): string {
  return decimal(value, 3, options) + ' €/L';
}

/** `1,18 €/km`. */
export function perKm(value: number, options?: FormatOptions): string {
  return decimal(value, 2, options) + ' €/km';
}

/** `14,7 km/day`. */
export function kmPerDay(value: number, options?: FormatOptions): string {
  return decimal(value, 1, options) + ' km/day';
}

/** Marks a projected value: `≈92.388 km`. Never an abbreviated `92k`. */
export function approx(formatted: string): string {
  return APPROX + formatted;
}

/** `12 Jul` — the trailing date on a row. */
export function dayMonth(date: CivilDate): string {
  const { month, day } = parseCivilDate(date);
  return String(day) + ' ' + monthName(month, true);
}

/** `12 July` — a date inside a sentence. */
export function dayMonthLong(date: CivilDate): string {
  const { month, day } = parseCivilDate(date);
  return String(day) + ' ' + monthName(month, false);
}

/** `16 August 2026` — a date the user is asked to act on. */
export function fullDate(date: CivilDate): string {
  const { year, month, day } = parseCivilDate(date);
  return String(day) + ' ' + monthName(month, false) + ' ' + String(year);
}

/**
 * `July` — a period label, sentence case. The style layer uppercases it; typing
 * `JULY` here would leave the screen reader nothing to strip.
 */
export function monthLabel(date: CivilDate): string {
  return monthName(parseCivilDate(date).month, false);
}

/** `2026` — used by the archived-car row, which names only the year. */
export function year(date: CivilDate): string {
  return String(parseCivilDate(date).year);
}

/** `1 reading` / `2 readings` — English plural, and the count is grouped. */
export function count(n: number, singular: string, plural?: string): string {
  return integer(n) + ' ' + (n === 1 ? singular : (plural ?? singular + 's'));
}

/**
 * Reads a user-typed odometer under the locale convention. `20.000` is 20000,
 * never 20,0 — inv.20's 1000× corruption class, and the reason the capture
 * keypad has its own decimal key rather than trusting the system keyboard.
 * Returns null for anything that is not a finite number: never NaN, never a guess.
 */
export function parseKm(input: string, options?: FormatOptions): number | null {
  const value = parseAmount(input, sep(options));
  return value === null || !Number.isFinite(value) ? null : value;
}
