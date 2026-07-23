/**
 * Exhaustive op-handling (⛔, Spike ② finding, D-038): any op the write-path
 * does not explicitly handle-and-persist must be dead-lettered + flagged, never
 * skipped — a silent skip is silent data loss once the client clears its queue
 * on 2xx. S-6 added cars/readings DELETE handlers, but the registry is still
 * (table, op)-specific: an unknown TABLE dead-letters for PUT *and* DELETE alike
 * — DELETE is not blanket-handled. Either way the queue must drain: nothing
 * wedges. (DELETEs on the known tables now APPLY — see the 05..10 scenarios.)
 */

import { Table, column } from '@powersync/node';
import { afterAll, beforeAll, expect, it } from 'vitest';

import {
  CAR_ID,
  TestConnector,
  closeAll,
  makeClient,
  makeSchema,
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

it('unknown-table op dead-letters + flags, and the queue does not wedge', async () => {
  // This client's schema has a table the server has no handler for.
  const schema = makeSchema({ gremlins: new Table({ mood: column.text }) });
  const A = makeClient('a4', schema);
  try {
    await A.init();

    // Offline: one unhandleable op and a perfectly good one in the SAME
    // local transaction → they arrive in the SAME upload batch. The good op
    // must apply while its poison sibling dead-letters — that is the
    // per-op-savepoint contract, exercised, not just claimed.
    await A.writeTransaction(async (tx) => {
      await tx.execute(`INSERT INTO gremlins (id, mood) VALUES (?, ?)`, ['g-1', 'mischievous']);
      await tx.execute(
        `INSERT INTO odometer_readings (id, car_id, reading_km, recorded_date, source, device_id)
         VALUES (?, ?, ?, ?, 'manual', 'device-A')`,
        ['odo-ok', CAR_ID, 43000, '2026-07-21'],
      );
    });

    await A.connect(new TestConnector('device-A'));

    // The good op behind the dead letter still lands (queue not wedged).
    await waitFor(async () => {
      const r = await db.query(`SELECT 1 FROM odometer_readings WHERE id = 'odo-ok'`);
      return r.rowCount === 1;
    }, 'the op behind the dead letter applied');
    await waitForQueueDrained(A, 'A');

    // The unknown op is preserved with its full payload, not applied, not lost.
    const dl = await db.query(
      `SELECT op, record_table, record_id, payload, reason FROM dead_letters`,
    );
    expect(dl.rowCount).toBe(1);
    expect(dl.rows[0].op).toBe('PUT');
    expect(dl.rows[0].record_table).toBe('gremlins');
    expect(dl.rows[0].record_id).toBe('g-1');
    expect(dl.rows[0].reason).toContain('no handler');
    expect(dl.rows[0].payload.data).toEqual({ mood: 'mischievous' });

    // And the user hears about it: a synced dead-letter flag reaches the client.
    const flag = await waitFor(async () => {
      const rows = await A.getAll<{ kind: string; record_table: string; record_id: string }>(
        `SELECT kind, record_table, record_id FROM flags WHERE kind = 'dead-lettered-op'`,
      );
      return rows.length === 1 ? rows[0] : null;
    }, 'dead-letter flag synced down');
    expect(flag).toMatchObject({ record_table: 'gremlins', record_id: 'g-1' });
  } finally {
    await closeAll([A]);
  }
});

it('a DELETE on an unknown table still dead-letters: DELETE is not blanket-handled (S-6)', async () => {
  const schema = makeSchema({ gremlins: new Table({ mood: column.text }) });
  const A = makeClient('a4b', schema);
  try {
    await A.init();
    // Create then delete a gremlin: the create dead-letters (unknown table), and
    // so must the delete — the registry only gained cars/readings DELETE, not a
    // catch-all DELETE.
    await A.execute(`INSERT INTO gremlins (id, mood) VALUES (?, ?)`, ['g-2', 'grumpy']);
    await A.connect(new TestConnector('device-A'));
    await waitFor(async () => {
      const r = await db.query(`SELECT 1 FROM dead_letters WHERE record_id = 'g-2' AND op = 'PUT'`);
      return r.rowCount === 1;
    }, 'gremlin create dead-lettered');
    await waitForQueueDrained(A, 'A');

    await A.execute(`DELETE FROM gremlins WHERE id = 'g-2'`);
    await waitForQueueDrained(A, 'A');

    const dl = await db.query(
      `SELECT op FROM dead_letters WHERE record_table = 'gremlins' AND record_id = 'g-2' ORDER BY op`,
    );
    expect(dl.rows.map((r) => r.op)).toEqual(['DELETE', 'PUT']);
  } finally {
    await closeAll([A]);
  }
});
