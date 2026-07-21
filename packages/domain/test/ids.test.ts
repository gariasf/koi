import { describe, expect, it } from 'vitest';
import { compareIds, isUuidV7, sortIds } from '../src/index.js';

describe('isUuidV7', () => {
  it('accepts canonical lowercase v7 ids', () => {
    expect(isUuidV7('0192f1a1-0000-7000-8000-000000000001')).toBe(true);
    expect(isUuidV7('01890a5d-ac96-774b-bcce-b302099a8057')).toBe(true);
  });

  it('rejects other versions, variants, cases and shapes', () => {
    expect(isUuidV7('9b2c8f4e-3a1d-4c6b-9f2e-8d7a6b5c4d3e')).toBe(false); // v4
    expect(isUuidV7('0192f1a1-0000-7000-c000-000000000001')).toBe(false); // bad variant
    expect(isUuidV7('0192F1A1-0000-7000-8000-000000000001')).toBe(false); // uppercase
    expect(isUuidV7('0192f1a1-0000-7000-8000-00000000001')).toBe(false); // short
    expect(isUuidV7('')).toBe(false);
  });
});

describe('id ordering (v7 lexical == creation-time, Spike Ⓒ vector 11)', () => {
  it('sorts time-ordered prefixes chronologically', () => {
    expect(
      sortIds([
        '0192f1a2-0000-7000-8000-000000000003',
        '0192f1a1-0000-7000-8000-000000000001',
        '0192f1a1-9999-7000-8000-000000000002',
      ]),
    ).toEqual([
      '0192f1a1-0000-7000-8000-000000000001',
      '0192f1a1-9999-7000-8000-000000000002',
      '0192f1a2-0000-7000-8000-000000000003',
    ]);
  });

  it('compareIds is a total order and sortIds does not mutate', () => {
    expect(compareIds('a', 'a')).toBe(0);
    expect(compareIds('a', 'b')).toBe(-1);
    expect(compareIds('b', 'a')).toBe(1);
    const input = ['b', 'a'];
    sortIds(input);
    expect(input).toEqual(['b', 'a']);
  });
});
