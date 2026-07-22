import { describe, expect, it } from 'vitest';

import {
  ODOMETER_KM_MAX,
  checkOdometerReading,
  deriveCurrentOdometerKm,
  isValidOdometerKm,
  type OdometerObservation,
} from '../src/odometer.js';

const r = (readingKm: number, recordedDate: string): OdometerObservation => ({
  readingKm,
  recordedDate,
});

describe('isValidOdometerKm', () => {
  it('accepts the hard range 0…9,999,999 (§B2 table)', () => {
    expect(isValidOdometerKm(0)).toBe(true);
    expect(isValidOdometerKm(ODOMETER_KM_MAX)).toBe(true);
    expect(isValidOdometerKm(-1)).toBe(false);
    expect(isValidOdometerKm(ODOMETER_KM_MAX + 1)).toBe(false);
  });

  it('rejects non-integers and non-finite values', () => {
    expect(isValidOdometerKm(42000.5)).toBe(false);
    expect(isValidOdometerKm(Number.NaN)).toBe(false);
    expect(isValidOdometerKm(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe('checkOdometerReading', () => {
  const trail = [r(41000, '2026-07-01'), r(42000, '2026-07-10'), r(43000, '2026-07-20')];

  it('passes a reading that fits the trail', () => {
    expect(checkOdometerReading(trail, r(42500, '2026-07-15'))).toBeNull();
  });

  it('passes on an empty trail', () => {
    expect(checkOdometerReading([], r(1, '2026-07-15'))).toBeNull();
  });

  it('flags a same-date different-km conflict (S-5: keep both, flag)', () => {
    const v = checkOdometerReading(trail, r(42500, '2026-07-10'));
    expect(v?.kind).toBe('odometer-same-date-conflict');
    expect(v?.message).toContain('42000');
    expect(v?.message).toContain('42500');
  });

  it('does not flag an identical same-date reading (idempotent replay)', () => {
    expect(checkOdometerReading(trail, r(42000, '2026-07-10'))).toBeNull();
  });

  it('flags a later-dated reading below an earlier one (inv.9 down)', () => {
    const v = checkOdometerReading(trail, r(41500, '2026-07-25'));
    expect(v?.kind).toBe('odometer-backwards');
    expect(v?.message).toContain('43000');
  });

  it('flags an earlier-dated reading above a later one (inv.9 up)', () => {
    const v = checkOdometerReading(trail, r(45000, '2026-07-05'));
    expect(v?.kind).toBe('odometer-ahead');
    expect(v?.message).toContain('42000');
  });

  it('equal km on different dates is fine (parked car)', () => {
    expect(checkOdometerReading(trail, r(43000, '2026-07-25'))).toBeNull();
    expect(checkOdometerReading(trail, r(41000, '2026-07-05'))).toBeNull();
  });

  it('same-date conflict wins precedence over monotonicity', () => {
    // 40000 on 07-10 both conflicts with 42000 same-date and is below 41000 earlier.
    const v = checkOdometerReading(trail, r(40000, '2026-07-10'));
    expect(v?.kind).toBe('odometer-same-date-conflict');
  });

  it('returns odometer-invalid for malformed input instead of throwing', () => {
    expect(checkOdometerReading(trail, r(42.5, '2026-07-15'))?.kind).toBe('odometer-invalid');
    expect(checkOdometerReading(trail, r(-5, '2026-07-15'))?.kind).toBe('odometer-invalid');
    expect(checkOdometerReading(trail, r(42000, '2026-13-01'))?.kind).toBe('odometer-invalid');
    expect(checkOdometerReading(trail, r(42000, 'not-a-date'))?.kind).toBe('odometer-invalid');
  });

  it('skips malformed trail rows instead of throwing (imports, legacy)', () => {
    const dirty = [...trail, r(Number.NaN, '2026-07-11'), r(50000, 'garbage')];
    expect(checkOdometerReading(dirty, r(42500, '2026-07-15'))).toBeNull();
  });

  it('zero readings never join the trail (inv.8): neither checked nor checked against', () => {
    // An incoming 0 (the "unknown" import sentinel) raises nothing…
    expect(checkOdometerReading(trail, r(0, '2026-07-25'))).toBeNull();
    // …and an existing 0 cannot violate monotonicity against a real reading.
    const withZero = [...trail, r(0, '2026-07-05')];
    expect(checkOdometerReading(withZero, r(42500, '2026-07-15'))).toBeNull();
    expect(checkOdometerReading(withZero, r(41500, '2026-07-05'))).toBeNull();
  });
});

describe('deriveCurrentOdometerKm (S-3: derived, never synced)', () => {
  it('returns the newest reading (inv.11)', () => {
    expect(
      deriveCurrentOdometerKm([r(43000, '2026-07-20'), r(41000, '2026-07-01'), r(42000, '2026-07-10')]),
    ).toBe(43000);
  });

  it('backdated records never clobber a newer current (inv.11)', () => {
    expect(deriveCurrentOdometerKm([r(43000, '2026-07-20'), r(100, '2020-01-01')])).toBe(43000);
  });

  it('resolves same-date ties to the higher km, deterministically', () => {
    expect(deriveCurrentOdometerKm([r(42000, '2026-07-20'), r(42500, '2026-07-20')])).toBe(42500);
    expect(deriveCurrentOdometerKm([r(42500, '2026-07-20'), r(42000, '2026-07-20')])).toBe(42500);
  });

  it('never invents a current: empty or all-malformed trails give null', () => {
    expect(deriveCurrentOdometerKm([])).toBeNull();
    expect(deriveCurrentOdometerKm([r(Number.NaN, '2026-07-20'), r(42000, 'garbage')])).toBeNull();
  });

  it('ignores malformed rows but keeps valid ones', () => {
    expect(deriveCurrentOdometerKm([r(42000, '2026-07-10'), r(Number.NaN, '2026-07-20')])).toBe(42000);
  });

  it('zero readings never derive a current (inv.8)', () => {
    expect(deriveCurrentOdometerKm([r(42000, '2026-07-10'), r(0, '2026-07-20')])).toBe(42000);
    expect(deriveCurrentOdometerKm([r(0, '2026-07-20')])).toBeNull();
  });
});
