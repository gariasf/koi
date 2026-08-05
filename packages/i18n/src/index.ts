/**
 * @koi/i18n — Koi's locale edge.
 *
 * The formatters every Koi figure passes through, shared by the mobile app and
 * the web companion so one number cannot be spelled two ways. Pure, deterministic
 * and deliberately free of `Intl` (see `format.ts` for why that is a correctness
 * rule, not a preference).
 *
 * The i18next catalogs are a separate, later item (D-035): this package starts as
 * the formatter layer because that is what the app surface blocks on.
 */

export {
  APPROX,
  ES,
  amount,
  approx,
  count,
  dayMonth,
  dayMonthLong,
  decimal,
  economy,
  fullDate,
  integer,
  km,
  kmDelta,
  kmPerDay,
  monthLabel,
  parseKm,
  perKm,
  pricePerLitre,
  litres,
  year,
} from './format.js';
export type { FormatOptions } from './format.js';
