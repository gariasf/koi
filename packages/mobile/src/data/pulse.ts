/**
 * Home's month pulse — the distance half, which is the only half this schema can
 * honestly state.
 *
 * **The km rule** (§C1, inv.21/inv.23 as amendment B13 reads them): the newest
 * reading *inside* the month, minus the last reading at or before its start. This is
 * the **strict** reading of the distance invariants — it never invents distance for
 * a period that has not finished — and it is deliberately different from a completed
 * Insights page, where the trail may bracket the whole window. Two readings, both
 * real, no interpolation.
 *
 * A car contributes only when both ends exist and the newest reading inside the
 * month is genuinely later than the anchor. When no live car contributes, the
 * distance is **withheld**: `null`, rendered as a dash plus a sentence, never as
 * `0 km`. Zero and unknown are different facts (annex A) — `0,00 €` is a real sum of
 * no records, `0 km` would be an invention.
 *
 * This lives in the app rather than in `@koi/domain` because the domain's lens
 * derivation engines are a separate, sequenced board item. When they land, the pure
 * half below is what moves — the SQL stays here.
 */

import type { KoiDb } from './db';

/**
 * Both ends of one car's month, as the query returns them. Dates come back beside
 * the values on purpose: the *dates* decide whether the pair is usable, and a
 * version of this that compared only kilometres would happily measure a month
 * against a reading taken inside it.
 */
export interface CarMonthEnds {
  readonly car_id: string;
  readonly anchor_km: number | null;
  readonly anchor_date: string | null;
  readonly newest_km: number | null;
  readonly newest_date: string | null;
}

export const MONTH_ENDS_SQL = `
  SELECT c.id AS car_id,
         (SELECT r.reading_km   FROM odometer_readings r
           WHERE r.car_id = c.id AND r.recorded_date <= ?
           ORDER BY r.recorded_date DESC, r.reading_km DESC LIMIT 1) AS anchor_km,
         (SELECT r.recorded_date FROM odometer_readings r
           WHERE r.car_id = c.id AND r.recorded_date <= ?
           ORDER BY r.recorded_date DESC, r.reading_km DESC LIMIT 1) AS anchor_date,
         (SELECT r.reading_km   FROM odometer_readings r
           WHERE r.car_id = c.id AND r.recorded_date >= ? AND r.recorded_date <= ?
           ORDER BY r.recorded_date DESC, r.reading_km DESC LIMIT 1) AS newest_km,
         (SELECT r.recorded_date FROM odometer_readings r
           WHERE r.car_id = c.id AND r.recorded_date >= ? AND r.recorded_date <= ?
           ORDER BY r.recorded_date DESC, r.reading_km DESC LIMIT 1) AS newest_date
  FROM cars c
  WHERE c.archived_at IS NULL
`;

/** `[monthStart, monthStart, monthStart, monthEnd, monthStart, monthEnd]`. */
export const monthEndsParams = (monthStart: string, monthEnd: string): string[] => [
  monthStart,
  monthStart,
  monthStart,
  monthEnd,
  monthStart,
  monthEnd,
];

/**
 * The pure half: sum what the trail supports, withhold what it does not.
 * Returns null when no live car has a measurable month.
 */
export function monthDistanceKm(rows: readonly CarMonthEnds[]): number | null {
  let total = 0;
  let measured = false;
  for (const row of rows) {
    if (
      row.anchor_km === null ||
      row.anchor_date === null ||
      row.newest_km === null ||
      row.newest_date === null
    ) {
      continue;
    }
    // Strictly later: a month whose only reading is its own anchor has no distance
    // to state, and a same-date pair would be measuring a reading against itself.
    if (row.newest_date <= row.anchor_date) continue;
    total += row.newest_km - row.anchor_km;
    measured = true;
  }
  return measured ? total : null;
}

export async function readMonthEnds(
  db: KoiDb,
  monthStart: string,
  monthEnd: string,
): Promise<CarMonthEnds[]> {
  return db.getAll<CarMonthEnds>(MONTH_ENDS_SQL, monthEndsParams(monthStart, monthEnd));
}
