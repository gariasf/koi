// @koi/domain lint: typescript-eslint recommended plus the D-025 purity bans.
// The bans are load-bearing, not style: the domain's cross-engine byte-identical
// guarantee (Spike C, V8 == JSC == Hermes) holds only while src/ and conformance/
// stay free of ambient time, locale, timezone, randomness and crypto.
import tseslint from 'typescript-eslint';

const PURITY = 'purity (D-025):';

const purityBans = {
  'no-restricted-globals': [
    'error',
    { name: 'Date', message: `${PURITY} no ambient time in the domain. Civil dates are YYYY-MM-DD strings with integer math (src/civil-date.ts); "now" is injected by the caller.` },
    { name: 'Intl', message: `${PURITY} Intl is not uniform across engines (Hermes delegates to per-OS facilities). Locale formatting lives at the app edge.` },
    { name: 'crypto', message: `${PURITY} no crypto in the domain (Hermes lacks it). Ids are injected (IdSource).` },
    { name: 'performance', message: `${PURITY} no ambient clocks.` },
    { name: 'process', message: `${PURITY} no host environment access.` },
    { name: 'navigator', message: `${PURITY} no host environment access.` },
    { name: 'fetch', message: `${PURITY} the domain never does I/O.` },
    { name: 'XMLHttpRequest', message: `${PURITY} the domain never does I/O.` },
    { name: 'setTimeout', message: `${PURITY} the domain is synchronous and pure.` },
    { name: 'setInterval', message: `${PURITY} the domain is synchronous and pure.` },
    { name: 'queueMicrotask', message: `${PURITY} the domain is synchronous and pure.` },
    { name: 'localStorage', message: `${PURITY} the domain never touches storage.` },
  ],
  'no-restricted-imports': [
    'error',
    {
      paths: [
        { name: 'crypto', message: `${PURITY} ids are injected, never generated here.` },
        { name: 'node:crypto', message: `${PURITY} ids are injected, never generated here.` },
        { name: 'moment', message: `${PURITY} banned date lib; date-fns v4 is the only sanctioned calendar dependency.` },
        { name: 'dayjs', message: `${PURITY} banned date lib; date-fns v4 is the only sanctioned calendar dependency.` },
        { name: 'luxon', message: `${PURITY} banned date lib; date-fns v4 is the only sanctioned calendar dependency.` },
        { name: 'date-fns-tz', message: `${PURITY} no timezones in the domain - civil dates only.` },
        { name: '@date-fns/tz', message: `${PURITY} no timezones in the domain - civil dates only.` },
        { name: '@date-fns/utc', message: `${PURITY} no timezones in the domain - civil dates only.` },
        { name: 'temporal-polyfill', message: `${PURITY} Temporal refused until ~2027 (D-026).` },
        { name: '@js-temporal/polyfill', message: `${PURITY} Temporal refused until ~2027 (D-026).` },
      ],
      patterns: [
        { group: ['node:*'], message: `${PURITY} the domain must run unchanged under V8, JSC and Hermes - no Node builtins.` },
      ],
    },
  ],
  'no-restricted-syntax': [
    'error',
    { selector: "NewExpression[callee.name='Date']", message: `${PURITY} no Date construction - civil YYYY-MM-DD strings with integer math.` },
    { selector: "MemberExpression[object.name='Math'][property.name='random']", message: `${PURITY} no randomness - the domain is deterministic; ids are injected.` },
    { selector: "CallExpression[callee.property.name='localeCompare']", message: `${PURITY} collation is engine/OS-dependent - use compareCodePoints (src/ordering.ts).` },
    { selector: "CallExpression[callee.property.name=/^toLocale/]", message: `${PURITY} locale formatting lives at the app edge, never in the domain.` },
  ],
};

export default tseslint.config(
  { ignores: ['dist/**', 'dist-conformance/**', 'node_modules/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'conformance/**/*.ts'],
    rules: purityBans,
  },
);
