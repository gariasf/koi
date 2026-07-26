/**
 * Naming the record a flag is about — the part the "Review now" pattern rests on
 * (§C, D-013): a review item that cannot name what it is about is a warning, not
 * a decision.
 *
 * The awkward case is the one bucket-filter creates (D-046): a flag can point at a
 * record that is *deleted*, and a deleted record is not on the device at all. So
 * naming falls back to the flag's own payload — `displaced_value` /
 * `incoming_value` carry the values the record had — and says plainly that it is
 * gone rather than rendering a blank row.
 *
 * Pure and unit-tested: no database, no SDK.
 */

import { payloadEntries, unwrapPayload } from './kinds';

/** A flag row plus whatever the LEFT JOINs could still find locally. */
export interface FlagWithRecord {
  readonly kind: string;
  readonly record_table: string;
  readonly record_id: string;
  readonly displaced_value: string | null;
  readonly incoming_value: string | null;
  readonly car_make: string | null;
  readonly car_model: string | null;
  readonly car_nickname: string | null;
  readonly reading_km: number | null;
  readonly reading_date: string | null;
}

export interface FlagSubject {
  /** What to call the record, in one short phrase. */
  readonly name: string;
  /** The car it belongs to, when that is known and not the subject itself. */
  readonly carName: string | null;
  /** True when the record is not on this device — deleted, and stated as such. */
  readonly absent: boolean;
}

const kmLabel = (km: number): string => `${km.toLocaleString()} km`;

const fromPayload = (flag: FlagWithRecord): { km?: number; date?: string } => {
  for (const raw of [flag.displaced_value, flag.incoming_value]) {
    const entries = payloadEntries(unwrapPayload(raw));
    const km = entries.find((e) => e.column === 'reading_km')?.value;
    const date = entries.find((e) => e.column === 'recorded_date')?.value;
    if (typeof km === 'number' || typeof date === 'string') {
      return {
        km: typeof km === 'number' ? km : undefined,
        date: typeof date === 'string' ? date : undefined,
      };
    }
  }
  return {};
};

const carNameOf = (flag: FlagWithRecord): string | null => {
  if (flag.car_nickname !== null && flag.car_nickname !== '') return flag.car_nickname;
  if (flag.car_make !== null && flag.car_model !== null) return `${flag.car_make} ${flag.car_model}`;
  return null;
};

export function flagSubject(flag: FlagWithRecord): FlagSubject {
  const carName = carNameOf(flag);

  if (flag.record_table === 'cars') {
    return carName !== null
      ? { name: carName, carName: null, absent: false }
      : { name: 'A car that is no longer here', carName: null, absent: true };
  }

  if (flag.record_table === 'odometer_readings') {
    if (flag.reading_km !== null) {
      const date = flag.reading_date ?? '';
      return {
        name: date === '' ? kmLabel(flag.reading_km) : `${kmLabel(flag.reading_km)} · ${date}`,
        carName,
        absent: false,
      };
    }
    const { km, date } = fromPayload(flag);
    const parts = [km === undefined ? null : kmLabel(km), date ?? null].filter(
      (p): p is string => p !== null,
    );
    return {
      name: parts.length > 0 ? parts.join(' · ') : 'A reading that is no longer here',
      carName,
      absent: true,
    };
  }

  // A table this build does not know: name it by what the server called it.
  return { name: `${flag.record_table} ${flag.record_id}`, carName, absent: true };
}
