import { describe, expect, it } from 'vitest';

import { checkCarFields } from '../src/car.js';

const CTX = { currentYear: 2026 };

describe('checkCarFields (§B2 hard bounds, flag-never-fix)', () => {
  it('passes in-range and absent fields', () => {
    expect(checkCarFields({}, CTX)).toEqual([]);
    expect(checkCarFields({ year: null, tankCapacityL: null, initialOdometerKm: null }, CTX)).toEqual([]);
    expect(
      checkCarFields({ year: 2020, tankCapacityL: 50, initialOdometerKm: 41887 }, CTX),
    ).toEqual([]);
  });

  it('allows next year (a 2027 plate in 2026), not beyond', () => {
    expect(checkCarFields({ year: 2027 }, CTX)).toEqual([]);
    expect(checkCarFields({ year: 2028 }, CTX)[0]?.kind).toBe('car-year-out-of-range');
  });

  it('flags year below 1950 and non-integer years', () => {
    expect(checkCarFields({ year: 1949 }, CTX)[0]?.kind).toBe('car-year-out-of-range');
    expect(checkCarFields({ year: 2020.5 }, CTX)[0]?.kind).toBe('car-year-out-of-range');
  });

  it('flags tank outside 10-200 L', () => {
    expect(checkCarFields({ tankCapacityL: 9 }, CTX)[0]?.kind).toBe('car-tank-out-of-range');
    expect(checkCarFields({ tankCapacityL: 201 }, CTX)[0]?.kind).toBe('car-tank-out-of-range');
    expect(checkCarFields({ tankCapacityL: 10 }, CTX)).toEqual([]);
    expect(checkCarFields({ tankCapacityL: 200 }, CTX)).toEqual([]);
  });

  it('flags initial odometer outside the hard range', () => {
    expect(checkCarFields({ initialOdometerKm: -1 }, CTX)[0]?.kind).toBe('car-odometer-out-of-range');
    expect(checkCarFields({ initialOdometerKm: 10_000_000 }, CTX)[0]?.kind).toBe(
      'car-odometer-out-of-range',
    );
  });

  it('reports one violation per offending field', () => {
    const violations = checkCarFields({ year: 1900, tankCapacityL: 5, initialOdometerKm: -1 }, CTX);
    expect(violations.map((v) => v.kind).sort()).toEqual([
      'car-odometer-out-of-range',
      'car-tank-out-of-range',
      'car-year-out-of-range',
    ]);
  });
});
