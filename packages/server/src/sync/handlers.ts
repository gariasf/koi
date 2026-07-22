/**
 * Per-table upload handlers. Every (table, op) pair the write-path handles
 * is registered here explicitly; `registry` is consulted by the upload
 * pipeline and ANYTHING not present is dead-lettered + flagged, never
 * skipped (Spike ② rule).
 *
 * DELETEs are deliberately NOT handled yet: the S-6 delete model
 * (tombstones, undo-survives-sync, cascade) is a later session. Until it
 * lands, a DELETE dead-letters like any other unhandled op — preserved and
 * flagged, not applied and not dropped.
 *
 * Locking discipline: the parent CAR row is the per-car serialization
 * point, and it is always locked FIRST — before any reading row — in every
 * path that touches a reading. A single consistent order is what makes the
 * concurrent-upload story deadlock-free.
 */

import {
  checkCarFields,
  checkOdometerReading,
  type OdometerObservation,
} from '@koi/domain';
import { and, eq, ne, sql } from 'drizzle-orm';
import type { z } from 'zod';

import { cars, flags, odometer_readings } from '../db/schema.js';
import { sanitizeJson, sanitizeText } from './sanitize.js';
import {
  carPatchSchema,
  carPutSchema,
  readingPatchSchema,
  readingPutSchema,
  summarizeIssues,
  extractBaseVersion,
  type UploadEntry,
} from './types.js';
import {
  planPatch,
  planPutOnExisting,
  type ColumnVersions,
  type PatchPlan,
} from './versioning.js';

/** Drizzle transaction handle (outer batch tx or an op savepoint). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Tx = any;

export interface OpCtx {
  readonly actor: string;
  readonly deviceId: string;
}

export type OpOutcome =
  | { readonly outcome: 'applied'; readonly flagKinds: readonly string[] }
  | { readonly outcome: 'noop' }
  | { readonly outcome: 'dead-letter'; readonly reason: string };

export type Handler = (tx: Tx, entry: UploadEntry, ctx: OpCtx) => Promise<OpOutcome>;

const deadLetter = (reason: string): OpOutcome => ({ outcome: 'dead-letter', reason });

/**
 * jsonb values are wrapped so scalars survive every driver serialization
 * path, and sanitized so a U+0000 in client content can never abort the
 * transaction that is supposed to record it.
 */
const jsonWrap = (value: unknown): { value: unknown } => ({
  value: value === undefined ? null : sanitizeJson(value),
});

interface FlagRow {
  id: string;
  household_id: string | null;
  record_table: string;
  record_id: string;
  car_id?: string | null;
  column_name?: string | null;
  kind: string;
  message: string;
  displaced_value?: { value: unknown };
  incoming_value?: { value: unknown };
  base_version?: number | null;
  record_version?: number | null;
  actor: string;
  device_id: string;
}

async function writeFlag(tx: Tx, row: FlagRow): Promise<void> {
  await tx
    .insert(flags)
    .values({ ...row, message: sanitizeText(row.message) })
    .onConflictDoNothing();
}

interface TableConfig {
  readonly name: 'cars' | 'odometer_readings';
  readonly table: typeof cars | typeof odometer_readings;
  /** Client-writable columns — id and server bookkeeping excluded. */
  readonly writableColumns: readonly string[];
  readonly putSchema: z.ZodType<Record<string, unknown>>;
  readonly patchSchema: z.ZodType<Record<string, unknown>>;
}

const carsConfig: TableConfig = {
  name: 'cars',
  table: cars,
  writableColumns: [
    'household_id',
    'make',
    'model',
    'nickname',
    'plate',
    'fuel_type',
    'year',
    'tank_capacity_l',
    'initial_odometer_km',
  ],
  putSchema: carPutSchema as z.ZodType<Record<string, unknown>>,
  patchSchema: carPatchSchema as z.ZodType<Record<string, unknown>>,
};

const readingsConfig: TableConfig = {
  name: 'odometer_readings',
  table: odometer_readings,
  writableColumns: ['household_id', 'car_id', 'reading_km', 'recorded_date', 'source', 'device_id'],
  putSchema: readingPutSchema as z.ZodType<Record<string, unknown>>,
  patchSchema: readingPatchSchema as z.ZodType<Record<string, unknown>>,
};

/** Non-locking read — used only to discover a reading's parent car. */
async function readRow(
  tx: Tx,
  cfg: TableConfig,
  id: string,
): Promise<Record<string, unknown> | undefined> {
  const rows = await tx.select().from(cfg.table).where(eq(cfg.table.id, id));
  return rows[0] as Record<string, unknown> | undefined;
}

async function lockRow(
  tx: Tx,
  cfg: TableConfig,
  id: string,
): Promise<Record<string, unknown> | undefined> {
  const rows = await tx.select().from(cfg.table).where(eq(cfg.table.id, id)).for('update');
  return rows[0] as Record<string, unknown> | undefined;
}

/**
 * Locks the parent car row — the per-car serialization point. Always taken
 * BEFORE any reading-row lock (see module doc).
 */
async function lockCar(tx: Tx, carId: string): Promise<Record<string, unknown> | undefined> {
  const rows = await tx.select().from(cars).where(eq(cars.id, carId)).for('update');
  return rows[0] as Record<string, unknown> | undefined;
}

async function defaultHouseholdId(tx: Tx): Promise<string | null> {
  const rows = await tx.execute(sql`SELECT id FROM households ORDER BY created_at LIMIT 1`);
  const first = (rows.rows ?? rows)[0] as { id: string } | undefined;
  return first?.id ?? null;
}

const pick = (row: Record<string, unknown>, columns: readonly string[]): Record<string, unknown> =>
  Object.fromEntries(columns.map((c) => [c, row[c] ?? null]));

/** Full-row values for a PUT insert: absent writable columns become null. */
const putValues = (
  data: Record<string, unknown>,
  columns: readonly string[],
): Record<string, unknown> => Object.fromEntries(columns.map((c) => [c, data[c] ?? null]));

/**
 * Runs @koi/domain against the post-apply row values and writes one flag
 * per violation, atomically with the data. Flag ids are deterministic per
 * (table, record, kind): a violation that persists across later edits
 * keeps its single flag instead of accumulating one per touch.
 */
async function writeDomainFlags(
  tx: Tx,
  cfg: TableConfig,
  ctx: OpCtx,
  entryId: string,
  merged: Record<string, unknown>,
  version: number,
): Promise<string[]> {
  let violations: { kind: string; message: string }[] = [];

  if (cfg.name === 'odometer_readings') {
    const rows = await tx
      .select({
        reading_km: odometer_readings.reading_km,
        recorded_date: odometer_readings.recorded_date,
      })
      .from(odometer_readings)
      .where(
        and(
          eq(odometer_readings.car_id, merged['car_id'] as string),
          ne(odometer_readings.id, entryId),
        ),
      );
    const existing: OdometerObservation[] = (
      rows as { reading_km: number; recorded_date: string }[]
    ).map((r) => ({ readingKm: r.reading_km, recordedDate: r.recorded_date }));
    const violation = checkOdometerReading(existing, {
      readingKm: merged['reading_km'] as number,
      recordedDate: merged['recorded_date'] as string,
    });
    if (violation !== null) violations = [violation];
  } else {
    // Clients hard-block these bounds at entry (§B2); the server can only
    // flag. The clock stays at the edge — @koi/domain takes it as input.
    violations = checkCarFields(
      {
        year: merged['year'] as number | null,
        tankCapacityL: merged['tank_capacity_l'] as number | null,
        initialOdometerKm: merged['initial_odometer_km'] as number | null,
      },
      { currentYear: new Date().getUTCFullYear() },
    );
  }

  for (const violation of violations) {
    await writeFlag(tx, {
      id: `dv:${cfg.name}:${entryId}:${violation.kind}`,
      household_id: (merged['household_id'] as string | null) ?? null,
      record_table: cfg.name,
      record_id: entryId,
      car_id: cfg.name === 'cars' ? entryId : ((merged['car_id'] as string | null) ?? null),
      kind: violation.kind,
      message: violation.message,
      record_version: version,
      actor: ctx.actor,
      device_id: ctx.deviceId,
    });
  }
  return violations.map((v) => v.kind);
}

function makePut(cfg: TableConfig): Handler {
  return async (tx, entry, ctx) => {
    const parsed = cfg.putSchema.safeParse(entry.data ?? {});
    if (!parsed.success) return deadLetter(`schema: ${summarizeIssues(parsed.error)}`);
    const data = parsed.data;
    const flagKinds: string[] = [];

    // Per-car serialization point: always the FIRST lock taken.
    if (cfg.name === 'odometer_readings') {
      const car = await lockCar(tx, data['car_id'] as string);
      if (car === undefined) return deadLetter(`unknown car ${String(data['car_id'])}`);
      data['household_id'] = car['household_id'];
    } else if (data['household_id'] == null) {
      const hh = await defaultHouseholdId(tx);
      if (hh === null) return deadLetter('no household exists');
      data['household_id'] = hh;
    }

    const existing = await lockRow(tx, cfg, entry.id);
    if (existing !== undefined) {
      const incoming = putValues(data, cfg.writableColumns);
      const plan = planPutOnExisting({
        current: pick(existing, cfg.writableColumns),
        columnVersions: (existing['column_versions'] as ColumnVersions | null) ?? {},
        recordVersion: existing['record_version'] as number,
        incoming,
        writableColumns: cfg.writableColumns,
        deviceId: ctx.deviceId,
      });
      if (plan.noop) return { outcome: 'noop' };

      await tx
        .update(cfg.table)
        .set({
          ...(pick(incoming, plan.changedColumns) as object),
          record_version: plan.newVersion,
          column_versions: plan.columnVersions,
          updated_by: ctx.actor,
          updated_at: sql`now()`,
        })
        .where(eq(cfg.table.id, entry.id));

      await writeFlag(tx, {
        id: `poe:${cfg.name}:${entry.id}:v${plan.newVersion}`,
        household_id: (existing['household_id'] as string | null) ?? null,
        record_table: cfg.name,
        record_id: entry.id,
        car_id: cfg.name === 'cars' ? entry.id : ((existing['car_id'] as string | null) ?? null),
        kind: 'put-on-existing',
        message: `A full row arrived for an existing ${cfg.name} record with no base version. Applied it; the displaced values are kept here - please review.`,
        displaced_value: jsonWrap(plan.displacedSnapshot),
        incoming_value: jsonWrap(pick(incoming, plan.changedColumns)),
        record_version: plan.newVersion,
        actor: ctx.actor,
        device_id: ctx.deviceId,
      });
      flagKinds.push('put-on-existing');

      const merged = { ...existing, ...pick(incoming, plan.changedColumns) };
      flagKinds.push(...(await writeDomainFlags(tx, cfg, ctx, entry.id, merged, plan.newVersion)));
      return { outcome: 'applied', flagKinds };
    }

    const values = putValues(data, cfg.writableColumns);
    const columnVersions: ColumnVersions = Object.fromEntries(
      cfg.writableColumns.map((c) => [c, { v: 1, by: ctx.deviceId }]),
    );
    await tx.insert(cfg.table).values({
      id: entry.id,
      ...(values as object),
      record_version: 1,
      column_versions: columnVersions,
      updated_by: ctx.actor,
    });

    flagKinds.push(...(await writeDomainFlags(tx, cfg, ctx, entry.id, values, 1)));
    return { outcome: 'applied', flagKinds };
  };
}

function makePatch(cfg: TableConfig): Handler {
  return async (tx, entry, ctx) => {
    const parsed = cfg.patchSchema.safeParse(entry.data ?? {});
    if (!parsed.success) return deadLetter(`schema: ${summarizeIssues(parsed.error)}`);
    const data = parsed.data;

    // Same lock order as PUT: discover the parent car with a NON-locking
    // read, lock the car first, then the reading row. (car_id is not
    // patchable, so the discovered parent is stable once the car lock is
    // held — every reading writer serializes on it.)
    if (cfg.name === 'odometer_readings') {
      const peek = await readRow(tx, cfg, entry.id);
      if (peek === undefined) return deadLetter('patch for unknown row');
      const car = await lockCar(tx, peek['car_id'] as string);
      if (car === undefined) return deadLetter(`unknown car ${String(peek['car_id'])}`);
    }

    const row = await lockRow(tx, cfg, entry.id);
    if (row === undefined) return deadLetter('patch for unknown row');
    return applyPatch(tx, cfg, entry, ctx, row, data);
  };
}

async function applyPatch(
  tx: Tx,
  cfg: TableConfig,
  entry: UploadEntry,
  ctx: OpCtx,
  row: Record<string, unknown>,
  data: Record<string, unknown>,
): Promise<OpOutcome> {
  const incoming = pick(
    data,
    cfg.writableColumns.filter((c) => c in data),
  );
  const plan: PatchPlan = planPatch({
    current: pick(row, cfg.writableColumns),
    columnVersions: (row['column_versions'] as ColumnVersions | null) ?? {},
    recordVersion: row['record_version'] as number,
    incoming,
    baseVersion: extractBaseVersion(entry.old),
    deviceId: ctx.deviceId,
  });
  if (plan.noop) return { outcome: 'noop' };

  const flagKinds: string[] = [];
  const householdId = (row['household_id'] as string | null) ?? null;
  const carId = cfg.name === 'cars' ? entry.id : ((row['car_id'] as string | null) ?? null);

  await tx
    .update(cfg.table)
    .set({
      ...(pick(incoming, plan.changedColumns) as object),
      record_version: plan.newVersion,
      column_versions: plan.columnVersions,
      updated_by: ctx.actor,
      updated_at: sql`now()`,
    })
    .where(eq(cfg.table.id, entry.id));

  for (const conflict of plan.conflicts) {
    await writeFlag(tx, {
      id: `cf:${cfg.name}:${entry.id}:${conflict.column}:v${plan.newVersion}`,
      household_id: householdId,
      record_table: cfg.name,
      record_id: entry.id,
      car_id: carId,
      column_name: conflict.column,
      kind: 'column-conflict',
      message: `Two devices edited ${cfg.name}.${conflict.column} at the same time. Kept the later arrival; the other value is preserved here - please review.`,
      displaced_value: jsonWrap(conflict.displacedValue),
      incoming_value: jsonWrap(conflict.incomingValue),
      base_version: extractBaseVersion(entry.old),
      record_version: plan.newVersion,
      actor: ctx.actor,
      device_id: ctx.deviceId,
    });
    flagKinds.push('column-conflict');
  }

  if (plan.missingBase) {
    await writeFlag(tx, {
      id: `mb:${cfg.name}:${entry.id}:v${plan.newVersion}`,
      household_id: householdId,
      record_table: cfg.name,
      record_id: entry.id,
      car_id: carId,
      kind: 'missing-base-version',
      message: `An edit to ${cfg.name} arrived without its base version, so concurrent edits cannot be told apart. Applied it - please review.`,
      incoming_value: jsonWrap(pick(incoming, plan.changedColumns)),
      record_version: plan.newVersion,
      actor: ctx.actor,
      device_id: ctx.deviceId,
    });
    flagKinds.push('missing-base-version');
  }

  const merged = { ...row, ...pick(incoming, plan.changedColumns) };
  flagKinds.push(...(await writeDomainFlags(tx, cfg, ctx, entry.id, merged, plan.newVersion)));

  return { outcome: 'applied', flagKinds };
}

/**
 * The exhaustive registry: (table, op) → handler. The upload pipeline
 * dead-letters anything absent from this map.
 */
export const registry: ReadonlyMap<string, Handler> = new Map([
  ['cars:PUT', makePut(carsConfig)],
  ['cars:PATCH', makePatch(carsConfig)],
  ['odometer_readings:PUT', makePut(readingsConfig)],
  ['odometer_readings:PATCH', makePatch(readingsConfig)],
]);
