/**
 * The app's own modules against the real stack.
 *
 * Session 3's torture tier proved the *protocol* on two purpose-built test
 * clients. This tier proves the **app**: it opens a database with @koi/mobile's
 * real `koiSchema`, connects @koi/mobile's real `KoiConnector`, and drives
 * @koi/mobile's real write functions (`deleteReading`, `undoDeleteReading`,
 * `deleteCarWithReadings`, `resolveFlag`) through the same `runS6Scenarios` module
 * the on-device self-test screen runs. Nothing is re-implemented here — that is
 * the whole point, because a re-implementation can be right while the app is
 * wrong.
 *
 * The one substitution is the SQLite driver: `@powersync/node` (better-sqlite3)
 * instead of op-sqlite, because CI has no simulator. Both are the same
 * `@powersync/common` 2.0.0 core, and the device half is covered by running the
 * identical scenarios on the simulator (see the session log).
 */

import { PowerSyncDatabase } from '@powersync/node';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, expect, it } from 'vitest';

import { archiveCar, insertCar, restoreCar, type CarRow } from '../src/data/cars';
import { runS6Scenarios, SCENARIO_COUNT, type ScenarioResult } from '../src/selftest/scenarios';
import { KoiConnector } from '../src/sync/connector';
import { crudQueueSettler } from '../src/sync/queue';
import { koiSchema } from '../src/sync/schema';
import { testSessionCookie } from './test-auth';

import type { KoiDb } from '../src/data/db';

const API = 'http://localhost:4000';
const POWERSYNC = 'http://localhost:8080';
const DEVICE = 'device-mobile-integration';

let db: PowerSyncDatabase;
let results: ScenarioResult[];

beforeAll(async () => {
  const dir = mkdtempSync(join(tmpdir(), 'koi-mobile-'));
  db = new PowerSyncDatabase({
    schema: koiSchema,
    database: { dbFilename: join(dir, 'koi.db') },
  });
  await db.init();
  await db.connect(
    new KoiConnector({
      apiUrl: API,
      powerSyncUrl: POWERSYNC,
      deviceId: DEVICE,
      getSessionCookie: testSessionCookie,
    }),
  );
  await db.waitForFirstSync();

  results = await runS6Scenarios({
    db: db as unknown as KoiDb,
    deviceId: DEVICE,
    apiUrl: API,
    getSessionCookie: testSessionCookie,
    timeoutMs: 60_000,
    settle: crudQueueSettler(db),
  });
}, 300_000);

afterAll(async () => {
  await db.disconnect();
  await db.close();
});

it('runs every scenario', () => {
  expect(results).toHaveLength(SCENARIO_COUNT);
});

it('proves the S-6 and S-4 semantics from the app itself', () => {
  const failed = results.filter((r) => !r.passed);
  expect(
    failed.map((f) => `${f.name}: ${f.detail}`),
    'scenarios that failed',
  ).toEqual([]);
});

/**
 * `archived_at` joined the sync rules WITH its write flow (Build Session 8), and this
 * is the proof the trap it was held back for is actually closed.
 *
 * The assertion is `record_version`, not the local value: a local `UPDATE` sets
 * `archived_at` on this device whether or not the server ever accepts it, so a test
 * that only read the local row would pass just as happily against a dead-letter.
 * `record_version` is **server-authored** and syncs down (S-2), so an increment means
 * the op was applied server-side — and a dead-lettered op is accepted with 2xx and
 * leaves the version alone, which is exactly the failure this catches.
 */
it('archives and restores a car through the real write path', async () => {
  const app = db as unknown as KoiDb;
  const settle = crudQueueSettler(db);
  const id = `car-archive-${DEVICE}`;

  const read = async (): Promise<CarRow> => {
    const rows = await app.getAll<CarRow>(`SELECT * FROM cars WHERE id = ?`, [id]);
    const row = rows[0];
    if (row === undefined) throw new Error('the archive fixture car is not on this device');
    return row;
  };
  const waitForVersionAbove = async (base: number): Promise<CarRow> => {
    const deadline = Date.now() + 30_000;
    for (;;) {
      const row = await read();
      if ((row.record_version ?? 0) > base) return row;
      if (Date.now() > deadline) {
        throw new Error(`record_version stayed at ${String(row.record_version)} — op not applied`);
      }
      await new Promise((r) => setTimeout(r, 200));
    }
  };

  await insertCar(app, { id, make: 'VW', model: 'Golf GTI', fuelType: 'petrol' });
  await settle();
  const created = await waitForVersionAbove(0);
  expect(created.archived_at).toBeNull();

  await archiveCar(app, id, '2020-06-01T00:00:00.000Z');
  await settle();
  const archived = await waitForVersionAbove(created.record_version ?? 1);
  expect(archived.archived_at).not.toBeNull();

  await restoreCar(app, id);
  await settle();
  const restored = await waitForVersionAbove(archived.record_version ?? 2);
  expect(restored.archived_at).toBeNull();
}, 120_000);
