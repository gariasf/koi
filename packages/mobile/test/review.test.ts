/**
 * The review queue's policy and copy layer, tested without a device.
 *
 * These assertions are the honesty rules, not styling: a kind that the
 * architecture cannot un-do must never offer a restore, a deleted record must be
 * nameable from the flag payload alone (bucket-filter, D-046), and a column the
 * server would strict-reject must never be sent as a "restore" (which would
 * dead-letter the very act of reviewing).
 */

import { describe, expect, it } from 'vitest';

import { restorableColumns, restoreDisplaced, type FlagRow } from '../src/data/flags';
import {
  REVIEW_KINDS,
  namedPayloadEntries,
  payloadEntries,
  reviewKind,
  unwrapPayload,
} from '../src/review/kinds';
import { flagSubject, type FlagWithRecord } from '../src/review/naming';

import type { KoiDb, KoiTx } from '../src/data/db';

const wrap = (value: unknown): string => JSON.stringify({ value });

const flag = (over: Partial<FlagRow> = {}): FlagRow => ({
  id: 'f1',
  household_id: 'h1',
  record_table: 'odometer_readings',
  record_id: 'r1',
  car_id: 'c1',
  column_name: null,
  kind: 'column-conflict',
  message: 'Two devices edited it.',
  displaced_value: null,
  incoming_value: null,
  actor: 'owner',
  device_id: 'device-A',
  record_version: 3,
  created_at: '2026-07-25T09:00:00Z',
  resolved_at: null,
  ...over,
});

const joined = (over: Partial<FlagWithRecord> = {}): FlagWithRecord => ({
  kind: 'column-conflict',
  record_table: 'odometer_readings',
  record_id: 'r1',
  displaced_value: null,
  incoming_value: null,
  car_make: null,
  car_model: null,
  car_nickname: null,
  reading_km: null,
  reading_date: null,
  ...over,
});

describe('every flag kind the write-path can raise has a review entry', () => {
  // The kinds the server writes today: D-037/D-038 + the S-6 set (D-043) + the
  // @koi/domain violation kinds. A kind with no entry would render as "something
  // needs your attention" — safe, but not a decision the user can make.
  const SERVER_KINDS = [
    'column-conflict',
    'missing-base-version',
    'put-on-existing',
    'dead-lettered-op',
    'delete-conflict',
    'resurrected',
    'write-on-tombstone',
    'late-child',
    'edit-after-delete',
    'odometer-invalid',
    'odometer-same-date-conflict',
    'odometer-backwards',
    'odometer-ahead',
    'car-year-out-of-range',
    'car-tank-out-of-range',
    'car-odometer-out-of-range',
  ];

  it.each(SERVER_KINDS)('%s is described and offers at least one action', (kind) => {
    const entry = REVIEW_KINDS.find((k) => k.kind === kind);
    expect(entry, `no review entry for ${kind}`).toBeDefined();
    expect(entry?.actions.length ?? 0).toBeGreaterThan(0);
    expect(entry?.what).not.toBe('');
  });

  it('an unknown kind is still shown, never dropped', () => {
    const entry = reviewKind('some-future-kind');
    expect(entry.kind).toBe('some-future-kind');
    expect(entry.actions).toContain('mark-reviewed');
  });

  it('never offers to restore a record that is deleted — Koi cannot deliver it', () => {
    for (const entry of REVIEW_KINDS.filter((k) => k.presence === 'deleted')) {
      expect(entry.actions, entry.kind).not.toContain('restore-displaced');
      expect(entry.actions, entry.kind).not.toContain('open-record');
    }
  });

  it('says plainly, on every deleted-record kind, that a delete is not undone from here', () => {
    for (const entry of REVIEW_KINDS.filter((k) => k.presence === 'deleted')) {
      expect(`${entry.what} ${entry.note ?? ''}`.toLowerCase(), entry.kind).toMatch(
        /deleted|no longer|cannot/,
      );
    }
  });
});

describe('payload reading', () => {
  it('unwraps the server jsonWrap envelope', () => {
    expect(unwrapPayload(wrap({ reading_km: 90000 }))).toEqual({ reading_km: 90000 });
    expect(unwrapPayload(wrap(42))).toBe(42);
    expect(unwrapPayload(wrap(null))).toBeNull();
  });

  it('keeps unparseable evidence instead of discarding it', () => {
    expect(unwrapPayload('not json')).toBe('not json');
    expect(unwrapPayload(null)).toBeNull();
  });

  it('lists snapshot columns, and nothing for a scalar', () => {
    expect(payloadEntries({ a: 1, b: null })).toEqual([
      { column: 'a', value: 1 },
      { column: 'b', value: null },
    ]);
    expect(payloadEntries(7)).toEqual([]);
  });
});

describe('namedPayloadEntries — the one place the column-conflict scalar shape is resolved', () => {
  it('column-conflict: a bare scalar, named by column_name', () => {
    expect(namedPayloadEntries('column-conflict', 'reading_km', 70_500)).toEqual([
      { column: 'reading_km', value: 70_500 },
    ]);
  });

  it('column-conflict with no column_name has nothing to name', () => {
    expect(namedPayloadEntries('column-conflict', null, 70_500)).toEqual([]);
  });

  it('delete-conflict is ALWAYS a snapshot object, even with exactly one conflicting column — ' +
    'regression for the bug where a single-column delete-conflict got nested under its own name', () => {
    expect(namedPayloadEntries('delete-conflict', 'reading_km', { reading_km: 61_000 })).toEqual([
      { column: 'reading_km', value: 61_000 },
    ]);
  });

  it('a kind with no column_name reads the whole snapshot', () => {
    expect(
      namedPayloadEntries('put-on-existing', null, {
        reading_km: 1,
        recorded_date: '2026-01-01',
      }),
    ).toEqual([
      { column: 'reading_km', value: 1 },
      { column: 'recorded_date', value: '2026-01-01' },
    ]);
  });
});

describe('naming the record a flag is about', () => {
  it('uses the live row when it is on the device', () => {
    const subject = flagSubject(
      joined({ reading_km: 90_000, reading_date: '2026-07-21', car_nickname: 'The Golf' }),
    );
    expect(subject.absent).toBe(false);
    expect(subject.name).toContain('2026-07-21');
    expect(subject.carName).toBe('The Golf');
  });

  it('falls back to the flag payload for a deleted row, and says it is gone', () => {
    const subject = flagSubject(
      joined({ displaced_value: wrap({ reading_km: 30_500, recorded_date: '2026-07-02' }) }),
    );
    expect(subject.absent).toBe(true);
    expect(subject.name).toContain('2026-07-02');
  });

  it('never renders a blank row when there is nothing to go on', () => {
    expect(flagSubject(joined()).name).not.toBe('');
    expect(flagSubject(joined({ record_table: 'cars' })).name).not.toBe('');
  });

  it('names a car by nickname, else make and model', () => {
    expect(flagSubject(joined({ record_table: 'cars', car_nickname: 'Bluey' })).name).toBe('Bluey');
    expect(
      flagSubject(joined({ record_table: 'cars', car_make: 'VW', car_model: 'Golf' })).name,
    ).toBe('VW Golf');
  });
});

describe('what a restore is allowed to write', () => {
  it('restores one named column from a column-conflict', () => {
    expect(
      restorableColumns(
        flag({ column_name: 'reading_km', displaced_value: wrap(70_500) }),
      ),
    ).toEqual({ reading_km: 70_500 });
  });

  it('restores a snapshot, dropping columns the server would reject', () => {
    // household_id and car_id are in the server-side snapshot but are not
    // patchable (D-038) — sending them would dead-letter the review action.
    expect(
      restorableColumns(
        flag({
          kind: 'put-on-existing',
          displaced_value: wrap({
            household_id: 'h1',
            car_id: 'c1',
            reading_km: 88_000,
            recorded_date: '2026-06-01',
          }),
        }),
      ),
    ).toEqual({ reading_km: 88_000, recorded_date: '2026-06-01' });
  });

  it('offers nothing when there is nothing restorable', () => {
    expect(restorableColumns(flag())).toBeNull();
    expect(restorableColumns(flag({ displaced_value: wrap({ household_id: 'h1' }) }))).toBeNull();
    expect(restorableColumns(flag({ record_table: 'flags', column_name: 'kind' }))).toBeNull();
  });

  it('treats a multi-column delete-conflict as a snapshot, not a single column', () => {
    expect(
      restorableColumns(
        flag({
          kind: 'delete-conflict',
          column_name: 'reading_km,recorded_date',
          displaced_value: wrap({ reading_km: 61_000, recorded_date: '2026-07-03' }),
        }),
      ),
    ).toEqual({ reading_km: 61_000, recorded_date: '2026-07-03' });
  });

  it('treats a SINGLE-column delete-conflict as a snapshot too, not nested under its own name (regression)', () => {
    expect(
      restorableColumns(
        flag({
          kind: 'delete-conflict',
          column_name: 'reading_km', // no comma — exactly one conflicting column
          displaced_value: wrap({ reading_km: 61_000 }),
        }),
      ),
    ).toEqual({ reading_km: 61_000 });
  });

  it('a record_table colliding with Object.prototype resolves to nothing, not a crash', () => {
    expect(restorableColumns(flag({ record_table: 'constructor' }))).toBeNull();
    expect(restorableColumns(flag({ record_table: 'toString' }))).toBeNull();
  });
});

/** A KoiDb whose rows are fixed in advance, recording every write it is asked to make. */
function fakeDb(existingRows: readonly { id: string }[]): {
  db: KoiDb;
  executed: { sql: string; params?: unknown[] }[];
} {
  const executed: { sql: string; params?: unknown[] }[] = [];
  const tx: KoiTx = {
    execute: async (sql, params) => {
      executed.push({ sql, params });
      return null;
    },
    getAll: async <T,>() => existingRows as unknown as T[],
  };
  const db: KoiDb = {
    ...tx,
    writeTransaction: async (fn) => fn(tx),
  };
  return { db, executed };
}

describe('restoreDisplaced only reports success when a row was actually written', () => {
  it('returns false and writes nothing when the row is not on this device (deleted, bucket-filter)', async () => {
    const { db, executed } = fakeDb([]);
    const ok = await restoreDisplaced(
      db,
      flag({ column_name: 'reading_km', displaced_value: wrap(70_500) }),
    );
    expect(ok).toBe(false);
    expect(executed).toHaveLength(0);
  });

  it('returns true and writes the columns when the row is present', async () => {
    const { db, executed } = fakeDb([{ id: 'r1' }]);
    const ok = await restoreDisplaced(
      db,
      flag({ column_name: 'reading_km', displaced_value: wrap(70_500) }),
    );
    expect(ok).toBe(true);
    expect(executed).toHaveLength(1);
    expect(executed[0]?.sql).toContain('UPDATE odometer_readings SET reading_km = ?');
    expect(executed[0]?.params).toEqual([70_500, 'r1']);
  });
});
