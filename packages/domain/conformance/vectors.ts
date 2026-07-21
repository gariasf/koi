/**
 * Spike Ⓒ golden vectors, re-pointed at the real @koi/domain implementation.
 *
 * The canonical JSON these produce must stay byte-identical to the spike's
 * locked output (conformance/golden.json — md5
 * f93b1d6b1717043d97f16b0a17416681, 720 bytes incl. trailing newline) across
 * V8, JSC and Hermes. A diff here is a cross-engine-convergence event to
 * investigate (D-025/D-030), never a fixture to update casually.
 *
 * Inputs and output shaping are the spike's, verbatim; only the computation
 * now goes through the real domain API.
 */
import {
  parseAmount,
  formatAmount,
  toMinorUnits,
  isSafeMinorUnits,
  sumMinorUnits,
  economyL100km,
  addDays,
  cycleAnchor,
  normalizeNfc,
  sortForMerge,
  sortIds,
} from '../src/index.js';
import type { NumberSeparators } from '../src/index.js';

/** es-ES separator convention — the spec's design-default format (§H3). */
const ES: NumberSeparators = { decimal: ',', group: '.' };

/** Spike shaping: economy readouts rendered at one decimal, null preserved. */
function round1(value: number | null): string | null {
  return value === null ? null : value.toFixed(1);
}

export function buildVectorResults(): Record<string, unknown> {
  const results: Record<string, unknown> = {};

  results['01_money_parse'] = ['1.234,56', '20.000', '1,5', '0,60', '1.000.000,00', '20.000,50'].map(
    (s) => parseAmount(s, ES),
  );

  results['02_money_fmt'] = [
    formatAmount(1234.56, 2, ES),
    formatAmount(20000, 2, ES),
    formatAmount(1000000, 0, ES),
    formatAmount(6.9, 1, ES),
    formatAmount(-42.5, 2, ES),
    formatAmount(0, 2, ES),
  ];

  results['03_euros_to_cents'] = [
    toMinorUnits(68.4),
    toMinorUnits(0.1 + 0.2),
    toMinorUnits(1.005),
    toMinorUnits(999999.99),
  ];

  results['04_minor_unit_sum'] = (() => {
    const sum = sumMinorUnits([1999, 2001, 4550, 68400, 12345]);
    return { sum, safe: isSafeMinorUnits(sum) };
  })();

  results['05_safe_integer_edge'] = [isSafeMinorUnits(9007199254740991), isSafeMinorUnits(9007199254740992)];

  results['06_economy'] = [
    round1(economyL100km(44.1, 378, false)),
    round1(economyL100km(26.08, 378, false)),
    economyL100km(30, 400, true),
    economyL100km(30, 0, false),
  ];

  results['07_civil_date_add'] = [
    addDays('2026-06-12', 38),
    addDays('2024-02-28', 2),
    addDays('2023-02-28', 2),
    addDays('2026-12-31', 1),
  ];

  results['08_cap_cycle_anchor'] = ['2026-01', '2026-02', '2026-04', '2028-02'].map((ym) => {
    const parts = ym.split('-');
    return cycleAnchor(Number(parts[0]), Number(parts[1]), 31);
  });

  results['09_codepoint_sort'] = sortForMerge([
    'Zürich',
    'abaco',
    'Ábaco',
    'Äpfel',
    'apple',
    'Öl',
    'zoo',
    'Ábaco',
  ]);

  results['10_nfc_normalize'] = (() => {
    const composed = 'Á'; // Á precomposed
    const decomposed = 'Á'; // A + combining acute
    const normalized = normalizeNfc(decomposed);
    return { equal: normalized === composed, len: normalized.length, cp: normalized.charCodeAt(0) };
  })();

  results['11_uuidv7_sort'] = sortIds([
    '0192f1a2-0000-7000-8000-000000000003',
    '0192f1a1-0000-7000-8000-000000000001',
    '0192f1a1-9999-7000-8000-000000000002',
  ]);

  // Stable key order for byte-identical output (as in the spike).
  const ordered: Record<string, unknown> = {};
  for (const key of Object.keys(results).sort()) {
    ordered[key] = results[key];
  }
  return ordered;
}

export function renderCanonicalVectors(): string {
  return JSON.stringify(buildVectorResults());
}
