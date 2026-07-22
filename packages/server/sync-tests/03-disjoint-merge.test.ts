/**
 * The ⑤ complement — the distinction row-level versioning could not make
 * (D-023: "as drafted it can't distinguish same-column overwrites from
 * disjoint-field merges"): two clients offline edit DIFFERENT columns of
 * the same car row. Expected: both edits merge, NO flag.
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

it('disjoint-column concurrent edits merge silently — no flag', async () => {
  const A = makeClient('a3');
  const B = makeClient('b3');
  try {
    await A.init();
    await B.init();
    await A.connect(new TestConnector('device-A'));
    await B.connect(new TestConnector('device-B'));
    await A.waitForFirstSync();
    await B.waitForFirstSync();
    // The reset's replication may still be in flight — wait for the clean
    // fixture (v1), not whatever checkpoint happened to arrive first.
    await waitFor(async () => {
      for (const c of [A, B]) {
        const car = await c.getAll<{ record_version: number }>(
          'SELECT record_version FROM cars WHERE id = ?',
          [CAR_ID],
        );
        if (car[0]?.record_version !== 1) return null;
      }
      return true;
    }, 'fixture car at v1 on both clients');
    await A.disconnect();
    await B.disconnect();

    await A.execute('UPDATE cars SET nickname = ? WHERE id = ?', ['Weekend car', CAR_ID]);
    await B.execute('UPDATE cars SET plate = ? WHERE id = ?', ['B-1234-XY', CAR_ID]);

    await A.connect(new TestConnector('device-A'));
    await waitFor(async () => {
      const r = await db.query(`SELECT nickname FROM cars WHERE id = $1`, [CAR_ID]);
      return r.rows[0]?.nickname === 'Weekend car';
    }, "A's edit on server");
    await B.connect(new TestConnector('device-B'));

    const snapshots = await waitFor(async () => {
      const out = [];
      for (const c of [A, B]) {
        const cars = await c.getAll<{ nickname: string; plate: string; record_version: number }>(
          'SELECT nickname, plate, record_version FROM cars WHERE id = ?',
          [CAR_ID],
        );
        out.push(cars[0]);
      }
      const [a, b] = out;
      const converged =
        a !== undefined &&
        b !== undefined &&
        a.nickname === 'Weekend car' &&
        a.plate === 'B-1234-XY' &&
        b.nickname === 'Weekend car' &&
        b.plate === 'B-1234-XY';
      return converged ? { a, b } : null;
    }, 'both clients see the merged row');

    expect(snapshots.a).toEqual(snapshots.b);
    expect(snapshots.a?.record_version).toBe(3); // two accepted writes

    // The whole point: a disjoint merge raises NO flag anywhere.
    const flags = await db.query('SELECT count(*)::int AS n FROM flags');
    expect(flags.rows[0].n).toBe(0);
    for (const c of [A, B]) {
      const clientFlags = await c.getAll('SELECT id FROM flags');
      expect(clientFlags).toHaveLength(0);
    }

    await waitForQueueDrained(A, 'A');
    await waitForQueueDrained(B, 'B');
    const dl = await db.query('SELECT count(*)::int AS n FROM dead_letters');
    expect(dl.rows[0].n).toBe(0);
  } finally {
    await closeAll([A, B]);
  }
});
