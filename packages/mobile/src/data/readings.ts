/**
 * Odometer-reading writes — and the client half of the S-6 delete contract.
 *
 * The server pinned this contract in Session 3 and its conflict analysis depends
 * on the client keeping it (D-039..D-046):
 *
 *  - **A delete is a SQL DELETE.** It becomes a PowerSync DELETE op, which the
 *    server turns into a tombstone. The client never writes `deleted_at` — it
 *    has no such column (bucket-filter, D-046), and a client-authored tombstone
 *    would bypass `planDelete` entirely.
 *  - **An undo is a re-INSERT of the captured row** (inv.31 / D-040), never an
 *    `UPDATE deleted_at`. The row is already gone from this device when the toast
 *    is showing, so the closure — not the database — holds the data. Because the
 *    re-INSERT comes from the deleting device and carries the same id, the server
 *    resurrects it flag-free.
 *  - `record_version` rides along in that re-INSERT on purpose: it is a server
 *    column the client mirrors, accepted-and-ignored on upload. Dropping it would
 *    be harmless; sending it proves the trap stays closed.
 */

import type { KoiDb, KoiTx } from './db';

export interface ReadingRow {
  readonly id: string;
  readonly household_id: string | null;
  readonly car_id: string;
  readonly reading_km: number;
  readonly recorded_date: string;
  readonly source: string | null;
  readonly device_id: string | null;
  readonly record_version: number | null;
}

export interface NewReading {
  readonly id: string;
  readonly carId: string;
  readonly readingKm: number;
  /** Civil `YYYY-MM-DD` (@koi/domain discipline) — never a timestamp. */
  readonly recordedDate: string;
  readonly source?: string;
  readonly deviceId: string;
}

export async function listReadings(db: KoiDb, carId: string): Promise<ReadingRow[]> {
  return db.getAll<ReadingRow>(
    `SELECT * FROM odometer_readings WHERE car_id = ? ORDER BY recorded_date DESC, reading_km DESC`,
    [carId],
  );
}

export async function insertReading(db: KoiDb, reading: NewReading): Promise<void> {
  // household_id is left to the server: it inherits the parent car's household
  // (S-14), and a client guess would only be a value to reconcile later.
  await db.execute(
    `INSERT INTO odometer_readings (id, car_id, reading_km, recorded_date, source, device_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      reading.id,
      reading.carId,
      reading.readingKm,
      reading.recordedDate,
      reading.source ?? 'manual',
      reading.deviceId,
    ],
  );
}

/** An edit: a PATCH whose `old` echo carries the base_version (D-037). */
export async function updateReading(
  db: KoiDb,
  id: string,
  changes: { readingKm?: number; recordedDate?: string; source?: string | null },
): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [];
  if (changes.readingKm !== undefined) {
    sets.push('reading_km = ?');
    params.push(changes.readingKm);
  }
  if (changes.recordedDate !== undefined) {
    sets.push('recorded_date = ?');
    params.push(changes.recordedDate);
  }
  if (changes.source !== undefined) {
    sets.push('source = ?');
    params.push(changes.source);
  }
  if (sets.length === 0) return;
  params.push(id);
  await db.execute(`UPDATE odometer_readings SET ${sets.join(', ')} WHERE id = ?`, params);
}

/**
 * Deletes a reading and returns the row the undo toast must hold. Returns null
 * when the row is already gone (a peer deleted it first) — there is nothing to
 * offer an undo for, and no op is emitted.
 */
export async function deleteReading(db: KoiDb, id: string): Promise<ReadingRow | null> {
  return db.writeTransaction(async (tx: KoiTx) => {
    const rows = await tx.getAll<ReadingRow>(`SELECT * FROM odometer_readings WHERE id = ?`, [id]);
    const row = rows[0] ?? null;
    if (row === null) return null;
    await tx.execute(`DELETE FROM odometer_readings WHERE id = ?`, [id]);
    return row;
  });
}

/**
 * The undo (inv.31): re-INSERT the captured row, same id. `INSERT OR REPLACE`
 * because a checkpoint could in principle have put the row back already (a peer
 * restored it) — the intent is "this row exists again", expressed as one PUT.
 */
export async function undoDeleteReading(db: KoiDb, row: ReadingRow): Promise<void> {
  await db.execute(
    `INSERT OR REPLACE INTO odometer_readings
       (id, car_id, reading_km, recorded_date, source, device_id, record_version)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.car_id,
      row.reading_km,
      row.recorded_date,
      row.source,
      row.device_id,
      row.record_version,
    ],
  );
}
