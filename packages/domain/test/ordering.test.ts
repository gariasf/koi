import { describe, expect, it } from 'vitest';
import { compareCodePoints, compareForMerge, normalizeNfc, sortForMerge } from '../src/index.js';

describe('normalizeNfc', () => {
  it('composes decomposed sequences', () => {
    const decomposed = 'Á'; // A + combining acute
    const composed = 'Á'; // Á
    expect(decomposed.length).toBe(2); // guard: editors must not re-normalize this literal
    expect(normalizeNfc(decomposed)).toBe(composed);
    expect(normalizeNfc(decomposed).length).toBe(1);
  });
});

describe('compareCodePoints', () => {
  it('orders by code point, prefix first', () => {
    expect(compareCodePoints('a', 'b')).toBe(-1);
    expect(compareCodePoints('a', 'ab')).toBe(-1);
    expect(compareCodePoints('ab', 'a')).toBe(1);
    expect(compareCodePoints('same', 'same')).toBe(0);
  });

  it('uppercase sorts before lowercase; non-ASCII after (code-point order, not collation)', () => {
    expect(compareCodePoints('Zürich', 'abaco')).toBe(-1); // 'Z' (0x5A) < 'a' (0x61)
    expect(compareCodePoints('zoo', 'Ábaco')).toBe(-1); // 'z' (0x7A) < 'Á' (0xC1)
  });

  it('diverges from JS code-unit order exactly on astral-plane characters', () => {
    const emoji = '\u{1F600}'; // U+1F600, UTF-16 D83D DE00
    const halfwidth = '｡'; // U+FF61
    // Naive `<` compares code units: D83D < FF61 — the wrong answer for merges.
    expect(emoji < halfwidth).toBe(true);
    // Code-point order: 0x1F600 > 0xFF61.
    expect(compareCodePoints(emoji, halfwidth)).toBe(1);
  });
});

describe('sortForMerge (Spike Ⓒ vector 09 semantics)', () => {
  it('NFC-normalizes then sorts by code point', () => {
    expect(sortForMerge(['Zürich', 'abaco', 'Ábaco', 'Äpfel', 'apple', 'Öl', 'zoo', 'Ábaco'])).toEqual([
      'Zürich',
      'abaco',
      'apple',
      'zoo',
      'Ábaco',
      'Ábaco',
      'Äpfel',
      'Öl',
    ]);
  });

  it('composed and decomposed inputs land identically', () => {
    const decomposed = 'Ábaco';
    const composed = 'Ábaco';
    expect(decomposed).not.toBe(composed); // guard: editors must not re-normalize
    expect(sortForMerge([decomposed])).toEqual(sortForMerge([composed]));
    expect(compareForMerge(decomposed, composed)).toBe(0);
  });

  it('does not mutate its input', () => {
    const input = ['b', 'a'];
    sortForMerge(input);
    expect(input).toEqual(['b', 'a']);
  });
});
