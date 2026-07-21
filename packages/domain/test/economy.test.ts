import { describe, expect, it } from 'vitest';
import { economyL100km } from '../src/index.js';

describe('economyL100km (inv.1–3: full→full only, no number over a broken chain)', () => {
  it('computes litres per 100 km over a measured interval', () => {
    expect(economyL100km(44.1, 378, false)).toBeCloseTo(11.666, 2);
    expect(economyL100km(26.08, 378, false)).toBeCloseTo(6.899, 2);
  });

  it('missedPrevious restarts the chain: no number, never a wrong one', () => {
    expect(economyL100km(30, 400, true)).toBeNull();
  });

  it('non-positive distance yields no number', () => {
    expect(economyL100km(30, 0, false)).toBeNull();
    expect(economyL100km(30, -5, false)).toBeNull();
  });

  it('non-positive litres yields no number (entry validation hard-stops these)', () => {
    expect(economyL100km(0, 378, false)).toBeNull();
    expect(economyL100km(-1, 378, false)).toBeNull();
  });
});
