/**
 * The base_version per-column protocol (S-5, D-023) — pure planning core.
 *
 * Every synced row carries `record_version` (S-2), bumped by the server on
 * each accepted write and synced down. Clients echo the version their edit
 * was based on (PowerSync `trackPrevious` → `CrudEntry.previousValues.
 * record_version`, sent as `old.record_version`). Server-side,
 * `column_versions` records for each column the record_version at which it
 * last changed and which device wrote it.
 *
 * A changed column is a CONFLICT when all of:
 *   1. the client declared a base (echo present),
 *   2. the column changed after that base (column version > base_version),
 *   3. that change came from a DIFFERENT device — a device's own sequential
 *      offline edits arrive in order and must never self-conflict,
 *   4. the values actually differ — two devices writing the same value agree,
 *      and agreement is not a conflict.
 *
 * Resolution (never silent LWW): the incoming value is applied — arrival
 * order decides the column value so every replica converges — and the
 * displaced value is preserved in a violation flag committed atomically with
 * the data. The user decides in the S-4 review queue; nothing is lost.
 * Disjoint-column concurrent edits merge with no flag: that distinction is
 * exactly what row-level versioning could not express (Spike ② k3).
 */

export interface ColumnWrite {
  /** record_version at which this column last changed. */
  readonly v: number;
  /** Device that wrote it; null when unknown (server-side writes, fixtures). */
  readonly by: string | null;
}

export type ColumnVersions = Record<string, ColumnWrite>;

export interface PatchInput {
  /** Current row values, keyed by wire/column name (writable columns only). */
  readonly current: Record<string, unknown>;
  readonly columnVersions: ColumnVersions;
  readonly recordVersion: number;
  /** Changed columns as sent by the client (PowerSync PATCH opData). */
  readonly incoming: Record<string, unknown>;
  /** The record_version echo; null when the client sent none. */
  readonly baseVersion: number | null;
  readonly deviceId: string | null;
}

export interface ColumnConflict {
  readonly column: string;
  readonly displacedValue: unknown;
  readonly incomingValue: unknown;
  readonly displacedWriterDevice: string | null;
  readonly displacedAtVersion: number;
}

export interface PatchPlan {
  /** True when every incoming value already equals the row (idempotent replay). */
  readonly noop: boolean;
  readonly newVersion: number;
  readonly changedColumns: readonly string[];
  readonly conflicts: readonly ColumnConflict[];
  /**
   * True when a change arrived without a usable base echo AND some changed
   * column was last written by a different device — i.e. a displacement
   * that genuinely cannot be attributed. A device editing rows only it has
   * touched (the ordinary offline create-then-edit flow, where the local
   * row has no record_version yet) never raises this.
   */
  readonly missingBase: boolean;
  /** Post-apply column_versions (merged). */
  readonly columnVersions: ColumnVersions;
}

const norm = (v: unknown): unknown => (v === undefined ? null : v);

export function valuesEqual(a: unknown, b: unknown): boolean {
  return Object.is(norm(a), norm(b));
}

export function planPatch(input: PatchInput): PatchPlan {
  const changedColumns = Object.keys(input.incoming).filter(
    (column) => !valuesEqual(input.incoming[column], input.current[column]),
  );

  if (changedColumns.length === 0) {
    return {
      noop: true,
      newVersion: input.recordVersion,
      changedColumns: [],
      conflicts: [],
      missingBase: false,
      columnVersions: input.columnVersions,
    };
  }

  const newVersion = input.recordVersion + 1;
  // A base from the future (backup restore, garbled echo) is exactly as
  // uninterpretable as a missing one — degrade it to the missing-base path
  // instead of letting `last.v > base` go silently false for every column.
  const base =
    input.baseVersion !== null && input.baseVersion <= input.recordVersion
      ? input.baseVersion
      : null;
  const conflicts: ColumnConflict[] = [];
  const merged: ColumnVersions = { ...input.columnVersions };
  let unattributableDisplacement = false;

  for (const column of changedColumns) {
    const last = input.columnVersions[column];
    const sameDevice = last?.by !== null && last?.by !== undefined && last.by === input.deviceId;
    if (base !== null && last !== undefined && last.v > base && !sameDevice) {
      conflicts.push({
        column,
        displacedValue: norm(input.current[column]),
        incomingValue: norm(input.incoming[column]),
        displacedWriterDevice: last.by,
        displacedAtVersion: last.v,
      });
    }
    if (base === null && last !== undefined && !sameDevice) {
      unattributableDisplacement = true;
    }
    merged[column] = { v: newVersion, by: input.deviceId };
  }

  return {
    noop: false,
    newVersion,
    changedColumns,
    conflicts,
    missingBase: base === null && unattributableDisplacement,
    columnVersions: merged,
  };
}

/**
 * A PUT whose id already exists (UUIDv7 collision, or replay racing a remote
 * edit — no base to attribute against). The incoming full row is asserted,
 * and one flag preserves the displaced snapshot of every column it changes.
 * Absent writable columns are treated as null: a PowerSync PUT carries all
 * non-null columns, so absence means null.
 */
export interface PutOnExistingPlan {
  readonly noop: boolean;
  readonly newVersion: number;
  readonly changedColumns: readonly string[];
  readonly displacedSnapshot: Record<string, unknown>;
  readonly columnVersions: ColumnVersions;
}

export function planPutOnExisting(input: {
  readonly current: Record<string, unknown>;
  readonly columnVersions: ColumnVersions;
  readonly recordVersion: number;
  readonly incoming: Record<string, unknown>;
  readonly writableColumns: readonly string[];
  readonly deviceId: string | null;
}): PutOnExistingPlan {
  const changedColumns = input.writableColumns.filter(
    (column) => !valuesEqual(input.incoming[column], input.current[column]),
  );

  if (changedColumns.length === 0) {
    return {
      noop: true,
      newVersion: input.recordVersion,
      changedColumns: [],
      displacedSnapshot: {},
      columnVersions: input.columnVersions,
    };
  }

  const newVersion = input.recordVersion + 1;
  const displacedSnapshot: Record<string, unknown> = {};
  const merged: ColumnVersions = { ...input.columnVersions };
  for (const column of changedColumns) {
    displacedSnapshot[column] = norm(input.current[column]);
    merged[column] = { v: newVersion, by: input.deviceId };
  }

  return { noop: false, newVersion, changedColumns, displacedSnapshot, columnVersions: merged };
}

/**
 * The tombstone column — a first-class attributed column in the ledger (S-6,
 * D-039). Its `column_versions` entry is bumped by every DELETE (LIVE→tombstone)
 * and every resurrection (tombstone→LIVE), so a delete-vs-edit race and a
 * delete-vs-undo race are both just base_version conflicts over this column.
 */
export const DELETED_AT = 'deleted_at';

/**
 * A DELETE conflict: a column another device changed after the deleter's base.
 * The deleter acted on stale data — the delete still applies (delete wins
 * visibility, D-043) but the concurrent change is surfaced for review, never
 * silently buried in the tombstone. `deleted_at` itself is scanned, so a stale
 * delete that would reverse a concurrent undo is caught too (F13).
 */
export interface DeleteConflict {
  readonly column: string;
  readonly writerDevice: string | null;
  readonly atVersion: number;
}

export interface DeletePlan {
  /** Row already tombstoned → idempotent replay / agreement. */
  readonly noop: boolean;
  readonly newVersion: number;
  readonly conflicts: readonly DeleteConflict[];
  /**
   * True when the DELETE arrived without a usable base AND some column was last
   * written by a different device — an unattributable concurrent change, the
   * DELETE analogue of planPatch.missingBase. The tombstone still applies.
   */
  readonly missingBase: boolean;
  /** Post-apply column_versions, with deleted_at bumped to newVersion. */
  readonly columnVersions: ColumnVersions;
}

/**
 * Plan a DELETE (S-6): tombstone the row, detecting concurrent foreign changes
 * the deleter did not observe. Mirrors planPatch's base/same-device/future-base
 * discipline. `current`/`incoming` value comparison is NOT needed — a delete
 * displaces nothing value-wise (values stay in the tombstoned row); the scan is
 * purely over the attribution ledger.
 */
export function planDelete(input: {
  readonly alreadyDeleted: boolean;
  readonly columnVersions: ColumnVersions;
  readonly recordVersion: number;
  readonly baseVersion: number | null;
  readonly deviceId: string | null;
  /** Columns to scan for concurrent edits (writable columns; deleted_at is added). */
  readonly scanColumns: readonly string[];
}): DeletePlan {
  if (input.alreadyDeleted) {
    return {
      noop: true,
      newVersion: input.recordVersion,
      conflicts: [],
      missingBase: false,
      columnVersions: input.columnVersions,
    };
  }

  const newVersion = input.recordVersion + 1;
  // Future base (backup restore, garbled echo) is as uninterpretable on a
  // DELETE as on a PATCH — degrade to the missing-base path (planPatch parity).
  const base =
    input.baseVersion !== null && input.baseVersion <= input.recordVersion
      ? input.baseVersion
      : null;

  const conflicts: DeleteConflict[] = [];
  let unattributable = false;
  // deleted_at is scanned so a stale delete that would silently reverse a
  // concurrent resurrection (undo) is caught (F13); the row's live columns are
  // scanned so a car-delete cascade / individual delete over an edit another
  // device made after the deleter's base is surfaced (F02/F06).
  const columns = [...input.scanColumns, DELETED_AT];
  for (const column of columns) {
    const last = input.columnVersions[column];
    if (last === undefined) continue;
    const sameDevice = last.by !== null && last.by === input.deviceId;
    if (sameDevice) continue;
    if (base !== null && last.v > base) {
      conflicts.push({ column, writerDevice: last.by, atVersion: last.v });
    } else if (base === null) {
      unattributable = true;
    }
  }

  return {
    noop: false,
    newVersion,
    conflicts,
    missingBase: base === null && unattributable,
    columnVersions: { ...input.columnVersions, [DELETED_AT]: { v: newVersion, by: input.deviceId } },
  };
}
