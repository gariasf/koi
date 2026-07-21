import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildVectorResults, renderCanonicalVectors } from '../conformance/vectors.js';

const golden = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'conformance', 'golden.json'),
  'utf8',
);

// Spike Ⓒ locked output (D-030): 720 bytes incl. trailing newline.
const SPIKE_C_MD5 = 'f93b1d6b1717043d97f16b0a17416681';

describe('Spike Ⓒ golden vectors (V8 via Vitest)', () => {
  it('golden fixture itself still carries the locked Spike Ⓒ md5', () => {
    expect(createHash('md5').update(golden).digest('hex')).toBe(SPIKE_C_MD5);
    expect(Buffer.byteLength(golden, 'utf8')).toBe(720);
  });

  it('the real domain reproduces the spike output byte-identically', () => {
    expect(renderCanonicalVectors() + '\n').toBe(golden);
  });

  // Readable spot checks so a divergence names its vector instead of just
  // failing a 720-byte string comparison.
  it('per-vector spot checks', () => {
    const r = buildVectorResults();
    expect(r['01_money_parse']).toEqual([1234.56, 20000, 1.5, 0.6, 1000000, 20000.5]);
    expect(r['02_money_fmt']).toEqual(['1.234,56', '20.000,00', '1.000.000', '6,9', '-42,50', '0,00']);
    expect(r['03_euros_to_cents']).toEqual([6840, 30, 100, 99999999]);
    expect(r['04_minor_unit_sum']).toEqual({ sum: 89295, safe: true });
    expect(r['05_safe_integer_edge']).toEqual([true, false]);
    expect(r['06_economy']).toEqual(['11.7', '6.9', null, null]);
    expect(r['07_civil_date_add']).toEqual(['2026-07-20', '2024-03-01', '2023-03-02', '2027-01-01']);
    expect(r['08_cap_cycle_anchor']).toEqual(['2026-01-31', '2026-02-28', '2026-04-30', '2028-02-29']);
    expect(r['10_nfc_normalize']).toEqual({ equal: true, len: 1, cp: 193 });
    expect(r['11_uuidv7_sort']).toEqual([
      '0192f1a1-0000-7000-8000-000000000001',
      '0192f1a1-9999-7000-8000-000000000002',
      '0192f1a2-0000-7000-8000-000000000003',
    ]);
  });
});
