/**
 * S-6 edit-vs-delete concurrency (D-043) — the classic silent-absorb hole: an
 * offline edit races an offline delete of the same reading. The delete wins
 * visibility in BOTH arrival orders, and the edit is never silently absorbed —
 * it is preserved in the tombstoned row and surfaced by a flag:
 *
 *   Order B (edit lands first, delete second) → delete-conflict: the deleter
 *     acted on stale data; the concurrent column is named + its value preserved.
 *   Order A (delete lands first, edit second) → edit-after-delete: the edit
 *     applies into the tombstoned row (kept, reviewable), never resurrecting it.
 */

import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';

import {
  CAR_ID,
  TestConnector,
  closeAll,
  makeClient,
  pgConnect,
  resetData,
  waitFor,
  waitForQueueDrained,
} from './helpers.js';

import type { PowerSyncDatabase } from '@powersync/node';
import type pg from 'pg';

let db: pg.Client;

beforeAll(async () => {
  db = await pgConnect();
});

beforeEach(async () => {
  await resetData(db);
});

afterAll(async () => {
  await db.end();
});

/** Seed a reading live on both clients at record_version 1, then take them offline. */
async function seedOfflineReading(A: PowerSyncDatabase, B: PowerSyncDatabase): Promise<void> {
  await A.init();
  await B.init();
  await A.connect(new TestConnector('device-A'));
  await B.connect(new TestConnector('device-B'));
  await A.waitForFirstSync();
  await B.waitForFirstSync();
  await A.execute(
    `INSERT INTO odometer_readings (id, car_id, reading_km, recorded_date, source, device_id)
     VALUES (?, ?, ?, ?, 'manual', 'device-A')`,
    ['odo-1', CAR_ID, 60000, '2026-07-21'],
  );
  for (const c of [A, B]) {
    await waitFor(async () => {
      const r = await c.getAll<{ record_version: number }>(
        `SELECT record_version FROM odometer_readings WHERE id = 'odo-1'`,
      );
      return r[0]?.record_version === 1 ? true : null;
    }, 'odo-1 at v1 on both clients');
  }
  await A.disconnect();
  await B.disconnect();
}

it('Order B (edit first, delete second): delete-conflict preserves the concurrent edit', async () => {
  const A = makeClient('a6b');
  const B = makeClient('b6b');
  try {
    await seedOfflineReading(A, B);

    // Concurrent offline ops.
    await B.execute(`UPDATE odometer_readings SET reading_km = ? WHERE id = ?`, [62000, 'odo-1']);
    await A.execute(`DELETE FROM odometer_readings WHERE id = ?`, ['odo-1']);

    // B's edit lands first.
    await B.connect(new TestConnector('device-B'));
    await waitFor(async () => {
      const r = await db.query(`SELECT reading_km FROM odometer_readings WHERE id = 'odo-1'`);
      return r.rows[0]?.reading_km === 62000;
    }, "B's edit on server");
    // A's stale delete lands second.
    await A.connect(new TestConnector('device-A'));

    const flag = await waitFor(async () => {
      const r = await db.query(
        `SELECT column_name, displaced_value, kind FROM flags WHERE kind = 'delete-conflict'`,
      );
      return r.rowCount === 1 ? r.rows[0] : null;
    }, 'delete-conflict flag written');
    expect(flag.column_name).toContain('reading_km');
    // The concurrent edit survives in the tombstoned row and on the flag
    // (jsonb values are wrapped so scalars survive every driver path).
    expect(flag.displaced_value).toEqual({ value: { reading_km: 62000 } });

    const server = await db.query(
      `SELECT deleted_at, reading_km FROM odometer_readings WHERE id = 'odo-1'`,
    );
    expect(server.rows[0].deleted_at).not.toBeNull(); // delete wins visibility
    expect(server.rows[0].reading_km).toBe(62000); // edit preserved, not lost

    // Both clients converge: row removed, one flag each, nothing dead-lettered.
    await waitForQueueDrained(A, 'A');
    await waitForQueueDrained(B, 'B');
    for (const c of [A, B]) {
      await waitFor(async () => {
        const rows = await c.getAll(`SELECT id FROM odometer_readings WHERE id = 'odo-1'`);
        const flags = await c.getAll(`SELECT id FROM flags WHERE kind = 'delete-conflict'`);
        return rows.length === 0 && flags.length === 1 ? true : null;
      }, 'client converged: row removed + one delete-conflict flag');
    }
    const dl = await db.query(`SELECT count(*)::int AS n FROM dead_letters`);
    expect(dl.rows[0].n).toBe(0);
  } finally {
    await closeAll([A, B]);
  }
});

it('Order A (delete first, edit second): edit-after-delete keeps + surfaces the edit', async () => {
  const A = makeClient('a6a');
  const B = makeClient('b6a');
  try {
    await seedOfflineReading(A, B);

    await A.execute(`DELETE FROM odometer_readings WHERE id = ?`, ['odo-1']);
    await B.execute(`UPDATE odometer_readings SET reading_km = ? WHERE id = ?`, [63000, 'odo-1']);

    // A's delete lands first (clean tombstone).
    await A.connect(new TestConnector('device-A'));
    await waitFor(async () => {
      const r = await db.query(`SELECT deleted_at FROM odometer_readings WHERE id = 'odo-1'`);
      return r.rows[0]?.deleted_at !== null;
    }, "A's delete on server");
    // B's stale edit lands second, onto the tombstone.
    await B.connect(new TestConnector('device-B'));

    const flag = await waitFor(async () => {
      const r = await db.query(
        `SELECT incoming_value, kind FROM flags WHERE kind = 'edit-after-delete'`,
      );
      return r.rowCount === 1 ? r.rows[0] : null;
    }, 'edit-after-delete flag written');
    expect(flag.incoming_value).toEqual({ value: { reading_km: 63000 } });

    const server = await db.query(
      `SELECT deleted_at, reading_km FROM odometer_readings WHERE id = 'odo-1'`,
    );
    expect(server.rows[0].deleted_at).not.toBeNull(); // still deleted (not resurrected)
    expect(server.rows[0].reading_km).toBe(63000); // edit preserved

    await waitForQueueDrained(A, 'A');
    await waitForQueueDrained(B, 'B');
    for (const c of [A, B]) {
      await waitFor(async () => {
        const rows = await c.getAll(`SELECT id FROM odometer_readings WHERE id = 'odo-1'`);
        const flags = await c.getAll(`SELECT id FROM flags WHERE kind = 'edit-after-delete'`);
        return rows.length === 0 && flags.length === 1 ? true : null;
      }, 'client converged: row removed + one edit-after-delete flag');
    }
    // No domain (monotonicity) flag on the tombstoned reading (inv.11).
    const dv = await db.query(`SELECT count(*)::int AS n FROM flags WHERE kind LIKE 'odometer%'`);
    expect(dv.rows[0].n).toBe(0);
    const dl = await db.query(`SELECT count(*)::int AS n FROM dead_letters`);
    expect(dl.rows[0].n).toBe(0);
  } finally {
    await closeAll([A, B]);
  }
});
