/**
 * The locale edge, checked against the design's own reconciled fixture
 * (`docs/build/design/decisions.md` §B, today 28 Jul 2026) — so a formatter
 * change that would repaint a sheet fails here first.
 */

import { describe, expect, it } from 'vitest';

import {
  amount,
  approx,
  count,
  dayMonth,
  dayMonthLong,
  economy,
  fullDate,
  integer,
  km,
  kmDelta,
  kmPerDay,
  litres,
  monthLabel,
  parseKm,
  perKm,
  pricePerLitre,
  year,
} from '../src/index.js';

describe('the grouping trap this package exists to close', () => {
  it('groups four-digit values, where Intl does not', () => {
    expect(integer(1148)).toBe('1.148');
    // The bug, stated: Intl's minimumGroupingDigits is 2, so es-ES drops the
    // separator below five digits. Asserted rather than described, because this
    // is the exact call every number in the app used to make.
    expect((1148).toLocaleString('es-ES')).toBe('1148');
    expect(integer(1148)).not.toBe((1148).toLocaleString('es-ES'));
  });

  it('groups at every magnitude', () => {
    expect(integer(999)).toBe('999');
    expect(integer(1000)).toBe('1.000');
    expect(integer(91240)).toBe('91.240');
    expect(integer(142600)).toBe('142.600');
    expect(integer(9999999)).toBe('9.999.999');
  });
});

describe('the July 2026 ledger', () => {
  it('formats the month pulse', () => {
    expect(km(412)).toBe('412 km');
    expect(amount(487.9)).toBe('487,90 €');
    // 487,90 ÷ 412 = 1,1842 → 1,18 €/km. The sheets' 0,77 is the pre-correction
    // rate (318,60 ÷ 412) and survives only on sheet 08's scenery.
    expect(perKm(487.9 / 412)).toBe('1,18 €/km');
  });

  it('formats the 12 July fill', () => {
    expect(litres(26.1)).toBe('26,10 L');
    expect(amount(35.75)).toBe('35,75 €');
    expect(pricePerLitre(35.75 / 26.1)).toBe('1,370 €/L');
    expect(economy((26.1 / 378) * 100)).toBe('6,9 L/100km');
    expect(km(91240)).toBe('91.240 km');
  });

  it('formats the derived anchors', () => {
    expect(litres(72.54)).toBe('72,54 L');
    expect(kmPerDay(412 / 28)).toBe('14,7 km/day');
    // 91.240 + 14,714 × 78 days past the 12 Jul reading.
    expect(approx(km(91240 + (412 / 28) * 78))).toBe('≈92.388 km');
  });
});

describe('deltas are signed', () => {
  it('signs both directions and states zero without a sign', () => {
    expect(kmDelta(132)).toBe('+132 km');
    expect(kmDelta(6160)).toBe('+6.160 km');
    expect(kmDelta(-40)).toBe('-40 km');
    expect(kmDelta(0)).toBe('0 km');
  });
});

describe('dates', () => {
  it('formats the three shapes the surfaces use', () => {
    expect(dayMonth('2026-07-12')).toBe('12 Jul');
    expect(dayMonthLong('2026-07-12')).toBe('12 July');
    expect(fullDate('2026-08-16')).toBe('16 August 2026');
    expect(year('2020-06-01')).toBe('2020');
  });

  it('authors month labels in sentence case — the style layer uppercases', () => {
    expect(monthLabel('2026-07-12')).toBe('July');
    expect(monthLabel('2026-07-12')).not.toBe('JULY');
  });

  it('refuses anything that is not a civil date', () => {
    expect(() => dayMonth('12/07/2026')).toThrow();
    expect(() => dayMonth('2026-13-01')).toThrow();
  });
});

describe('parsing under the locale convention (inv.20)', () => {
  it('reads a grouping-only value as thousands, never as a decimal', () => {
    expect(parseKm('20.000')).toBe(20000);
    expect(parseKm('91.240')).toBe(91240);
    expect(parseKm('1.234,56')).toBe(1234.56);
  });

  it('returns null rather than NaN', () => {
    expect(parseKm('')).toBeNull();
    expect(parseKm('   ')).toBeNull();
    expect(parseKm('km')).toBeNull();
  });
});

describe('counts', () => {
  it('pluralises and groups', () => {
    expect(count(1, 'reading')).toBe('1 reading');
    expect(count(2, 'reading')).toBe('2 readings');
    expect(count(1200, 'reading')).toBe('1.200 readings');
    expect(count(2, 'thing needs', 'things need')).toBe('2 things need');
  });
});
