/**
 * Fuel economy (koi-core-spec.md §B2 inv.1–5).
 *
 * L/100km is only honest full-tank → full-tank: the caller measures litres
 * accumulated over the interval back to the previous full fill with an
 * odometer (inv.1–2). A broken chain yields no number, never a wrong one
 * (inv.3). Blending across cars is refused at a higher layer (inv.5).
 */

/**
 * Litres per 100 km over a measured full→full interval.
 * Returns null — "no number" — when the chain restarted (`missedPrevious`),
 * when the distance is not positive, or when litres are not positive
 * (entry validation hard-stops litres ≤ 0, so a non-positive value here can
 * only mean an unmeasurable interval).
 */
export function economyL100km(litres: number, deltaKm: number, missedPrevious: boolean): number | null {
  if (missedPrevious) return null;
  if (deltaKm <= 0) return null;
  if (litres <= 0) return null;
  return (litres / deltaKm) * 100;
}
