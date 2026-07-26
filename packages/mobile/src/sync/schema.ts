/**
 * The PowerSync client schema — the client half of the contracts the write-path
 * already enforces. It mirrors `infra/powersync/sync_rules.yaml` column for
 * column (the reference client is `packages/server/sync-tests/helpers.ts`), and
 * every difference from the server's own tables is deliberate:
 *
 *  - **`trackPrevious: true`** on both record tables. That is what makes the
 *    base_version protocol work at all (D-037): PowerSync attaches the row a
 *    write was based on, the connector forwards it as `old`, and the server reads
 *    `old.record_version` as the base for per-column conflict analysis. Without
 *    it every edit looks baseless and same-column overwrites silently LWW.
 *  - **`record_version` IS a column.** It syncs down (S-2) and is echoed back as
 *    the base. It also rides along in the undo re-INSERT's payload, which the
 *    server accepts-and-ignores.
 *  - **NO `deleted_at` column, anywhere.** Under bucket-filter (D-046) the
 *    buckets carry only live rows, so a delete arrives as a checkpoint
 *    ROW-REMOVAL and a client never holds a tombstone. Nothing here filters
 *    `deleted_at IS NULL`, because there is nothing to filter.
 *  - **No `archived_at`.** It is not in the sync rules yet; a column visible
 *    locally but strict-rejected on upload is a dead-letter trap. It joins with
 *    its write flow. `resolved_at` DID join, with the S-4 resolve flow (D-047).
 *
 * `app_meta` is local-only: this device's own identity never leaves it as a
 * record (it travels as the `deviceId` in the upload envelope, which is what the
 * per-column attribution ledger stores).
 */

import { Schema, Table, column } from '@powersync/common';

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

/**
 * Server-authored evidence for the S-4 queue. `resolved_at` is the one field a
 * client writes (D-047); `record_version` here is the version of the FLAGGED
 * record, not of the flag. `displaced_value`/`incoming_value` arrive as JSON
 * text (`{"value": …}`) and carry what a deleted row can no longer show.
 */
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
  resolved_at: column.text,
};

/** Device-local key/value: never synced, never uploaded. */
const appMetaColumns = { value: column.text };

export const koiSchema = new Schema({
  cars: new Table(carColumns, { trackPrevious: true }),
  odometer_readings: new Table(readingColumns, { trackPrevious: true }),
  flags: new Table(flagColumns),
  app_meta: new Table(appMetaColumns, { localOnly: true }),
});

/**
 * Columns the server accepts on a PATCH — see `writableColumns` in handlers.ts.
 * A Map, not a plain object: `record_table` reaches this lookup as data synced
 * from the server (a flag row), so an object literal would let a value like
 * `"constructor"` resolve through the prototype chain instead of missing cleanly.
 */
export const PATCHABLE_COLUMNS: ReadonlyMap<string, readonly string[]> = new Map([
  // household_id and car_id are deliberately absent: re-homing is not a
  // supported edit and a PATCH carrying either dead-letters loudly (D-038).
  [
    'cars',
    [
      'make',
      'model',
      'nickname',
      'plate',
      'fuel_type',
      'year',
      'tank_capacity_l',
      'initial_odometer_km',
    ],
  ],
  ['odometer_readings', ['reading_km', 'recorded_date', 'source', 'device_id']],
]);
