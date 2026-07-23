/**
 * S-6 (D-039): a delete is a tombstone that syncs down. One device deletes a
 * reading; the tombstone (deleted_at set) reaches BOTH clients, so the row is
 * hidden everywhere (`deleted_at IS NULL` filter), the canonical row survives
 * (no physical removal), attribution is recorded server-side, and nothing
 * dead-letters or flags — a clean delete is not a review event.
 */

import { afterAll, beforeAll, expect, it } from 'vitest';

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
  await resetData(db);
});

afterAll(async () => {
  await db.end();
});

it('a delete tombstones + propagates to every device; the row is hidden, not removed', async () => {
  const A = makeClient('a5t');
  const B = makeClient('b5t');
  try {
    await A.init();
    await B.init();
    await A.connect(new TestConnector('device-A'));
    await B.connect(new TestConnector('device-B'));
    await A.waitForFirstSync();
    await B.waitForFirstSync();

    // A creates a reading; both clients see it live.
    await A.execute(
      `INSERT INTO odometer_readings (id, car_id, reading_km, recorded_date, source, device_id)
       VALUES (?, ?, ?, ?, 'manual', 'device-A')`,
      ['odo-1', CAR_ID, 51000, '2026-07-21'],
    );
    for (const c of [A, B]) {
      await waitFor(async () => {
        const r = await c.getAll(`SELECT id FROM odometer_readings WHERE id = 'odo-1'`);
        return r.length === 1 ? true : null;
      }, 'odo-1 live on both clients');
    }

    // A deletes it.
    await A.execute(`DELETE FROM odometer_readings WHERE id = 'odo-1'`);
    await waitForQueueDrained(A, 'A');

    // Server: tombstoned (not removed), attributed, deleted_via='direct'.
    const server = await waitFor(async () => {
      const r = await db.query(
        `SELECT deleted_at, deleted_by_device, deleted_via, record_version FROM odometer_readings WHERE id = 'odo-1'`,
      );
      return r.rows[0]?.deleted_at !== null ? r.rows[0] : null;
    }, 'server tombstone written');
    expect(server.deleted_by_device).toBe('device-A');
    expect(server.deleted_via).toBe('direct');
    expect(Number(server.record_version)).toBe(2); // create v1 → tombstone v2

    // Both clients: tombstone synced down (row present with deleted_at set), so
    // the live-filtered view hides it while the row itself is preserved.
    for (const c of [A, B]) {
      await waitFor(async () => {
        const rows = await c.getAll<{ deleted_at: string | null }>(
          `SELECT deleted_at FROM odometer_readings WHERE id = 'odo-1'`,
        );
        return rows[0]?.deleted_at != null ? true : null;
      }, 'tombstone propagated to client');
      const live = await c.getAll(
        `SELECT id FROM odometer_readings WHERE id = 'odo-1' AND deleted_at IS NULL`,
      );
      expect(live).toHaveLength(0);
    }

    // Clean delete: no flags, no dead letters.
    await waitForQueueDrained(A, 'A');
    await waitForQueueDrained(B, 'B');
    const flags = await db.query(`SELECT count(*)::int AS n FROM flags`);
    expect(flags.rows[0].n).toBe(0);
    const dl = await db.query(`SELECT count(*)::int AS n FROM dead_letters`);
    expect(dl.rows[0].n).toBe(0);
  } finally {
    await closeAll([A, B]);
  }
});
