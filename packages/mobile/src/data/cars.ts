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
 * is typed instead. Archive — the reversible one — is a separate flow entirely
 * and is not built yet (`archived_at` is still out of the sync rules).
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

export const carLabel = (car: Pick<CarRow, 'make' | 'model' | 'nickname'>): string =>
  car.nickname ?? `${car.make} ${car.model}`;

export async function listCars(db: KoiDb): Promise<CarRow[]> {
  return db.getAll<CarRow>(`SELECT * FROM cars ORDER BY make, model`);
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
