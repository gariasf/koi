/**
 * Spike ②'s pre-registered scenario, graduated into the permanent tier
 * (D-013/H5): two clients offline, each appends a conflicting odometer
 * reading for the same car+date. Expected: both readings kept (no silent
 * loss), ONE violation flag committed atomically with the data, both
 * clients converge to identical state, neither upload queue wedges.
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

it('same-date append conflict: both kept + one atomic flag + convergence', async () => {
  const A = makeClient('a1');
  const B = makeClient('b1');
  try {
    await A.init();
    await B.init();

    // Offline writes — clients are not connected yet.
    await A.execute(
      `INSERT INTO odometer_readings (id, car_id, reading_km, recorded_date, source, device_id)
       VALUES (?, ?, ?, ?, 'manual', 'device-A')`,
      ['odo-A', CAR_ID, 42000, '2026-07-20'],
    );
    await B.execute(
      `INSERT INTO odometer_readings (id, car_id, reading_km, recorded_date, source, device_id)
       VALUES (?, ?, ?, ?, 'manual', 'device-B')`,
      ['odo-B', CAR_ID, 42500, '2026-07-20'],
    );

    // Deterministic arrival order: A lands first, then B (the conflict).
    await A.connect(new TestConnector('device-A'));
    await waitFor(async () => {
      const r = await db.query(`SELECT 1 FROM odometer_readings WHERE id = 'odo-A'`);
      return r.rowCount === 1;
    }, 'odo-A on server');
    await B.connect(new TestConnector('device-B'));

    // Convergence: both clients see BOTH readings and the same single flag.
    const snapshots = await waitFor(async () => {
      const out = [];
      for (const c of [A, B]) {
        const readings = await c.getAll<{ id: string; reading_km: number }>(
          'SELECT id, reading_km FROM odometer_readings ORDER BY id',
        );
        const flagRows = await c.getAll<{ kind: string; message: string; record_id: string }>(
          'SELECT kind, message, record_id FROM flags ORDER BY id',
        );
        out.push({ readings, flags: flagRows });
      }
      const [a, b] = out;
      const converged =
        a !== undefined &&
        b !== undefined &&
        a.readings.length === 2 &&
        b.readings.length === 2 &&
        a.flags.length === 1 &&
        b.flags.length === 1;
      return converged ? { a, b } : null;
    }, 'both clients converged to 2 readings + 1 flag');

    const { a, b } = snapshots;
    expect(a).toEqual(b); // byte-identical convergence
    expect(a.readings.map((r) => r.reading_km)).toEqual([42000, 42500]); // no silent loss
    expect(a.flags[0]?.kind).toBe('odometer-same-date-conflict');
    expect(a.flags[0]?.message).toContain('42000');
    expect(a.flags[0]?.message).toContain('42500');
    expect(a.flags[0]?.record_id).toBe('odo-B'); // the later arrival is the attributed one

    // Queue-wedge check (② k2): both queues fully drained.
    await waitForQueueDrained(A, 'A');
    await waitForQueueDrained(B, 'B');

    // Nothing dead-lettered — these were handled ops.
    const dl = await db.query('SELECT count(*)::int AS n FROM dead_letters');
    expect(dl.rows[0].n).toBe(0);
  } finally {
    await closeAll([A, B]);
  }
});
