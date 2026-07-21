import { describe, expect, it } from 'vitest';
import {
  addDays,
  compareCivilDates,
  cycleAnchor,
  daysInMonth,
  formatCivilDate,
  fromOrdinal,
  isCivilDate,
  isLeapYear,
  parseCivilDate,
  toOrdinal,
} from '../src/index.js';

describe('parse / validate', () => {
  it('accepts real dates', () => {
    expect(parseCivilDate('2026-07-21')).toEqual({ year: 2026, month: 7, day: 21 });
    expect(isCivilDate('2024-02-29')).toBe(true); // leap day
  });

  it('rejects malformed shapes', () => {
    for (const bad of ['2026-7-21', '26-07-21', '2026/07/21', '2026-07-21T00:00', '', 'not a date']) {
      expect(isCivilDate(bad), bad).toBe(false);
    }
  });

  it('rejects impossible dates', () => {
    for (const bad of ['2026-02-29', '2026-13-01', '2026-00-10', '2026-04-31', '2026-01-00']) {
      expect(isCivilDate(bad), bad).toBe(false);
      expect(() => parseCivilDate(bad)).toThrow(RangeError);
    }
  });
});

describe('calendar rules', () => {
  it('leap years: divisible by 4, except centuries, except every 400', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
  });

  it('daysInMonth follows the leap rule', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
    expect(() => daysInMonth(2026, 13)).toThrow(RangeError);
    expect(() => daysInMonth(2026, 0)).toThrow(RangeError);
  });
});

describe('addDays (pure integer math, Spike Ⓒ vector 07)', () => {
  it('rolls months, years and leap days', () => {
    expect(addDays('2026-06-12', 38)).toBe('2026-07-20');
    expect(addDays('2024-02-28', 2)).toBe('2024-03-01'); // leap year
    expect(addDays('2023-02-28', 2)).toBe('2023-03-02'); // non-leap
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('subtracts across boundaries', () => {
    expect(addDays('2024-03-01', -2)).toBe('2024-02-28');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('rejects fractional day counts and invalid dates', () => {
    expect(() => addDays('2026-06-12', 1.5)).toThrow(RangeError);
    expect(() => addDays('2026-02-29', 1)).toThrow(RangeError);
  });
});

describe('ordinal round-trip', () => {
  it('round-trips across a wide range', () => {
    for (const iso of ['1950-01-01', '1999-12-31', '2000-02-29', '2026-07-21', '2099-12-31']) {
      expect(fromOrdinal(toOrdinal(parseCivilDate(iso)))).toBe(iso);
    }
  });

  it('consecutive days differ by exactly one ordinal', () => {
    const a = toOrdinal(parseCivilDate('2026-02-28'));
    const b = toOrdinal(parseCivilDate('2026-03-01'));
    expect(b - a).toBe(1);
  });
});

describe('compare / format', () => {
  it('compares chronologically', () => {
    expect(compareCivilDates('2026-01-31', '2026-02-01')).toBe(-1);
    expect(compareCivilDates('2026-02-01', '2026-02-01')).toBe(0);
    expect(compareCivilDates('2027-01-01', '2026-12-31')).toBe(1);
  });

  it('formats with fixed-width zero padding', () => {
    expect(formatCivilDate({ year: 987, month: 3, day: 5 })).toBe('0987-03-05');
  });

  it('refuses to mint invalid CivilDate strings (validate at construction)', () => {
    expect(() => formatCivilDate({ year: 2026, month: 2, day: 31 })).toThrow(RangeError);
    expect(() => formatCivilDate({ year: 2026, month: 13, day: 1 })).toThrow(RangeError);
    expect(() => formatCivilDate({ year: 2026.5, month: 3, day: 1 })).toThrow(RangeError);
    expect(() => formatCivilDate({ year: 2026, month: 3, day: 1.5 })).toThrow(RangeError);
    expect(() => formatCivilDate({ year: 10000, month: 1, day: 1 })).toThrow(RangeError);
    expect(() => formatCivilDate({ year: -1, month: 1, day: 1 })).toThrow(RangeError);
  });
});

describe('cycleAnchor (inv.13 / inv.24: clamp on short months, never decay)', () => {
  it('clamps a 31st anchor on short months and recovers on long ones', () => {
    expect(cycleAnchor(2026, 1, 31)).toBe('2026-01-31');
    expect(cycleAnchor(2026, 2, 31)).toBe('2026-02-28');
    expect(cycleAnchor(2028, 2, 31)).toBe('2028-02-29'); // leap Feb
    expect(cycleAnchor(2026, 3, 31)).toBe('2026-03-31'); // never decays
  });

  it('rejects out-of-range anchors', () => {
    expect(() => cycleAnchor(2026, 1, 0)).toThrow(RangeError);
    expect(() => cycleAnchor(2026, 1, 32)).toThrow(RangeError);
    expect(() => cycleAnchor(2026, 1, 15.5)).toThrow(RangeError);
  });

  it('rejects non-integer year/month (inherits formatCivilDate validation)', () => {
    expect(() => cycleAnchor(2026.5, 3, 31)).toThrow(RangeError);
    expect(() => cycleAnchor(2026, 2.5, 31)).toThrow(RangeError);
  });
});
