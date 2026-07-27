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

import { runS6Scenarios, SCENARIO_COUNT, type ScenarioResult } from '../src/selftest/scenarios';
import { KoiConnector } from '../src/sync/connector';
import { crudQueueSettler } from '../src/sync/queue';
import { koiSchema } from '../src/sync/schema';

import type { KoiDb } from '../src/data/db';

const API = 'http://localhost:4000';
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
  await db.connect(new KoiConnector({ apiUrl: API, deviceId: DEVICE }));
  await db.waitForFirstSync();

  results = await runS6Scenarios({
    db: db as unknown as KoiDb,
    deviceId: DEVICE,
    apiUrl: API,
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
