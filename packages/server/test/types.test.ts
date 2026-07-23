import { describe, expect, it } from 'vitest';

import {
  carPatchSchema,
  carPutSchema,
  extractBaseVersion,
  readingPatchSchema,
  readingPutSchema,
  uploadBodySchema,
} from '../src/sync/types.js';

describe('wire schemas', () => {
  it('accepts a well-formed car PUT', () => {
    expect(
      carPutSchema.safeParse({ make: 'VW', model: 'Golf', fuel_type: 'petrol', nickname: null })
        .success,
    ).toBe(true);
  });

  it('rejects unknown columns instead of silently stripping them (S-10 stance)', () => {
    const r = carPutSchema.safeParse({ make: 'VW', model: 'Golf', fuel_type: 'petrol', color: 'red' });
    expect(r.success).toBe(false);
  });

  it('rejects an empty make (§B2 hard validation) so it dead-letters, never half-applies', () => {
    expect(carPutSchema.safeParse({ make: '', model: 'Golf', fuel_type: 'petrol' }).success).toBe(
      false,
    );
  });

  it('car PATCH allows any writable subset, still strict on genuinely unknown columns', () => {
    expect(carPatchSchema.safeParse({ nickname: 'Red' }).success).toBe(true);
    // A genuinely unknown column still dead-letters (S-10 stance holds).
    expect(carPatchSchema.safeParse({ color: 'red' }).success).toBe(false);
  });

  it('accepts server-managed columns clients mirror, so the undo re-INSERT never dead-letters (S-6)', () => {
    // record_version and deleted_at sync DOWN, so a full-row re-INSERT PUT
    // (undo/restore) carries them in opData; they are known server columns,
    // accepted here and ignored by the handlers (never in writableColumns).
    expect(
      carPutSchema.safeParse({
        make: 'VW',
        model: 'Golf',
        fuel_type: 'petrol',
        record_version: 4,
        deleted_at: null,
      }).success,
    ).toBe(true);
    expect(carPatchSchema.safeParse({ nickname: 'Red', record_version: 4 }).success).toBe(true);
    expect(readingPatchSchema.safeParse({ reading_km: 42100, deleted_at: null }).success).toBe(true);
  });

  it('re-homing fields are not patchable: household_id and car_id dead-letter loudly', () => {
    expect(carPatchSchema.safeParse({ household_id: 'other' }).success).toBe(false);
    expect(readingPatchSchema.safeParse({ car_id: 'other-car' }).success).toBe(false);
    expect(readingPatchSchema.safeParse({ household_id: 'other' }).success).toBe(false);
    expect(readingPatchSchema.safeParse({ reading_km: 42100 }).success).toBe(true);
  });

  it('reading PUT requires car_id, km and date', () => {
    expect(
      readingPutSchema.safeParse({ car_id: 'c1', reading_km: 42000, recorded_date: '2026-07-20' })
        .success,
    ).toBe(true);
    expect(readingPutSchema.safeParse({ car_id: 'c1', reading_km: 42000 }).success).toBe(false);
  });

  it('upload body requires deviceId and a batch', () => {
    expect(
      uploadBodySchema.safeParse({
        deviceId: 'd1',
        batch: [{ op: 'PUT', type: 'cars', id: 'c1', data: {} }],
      }).success,
    ).toBe(true);
    expect(uploadBodySchema.safeParse({ batch: [] }).success).toBe(false);
  });
});

describe('extractBaseVersion', () => {
  it('reads the record_version echo, tolerating string form', () => {
    expect(extractBaseVersion({ record_version: 3 })).toBe(3);
    expect(extractBaseVersion({ record_version: '3' })).toBe(3);
  });

  it('returns null for absent or garbled echoes', () => {
    expect(extractBaseVersion(undefined)).toBeNull();
    expect(extractBaseVersion({})).toBeNull();
    expect(extractBaseVersion({ record_version: 0 })).toBeNull();
    expect(extractBaseVersion({ record_version: 'x' })).toBeNull();
    expect(extractBaseVersion({ record_version: 2.5 })).toBeNull();
  });
});
