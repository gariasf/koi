/**
 * Car-field hard bounds (koi-core-spec.md §B2 validation table): year
 * 1950…next, tank 10–200 L, odometer 0…9,999,999. Clients hard-block these
 * at entry; the server can only "flag, never fix" (D-022) — so this check
 * returns violations as data, one per offending field, never throws.
 *
 * `currentYear` is injected: the domain core owns no clock (purity bans).
 */

import { isValidOdometerKm, ODOMETER_KM_MAX } from './odometer.js';

export interface CarFieldValues {
  readonly year?: number | null;
  readonly tankCapacityL?: number | null;
  readonly initialOdometerKm?: number | null;
}

export type CarViolationKind =
  | 'car-year-out-of-range'
  | 'car-tank-out-of-range'
  | 'car-odometer-out-of-range';

export interface CarViolation {
  readonly kind: CarViolationKind;
  readonly message: string;
}

export const CAR_YEAR_MIN = 1950;
export const TANK_CAPACITY_L_MIN = 10;
export const TANK_CAPACITY_L_MAX = 200;

export function checkCarFields(
  fields: CarFieldValues,
  context: { readonly currentYear: number },
): CarViolation[] {
  const violations: CarViolation[] = [];
  const { year, tankCapacityL, initialOdometerKm } = fields;
  const maxYear = context.currentYear + 1;

  if (year !== undefined && year !== null && (!Number.isInteger(year) || year < CAR_YEAR_MIN || year > maxYear)) {
    violations.push({
      kind: 'car-year-out-of-range',
      message:
        'Year ' + String(year) + ' is outside ' + String(CAR_YEAR_MIN) + '-' + String(maxYear) + '.',
    });
  }

  if (
    tankCapacityL !== undefined &&
    tankCapacityL !== null &&
    (!Number.isInteger(tankCapacityL) ||
      tankCapacityL < TANK_CAPACITY_L_MIN ||
      tankCapacityL > TANK_CAPACITY_L_MAX)
  ) {
    violations.push({
      kind: 'car-tank-out-of-range',
      message:
        'Tank capacity ' +
        String(tankCapacityL) +
        ' L is outside ' +
        String(TANK_CAPACITY_L_MIN) +
        '-' +
        String(TANK_CAPACITY_L_MAX) +
        ' L.',
    });
  }

  if (
    initialOdometerKm !== undefined &&
    initialOdometerKm !== null &&
    !isValidOdometerKm(initialOdometerKm)
  ) {
    violations.push({
      kind: 'car-odometer-out-of-range',
      message:
        'Initial odometer ' +
        String(initialOdometerKm) +
        ' km is outside 0-' +
        String(ODOMETER_KM_MAX) +
        '.',
    });
  }

  return violations;
}
