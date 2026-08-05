/**
 * `useFormat()` — the app's one door to `@koi/i18n`.
 *
 * Screens never import the formatters directly, for one reason: the Units setting
 * (km/mi · L/100km / km/L / mpg · L/gal) is a *conversion* layer, and when it lands
 * it lands here — behind an unchanged call site. A screen that reached past this
 * hook would keep printing kilometres to a user who asked for miles.
 *
 * The es-ES separator convention is injected by these functions rather than sniffed
 * from the environment, which is what makes the ledger read the same on every
 * device (inv.20, amendments §C).
 */

import {
  amount,
  approx,
  count,
  dayMonth,
  dayMonthLong,
  economy,
  fullDate,
  integer,
  km,
  kmDelta,
  kmPerDay,
  litres,
  monthLabel,
  parseKm,
  perKm,
  pricePerLitre,
  year,
} from '@koi/i18n';

const format = {
  amount,
  approx,
  count,
  dayMonth,
  dayMonthLong,
  economy,
  fullDate,
  integer,
  km,
  kmDelta,
  kmPerDay,
  litres,
  monthLabel,
  parseKm,
  perKm,
  pricePerLitre,
  year,
} as const;

export type KoiFormat = typeof format;

export function useFormat(): KoiFormat {
  return format;
}
