/**
 * Shared plumbing for the torture scenarios: PowerSync client schema
 * (trackPrevious ON — the base_version echo, S-5/D-023), an upload
 * connector matching the wire protocol, Postgres fixtures and polling.
 */

import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  PowerSyncDatabase,
  Schema,
  Table,
  column,
  type AbstractPowerSyncDatabase,
} from '@powersync/node';
import pg from 'pg';

export const API = 'http://localhost:4000';
export const PG_URL = 'postgresql://postgres:postgres@localhost:5433/koi';
/**
 * better-auth's own `/api/auth/token` mints the PowerSync JWT but — unlike
 * the old dev-mint route — has no idea PowerSync exists, so it no longer
 * hands the endpoint back bundled with the token. Every caller of
 * `fetchCredentials` needs to know this independently; it is the same fixed
 * value `infra/docker-compose.yml` publishes PowerSync on.
 */
export const POWERSYNC_URL = 'http://localhost:8080';

export const CAR_ID = 'car-golf';
export const HOUSEHOLD_ID = 'household-default';

// Mirrors infra/powersync/sync_rules.yaml exactly — a column visible locally
// but strict-rejected on upload (archived_at) is a dead-letter trap, so it stays
// off both sides until its write flow lands. resolved_at DID land (D-047): the
// flags table below carries it, and flags:PATCH is its accepting handler.
const carColumns = {
  household_id: column.text,
  make: column.text,
  model: column.text,
  nickname: column.text,
  plate: column.text,
  fuel_type: column.text,
  year: column.integer,
  tank_capacity_l: column.integer,
  initial_odometer_km: column.integer,
  // S-6 (D-046, bucket-filter): the bucket carries only live rows
  // (`WHERE deleted_at IS NULL`), so clients never receive a tombstone — there
  // is no deleted_at column client-side. A delete arrives as a row-removal.
  record_version: column.integer,
};

const readingColumns = {
  household_id: column.text,
  car_id: column.text,
  reading_km: column.integer,
  recorded_date: column.text,
  source: column.text,
  device_id: column.text,
  record_version: column.integer,
};

const flagColumns = {
  household_id: column.text,
  record_table: column.text,
  record_id: column.text,
  car_id: column.text,
  column_name: column.text,
  kind: column.text,
  message: column.text,
  displaced_value: column.text,
  incoming_value: column.text,
  actor: column.text,
  device_id: column.text,
  record_version: column.integer,
  created_at: column.text,
  // The one field a client writes on a flag (D-047): non-null = resolve,
  // null = re-open. flags:PATCH is the sole handler; PUT/DELETE stay unhandled.
  resolved_at: column.text,
};

export function makeSchema(extraTables: Record<string, Table> = {}): Schema {
  return new Schema({
    cars: new Table(carColumns, { trackPrevious: true }),
    odometer_readings: new Table(readingColumns, { trackPrevious: true }),
    flags: new Table(flagColumns),
    ...extraTables,
  });
}

/**
 * Real auth, headless (Build Session 6): there is no WebAuthn authenticator
 * in a Node test process, so a torture-tier "device" signs in via the
 * test-only bootstrap plugin (`auth/test-bootstrap.ts`, mounted only because
 * `global-setup.ts` passes `testBootstrap: true`) rather than a passkey —
 * then mints the same PowerSync JWT any real sign-in method would, through
 * the same `GET /api/auth/token` a passkey or recovery-code sign-in uses.
 * Cookie handling is manual (plain `fetch` keeps no cookie jar): capture
 * `set-cookie` from the bootstrap response, echo it back as `cookie` on the
 * token request.
 */
export async function establishTestSession(): Promise<string> {
  const res = await fetch(`${API}/api/auth/test/bootstrap-session`, { method: 'POST' });
  if (!res.ok) throw new Error(`test bootstrap HTTP ${res.status}`);
  const cookie = res.headers.get('set-cookie');
  if (cookie === null) throw new Error('test bootstrap returned no session cookie');
  return cookie.split(';')[0] ?? cookie;
}

export class TestConnector {
  private sessionCookie: string | null = null;

  constructor(private readonly deviceId: string) {}

  // Established once and reused, exactly like a real client: signing in is a
  // one-time event, and only the short-lived PowerSync JWT gets re-minted per
  // upload. Re-bootstrapping a fresh session on every call was strictly
  // extra latency, not extra correctness — and on a slow run it stretched
  // `waitForQueueDrained`'s polling window enough to make timing-sensitive
  // scenarios flaky.
  private async mintToken(): Promise<{ token: string; endpoint: string }> {
    this.sessionCookie ??= await establishTestSession();
    const res = await fetch(`${API}/api/auth/token`, { headers: { cookie: this.sessionCookie } });
    if (!res.ok) throw new Error(`token mint HTTP ${res.status}`);
    const { token } = (await res.json()) as { token: string };
    return { token, endpoint: POWERSYNC_URL };
  }

  async fetchCredentials(): Promise<{ endpoint: string; token: string }> {
    const { token, endpoint } = await this.mintToken();
    return { endpoint, token };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const tx = await database.getNextCrudTransaction();
    if (tx === null) return;
    const batch = tx.crud.map((e) => ({
      op: e.op,
      type: e.table,
      id: e.id,
      data: e.opData,
      old: e.previousValues,
    }));
    const { token } = await this.mintToken();
    const res = await fetch(`${API}/upload`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ deviceId: this.deviceId, batch }),
    });
    // Throw on non-2xx: PowerSync keeps the tx queued and retries — the
    // accept-with-2xx contract means this only happens on infra failures.
    if (!res.ok) throw new Error(`upload HTTP ${res.status}`);
    await tx.complete();
  }
}

export function makeClient(name: string, schema: Schema = makeSchema()): PowerSyncDatabase {
  const dir = mkdtempSync(join(tmpdir(), `koi-sync-${name}-`));
  return new PowerSyncDatabase({ schema, database: { dbFilename: join(dir, `${name}.db`) } });
}

/** One pg client per scenario file. */
export async function pgConnect(): Promise<pg.Client> {
  const client = new pg.Client({ connectionString: PG_URL });
  await client.connect();
  return client;
}

/**
 * Clean slate between scenarios: all record data goes (DELETE, not
 * TRUNCATE — deletes replicate row-by-row through the publication), the
 * default household stays, and the fixture car is reseeded with a fully
 * populated column_versions ledger ({v:1, by:null} — a server-side write).
 * One transaction, so replication ships the reset as a single consistent
 * snapshot — a client's first checkpoint can never see a half-reset state.
 */
export async function resetData(db: pg.Client): Promise<void> {
  const writable = [
    'household_id',
    'make',
    'model',
    'nickname',
    'plate',
    'fuel_type',
    'year',
    'tank_capacity_l',
    'initial_odometer_km',
  ];
  const columnVersions = Object.fromEntries(writable.map((c) => [c, { v: 1, by: null }]));
  await db.query('BEGIN');
  try {
    await db.query('DELETE FROM flags');
    await db.query('DELETE FROM dead_letters');
    await db.query('DELETE FROM odometer_readings');
    await db.query('DELETE FROM cars');
    await db.query(
      `INSERT INTO households (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`,
      [HOUSEHOLD_ID],
    );
    await db.query(
      `INSERT INTO cars (id, household_id, make, model, fuel_type, record_version, column_versions, updated_by)
       VALUES ($1, $2, 'VW', 'Golf GTI', 'petrol', 1, $3, 'fixture')`,
      [CAR_ID, HOUSEHOLD_ID, JSON.stringify(columnVersions)],
    );
    await db.query('COMMIT');
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  }
}

export async function waitFor<T>(
  probe: () => Promise<T | null | false>,
  label: string,
  timeoutMs = 60_000,
  intervalMs = 300,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const result = await probe();
    if (result !== null && result !== false) return result;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

/** Resolves once the client's upload queue is fully drained. */
export async function waitForQueueDrained(
  db: AbstractPowerSyncDatabase,
  label: string,
): Promise<void> {
  await waitFor(
    async () => ((await db.getNextCrudTransaction()) === null ? true : false),
    `${label} queue drained`,
  );
}

export async function closeAll(clients: AbstractPowerSyncDatabase[]): Promise<void> {
  for (const c of clients) {
    await c.disconnect();
    await c.close();
  }
}
