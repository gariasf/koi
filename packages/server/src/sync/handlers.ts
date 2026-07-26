/**
 * Per-table upload handlers. Every (table, op) pair the write-path handles is
 * registered here explicitly; `registry` is consulted by the upload pipeline
 * and ANYTHING not present is dead-lettered + flagged, never skipped (Spike ②
 * rule, D-038).
 *
 * S-6 delete model (D-039..D-044, D-046). A delete never removes a row — it
 * writes a tombstone (`deleted_at` set + attribution). The buckets carry only
 * live rows (bucket-filter, D-046), so the tombstone drops the row out of the
 * bucket and peers see the delete as a checkpoint row-removal; no tombstone
 * content ever reaches a client. `deleted_at` is a first-class attributed column
 * in `column_versions`, so delete-vs-edit and delete-vs-undo races reuse the
 * base_version machinery. The state transitions:
 *
 *   DELETE live row      → tombstone; concurrent foreign changes the deleter
 *                          didn't see are surfaced (delete-conflict), never
 *                          buried. cars also cascade-tombstone their readings in
 *                          the same transaction (peers observe car+children
 *                          atomically). DELETE tombstoned row → noop.
 *   PUT tombstoned reading, by the deleting device, parent live
 *                        → resurrection (undo, inv.31): clear the tombstone.
 *   PUT tombstoned row, any other case (cars always — inv.30 has no car undo;
 *   foreign-device readings; parent tombstoned)
 *                        → keep the tombstone, apply-and-preserve the displaced
 *                          values, flag. A stale replay/import never silently
 *                          resurrects a delete.
 *   PUT new reading under a tombstoned car (late child)
 *                        → insert tombstone-born (inherits the car's deletion),
 *                          flagged, never dropped, never resurrecting the parent.
 *   PATCH tombstoned row  → apply-and-preserve, keep the tombstone, flag
 *                          (edit-after-delete).
 *
 * Domain checks (@koi/domain) run only on rows that are LIVE after the op — a
 * tombstoned reading must not constrain the live odometer trail (inv.11).
 *
 * Locking discipline: the parent CAR row is the per-car serialization point,
 * always locked FIRST — before any reading row, and before a cascade touches
 * its children — in every path. That orders a car before its own children, so
 * no op deadlocks against another op on the SAME car. It does NOT order two
 * DIFFERENT cars: a batch touching cars C1 then C2 can deadlock against a
 * concurrent batch touching C2 then C1 (multi-car batches — bulk delete, the
 * D-010 import). That is a transient, retryable Postgres deadlock (40P01), not a
 * data problem — `upload.ts` recognizes retryable SQLSTATEs and aborts the batch
 * for an idempotent client retry rather than dead-lettering the victim op.
 */

import {
  checkCarFields,
  checkOdometerReading,
  type OdometerObservation,
} from '@koi/domain';
import { and, eq, isNull, ne, sql } from 'drizzle-orm';
import type { z } from 'zod';

import { cars, flags, odometer_readings } from '../db/schema.js';
import { sanitizeJson, sanitizeText } from './sanitize.js';
import {
  carPatchSchema,
  carPutSchema,
  flagResolvePatchSchema,
  readingPatchSchema,
  readingPutSchema,
  summarizeIssues,
  extractBaseVersion,
  type UploadEntry,
} from './types.js';
import {
  DELETED_AT,
  planDelete,
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

const isTombstoned = (row: Record<string, unknown>): boolean => row['deleted_at'] != null;

/** Device that wrote the row's tombstone (the base_version ledger is authoritative). */
const tombstoneDevice = (row: Record<string, unknown>): string | null =>
  ((row['column_versions'] as ColumnVersions | null)?.[DELETED_AT]?.by ?? null);

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
  /** Client-writable columns — id, server bookkeeping and tombstone excluded. */
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
 * BEFORE any reading-row lock and before a cascade (see module doc).
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
 * Runs @koi/domain against the post-apply row values and writes one flag per
 * violation, atomically with the data. Called ONLY on paths that leave the row
 * LIVE — a tombstoned row is out of the trail (inv.11), so its values must not
 * mint monotonicity flags. The existing-readings comparison excludes tombstoned
 * rows for the same reason. Flag ids are deterministic per (table, record, kind):
 * a violation that persists across later edits keeps its single flag.
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
          isNull(odometer_readings.deleted_at),
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

const carIdOf = (cfg: TableConfig, entryId: string, row: Record<string, unknown>): string | null =>
  cfg.name === 'cars' ? entryId : ((row['car_id'] as string | null) ?? null);

/** A fresh live insert (no existing row) + its domain flags. */
async function insertLive(
  tx: Tx,
  cfg: TableConfig,
  ctx: OpCtx,
  entry: UploadEntry,
  data: Record<string, unknown>,
): Promise<OpOutcome> {
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
  const flagKinds = await writeDomainFlags(tx, cfg, ctx, entry.id, values, 1);
  return { outcome: 'applied', flagKinds };
}

/**
 * A reading PUT whose parent car is tombstoned but which has no existing row: a
 * late child of a deleted parent (D-042). Inserted tombstone-born so it is
 * preserved, never dropped, never silently resurrecting the parent; the tombstone
 * inherits the CAR's deletion attribution (the car delete is the authority). No
 * domain flags — a tombstoned reading is out of the live trail.
 */
async function insertLateChild(
  tx: Tx,
  cfg: TableConfig,
  ctx: OpCtx,
  entry: UploadEntry,
  data: Record<string, unknown>,
  car: Record<string, unknown>,
): Promise<OpOutcome> {
  const values = putValues(data, cfg.writableColumns);
  const columnVersions: ColumnVersions = Object.fromEntries([
    ...cfg.writableColumns.map((c) => [c, { v: 1, by: ctx.deviceId }]),
    [DELETED_AT, { v: 1, by: tombstoneDevice(car) }],
  ]);
  await tx.insert(cfg.table).values({
    id: entry.id,
    ...(values as object),
    deleted_at: sql`now()`,
    deleted_by: (car['deleted_by'] as string | null) ?? null,
    deleted_by_device: (car['deleted_by_device'] as string | null) ?? null,
    deleted_via: 'cascade',
    record_version: 1,
    column_versions: columnVersions,
    updated_by: ctx.actor,
  });
  await writeFlag(tx, {
    id: `lc:${cfg.name}:${entry.id}`,
    household_id: (values['household_id'] as string | null) ?? null,
    record_table: cfg.name,
    record_id: entry.id,
    car_id: (values['car_id'] as string | null) ?? null,
    kind: 'late-child',
    message: `A ${cfg.name} record arrived for a car that was deleted. It is kept as deleted for review - the car was not brought back.`,
    incoming_value: jsonWrap(values),
    record_version: 1,
    actor: ctx.actor,
    device_id: ctx.deviceId,
  });
  return { outcome: 'applied', flagKinds: ['late-child'] };
}

/** A PUT whose id already exists and is LIVE (put-on-existing, D-037). */
async function putOnExistingLive(
  tx: Tx,
  cfg: TableConfig,
  ctx: OpCtx,
  entry: UploadEntry,
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Promise<OpOutcome> {
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
    car_id: carIdOf(cfg, entry.id, existing),
    kind: 'put-on-existing',
    message: `A full row arrived for an existing ${cfg.name} record with no base version. Applied it; the displaced values are kept here - please review.`,
    displaced_value: jsonWrap(plan.displacedSnapshot),
    incoming_value: jsonWrap(pick(incoming, plan.changedColumns)),
    record_version: plan.newVersion,
    actor: ctx.actor,
    device_id: ctx.deviceId,
  });

  const merged = { ...existing, ...pick(incoming, plan.changedColumns) };
  const flagKinds = ['put-on-existing', ...(await writeDomainFlags(tx, cfg, ctx, entry.id, merged, plan.newVersion))];
  return { outcome: 'applied', flagKinds };
}

/**
 * Resurrection (undo, inv.31): a reading tombstoned by THIS device, whose parent
 * car is live, gets its tombstone cleared. Clearing the tombstone is always a
 * change (version bump even if the values are identical). A clean undo (no value
 * change) is flag-free; a value-changing resurrection preserves the displaced
 * snapshot. Domain checks run — the row is live again.
 */
async function resurrect(
  tx: Tx,
  cfg: TableConfig,
  ctx: OpCtx,
  entry: UploadEntry,
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Promise<OpOutcome> {
  const plan = planPutOnExisting({
    current: pick(existing, cfg.writableColumns),
    columnVersions: (existing['column_versions'] as ColumnVersions | null) ?? {},
    recordVersion: existing['record_version'] as number,
    incoming,
    writableColumns: cfg.writableColumns,
    deviceId: ctx.deviceId,
  });
  const newVersion = (existing['record_version'] as number) + 1;
  const columnVersions: ColumnVersions = {
    ...plan.columnVersions,
    [DELETED_AT]: { v: newVersion, by: ctx.deviceId },
  };

  await tx
    .update(cfg.table)
    .set({
      ...(pick(incoming, plan.changedColumns) as object),
      deleted_at: null,
      deleted_by: null,
      deleted_by_device: null,
      deleted_via: null,
      record_version: newVersion,
      column_versions: columnVersions,
      updated_by: ctx.actor,
      updated_at: sql`now()`,
    })
    .where(eq(cfg.table.id, entry.id));

  const flagKinds: string[] = [];
  if (plan.changedColumns.length > 0) {
    await writeFlag(tx, {
      id: `rs:${cfg.name}:${entry.id}:v${newVersion}`,
      household_id: (existing['household_id'] as string | null) ?? null,
      record_table: cfg.name,
      record_id: entry.id,
      car_id: carIdOf(cfg, entry.id, existing),
      kind: 'resurrected',
      message: `An undone ${cfg.name} record came back with changed values. Restored it; the values it replaced are kept here - please review.`,
      displaced_value: jsonWrap(plan.displacedSnapshot),
      incoming_value: jsonWrap(pick(incoming, plan.changedColumns)),
      record_version: newVersion,
      actor: ctx.actor,
      device_id: ctx.deviceId,
    });
    flagKinds.push('resurrected');
  }

  const merged = { ...existing, ...pick(incoming, plan.changedColumns), deleted_at: null };
  flagKinds.push(...(await writeDomainFlags(tx, cfg, ctx, entry.id, merged, newVersion)));
  return { outcome: 'applied', flagKinds };
}

/**
 * A PUT onto a tombstoned row that must NOT resurrect (cars — inv.30 has no car
 * undo; a foreign-device reading — delete wins over a stale create/import). The
 * row stays tombstoned; the incoming values are applied and the displaced ones
 * preserved in a versioned flag (never the coalescing late-child id, which would
 * silently drop a displaced snapshot). A value-identical replay is a noop.
 */
async function writeOnTombstone(
  tx: Tx,
  cfg: TableConfig,
  ctx: OpCtx,
  entry: UploadEntry,
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Promise<OpOutcome> {
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
    id: `wt:${cfg.name}:${entry.id}:v${plan.newVersion}`,
    household_id: (existing['household_id'] as string | null) ?? null,
    record_table: cfg.name,
    record_id: entry.id,
    car_id: carIdOf(cfg, entry.id, existing),
    kind: 'write-on-tombstone',
    message: `A full row arrived for a deleted ${cfg.name} record. It stays deleted; the values it would have set are kept here - please review.`,
    displaced_value: jsonWrap(plan.displacedSnapshot),
    incoming_value: jsonWrap(pick(incoming, plan.changedColumns)),
    record_version: plan.newVersion,
    actor: ctx.actor,
    device_id: ctx.deviceId,
  });
  return { outcome: 'applied', flagKinds: ['write-on-tombstone'] };
}

function makePut(cfg: TableConfig): Handler {
  return async (tx, entry, ctx) => {
    const parsed = cfg.putSchema.safeParse(entry.data ?? {});
    if (!parsed.success) return deadLetter(`schema: ${summarizeIssues(parsed.error)}`);
    const data = parsed.data;

    // Per-car serialization point: always the FIRST lock taken.
    let car: Record<string, unknown> | undefined;
    if (cfg.name === 'odometer_readings') {
      car = await lockCar(tx, data['car_id'] as string);
      if (car === undefined) return deadLetter(`unknown car ${String(data['car_id'])}`);
      data['household_id'] = car['household_id'];
    } else if (data['household_id'] == null) {
      const hh = await defaultHouseholdId(tx);
      if (hh === null) return deadLetter('no household exists');
      data['household_id'] = hh;
    }

    const existing = await lockRow(tx, cfg, entry.id);

    if (existing === undefined) {
      // A brand-new reading under a tombstoned car is a late child; every other
      // fresh row inserts live.
      if (cfg.name === 'odometer_readings' && car !== undefined && isTombstoned(car)) {
        return insertLateChild(tx, cfg, ctx, entry, data, car);
      }
      return insertLive(tx, cfg, ctx, entry, data);
    }

    const incoming = putValues(data, cfg.writableColumns);
    if (!isTombstoned(existing)) {
      return putOnExistingLive(tx, cfg, ctx, entry, existing, incoming);
    }

    // The row is tombstoned. Only a reading, deleted by THIS device, whose
    // parent car is live, resurrects (inv.31 undo). Everything else keeps the
    // tombstone (cars never undo via PUT; a foreign device / dead parent must
    // not resurrect a delete).
    const parentLive = cfg.name === 'cars' || (car !== undefined && !isTombstoned(car));
    if (
      cfg.name === 'odometer_readings' &&
      parentLive &&
      tombstoneDevice(existing) === ctx.deviceId
    ) {
      return resurrect(tx, cfg, ctx, entry, existing, incoming);
    }
    return writeOnTombstone(tx, cfg, ctx, entry, existing, incoming);
  };
}

function makePatch(cfg: TableConfig): Handler {
  return async (tx, entry, ctx) => {
    const parsed = cfg.patchSchema.safeParse(entry.data ?? {});
    if (!parsed.success) return deadLetter(`schema: ${summarizeIssues(parsed.error)}`);
    const data = parsed.data;

    // Same lock order as PUT: discover the parent car with a NON-locking read,
    // lock the car first, then the reading row. (car_id is not patchable, so the
    // discovered parent is stable once the car lock is held.)
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

  // Edit-after-delete (Order A of the edit-vs-delete race, D-043): the row is
  // tombstoned. Apply and preserve the edit, keep the tombstone (delete wins
  // visibility), surface it — never silently absorb it, never resurrect. No
  // column-conflict analysis (the deletion supersedes it) and no domain checks
  // (a tombstoned row is out of the trail).
  if (isTombstoned(row)) {
    const plan = planPatch({
      current: pick(row, cfg.writableColumns),
      columnVersions: (row['column_versions'] as ColumnVersions | null) ?? {},
      recordVersion: row['record_version'] as number,
      incoming,
      baseVersion: extractBaseVersion(entry.old),
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
      id: `ed:${cfg.name}:${entry.id}:v${plan.newVersion}`,
      household_id: (row['household_id'] as string | null) ?? null,
      record_table: cfg.name,
      record_id: entry.id,
      car_id: carIdOf(cfg, entry.id, row),
      kind: 'edit-after-delete',
      message: `A ${cfg.name} record was edited on one device while deleted on another. It stays deleted; the edit is kept here - please review.`,
      incoming_value: jsonWrap(pick(incoming, plan.changedColumns)),
      base_version: extractBaseVersion(entry.old),
      record_version: plan.newVersion,
      actor: ctx.actor,
      device_id: ctx.deviceId,
    });
    return { outcome: 'applied', flagKinds: ['edit-after-delete'] };
  }

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
  const carId = carIdOf(cfg, entry.id, row);

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
 * Tombstone a live row + surface any concurrent change the deleter didn't see
 * (delete-conflict). `flagCarId` overrides the flag's car scope so a reading's
 * conflict points at its car. Returns the applied flag kinds.
 */
async function tombstoneRow(
  tx: Tx,
  cfg: TableConfig,
  ctx: OpCtx,
  entry: UploadEntry,
  row: Record<string, unknown>,
): Promise<string[]> {
  const plan = planDelete({
    alreadyDeleted: false,
    columnVersions: (row['column_versions'] as ColumnVersions | null) ?? {},
    recordVersion: row['record_version'] as number,
    baseVersion: extractBaseVersion(entry.old),
    deviceId: ctx.deviceId,
    scanColumns: cfg.writableColumns,
  });

  await tx
    .update(cfg.table)
    .set({
      deleted_at: sql`now()`,
      deleted_by: ctx.actor,
      deleted_by_device: ctx.deviceId,
      deleted_via: 'direct',
      record_version: plan.newVersion,
      column_versions: plan.columnVersions,
      updated_by: ctx.actor,
      updated_at: sql`now()`,
    })
    .where(eq(cfg.table.id, entry.id));

  const base = extractBaseVersion(entry.old);
  const householdId = (row['household_id'] as string | null) ?? null;
  const carId = carIdOf(cfg, entry.id, row);

  if (plan.conflicts.length > 0) {
    // The concurrent columns' current values survive in the tombstoned row; the
    // deleter never saw them, so preserve them on the flag for review.
    const displaced = Object.fromEntries(
      plan.conflicts.map((c) => [c.column, c.column === DELETED_AT ? null : (row[c.column] ?? null)]),
    );
    await writeFlag(tx, {
      id: `dc:${cfg.name}:${entry.id}:v${plan.newVersion}`,
      household_id: householdId,
      record_table: cfg.name,
      record_id: entry.id,
      car_id: carId,
      column_name: plan.conflicts.map((c) => c.column).join(','),
      kind: 'delete-conflict',
      message: `A ${cfg.name} record was deleted on one device while another device changed it. Kept it deleted; the changed values are preserved here - please review.`,
      displaced_value: jsonWrap(displaced),
      base_version: base,
      record_version: plan.newVersion,
      actor: ctx.actor,
      device_id: ctx.deviceId,
    });
    return ['delete-conflict'];
  }

  if (plan.missingBase) {
    await writeFlag(tx, {
      id: `dc:${cfg.name}:${entry.id}:v${plan.newVersion}`,
      household_id: householdId,
      record_table: cfg.name,
      record_id: entry.id,
      car_id: carId,
      kind: 'delete-conflict',
      message: `A ${cfg.name} record was deleted without its base version, so a concurrent change cannot be told apart. Kept it deleted - please review.`,
      base_version: base,
      record_version: plan.newVersion,
      actor: ctx.actor,
      device_id: ctx.deviceId,
    });
    return ['delete-conflict'];
  }
  return [];
}

/**
 * Atomic cascade (D-041): tombstone every LIVE child reading of a car in the
 * SAME transaction as the car, so one replication transaction → one checkpoint
 * → peers observe the car and its children deleted together. Each child bumps
 * its own record_version and gets deleted_via='cascade' + a deleted_at ledger
 * entry attributed to the deleter. This is the BACKSTOP for children the
 * deleting client did not list as per-child DELETEs; children it did list are
 * already tombstoned (deleted_at set) and excluded here.
 */
async function cascadeChildren(tx: Tx, carId: string, ctx: OpCtx): Promise<void> {
  await tx.execute(sql`
    UPDATE odometer_readings SET
      deleted_at = now(),
      deleted_by = ${ctx.actor},
      deleted_by_device = ${ctx.deviceId},
      deleted_via = 'cascade',
      record_version = record_version + 1,
      column_versions = jsonb_set(
        column_versions, '{deleted_at}',
        jsonb_build_object('v', record_version + 1, 'by', ${ctx.deviceId}::text), true
      ),
      updated_by = ${ctx.actor},
      updated_at = now()
    WHERE car_id = ${carId} AND deleted_at IS NULL
  `);
}

function makeDelete(cfg: TableConfig): Handler {
  return async (tx, entry, ctx) => {
    if (cfg.name === 'odometer_readings') {
      const peek = await readRow(tx, cfg, entry.id);
      if (peek === undefined) return deadLetter('delete for unknown row');
      const car = await lockCar(tx, peek['car_id'] as string);
      if (car === undefined) return deadLetter(`unknown car ${String(peek['car_id'])}`);
      const row = await lockRow(tx, cfg, entry.id);
      if (row === undefined) return deadLetter('delete for unknown row');
      if (isTombstoned(row)) return { outcome: 'noop' };
      const flagKinds = await tombstoneRow(tx, cfg, ctx, entry, row);
      return { outcome: 'applied', flagKinds };
    }

    // cars: the car row is the per-car lock, taken first.
    const car = await lockCar(tx, entry.id);
    if (car === undefined) return deadLetter('delete for unknown row');
    if (isTombstoned(car)) return { outcome: 'noop' };
    const flagKinds = await tombstoneRow(tx, cfg, ctx, entry, car);
    await cascadeChildren(tx, entry.id, ctx);
    return { outcome: 'applied', flagKinds };
  };
}

/**
 * S-4 review-queue resolution (D-047). A flag is server-authored evidence, so
 * the ONLY thing a client may write about one is the `resolved_at` latch:
 * `flags:PUT` and `flags:DELETE` stay OUT of the registry and dead-letter
 * loudly — a client must not be able to author a flag the server never raised,
 * nor destroy the record of one. `resolved_at` joins the sync rules together
 * with this handler, because a column clients can see but the server rejects is
 * a dead-letter trap (the archived_at lesson, D-038).
 *
 * No base_version machinery here, deliberately — and it is not an exception to
 * "never silent LWW" (D-037), which exists to stop one device's typed CONTENT
 * from being overwritten unseen. The latch holds no content: its two states are
 * "I have looked at this" and "I have not", both user intents, both one tap
 * apart, both visible in the queue, and two devices SETTLING ON THE SAME state
 * agree by construction (a plain no-op, `resolving === current`). The server
 * writes its OWN clock and reads the client's value as intent only (non-null =
 * resolve, null = re-open, which is how the undo toast reverses a mis-tap) — a
 * client clock never lands in the evidence. Resolution never touches
 * `record_version`: on a flag that column is the version of the FLAGGED record,
 * not of the flag.
 *
 * The one race this leaves open, named rather than hidden: a device offline at
 * the moment of a deliberate re-open can later replay its OWN earlier "resolve"
 * op and silently flip the flag closed again — last write wins, with no signal
 * to arbitrate two genuine, differently-timed user intents. Accepted for the
 * same reason the latch carries no base echo at all: the cost of losing is one
 * extra tap on a note already visible in the queue, never lost content, and a
 * single-user-multi-device household (today's only case) rarely produces the
 * race in the first place.
 */
const resolveFlag: Handler = async (tx, entry) => {
  const parsed = flagResolvePatchSchema.safeParse(entry.data ?? {});
  if (!parsed.success) return deadLetter(`schema: ${summarizeIssues(parsed.error)}`);

  // No household check: today's server serves exactly one household (S-14
  // groundwork, not a live sharing flow), so there is no OTHER household's flag
  // to reach. Add the scope check here the moment that stops being true — the
  // same deferral already recorded for household_id/car_id re-homing (D-038).
  const rows = await tx.select().from(flags).where(eq(flags.id, entry.id)).for('update');
  const row = rows[0] as Record<string, unknown> | undefined;
  if (row === undefined) return deadLetter('resolve for unknown flag');

  const resolving = parsed.data.resolved_at !== null;
  if (resolving === (row['resolved_at'] != null)) return { outcome: 'noop' };

  await tx
    .update(flags)
    .set({ resolved_at: resolving ? sql`now()` : null })
    .where(eq(flags.id, entry.id));
  return { outcome: 'applied', flagKinds: [] };
};

/**
 * The exhaustive registry: (table, op) → handler. The upload pipeline
 * dead-letters anything absent from this map.
 */
export const registry: ReadonlyMap<string, Handler> = new Map([
  ['cars:PUT', makePut(carsConfig)],
  ['cars:PATCH', makePatch(carsConfig)],
  ['cars:DELETE', makeDelete(carsConfig)],
  ['odometer_readings:PUT', makePut(readingsConfig)],
  ['odometer_readings:PATCH', makePatch(readingsConfig)],
  ['odometer_readings:DELETE', makeDelete(readingsConfig)],
  ['flags:PATCH', resolveFlag],
]);
