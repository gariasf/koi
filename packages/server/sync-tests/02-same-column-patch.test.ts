/**
 * ⑤ — THE run-first blocker (S-5, D-023): two clients offline, both edit
 * the SAME column of the SAME car row. Spike ② left exactly this hole
 * (no cars-PATCH handler → unhandled-op silent drop). Expected: both
 * uploads accepted with 2xx, deterministic convergence (later arrival's
 * value), the displaced value preserved in a column-conflict flag written
 * atomically with the data — never silent LWW, never a wedged queue.
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

it('same-row same-column conflict: loser attributed in a flag, never silent LWW', async () => {
  const A = makeClient('a2');
  const B = makeClient('b2');
  try {
    await A.init();
    await B.init();

    // Both sync the fixture car down first (record_version 1 = the base
    // both will echo back), then go offline. Poll rather than trusting the
    // first checkpoint: replication of the reset may still be in flight.
    await A.connect(new TestConnector('device-A'));
    await B.connect(new TestConnector('device-B'));
    await A.waitForFirstSync();
    await B.waitForFirstSync();
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

    // The same-column conflict.
    await A.execute('UPDATE cars SET nickname = ? WHERE id = ?', ['Red Rocket', CAR_ID]);
    await B.execute('UPDATE cars SET nickname = ? WHERE id = ?', ['Blue Beast', CAR_ID]);

    // Deterministic order: A lands first, B second (B displaces A's value).
    await A.connect(new TestConnector('device-A'));
    await waitFor(async () => {
      const r = await db.query(`SELECT nickname FROM cars WHERE id = $1`, [CAR_ID]);
      return r.rows[0]?.nickname === 'Red Rocket';
    }, "A's edit on server");
    await B.connect(new TestConnector('device-B'));

    // Convergence: same nickname + same single flag on both clients.
    const snapshots = await waitFor(async () => {
      const out = [];
      for (const c of [A, B]) {
        const cars = await c.getAll<{ nickname: string; record_version: number }>(
          'SELECT nickname, record_version FROM cars WHERE id = ?',
          [CAR_ID],
        );
        const flagRows = await c.getAll<{
          kind: string;
          column_name: string;
          displaced_value: string;
          incoming_value: string;
          record_id: string;
        }>('SELECT kind, column_name, displaced_value, incoming_value, record_id FROM flags ORDER BY id');
        out.push({ car: cars[0], flags: flagRows });
      }
      const [a, b] = out;
      const converged =
        a?.car !== undefined &&
        b?.car !== undefined &&
        a.car.record_version === 3 &&
        b.car.record_version === 3 &&
        a.flags.length === 1 &&
        b.flags.length === 1;
      return converged ? { a, b } : null;
    }, 'both clients converged to v3 + 1 flag');

    const { a, b } = snapshots;
    expect(a).toEqual(b);
    // Later arrival wins the column value; nothing silent about it:
    expect(a.car?.nickname).toBe('Blue Beast');
    const flag = a.flags[0];
    expect(flag?.kind).toBe('column-conflict');
    expect(flag?.column_name).toBe('nickname');
    expect(flag?.record_id).toBe(CAR_ID);
    // The displaced value is preserved, attributed, reviewable:
    expect(JSON.parse(flag?.displaced_value ?? '{}')).toEqual({ value: 'Red Rocket' });
    expect(JSON.parse(flag?.incoming_value ?? '{}')).toEqual({ value: 'Blue Beast' });

    // Server-side attribution ledger: nickname now v3, written by device-B.
    const server = await db.query(
      `SELECT record_version, column_versions->'nickname' AS nick FROM cars WHERE id = $1`,
      [CAR_ID],
    );
    expect(server.rows[0].record_version).toBe('3');
    expect(server.rows[0].nick).toEqual({ v: 3, by: 'device-B' });

    await waitForQueueDrained(A, 'A');
    await waitForQueueDrained(B, 'B');
    const dl = await db.query('SELECT count(*)::int AS n FROM dead_letters');
    expect(dl.rows[0].n).toBe(0);
  } finally {
    await closeAll([A, B]);
  }
});
