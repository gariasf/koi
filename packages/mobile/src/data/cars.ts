/**
 * Car writes — including the cascade half of the S-6 client contract (D-041).
 *
 * Deleting a car sends **per-child DELETEs first, then the car's own DELETE, all
 * in ONE client transaction.** Both halves of that matter:
 *
 *  - *Per-child*, because each child's DELETE carries its own `old` echo, so the
 *    server runs `planDelete` on it and can tell the user that a reading someone
 *    else had just edited went down with the car (`delete-conflict`). The server's
 *    own cascade is the backstop for children this device never synced — it
 *    cannot do per-child conflict analysis for rows the client never saw.
 *  - *One transaction*, because a client transaction is one upload batch is one
 *    server transaction is one checkpoint: peers see the car and its readings
 *    leave together, never a deleted car with live children.
 *
 * There is no undo for a car (inv.30 / §C4: "There is no undo."). A car never
 * resurrects via PUT server-side, so offering one would be a lie; the confirmation
 * is typed instead, and it demands the car's own name.
 *
 * **Archive is the reversible one, and it is never conflated with delete** (inv.30).
 * Archive shelves: the car keeps every record, leaves the tallies and the all-cars
 * feed, and one tap brings it back. Delete purges. They are a column and a
 * tombstone respectively, they live in different places in the UI (archive in the
 * car form's foot beside Remove, restore on the Garage's archived row), and the
 * archive write flow is what let `archived_at` join the sync rules at all — a
 * column clients could see but the server rejected would have been a dead-letter
 * trap (Build Session 8).
 */

import type { KoiDb, KoiTx } from './db';

export interface CarRow {
  readonly id: string;
  readonly household_id: string | null;
  readonly make: string;
  readonly model: string;
  readonly nickname: string | null;
  readonly plate: string | null;
  readonly fuel_type: string;
  readonly year: number | null;
  readonly tank_capacity_l: number | null;
  readonly initial_odometer_km: number | null;
  /** An instant, or null for a live car. Never a delete (inv.30). */
  readonly archived_at: string | null;
  readonly record_version: number | null;
}

export interface NewCar {
  readonly id: string;
  readonly make: string;
  readonly model: string;
  readonly fuelType: string;
  readonly nickname?: string | null;
  readonly plate?: string | null;
  readonly year?: number | null;
  readonly tankCapacityL?: number | null;
  readonly initialOdometerKm?: number | null;
}

/**
 * The full identity, used where a car is named among other records — the review
 * queue's subject lines and the toasts. Unchanged from Session 4: proven strings.
 */
export const carLabel = (car: Pick<CarRow, 'make' | 'model' | 'nickname'>): string =>
  car.nickname ?? `${car.make} ${car.model}`;

/**
 * The familiar short name, used as a card title, a page title and — deliberately —
 * as the phrase a delete confirmation demands. The design repeats the make in the
 * meta line beneath (`Golf GTI` over `VW Golf GTI · 2019 · 1234-ABC`): the title is
 * what the owner calls the car, the meta is what the registration says.
 */
export const carTitle = (car: Pick<CarRow, 'model' | 'nickname'>): string =>
  car.nickname ?? car.model;

/**
 * The Garage's order: **most-recently-active first, archived always last**
 * (§16 #12, answered). An alphabetical garage buries the car you actually drive.
 * "Active" is the newest reading on the car; a car with no readings yet sorts after
 * the ones that have them, then alphabetically — it has no activity to rank by, and
 * inventing one would be inventing data.
 *
 * `NULLS LAST` is avoided deliberately: the ordering has to mean the same thing
 * under op-sqlite on device and better-sqlite3 in the integration tier, so the
 * null-ness is ranked explicitly instead of relying on a dialect extension.
 */
export const CARS_ORDERED_SQL = `
  SELECT c.*,
         (SELECT MAX(r.recorded_date) FROM odometer_readings r WHERE r.car_id = c.id) AS last_activity
  FROM cars c
  ORDER BY (c.archived_at IS NOT NULL) ASC,
           (last_activity IS NULL) ASC,
           last_activity DESC,
           c.make ASC, c.model ASC
`;

export interface CarListRow extends CarRow {
  readonly last_activity: string | null;
}

export async function listCars(db: KoiDb): Promise<CarListRow[]> {
  return db.getAll<CarListRow>(CARS_ORDERED_SQL);
}

/**
 * Archive: shelved, not deleted. An ordinary PATCH on an ordinary column, so two
 * devices disagreeing about it is a column conflict like any other and the loser is
 * flagged rather than silently overwritten.
 *
 * `at` is passed in — the clock lives at the edge (`src/clock.ts`), never in a
 * write function, which is what keeps this callable from the integration tier with
 * a fixed instant.
 */
export async function archiveCar(db: KoiDb, id: string, at: string): Promise<void> {
  await db.execute(`UPDATE cars SET archived_at = ? WHERE id = ?`, [at, id]);
}

/** Restore: one tap, and every record comes back with it. */
export async function restoreCar(db: KoiDb, id: string): Promise<void> {
  await db.execute(`UPDATE cars SET archived_at = NULL WHERE id = ?`, [id]);
}

export async function insertCar(db: KoiDb, car: NewCar): Promise<void> {
  // household_id omitted: the server assigns the household (S-14).
  await db.execute(
    `INSERT INTO cars (id, make, model, fuel_type, nickname, plate, year, tank_capacity_l, initial_odometer_km)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      car.id,
      car.make,
      car.model,
      car.fuelType,
      car.nickname ?? null,
      car.plate ?? null,
      car.year ?? null,
      car.tankCapacityL ?? null,
      car.initialOdometerKm ?? null,
    ],
  );
}

export async function updateCar(
  db: KoiDb,
  id: string,
  changes: Partial<Record<'make' | 'model' | 'nickname' | 'plate' | 'fuel_type', string | null>> &
    Partial<Record<'year' | 'tank_capacity_l' | 'initial_odometer_km', number | null>>,
): Promise<void> {
  const columns = Object.keys(changes);
  if (columns.length === 0) return;
  const sets = columns.map((c) => `${c} = ?`).join(', ');
  await db.execute(`UPDATE cars SET ${sets} WHERE id = ?`, [...Object.values(changes), id]);
}

/**
 * The pinned delete contract: children first (each as its own DELETE op), then
 * the car, in a single client transaction. Returns how many children this device
 * knew about — the server cascade covers any it did not.
 */
export async function deleteCarWithReadings(db: KoiDb, carId: string): Promise<number> {
  return db.writeTransaction(async (tx: KoiTx) => {
    const children = await tx.getAll<{ id: string }>(
      `SELECT id FROM odometer_readings WHERE car_id = ? ORDER BY id`,
      [carId],
    );
    for (const child of children) {
      await tx.execute(`DELETE FROM odometer_readings WHERE id = ?`, [child.id]);
    }
    await tx.execute(`DELETE FROM cars WHERE id = ?`, [carId]);
    return children.length;
  });
}
