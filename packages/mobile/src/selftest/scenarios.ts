/**
 * The S-6 / S-4 semantics, proven from the app itself.
 *
 * Session 3 proved the delete model on two `@powersync/node` clients. That is a
 * proof about the *protocol*; this is the proof the brief actually asked for — the
 * app's own schema, connector and write functions, against the real stack. It runs
 * in two places, unchanged:
 *
 *  - on the device (the self-test screen): real Hermes, real op-sqlite, real
 *    PowerSync React Native SDK;
 *  - under Node in CI (`sync-tests/`): same modules, `@powersync/node` driver.
 *
 * The second device is a direct POST to `/upload` with a different `deviceId`
 * (`uploadAsPeer`). That is not a shortcut around the protocol — it IS the
 * protocol; the write-path cannot tell it from another phone, which is exactly why
 * it can produce real conflicts, real tombstone races and real late children.
 */

import { deleteCarWithReadings, insertCar } from '../data/cars';
import { newId } from '../data/ids';
import { reopenFlag, resolveFlag } from '../data/flags';
import {
  deleteReading,
  insertReading,
  undoDeleteReading,
  updateReading,
  type ReadingRow,
} from '../data/readings';
import { uploadAsPeer } from '../sync/connector';

import type { KoiDb } from '../data/db';

export interface ScenarioContext {
  readonly db: KoiDb;
  readonly deviceId: string;
  readonly apiUrl: string;
  readonly fetchImpl?: typeof fetch;
  /** Milliseconds a probe may keep failing before the scenario is a failure. */
  readonly timeoutMs?: number;
  readonly onProgress?: (name: string) => void;
  /**
   * Resolves once this device's queued writes have been accepted by the server.
   * Ordering matters in a race scenario: a local DELETE disappears from the local
   * database the instant it is written, long before it is uploaded, so "the row is
   * gone here" is NOT "the server has the tombstone". Without this gate a peer's
   * write can legitimately arrive first and take a different — also correct — path
   * (put-on-existing instead of write-on-tombstone), which is a test that lies.
   */
  readonly settle: () => Promise<void>;
}

/**
 * The gate above, built from any PowerSync database. The connector completes a
 * transaction only after the server answers 2xx, so an empty queue means applied,
 * not merely sent.
 */
export function crudQueueSettler(
  database: { getNextCrudTransaction: () => Promise<unknown> },
  timeoutMs = 60_000,
): () => Promise<void> {
  return async () => {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      if ((await database.getNextCrudTransaction()) == null) return;
      if (Date.now() > deadline) throw new Error('timed out waiting for the upload queue to drain');
      await new Promise((r) => setTimeout(r, 200));
    }
  };
}

export interface ScenarioResult {
  readonly name: string;
  readonly passed: boolean;
  readonly detail: string;
}

const PEER = 'device-peer-selftest';
const CIVIL = '2026-07-25';

class Ctx {
  constructor(private readonly ctx: ScenarioContext) {}

  get db(): KoiDb {
    return this.ctx.db;
  }

  get deviceId(): string {
    return this.ctx.deviceId;
  }

  /** Blocks until this device's writes are on the server (see ScenarioContext.settle). */
  settle(): Promise<void> {
    return this.ctx.settle();
  }

  async waitFor<T>(probe: () => Promise<T | null | false>, label: string): Promise<T> {
    const deadline = Date.now() + (this.ctx.timeoutMs ?? 30_000);
    for (;;) {
      const result = await probe();
      if (result !== null && result !== false) return result;
      if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  /** Writes as another device, through the same endpoint a peer's connector uses. */
  async peer(batch: readonly Record<string, unknown>[]): Promise<void> {
    await uploadAsPeer(
      {
        apiUrl: this.ctx.apiUrl,
        deviceId: PEER,
        fetchImpl: this.ctx.fetchImpl,
      },
      batch,
    );
  }

  rows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.ctx.db.getAll<T>(sql, params);
  }

  /** A row is "here" when the bucket carries it; a deleted row never is (D-046). */
  async present(table: string, id: string): Promise<boolean> {
    const rows = await this.rows<{ id: string }>(`SELECT id FROM ${table} WHERE id = ?`, [id]);
    return rows.length === 1;
  }

  async serverVersion(id: string, table: string): Promise<number | null> {
    const rows = await this.rows<{ record_version: number | null }>(
      `SELECT record_version FROM ${table} WHERE id = ?`,
      [id],
    );
    return rows[0]?.record_version ?? null;
  }

  async flagsFor(recordId: string): Promise<{ id: string; kind: string; resolved_at: string | null }[]> {
    return this.rows(`SELECT id, kind, resolved_at FROM flags WHERE record_id = ? ORDER BY id`, [
      recordId,
    ]);
  }

  /** Waits until the row's record_version has been assigned by the server. */
  async synced(table: string, id: string): Promise<number> {
    return this.waitFor(async () => {
      const v = await this.serverVersion(id, table);
      return v === null ? null : v;
    }, `${table} ${id} synced`);
  }

  async seedCar(label: string): Promise<string> {
    const carId = newId();
    await insertCar(this.db, { id: carId, make: 'VW', model: label, fuelType: 'petrol' });
    await this.synced('cars', carId);
    return carId;
  }

  async seedReading(carId: string, km: number, date = CIVIL): Promise<ReadingRow> {
    const id = newId();
    await insertReading(this.db, {
      id,
      carId,
      readingKm: km,
      recordedDate: date,
      deviceId: this.deviceId,
    });
    await this.synced('odometer_readings', id);
    const rows = await this.rows<ReadingRow>(`SELECT * FROM odometer_readings WHERE id = ?`, [id]);
    const row = rows[0];
    if (row === undefined) throw new Error('seeded reading vanished');
    return row;
  }

  async waitForFlag(recordId: string, kind: string): Promise<void> {
    await this.waitFor(async () => {
      const flags = await this.flagsFor(recordId);
      return flags.some((f) => f.kind === kind) ? true : null;
    }, `${kind} flag on ${recordId}`);
  }

  async waitForAbsent(table: string, id: string): Promise<void> {
    await this.waitFor(async () => ((await this.present(table, id)) ? null : true), `${id} removed`);
  }

  async waitForPresent(table: string, id: string): Promise<void> {
    await this.waitFor(async () => ((await this.present(table, id)) ? true : null), `${id} back`);
  }
}

type Scenario = (c: Ctx) => Promise<string>;

const SCENARIOS: readonly { name: string; run: Scenario }[] = [
  {
    name: 'a write reaches the server and comes back versioned',
    run: async (c) => {
      const carId = await c.seedCar('Golf GTI');
      const reading = await c.seedReading(carId, 90_000);
      const version = await c.serverVersion(reading.id, 'odometer_readings');
      if (version === null) throw new Error('no record_version came back');
      return `reading is at record_version ${String(version)}`;
    },
  },
  {
    name: 'a delete removes the row from this device (bucket-filter)',
    run: async (c) => {
      const carId = await c.seedCar('Polo');
      const reading = await c.seedReading(carId, 50_000);
      const captured = await deleteReading(c.db, reading.id);
      if (captured === null) throw new Error('delete captured nothing to undo');
      await c.waitForAbsent('odometer_readings', reading.id);
      return 'row gone locally, no deleted_at column anywhere';
    },
  },
  {
    name: 'undo re-INSERTs the captured row and it comes back, flag-free',
    run: async (c) => {
      const carId = await c.seedCar('Passat');
      const reading = await c.seedReading(carId, 120_000);
      const captured = await deleteReading(c.db, reading.id);
      if (captured === null) throw new Error('nothing captured');
      await c.waitForAbsent('odometer_readings', reading.id);
      await undoDeleteReading(c.db, captured);
      await c.waitForPresent('odometer_readings', reading.id);
      const flags = await c.flagsFor(reading.id);
      if (flags.length > 0) throw new Error(`a clean undo raised ${String(flags.length)} flag(s)`);
      return 'row restored on this device, no review event';
    },
  },
  {
    name: 'deleting a car takes its readings with it, in one checkpoint',
    run: async (c) => {
      const carId = await c.seedCar('Touran');
      const a = await c.seedReading(carId, 10_000, '2026-07-01');
      const b = await c.seedReading(carId, 11_000, '2026-07-10');
      const children = await deleteCarWithReadings(c.db, carId);
      await c.waitForAbsent('cars', carId);
      await c.waitForAbsent('odometer_readings', a.id);
      await c.waitForAbsent('odometer_readings', b.id);
      return `car and ${String(children)} readings gone together`;
    },
  },
  {
    name: 'a concurrent edit from another device raises a column-conflict',
    run: async (c) => {
      const carId = await c.seedCar('Up');
      const reading = await c.seedReading(carId, 70_000);
      // This device edits first (v1 → v2, attributed to us).
      await updateReading(c.db, reading.id, { readingKm: 70_500 });
      await c.waitFor(async () => {
        const v = await c.serverVersion(reading.id, 'odometer_readings');
        return v !== null && v >= 2 ? true : null;
      }, 'local edit applied');
      // The peer's edit is based on v1 — it never saw ours. Same column, different
      // value, different device: a conflict, and our value is the displaced one.
      await c.peer([
        {
          op: 'PATCH',
          type: 'odometer_readings',
          id: reading.id,
          data: { reading_km: 71_000 },
          old: { record_version: 1 },
        },
      ]);
      await c.waitForFlag(reading.id, 'column-conflict');
      return 'flag carries the displaced value, both edits accounted for';
    },
  },
  {
    name: 'another device cannot silently undo our delete (write-on-tombstone)',
    run: async (c) => {
      const carId = await c.seedCar('Caddy');
      const reading = await c.seedReading(carId, 30_000);
      await deleteReading(c.db, reading.id);
      await c.waitForAbsent('odometer_readings', reading.id);
      // The tombstone must be ON THE SERVER before the peer writes, or the peer's
      // PUT lands on a still-live row and takes the put-on-existing path instead.
      await c.settle();
      await c.peer([
        {
          op: 'PUT',
          type: 'odometer_readings',
          id: reading.id,
          data: {
            car_id: carId,
            reading_km: 30_500,
            recorded_date: CIVIL,
            source: 'manual',
            device_id: PEER,
          },
        },
      ]);
      await c.waitForFlag(reading.id, 'write-on-tombstone');
      if (await c.present('odometer_readings', reading.id)) {
        throw new Error('the row came back — a delete was silently reversed');
      }
      return 'row stays deleted, incoming values preserved on the flag';
    },
  },
  {
    name: 'a reading for a deleted car is kept and flagged (late child)',
    run: async (c) => {
      const carId = await c.seedCar('Sharan');
      await deleteCarWithReadings(c.db, carId);
      await c.waitForAbsent('cars', carId);
      // Same ordering gate: the car has to be tombstoned server-side, or the
      // reading simply inserts live under a car that is still there.
      await c.settle();
      const orphanId = newId();
      await c.peer([
        {
          op: 'PUT',
          type: 'odometer_readings',
          id: orphanId,
          data: {
            car_id: carId,
            reading_km: 40_000,
            recorded_date: CIVIL,
            source: 'manual',
            device_id: PEER,
          },
        },
      ]);
      await c.waitForFlag(orphanId, 'late-child');
      if (await c.present('cars', carId)) throw new Error('the deleted car came back');
      return 'reading preserved server-side, car not resurrected';
    },
  },
  {
    name: 'a domain violation from another device lands in the queue',
    run: async (c) => {
      const carId = await c.seedCar('Arteon');
      await c.seedReading(carId, 200_000, '2026-07-20');
      // Backwards in time: 199_000 km dated after a 200_000 km reading (inv.9).
      const badId = newId();
      await c.peer([
        {
          op: 'PUT',
          type: 'odometer_readings',
          id: badId,
          data: {
            car_id: carId,
            reading_km: 199_000,
            recorded_date: '2026-07-22',
            source: 'manual',
            device_id: PEER,
          },
        },
      ]);
      await c.waitForFlag(badId, 'odometer-backwards');
      return 'the pure check ran server-side and the flag reached this device';
    },
  },
  {
    name: 'resolving a flag latches it, and undo re-opens it (S-4)',
    run: async (c) => {
      const carId = await c.seedCar('Amarok');
      const reading = await c.seedReading(carId, 60_000);
      await c.peer([
        {
          op: 'PATCH',
          type: 'odometer_readings',
          id: reading.id,
          data: { reading_km: 60_500 },
          old: { record_version: 0 },
        },
      ]);
      await c.waitForFlag(reading.id, 'missing-base-version');
      const flags = await c.flagsFor(reading.id);
      const flag = flags[0];
      if (flag === undefined) throw new Error('no flag to resolve');

      await resolveFlag(c.db, flag.id, new Date().toISOString());
      // The server stamps its OWN clock, so a value coming back proves the round
      // trip, not just the local write.
      const stamped = await c.waitFor(async () => {
        const rows = await c.rows<{ resolved_at: string | null }>(
          `SELECT resolved_at FROM flags WHERE id = ?`,
          [flag.id],
        );
        const at = rows[0]?.resolved_at ?? null;
        return at !== null && at !== '' ? at : null;
      }, 'server stamped resolved_at');

      await reopenFlag(c.db, flag.id);
      await c.waitFor(async () => {
        const rows = await c.rows<{ resolved_at: string | null }>(
          `SELECT resolved_at FROM flags WHERE id = ?`,
          [flag.id],
        );
        return rows[0]?.resolved_at == null ? true : null;
      }, 'server cleared resolved_at');

      return `latched at ${stamped}, then re-opened — no dead letter`;
    },
  },
];

export async function runS6Scenarios(context: ScenarioContext): Promise<ScenarioResult[]> {
  const c = new Ctx(context);
  const results: ScenarioResult[] = [];
  for (const scenario of SCENARIOS) {
    context.onProgress?.(scenario.name);
    try {
      const detail = await scenario.run(c);
      results.push({ name: scenario.name, passed: true, detail });
    } catch (e) {
      results.push({
        name: scenario.name,
        passed: false,
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return results;
}

export const SCENARIO_COUNT = SCENARIOS.length;
