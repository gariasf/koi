/**
 * Exhaustive op-handling (⛔, Spike ② finding): any op the write-path does
 * not explicitly handle-and-persist must be dead-lettered + flagged, never
 * skipped — a silent skip is silent data loss once the client clears its
 * queue on 2xx. Covers: an unknown TABLE (a client schema the server has
 * no handler for) and a DELETE (S-6 not built yet — preserved, flagged,
 * not applied). Either way the queue must drain: nothing wedges.
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

it('DELETE ops are preserved (S-6 not built): dead-letter + flag, row survives', async () => {
  const A = makeClient('a5');
  try {
    await A.init();
    await A.connect(new TestConnector('device-A'));
    await A.waitForFirstSync();

    // The reading from the previous test is on the server; wait for it locally.
    await waitFor(async () => {
      const rows = await A.getAll(`SELECT id FROM odometer_readings WHERE id = 'odo-ok'`);
      return rows.length === 1 ? true : null;
    }, 'odo-ok synced down');

    await A.execute(`DELETE FROM odometer_readings WHERE id = 'odo-ok'`);
    await waitForQueueDrained(A, 'A');

    // Not applied: the canonical row survives.
    const server = await db.query(`SELECT 1 FROM odometer_readings WHERE id = 'odo-ok'`);
    expect(server.rowCount).toBe(1);

    // Preserved + flagged.
    const dl = await db.query(
      `SELECT reason FROM dead_letters WHERE op = 'DELETE' AND record_id = 'odo-ok'`,
    );
    expect(dl.rowCount).toBe(1);
    const flags = await db.query(
      `SELECT 1 FROM flags WHERE kind = 'dead-lettered-op' AND record_id = 'odo-ok'`,
    );
    expect(flags.rowCount).toBe(1);

    // And the row RESURRECTS locally — the server state wins after upload,
    // proving the delete was not silently absorbed client-side either.
    await waitFor(async () => {
      const rows = await A.getAll(`SELECT id FROM odometer_readings WHERE id = 'odo-ok'`);
      return rows.length === 1 ? true : null;
    }, 'deleted row resurrected from server state');
  } finally {
    await closeAll([A]);
  }
});
