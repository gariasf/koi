/**
 * S-6 late child of a tombstoned parent (D-042): a reading created offline for a
 * car another device deleted meanwhile. It must be PRESERVED (never dropped),
 * inserted tombstone-born (never re-appearing under a dead car), flagged
 * (late-child), and it must NOT resurrect the parent.
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

it('a reading for a deleted car is kept tombstone-born + flagged, parent stays deleted', async () => {
  const A = makeClient('a8');
  const B = makeClient('b8');
  try {
    await A.init();
    await B.init();
    await A.connect(new TestConnector('device-A'));
    await B.connect(new TestConnector('device-B'));
    await A.waitForFirstSync();
    await B.waitForFirstSync();
    await waitFor(async () => {
      for (const c of [A, B]) {
        const car = await c.getAll<{ record_version: number }>(
          `SELECT record_version FROM cars WHERE id = ?`,
          [CAR_ID],
        );
        if (car[0]?.record_version !== 1) return null;
      }
      return true;
    }, 'fixture car at v1 on both clients');
    await A.disconnect();
    await B.disconnect();

    // A deletes the car; B (offline, unaware) adds a reading to it.
    await A.execute(`DELETE FROM cars WHERE id = ?`, [CAR_ID]);
    await B.execute(
      `INSERT INTO odometer_readings (id, car_id, reading_km, recorded_date, source, device_id)
       VALUES (?, ?, ?, ?, 'manual', 'device-B')`,
      ['odo-late', CAR_ID, 80000, '2026-07-22'],
    );

    // A's car delete lands first.
    await A.connect(new TestConnector('device-A'));
    await waitFor(async () => {
      const r = await db.query(`SELECT deleted_at FROM cars WHERE id = $1`, [CAR_ID]);
      return r.rows[0]?.deleted_at !== null;
    }, 'car tombstoned on server');
    // B's late child lands second.
    await B.connect(new TestConnector('device-B'));

    // Preserved, tombstone-born, attribution inherited from the car's deleter.
    const child = await waitFor(async () => {
      const r = await db.query(
        `SELECT reading_km, deleted_at, deleted_via, deleted_by_device FROM odometer_readings WHERE id = 'odo-late'`,
      );
      return r.rowCount === 1 ? r.rows[0] : null;
    }, 'late child inserted on server');
    expect(child.reading_km).toBe(80000); // not dropped
    expect(child.deleted_at).not.toBeNull(); // tombstone-born
    expect(child.deleted_via).toBe('cascade');
    expect(child.deleted_by_device).toBe('device-A'); // the car's deleter

    // A late-child flag exists; the car was NOT resurrected.
    const flag = await db.query(`SELECT record_id FROM flags WHERE kind = 'late-child'`);
    expect(flag.rowCount).toBe(1);
    expect(flag.rows[0].record_id).toBe('odo-late');
    const car = await db.query(`SELECT deleted_at FROM cars WHERE id = $1`, [CAR_ID]);
    expect(car.rows[0].deleted_at).not.toBeNull(); // parent still deleted

    // The late child is tombstone-born → never enters the live bucket → it
    // reaches no client as data (B's optimistic local copy is removed once the
    // server rejects it into a tombstone). Only the flag propagates.
    await waitForQueueDrained(A, 'A');
    await waitForQueueDrained(B, 'B');
    for (const c of [A, B]) {
      await waitFor(async () => {
        const rows = await c.getAll(`SELECT id FROM odometer_readings WHERE id = 'odo-late'`);
        const flags = await c.getAll(`SELECT id FROM flags WHERE kind = 'late-child'`);
        return rows.length === 0 && flags.length === 1 ? true : null;
      }, 'client sees no late-child row + one late-child flag');
    }
    const dl = await db.query(`SELECT count(*)::int AS n FROM dead_letters`);
    expect(dl.rows[0].n).toBe(0);
  } finally {
    await closeAll([A, B]);
  }
});
