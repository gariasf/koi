/**
 * Civil dates (koi-core-spec.md §B2 inv.13, inv.24): plain "YYYY-MM-DD"
 * strings with proleptic-Gregorian integer math.
 *
 * No Date object, no timezones, no DST — byte-identical across V8, JSC and
 * Hermes (Spike Ⓒ vectors 07–08). date-fns v4 remains the only sanctioned
 * calendar dependency (D-025) for higher-level bucket logic; these primitives
 * deliberately need none of it.
 */

/** A civil calendar date as a "YYYY-MM-DD" string (proleptic Gregorian). */
export type CivilDate = string;

export interface CivilDateParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

const CIVIL_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

export function daysInMonth(year: number, month: number): number {
  const days = Number.isInteger(month) ? DAYS_IN_MONTH[month - 1] : undefined;
  if (days === undefined) {
    throw new RangeError('month out of range 1-12: ' + String(month));
  }
  return month === 2 && isLeapYear(year) ? 29 : days;
}

/** Strict parse: shape, month range and day-of-month are all validated. */
export function parseCivilDate(date: CivilDate): CivilDateParts {
  const match = CIVIL_DATE_RE.exec(date);
  if (match === null) {
    throw new RangeError('not a civil date (YYYY-MM-DD): ' + date);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) {
    throw new RangeError('month out of range 1-12: ' + date);
  }
  if (day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError('day out of range for month: ' + date);
  }
  return { year, month, day };
}

export function isCivilDate(value: string): boolean {
  if (CIVIL_DATE_RE.exec(value) === null) return false;
  try {
    parseCivilDate(value);
    return true;
  } catch {
    return false;
  }
}

function pad(value: number, width: number): string {
  let s = String(value);
  while (s.length < width) s = '0' + s;
  return s;
}

export function formatCivilDate(parts: CivilDateParts): CivilDate {
  return pad(parts.year, 4) + '-' + pad(parts.month, 2) + '-' + pad(parts.day, 2);
}

/**
 * Day number of a civil date (Julian-day-based ordinal; only differences and
 * round-trips matter). Pure integer math — Spike Ⓒ verified this exact
 * algorithm byte-identical across engines.
 */
export function toOrdinal(parts: CivilDateParts): number {
  const a = Math.floor((14 - parts.month) / 12);
  const y = parts.year + 4800 - a;
  const m = parts.month + 12 * a - 3;
  return (
    parts.day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

export function fromOrdinal(ordinal: number): CivilDate {
  const a = ordinal + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return formatCivilDate({ year, month, day });
}

/** Calendar addition in whole days; handles month/year/leap rollover. */
export function addDays(date: CivilDate, days: number): CivilDate {
  if (!Number.isInteger(days)) {
    throw new RangeError('days must be an integer: ' + String(days));
  }
  return fromOrdinal(toOrdinal(parseCivilDate(date)) + days);
}

/**
 * Chronological comparison. Valid civil dates compare correctly as plain
 * strings (fixed-width fields); both inputs are validated first.
 */
export function compareCivilDates(a: CivilDate, b: CivilDate): -1 | 0 | 1 {
  parseCivilDate(a);
  parseCivilDate(b);
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * The cycle anchor for a given month: the plan's signup/start day-of-month,
 * clamped on short months (inv.13 plan-cycle billing, inv.24 cap cycles —
 * a 31st anchor lands on Feb 29 in a leap year, never decays permanently).
 */
export function cycleAnchor(year: number, month: number, anchorDay: number): CivilDate {
  if (!Number.isInteger(anchorDay) || anchorDay < 1 || anchorDay > 31) {
    throw new RangeError('anchor day out of range 1-31: ' + String(anchorDay));
  }
  const day = Math.min(anchorDay, daysInMonth(year, month));
  return formatCivilDate({ year, month, day });
}
