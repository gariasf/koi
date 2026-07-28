/**
 * S-6 DELETE replay idempotency (D-039): a DELETE batch replayed after a lost
 * 2xx must land on the same tombstone — not a second version bump, not a second
 * flag, not a dead letter. Exercised by POSTing the identical batch twice
 * straight at /upload (what the connector does when its 200 is lost), so the
 * server's own idempotency is proven without relying on the client.
 */

import { afterAll, beforeAll, expect, it } from 'vitest';

import {
  API,
  CAR_ID,
  establishTestSession,
  HOUSEHOLD_ID,
  pgConnect,
  resetData,
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

async function mintToken(): Promise<string> {
  const cookie = await establishTestSession();
  const res = await fetch(`${API}/api/auth/token`, { headers: { cookie } });
  if (!res.ok) throw new Error(`token mint HTTP ${res.status}`);
  return ((await res.json()) as { token: string }).token;
}

async function postBatch(
  deviceId: string,
  batch: unknown[],
  token: string,
): Promise<{ status: number; results: { outcome: string }[] }> {
  const res = await fetch(`${API}/upload`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ deviceId, batch }),
  });
  const body = (await res.json()) as { results: { outcome: string }[] };
  return { status: res.status, results: body.results };
}

it('a replayed DELETE is a noop: one tombstone, no double bump, no duplicate flag/dead-letter', async () => {
  // Seed a reading at record_version 1 with a fully-populated ledger.
  const cols = ['household_id', 'car_id', 'reading_km', 'recorded_date', 'source', 'device_id'];
  const ledger = Object.fromEntries(cols.map((c) => [c, { v: 1, by: null }]));
  await db.query(
    `INSERT INTO odometer_readings
       (id, household_id, car_id, reading_km, recorded_date, source, device_id, record_version, column_versions, updated_by)
     VALUES ('odo-1', $1, $2, 42000, '2026-07-21', 'manual', 'device-A', 1, $3, 'seed')`,
    [HOUSEHOLD_ID, CAR_ID, JSON.stringify(ledger)],
  );

  const token = await mintToken();
  const batch = [
    { op: 'DELETE', type: 'odometer_readings', id: 'odo-1', old: { record_version: 1 } },
  ];

  // First delivery: applied.
  const first = await postBatch('device-A', batch, token);
  expect(first.status).toBe(200);
  expect(first.results[0]?.outcome).toBe('applied');

  const afterFirst = await db.query(
    `SELECT deleted_at, record_version FROM odometer_readings WHERE id = 'odo-1'`,
  );
  expect(afterFirst.rows[0].deleted_at).not.toBeNull();
  expect(Number(afterFirst.rows[0].record_version)).toBe(2);

  // Replay (lost-200 retry): noop, no state change.
  const second = await postBatch('device-A', batch, token);
  expect(second.status).toBe(200);
  expect(second.results[0]?.outcome).toBe('noop');

  const afterSecond = await db.query(
    `SELECT deleted_at, record_version FROM odometer_readings WHERE id = 'odo-1'`,
  );
  expect(Number(afterSecond.rows[0].record_version)).toBe(2); // NOT bumped again

  // Clean delete → no flags either time; nothing dead-lettered.
  const flags = await db.query(`SELECT count(*)::int AS n FROM flags`);
  expect(flags.rows[0].n).toBe(0);
  const dl = await db.query(`SELECT count(*)::int AS n FROM dead_letters`);
  expect(dl.rows[0].n).toBe(0);
});
