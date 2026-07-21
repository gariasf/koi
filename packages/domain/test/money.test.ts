import { describe, expect, it } from 'vitest';
import {
  formatAmount,
  isSafeMinorUnits,
  parseAmount,
  sumMinorUnits,
  toMinorUnits,
  type NumberSeparators,
} from '../src/index.js';

const ES: NumberSeparators = { decimal: ',', group: '.' };
const EN: NumberSeparators = { decimal: '.', group: ',' };

describe('parseAmount (inv.20 locale-safe parsing)', () => {
  it('parses es-ES convention', () => {
    expect(parseAmount('1.234,56', ES)).toBe(1234.56);
    expect(parseAmount('20.000', ES)).toBe(20000); // never 20.0 — the 1000× class
    expect(parseAmount('0,60', ES)).toBe(0.6);
  });

  it('the same digits mean the same value under the matching convention', () => {
    expect(parseAmount('1,234.56', EN)).toBe(1234.56);
    expect(parseAmount('1.234,56', ES)).toBe(parseAmount('1,234.56', EN));
  });

  it('handles sign and plain integers', () => {
    expect(parseAmount('-42,50', ES)).toBe(-42.5);
    expect(parseAmount('7', ES)).toBe(7);
  });

  it('rejects garbage as null, never NaN and never a guess', () => {
    expect(parseAmount('', ES)).toBeNull();
    expect(parseAmount('   ', ES)).toBeNull();
    expect(parseAmount('abc', ES)).toBeNull();
    expect(parseAmount('1,2,3', ES)).toBeNull(); // two decimal marks
    expect(parseAmount('12a', ES)).toBeNull();
    expect(parseAmount('Infinity', ES)).toBeNull();
  });
});

describe('formatAmount (deterministic, Intl-free)', () => {
  it('groups and fixes decimals under the given convention', () => {
    expect(formatAmount(1234.56, 2, ES)).toBe('1.234,56');
    expect(formatAmount(1234.56, 2, EN)).toBe('1,234.56');
    expect(formatAmount(1000000, 0, ES)).toBe('1.000.000');
    expect(formatAmount(0, 2, ES)).toBe('0,00');
  });

  it('keeps the sign outside the grouping', () => {
    expect(formatAmount(-1234.5, 2, ES)).toBe('-1.234,50');
  });
});

describe('minor units (integer money)', () => {
  it('rounds exactly once and survives the IEEE-754 traps', () => {
    expect(toMinorUnits(68.4)).toBe(6840);
    expect(toMinorUnits(0.1 + 0.2)).toBe(30);
    expect(toMinorUnits(1.005)).toBe(100);
    expect(toMinorUnits(999999.99)).toBe(99999999);
  });

  it('supports non-cent minor units', () => {
    expect(toMinorUnits(1.234, 1000)).toBe(1234); // e.g. mills
  });

  it('sums integers under safe-integer guards', () => {
    expect(sumMinorUnits([1999, 2001, 4550, 68400, 12345])).toBe(89295);
    expect(sumMinorUnits([])).toBe(0);
  });

  it('throws on non-integer input instead of drifting', () => {
    expect(() => sumMinorUnits([100, 0.5])).toThrow(TypeError);
    expect(() => sumMinorUnits([Number.NaN])).toThrow(TypeError);
  });

  it('throws when the sum leaves the safe range', () => {
    expect(() => sumMinorUnits([Number.MAX_SAFE_INTEGER, 1])).toThrow(RangeError);
  });

  it('isSafeMinorUnits marks the safe-integer boundary', () => {
    expect(isSafeMinorUnits(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(isSafeMinorUnits(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
    expect(isSafeMinorUnits(12.5)).toBe(false);
  });
});
