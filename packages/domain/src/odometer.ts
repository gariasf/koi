/**
 * Odometer trail invariants (koi-core-spec.md §B2 inv.6–12) as pure checks.
 *
 * The server runs these on every upload and the clients on every write —
 * "flag, never fix" (D-022/D-023): a violation is returned as data for the
 * caller to record, never thrown and never auto-repaired. Malformed input
 * (bad dates, non-integer km) therefore also comes back as a violation.
 *
 * S-3 (derived-never-sync): a car's current odometer is never a stored or
 * synced column — `deriveCurrentOdometerKm` recomputes it from the trail.
 */

import { isCivilDate, type CivilDate } from './civil-date.js';

export interface OdometerObservation {
  readonly readingKm: number;
  readonly recordedDate: CivilDate;
}

export type OdometerViolationKind =
  | 'odometer-invalid'
  | 'odometer-same-date-conflict'
  | 'odometer-backwards'
  | 'odometer-ahead';

export interface OdometerViolation {
  readonly kind: OdometerViolationKind;
  readonly message: string;
}

/** §B2 validation table: odometer outside 0…9,999,999 is a hard violation. */
export const ODOMETER_KM_MAX = 9_999_999;

export function isValidOdometerKm(km: number): boolean {
  return Number.isInteger(km) && km >= 0 && km <= ODOMETER_KM_MAX;
}

function isWellFormed(o: OdometerObservation): boolean {
  return isValidOdometerKm(o.readingKm) && isCivilDate(o.recordedDate);
}

/**
 * inv.8: zero/unknown readings never join the trail — a 0 km value is the
 * "unknown" sentinel (imports, name-only trips) and must not corrupt
 * monotonicity or derive a current.
 */
function joinsTrail(o: OdometerObservation): boolean {
  return isWellFormed(o) && o.readingKm > 0;
}

/**
 * Validate one incoming reading against a car's existing trail.
 *
 * Returns the first violation found, in fixed precedence order so the same
 * inputs always produce the same flag on every engine and every replay:
 * well-formedness, same-date conflict (S-5 — keep both, flag), then
 * monotonicity down/up (inv.9, both directions). Malformed rows already in
 * the trail can't be ordered against, so they are skipped, never thrown on.
 */
export function checkOdometerReading(
  existing: readonly OdometerObservation[],
  incoming: OdometerObservation,
): OdometerViolation | null {
  if (!isWellFormed(incoming)) {
    return {
      kind: 'odometer-invalid',
      message:
        'Reading must be a whole 0-' +
        String(ODOMETER_KM_MAX) +
        ' km on a valid YYYY-MM-DD date; got ' +
        String(incoming.readingKm) +
        ' km on ' +
        String(incoming.recordedDate) +
        '.',
    };
  }

  // inv.8: a zero reading never joins the trail, so it can neither violate
  // monotonicity nor be violated against — nothing to check.
  if (!joinsTrail(incoming)) return null;

  const trail = existing.filter(joinsTrail);
  const km = incoming.readingKm;
  const date = incoming.recordedDate;

  const sameDate = trail.find((r) => r.recordedDate === date && r.readingKm !== km);
  if (sameDate !== undefined) {
    return {
      kind: 'odometer-same-date-conflict',
      message:
        'Two readings for ' +
        date +
        ': ' +
        String(sameDate.readingKm) +
        ' and ' +
        String(km) +
        ' km. Kept both - please review.',
    };
  }

  // Valid civil dates compare chronologically as plain strings.
  let earlierMax = -1;
  let laterMin = -1;
  for (const r of trail) {
    if (r.recordedDate < date && r.readingKm > earlierMax) earlierMax = r.readingKm;
    if (r.recordedDate > date && (laterMin === -1 || r.readingKm < laterMin)) {
      laterMin = r.readingKm;
    }
  }

  if (earlierMax !== -1 && km < earlierMax) {
    return {
      kind: 'odometer-backwards',
      message:
        String(km) + ' km on ' + date + ' is below an earlier reading of ' + String(earlierMax) + ' km.',
    };
  }
  if (laterMin !== -1 && km > laterMin) {
    return {
      kind: 'odometer-ahead',
      message:
        String(km) + ' km on ' + date + ' exceeds a later reading of ' + String(laterMin) + ' km.',
    };
  }

  return null;
}

/**
 * The car's current odometer, derived from its trail (inv.11: current =
 * newest reading; backdated records never clobber a newer current). Ties on
 * date resolve to the highest km so concurrent same-date conflicts still
 * derive deterministically on every device. Zero readings never join the
 * trail (inv.8). Null when no trail-joining reading exists — a current is
 * never invented.
 */
export function deriveCurrentOdometerKm(readings: readonly OdometerObservation[]): number | null {
  let best: OdometerObservation | null = null;
  for (const r of readings) {
    if (!joinsTrail(r)) continue;
    if (
      best === null ||
      r.recordedDate > best.recordedDate ||
      (r.recordedDate === best.recordedDate && r.readingKm > best.readingKm)
    ) {
      best = r;
    }
  }
  return best === null ? null : best.readingKm;
}
