import { describe, expect, it } from 'vitest';

import { sanitizeJson, sanitizeText } from '../src/sync/sanitize.js';

describe('sanitize (U+0000 must never reach Postgres text/jsonb)', () => {
  it('replaces NUL in strings with U+FFFD', () => {
    expect(sanitizeText('a\u0000b')).toBe('a�b');
    expect(sanitizeText('clean')).toBe('clean');
  });

  it('sanitizes deeply: nested objects, arrays and keys', () => {
    expect(
      sanitizeJson({ 'k\u0000ey': ['v\u0000', { inner: 'x\u0000y' }], n: 5, b: null }),
    ).toEqual({ 'k�ey': ['v�', { inner: 'x�y' }], n: 5, b: null });
  });

  it('leaves non-string primitives untouched', () => {
    expect(sanitizeJson(42)).toBe(42);
    expect(sanitizeJson(null)).toBeNull();
    expect(sanitizeJson(true)).toBe(true);
  });
});
