/**
 * Canonical Postgres schema (Drizzle). Three schema-time obligations bind
 * from this FIRST migration because they cannot be retrofitted (D-033):
 *
 * - S-14 household non-preclusion (D-007): every record belongs to a
 *   household and carries actor attribution (`updated_by`). Single-user
 *   today means one household with one member — extension, not rewrite.
 * - S-2 per-record versioning: `record_version` (server-bumped on every
 *   accepted write, synced down) replaces the legacy `revision`; equality is
 *   id + record_version, so remote edits invalidate equality like local ones.
 * - S-3 derived-never-sync: there is NO `current_odo` column anywhere — a
 *   car's current odometer is derived from the reading trail
 *   (`deriveCurrentOdometerKm`), which deletes that whole conflict class.
 *
 * `column_versions` is the per-column attribution ledger for the base_version
 * protocol (S-5/D-023): { column: { v: record_version of last change, by:
 * writing device } }. Server bookkeeping — never synced to clients.
 *
 * Property keys are deliberately snake_case, identical to the SQL column and
 * wire names, so upload handlers need no mapping layer between PowerSync
 * CrudEntry data and rows.
 */

import { bigint, index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/** { column: { v, by } } — see module doc. */
export type ColumnVersions = Record<string, { v: number; by: string | null }>;

export const households = pgTable('households', {
  id: text('id').primaryKey(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const cars = pgTable(
  'cars',
  {
    id: text('id').primaryKey(),
    household_id: text('household_id')
      .notNull()
      .references(() => households.id),
    make: text('make').notNull(),
    model: text('model').notNull(),
    nickname: text('nickname'),
    plate: text('plate'),
    fuel_type: text('fuel_type').notNull(),
    year: integer('year'),
    tank_capacity_l: integer('tank_capacity_l'),
    initial_odometer_km: integer('initial_odometer_km'),
    archived_at: timestamp('archived_at', { withTimezone: true }),
    record_version: bigint('record_version', { mode: 'number' }).notNull().default(1),
    column_versions: jsonb('column_versions').$type<ColumnVersions>().notNull().default({}),
    updated_by: text('updated_by'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('cars_household_idx').on(t.household_id)],
);

export const odometer_readings = pgTable(
  'odometer_readings',
  {
    id: text('id').primaryKey(),
    household_id: text('household_id')
      .notNull()
      .references(() => households.id),
    car_id: text('car_id')
      .notNull()
      .references(() => cars.id),
    reading_km: integer('reading_km').notNull(),
    /** Civil YYYY-MM-DD string (@koi/domain civil-date discipline) — never a timestamp. */
    recorded_date: text('recorded_date').notNull(),
    /** Nullable: §B1 `source?` (manual / fuel / imported; nil = legacy). */
    source: text('source'),
    device_id: text('device_id'),
    record_version: bigint('record_version', { mode: 'number' }).notNull().default(1),
    column_versions: jsonb('column_versions').$type<ColumnVersions>().notNull().default({}),
    updated_by: text('updated_by'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('odometer_readings_car_idx').on(t.car_id),
    index('odometer_readings_household_idx').on(t.household_id),
  ],
);

/**
 * Synced violation flags (D-022/D-023): accept-with-2xx, flag, never reject.
 * Written in the SAME transaction as the data they attribute, so the
 * checkpoint carries both. `household_id` is nullable on purpose — writing a
 * flag must never be the thing that fails (e.g. a dead-lettered op for an
 * unknown household still gets flagged). `resolved_at` is groundwork for the
 * S-4 client review queue.
 */
export const flags = pgTable(
  'flags',
  {
    id: text('id').primaryKey(),
    household_id: text('household_id'),
    record_table: text('record_table').notNull(),
    record_id: text('record_id').notNull(),
    car_id: text('car_id'),
    column_name: text('column_name'),
    kind: text('kind').notNull(),
    message: text('message').notNull(),
    displaced_value: jsonb('displaced_value'),
    incoming_value: jsonb('incoming_value'),
    base_version: bigint('base_version', { mode: 'number' }),
    record_version: bigint('record_version', { mode: 'number' }),
    actor: text('actor'),
    device_id: text('device_id'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolved_at: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => [
    index('flags_household_idx').on(t.household_id),
    index('flags_record_idx').on(t.record_table, t.record_id),
  ],
);

/**
 * Server-only (never in sync rules). Any op the write-path does not
 * explicitly handle-and-persist lands here with its FULL payload — a silent
 * skip would be silent data loss the moment the client clears its queue on
 * 2xx (Spike ② finding). Each dead letter gets a paired synced flag so the
 * user learns about it.
 */
export const dead_letters = pgTable('dead_letters', {
  id: text('id').primaryKey(),
  household_id: text('household_id'),
  op: text('op').notNull(),
  record_table: text('record_table').notNull(),
  record_id: text('record_id'),
  payload: jsonb('payload').notNull(),
  reason: text('reason').notNull(),
  actor: text('actor'),
  device_id: text('device_id'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
