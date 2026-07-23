/**
 * S-6 atomic cascade (D-041): deleting a car tombstones its readings in the SAME
 * transaction — one replication transaction → one checkpoint → peers observe the
 * car and its children deleted together, never a deleted car with live children.
 * This exercises the SERVER-side backstop: the client deletes only the car, and
 * the server cascade-tombstones every live child (deleted_via='cascade'),
 * attributed to the deleter.
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

it('deleting a car cascade-tombstones its readings atomically (server backstop)', async () => {
  const A = makeClient('a7');
  const B = makeClient('b7');
  try {
    await A.init();
    await B.init();
    await A.connect(new TestConnector('device-A'));
    await B.connect(new TestConnector('device-B'));
    await A.waitForFirstSync();
    await B.waitForFirstSync();

    // Two readings on the fixture car; both clients see them live.
    await A.writeTransaction(async (tx) => {
      await tx.execute(
        `INSERT INTO odometer_readings (id, car_id, reading_km, recorded_date, source, device_id)
         VALUES (?, ?, ?, ?, 'manual', 'device-A')`,
        ['odo-a', CAR_ID, 70000, '2026-07-19'],
      );
      await tx.execute(
        `INSERT INTO odometer_readings (id, car_id, reading_km, recorded_date, source, device_id)
         VALUES (?, ?, ?, ?, 'manual', 'device-A')`,
        ['odo-b', CAR_ID, 71000, '2026-07-21'],
      );
    });
    for (const c of [A, B]) {
      await waitFor(async () => {
        const r = await c.getAll(
          `SELECT id FROM odometer_readings WHERE car_id = ? AND deleted_at IS NULL`,
          [CAR_ID],
        );
        return r.length === 2 ? true : null;
      }, 'two readings live on both clients');
    }

    // Client deletes ONLY the car — the server cascade must catch the children.
    await A.execute(`DELETE FROM cars WHERE id = ?`, [CAR_ID]);
    await waitForQueueDrained(A, 'A');

    // Server: car + both children tombstoned; children carry deleted_via='cascade'
    // and the same deleted_at as the car (one transaction, one now()).
    const rows = await waitFor(async () => {
      const car = await db.query(`SELECT deleted_at FROM cars WHERE id = $1`, [CAR_ID]);
      const kids = await db.query(
        `SELECT id, deleted_at, deleted_via, deleted_by_device FROM odometer_readings WHERE car_id = $1 ORDER BY id`,
        [CAR_ID],
      );
      const carDel = car.rows[0]?.deleted_at;
      if (carDel == null) return null;
      if (kids.rows.some((k) => k.deleted_at == null)) return null;
      return { carDel, kids: kids.rows };
    }, 'car + children tombstoned on server');
    expect(rows.kids).toHaveLength(2);
    for (const k of rows.kids) {
      expect(k.deleted_via).toBe('cascade');
      expect(k.deleted_by_device).toBe('device-A');
      // Atomic: children share the car's tombstone instant (single transaction).
      expect(new Date(k.deleted_at).getTime()).toBe(new Date(rows.carDel).getTime());
    }

    // Both clients: car + both readings hidden (tombstones propagated).
    await waitForQueueDrained(A, 'A');
    await waitForQueueDrained(B, 'B');
    for (const c of [A, B]) {
      await waitFor(async () => {
        const car = await c.getAll(`SELECT id FROM cars WHERE id = ? AND deleted_at IS NULL`, [CAR_ID]);
        const kids = await c.getAll(
          `SELECT id FROM odometer_readings WHERE car_id = ? AND deleted_at IS NULL`,
          [CAR_ID],
        );
        return car.length === 0 && kids.length === 0 ? true : null;
      }, 'car + children hidden on client');
    }
    const dl = await db.query(`SELECT count(*)::int AS n FROM dead_letters`);
    expect(dl.rows[0].n).toBe(0);
  } finally {
    await closeAll([A, B]);
  }
});
