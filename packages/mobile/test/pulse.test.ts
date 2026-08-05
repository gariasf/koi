/**
 * Home's month pulse: the km rule, and — the part worth a test — **when the number is
 * withheld rather than reported as zero**.
 *
 * Annex A's three renderings are the thing being protected here: zero renders as a
 * number, unknown renders as a dash plus a sentence, not-applicable does not render at
 * all. A `0 km` on Home would be the invention that rule exists to prevent, so every
 * case below that cannot be measured must come back `null`, never `0`.
 */

import { describe, expect, it } from 'vitest';

import { monthDistanceKm, type CarMonthEnds } from '../src/data/pulse';

const ends = (over: Partial<CarMonthEnds>): CarMonthEnds => ({
  car_id: 'car-1',
  anchor_km: null,
  anchor_date: null,
  newest_km: null,
  newest_date: null,
  ...over,
});

describe('the km rule', () => {
  it('measures the newest reading inside the month against the anchor before it', () => {
    // The design's own July: 91.240 (12 Jul) − 90.828 (28 Jun) = 412 km.
    expect(
      monthDistanceKm([
        ends({
          anchor_km: 90828,
          anchor_date: '2026-06-28',
          newest_km: 91240,
          newest_date: '2026-07-12',
        }),
      ]),
    ).toBe(412);
  });

  it('sums across live cars', () => {
    expect(
      monthDistanceKm([
        ends({
          anchor_km: 90828,
          anchor_date: '2026-06-28',
          newest_km: 91240,
          newest_date: '2026-07-12',
        }),
        ends({
          car_id: 'car-2',
          anchor_km: 142000,
          anchor_date: '2026-06-30',
          newest_km: 142600,
          newest_date: '2026-07-20',
        }),
      ]),
    ).toBe(1012);
  });

  it('counts only the cars it can measure, and does not zero the rest', () => {
    expect(
      monthDistanceKm([
        ends({
          anchor_km: 90828,
          anchor_date: '2026-06-28',
          newest_km: 91240,
          newest_date: '2026-07-12',
        }),
        ends({ car_id: 'car-2', anchor_km: 142000, anchor_date: '2026-06-30' }),
      ]),
    ).toBe(412);
  });
});

describe('what is withheld', () => {
  it('withholds when no car has readings at all', () => {
    expect(monthDistanceKm([ends({})])).toBeNull();
  });

  it('withholds when the month has no reading inside it', () => {
    expect(monthDistanceKm([ends({ anchor_km: 90828, anchor_date: '2026-06-28' })])).toBeNull();
  });

  it('withholds when there is no anchor at or before the month start', () => {
    expect(monthDistanceKm([ends({ newest_km: 91240, newest_date: '2026-07-12' })])).toBeNull();
  });

  it('withholds when the only reading inside the month IS the anchor', () => {
    // A reading dated exactly on the month start is both ends of the same pair;
    // measuring it against itself would report 0 km for a month nobody measured.
    expect(
      monthDistanceKm([
        ends({
          anchor_km: 91240,
          anchor_date: '2026-07-01',
          newest_km: 91240,
          newest_date: '2026-07-01',
        }),
      ]),
    ).toBeNull();
  });

  it('withholds for an empty garage rather than reporting zero', () => {
    expect(monthDistanceKm([])).toBeNull();
  });
});

describe('a real zero is still a zero', () => {
  it('reports 0 km when two dated readings genuinely show no movement', () => {
    // Distinct dates, same odometer: the car really did not move, and Koi has the
    // two readings to say so. This is the one case that is a number.
    expect(
      monthDistanceKm([
        ends({
          anchor_km: 91240,
          anchor_date: '2026-06-28',
          newest_km: 91240,
          newest_date: '2026-07-12',
        }),
      ]),
    ).toBe(0);
  });
});
