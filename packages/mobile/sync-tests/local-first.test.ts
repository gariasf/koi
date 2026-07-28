/**
 * ③ local-only → sync-on, proven lossless (D-052).
 *
 * There is no migration write path to test, because there is no migration write
 * path: `init()` always applies the full synced schema, and PowerSync's own
 * triggers queue every write into the local `ps_crud` table the instant it
 * happens — with or without a connection. So a "local-only" database is
 * indistinguishable, at the data layer, from a synced one that has simply never
 * called `connect()`. What this file proves is that the backlog such a database
 * accumulates drains completely and correctly the first time it does.
 *
 * The load-bearing claim under test is D-037 law 3: a device's own sequential
 * edits never self-conflict, "including the baseless offline create-then-edit
 * flow" — because a local row created and then edited three MONTHS apart while
 * fully offline looks, on the wire, identical to one created and edited three
 * SECONDS apart online (both arrive as an INSERT with no base, then a PATCH
 * whose base is null but whose displaced column was last written by this same
 * device). Scenario A proves that identity holds for a real multi-op backlog,
 * not just a single edit. Scenario B proves the two-device case: nothing about
 * "two devices with a backlog" is new protocol territory — it is the same
 * two-client shape the S-6 torture tier already exercises, just pre-loaded.
 */

import { PowerSyncDatabase } from '@powersync/node';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { afterAll, beforeAll, expect, it } from 'vitest';

import { deleteCarWithReadings, insertCar } from '../src/data/cars';
import { newId } from '../src/data/ids';
import { insertReading, updateReading } from '../src/data/readings';
import { KoiConnector } from '../src/sync/connector';
import { crudQueueSettler } from '../src/sync/queue';
import { koiSchema } from '../src/sync/schema';
import { testSessionCookie } from './test-auth';

import type { KoiDb } from '../src/data/db';

const API = 'http://localhost:4000';
const POWERSYNC = 'http://localhost:8080';
const PG_URL = 'postgresql://postgres:postgres@localhost:5433/koi';

let db: pg.Client;

beforeAll(async () => {
  db = new pg.Client({ connectionString: PG_URL });
  await db.connect();
});

afterAll(async () => {
  await db.end();
});

function openLocalOnly(name: string): PowerSyncDatabase {
  const dir = mkdtempSync(join(tmpdir(), `koi-local-first-${name}-`));
  return new PowerSyncDatabase({ schema: koiSchema, database: { dbFilename: join(dir, `${name}.db`) } });
}

async function noFlagsOrDeadLetters(recordIds: readonly string[]): Promise<void> {
  const flags = await db.query(`SELECT kind, record_id FROM flags WHERE record_id = ANY($1::text[])`, [
    recordIds,
  ]);
  expect(flags.rows, 'no flags from a pure single-device backlog').toEqual([]);
  const dead = await db.query(`SELECT op, record_id FROM dead_letters WHERE record_id = ANY($1::text[])`, [
    recordIds,
  ]);
  expect(dead.rows, 'no dead letters from a pure single-device backlog').toEqual([]);
}

it(
  'a single device drains its ENTIRE offline backlog correctly on first connect — ' +
    'plain create, offline create-then-edit, and offline create-then-delete, all flag-free',
  async () => {
    const deviceId = 'device-local-first-a';
    const local = openLocalOnly('a');
    try {
      await local.init();
      // Not connected yet. Every write below is queued (ps_crud) but nowhere
      // near a network — this IS local-only mode, exactly as the app default.

      const carId = newId();
      await insertCar(local as unknown as KoiDb, { id: carId, make: 'Seat', model: 'Ibiza', fuelType: 'petrol' });

      // Baseless offline create-then-edit (D-037 law 3), months-apart in spirit,
      // seconds-apart in this test — the wire shape is identical either way.
      const editedReadingId = newId();
      await insertReading(local as unknown as KoiDb, {
        id: editedReadingId,
        carId,
        readingKm: 10_000,
        recordedDate: '2026-01-01',
        deviceId,
      });
      await updateReading(local as unknown as KoiDb, editedReadingId, { readingKm: 10_500 });

      // Offline create-then-delete, no undo — the tombstone itself must reach
      // the server correctly from a backlog, not just from a live delete.
      const deletedReadingId = newId();
      await insertReading(local as unknown as KoiDb, {
        id: deletedReadingId,
        carId,
        readingKm: 20_000,
        recordedDate: '2026-02-01',
        deviceId,
      });
      await local.execute(`DELETE FROM odometer_readings WHERE id = ?`, [deletedReadingId]);

      const pendingBefore = await local.getUploadQueueStats();
      expect(pendingBefore.count, 'writes queued locally before any connection').toBeGreaterThan(0);

      // The switch: turning sync on IS this one call. No migration step.
      await local.connect(new KoiConnector({
        apiUrl: API,
        powerSyncUrl: POWERSYNC,
        deviceId,
        getSessionCookie: testSessionCookie,
      }));
      await crudQueueSettler(local)();

      const car = await db.query(`SELECT record_version, deleted_at FROM cars WHERE id = $1`, [carId]);
      expect(car.rows).toHaveLength(1);
      expect(Number(car.rows[0].record_version)).toBe(1);
      expect(car.rows[0].deleted_at).toBeNull();

      const edited = await db.query(
        `SELECT reading_km, record_version, deleted_at FROM odometer_readings WHERE id = $1`,
        [editedReadingId],
      );
      expect(edited.rows).toHaveLength(1);
      expect(edited.rows[0].reading_km).toBe(10_500);
      expect(Number(edited.rows[0].record_version)).toBe(2); // insert v1 -> edit v2
      expect(edited.rows[0].deleted_at).toBeNull();

      const deleted = await db.query(
        `SELECT record_version, deleted_at FROM odometer_readings WHERE id = $1`,
        [deletedReadingId],
      );
      expect(deleted.rows).toHaveLength(1);
      expect(Number(deleted.rows[0].record_version)).toBe(2); // insert v1 -> delete v2
      expect(deleted.rows[0].deleted_at).not.toBeNull();

      // The flagship claim: a whole backlog of same-device ops, uploaded long
      // after the fact, raises nothing for the user to review.
      await noFlagsOrDeadLetters([carId, editedReadingId, deletedReadingId]);
    } finally {
      await local.disconnect();
      await local.close();
    }
  },
  60_000,
);

it(
  'two devices, each with their OWN offline backlog, both join the same household with no loss',
  async () => {
    const deviceX = 'device-local-first-x';
    const deviceY = 'device-local-first-y';
    const x = openLocalOnly('x');
    const y = openLocalOnly('y');
    try {
      await x.init();
      await y.init();

      const carX = newId();
      const readingX = newId();
      await insertCar(x as unknown as KoiDb, { id: carX, make: 'Fiat', model: 'Panda', fuelType: 'petrol' });
      await insertReading(x as unknown as KoiDb, {
        id: readingX,
        carId: carX,
        readingKm: 5_000,
        recordedDate: '2026-01-05',
        deviceId: deviceX,
      });

      const carY = newId();
      const readingY = newId();
      await insertCar(y as unknown as KoiDb, { id: carY, make: 'Škoda', model: 'Fabia', fuelType: 'diesel' });
      await insertReading(y as unknown as KoiDb, {
        id: readingY,
        carId: carY,
        readingKm: 15_000,
        recordedDate: '2026-01-06',
        deviceId: deviceY,
      });

      // Neither device has ever seen the other. Both turn sync on at once —
      // this is not new protocol territory, just two backlogs draining
      // concurrently instead of two live streams.
      await Promise.all([
        x.connect(
          new KoiConnector({
            apiUrl: API,
            powerSyncUrl: POWERSYNC,
            deviceId: deviceX,
            getSessionCookie: testSessionCookie,
          }),
        ),
        y.connect(
          new KoiConnector({
            apiUrl: API,
            powerSyncUrl: POWERSYNC,
            deviceId: deviceY,
            getSessionCookie: testSessionCookie,
          }),
        ),
      ]);
      await Promise.all([crudQueueSettler(x)(), crudQueueSettler(y)()]);

      const cars = await db.query(
        `SELECT id, make, model, household_id FROM cars WHERE id = ANY($1::text[])`,
        [[carX, carY]],
      );
      expect(cars.rows).toHaveLength(2);
      // One household today (S-14 is groundwork, not a live sharing flow) —
      // both backlogs land under the same one, which is the correct outcome,
      // not a coincidence to paper over.
      const households = new Set(cars.rows.map((r) => r.household_id));
      expect(households.size).toBe(1);

      const readings = await db.query(
        `SELECT id, reading_km, car_id FROM odometer_readings WHERE id = ANY($1::text[])`,
        [[readingX, readingY]],
      );
      expect(readings.rows).toHaveLength(2);
      const byId = new Map(readings.rows.map((r) => [r.id, r]));
      expect(byId.get(readingX)?.reading_km).toBe(5_000);
      expect(byId.get(readingX)?.car_id).toBe(carX);
      expect(byId.get(readingY)?.reading_km).toBe(15_000);
      expect(byId.get(readingY)?.car_id).toBe(carY);

      await noFlagsOrDeadLetters([carX, carY, readingX, readingY]);
    } finally {
      await Promise.all([x.disconnect(), y.disconnect()]);
      await Promise.all([x.close(), y.close()]);
    }
  },
  60_000,
);

it(
  'an offline car-with-children delete (children-first, one local transaction) also drains correctly',
  async () => {
    const deviceId = 'device-local-first-cascade';
    const local = openLocalOnly('cascade');
    try {
      await local.init();

      const carId = newId();
      await insertCar(local as unknown as KoiDb, { id: carId, make: 'Renault', model: 'Clio', fuelType: 'petrol' });
      const readingId = newId();
      await insertReading(local as unknown as KoiDb, {
        id: readingId,
        carId,
        readingKm: 40_000,
        recordedDate: '2026-03-01',
        deviceId,
      });

      // The pinned client contract even offline: children first, one local
      // transaction, then the car (D-041) — deleteCarWithReadings already does
      // this; here it is exercised entirely before any connection exists.
      const childCount = await deleteCarWithReadings(local as unknown as KoiDb, carId);
      expect(childCount).toBe(1);

      await local.connect(new KoiConnector({
        apiUrl: API,
        powerSyncUrl: POWERSYNC,
        deviceId,
        getSessionCookie: testSessionCookie,
      }));
      await crudQueueSettler(local)();

      const car = await db.query(`SELECT deleted_at, deleted_via FROM cars WHERE id = $1`, [carId]);
      expect(car.rows).toHaveLength(1);
      expect(car.rows[0].deleted_at).not.toBeNull();

      const reading = await db.query(`SELECT deleted_at FROM odometer_readings WHERE id = $1`, [
        readingId,
      ]);
      expect(reading.rows).toHaveLength(1);
      expect(reading.rows[0].deleted_at).not.toBeNull();

      await noFlagsOrDeadLetters([carId, readingId]);
    } finally {
      await local.disconnect();
      await local.close();
    }
  },
  60_000,
);
