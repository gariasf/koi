/**
 * S-6 undo-survives-sync (D-040, inv.31): the deleting device's undo re-INSERTs
 * the row (INSERT OR REPLACE of the captured row, carrying record_version — the
 * dead-letter trap that must NOT fire) → the server resurrects it flag-free and
 * the row comes back on EVERY device. A foreign device cannot silently resurrect
 * another device's delete: its re-create keeps the tombstone and is flagged.
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

it('same-device undo resurrects flag-free, on every device — record_version in opData never dead-letters', async () => {
  const A = makeClient('a9');
  const B = makeClient('b9');
  try {
    await A.init();
    await B.init();
    await A.connect(new TestConnector('device-A'));
    await B.connect(new TestConnector('device-B'));
    await A.waitForFirstSync();
    await B.waitForFirstSync();

    await A.execute(
      `INSERT INTO odometer_readings (id, car_id, reading_km, recorded_date, source, device_id)
       VALUES (?, ?, ?, ?, 'manual', 'device-A')`,
      ['odo-1', CAR_ID, 90000, '2026-07-21'],
    );
    // A captures the full row (as the undo toast closure would) before deleting.
    await waitFor(async () => {
      const r = await A.getAll(`SELECT id FROM odometer_readings WHERE id = 'odo-1'`);
      return r.length === 1 ? true : null;
    }, 'odo-1 present on A');

    await A.execute(`DELETE FROM odometer_readings WHERE id = 'odo-1'`);
    // Wait for the tombstone to round-trip so the undo hits INSERT OR REPLACE on
    // a locally-present tombstoned row (the F19/F23 path).
    await waitForQueueDrained(A, 'A');
    await waitFor(async () => {
      const r = await A.getAll<{ deleted_at: string | null }>(
        `SELECT deleted_at FROM odometer_readings WHERE id = 'odo-1'`,
      );
      return r[0]?.deleted_at != null ? true : null;
    }, 'tombstone synced back to A');

    // Undo: re-INSERT the captured row INCLUDING record_version (which the client
    // schema carries) and a null deleted_at. record_version must be accepted and
    // ignored, not dead-lettered.
    await A.execute(
      `INSERT OR REPLACE INTO odometer_readings
         (id, car_id, reading_km, recorded_date, source, device_id, record_version, deleted_at)
       VALUES (?, ?, ?, ?, 'manual', 'device-A', ?, NULL)`,
      ['odo-1', CAR_ID, 90000, '2026-07-21', 1],
    );
    await waitForQueueDrained(A, 'A');

    // Server: resurrected (deleted_at cleared), version bumped, NO flags, NO dead letters.
    const server = await waitFor(async () => {
      const r = await db.query(
        `SELECT deleted_at, record_version FROM odometer_readings WHERE id = 'odo-1'`,
      );
      return r.rows[0]?.deleted_at === null ? r.rows[0] : null;
    }, 'server resurrected the reading');
    expect(Number(server.record_version)).toBe(3); // create v1 → delete v2 → resurrect v3
    const flags = await db.query(`SELECT count(*)::int AS n FROM flags`);
    expect(flags.rows[0].n).toBe(0); // clean undo is not a review event
    const dl = await db.query(`SELECT count(*)::int AS n FROM dead_letters`);
    expect(dl.rows[0].n).toBe(0); // record_version in opData did NOT dead-letter

    // The row is live again on BOTH devices.
    for (const c of [A, B]) {
      await waitFor(async () => {
        const r = await c.getAll(
          `SELECT id FROM odometer_readings WHERE id = 'odo-1' AND deleted_at IS NULL`,
        );
        return r.length === 1 ? true : null;
      }, 'reading live again on client');
    }
  } finally {
    await closeAll([A, B]);
  }
});

it('a foreign device cannot silently resurrect another device delete — kept deleted + flagged', async () => {
  const A = makeClient('a9f');
  const B = makeClient('b9f');
  try {
    await A.init();
    await B.init();
    await A.connect(new TestConnector('device-A'));
    await B.connect(new TestConnector('device-B'));
    await A.waitForFirstSync();
    await B.waitForFirstSync();

    await A.execute(
      `INSERT INTO odometer_readings (id, car_id, reading_km, recorded_date, source, device_id)
       VALUES (?, ?, ?, ?, 'manual', 'device-A')`,
      ['odo-2', CAR_ID, 91000, '2026-07-21'],
    );
    for (const c of [A, B]) {
      await waitFor(async () => {
        const r = await c.getAll(`SELECT id FROM odometer_readings WHERE id = 'odo-2'`);
        return r.length === 1 ? true : null;
      }, 'odo-2 on both clients');
    }

    // A deletes it; the tombstone reaches B.
    await A.execute(`DELETE FROM odometer_readings WHERE id = 'odo-2'`);
    await waitForQueueDrained(A, 'A');
    await waitFor(async () => {
      const r = await B.getAll<{ deleted_at: string | null }>(
        `SELECT deleted_at FROM odometer_readings WHERE id = 'odo-2'`,
      );
      return r[0]?.deleted_at != null ? true : null;
    }, 'tombstone synced to B');

    // B re-creates it with a DIFFERENT reading (a stale create / import, not an
    // undo). It keeps the reading's original device_id (the closure's value), so
    // only reading_km differs.
    await B.execute(
      `INSERT OR REPLACE INTO odometer_readings
         (id, car_id, reading_km, recorded_date, source, device_id, deleted_at)
       VALUES (?, ?, ?, ?, 'manual', 'device-A', NULL)`,
      ['odo-2', CAR_ID, 99999, '2026-07-21'],
    );
    await waitForQueueDrained(B, 'B');

    // Stays deleted (A's delete wins), the attempt is flagged, nothing lost.
    // jsonb flag values are wrapped {value: ...}.
    const flag = await waitFor(async () => {
      const r = await db.query(
        `SELECT displaced_value, incoming_value FROM flags WHERE kind = 'write-on-tombstone' AND record_id = 'odo-2'`,
      );
      return r.rowCount === 1 ? r.rows[0] : null;
    }, 'write-on-tombstone flag written');
    expect(flag.incoming_value).toEqual({ value: { reading_km: 99999 } });
    expect(flag.displaced_value).toEqual({ value: { reading_km: 91000 } }); // the value B would have overwritten

    const server = await db.query(`SELECT deleted_at FROM odometer_readings WHERE id = 'odo-2'`);
    expect(server.rows[0].deleted_at).not.toBeNull(); // NOT resurrected

    // B, too, sees it stay hidden (server state wins).
    await waitFor(async () => {
      const r = await B.getAll(
        `SELECT id FROM odometer_readings WHERE id = 'odo-2' AND deleted_at IS NULL`,
      );
      return r.length === 0 ? true : null;
    }, 'odo-2 stays hidden on B');
    const dl = await db.query(`SELECT count(*)::int AS n FROM dead_letters`);
    expect(dl.rows[0].n).toBe(0);
  } finally {
    await closeAll([A, B]);
  }
});
