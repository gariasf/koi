// @koi/i18n lint: typescript-eslint recommended plus the one ban this package
// exists to enforce. It is the LOCALE layer, so it is allowed month names and
// unit suffixes — but not Intl, and not the locale methods that reach it. Intl
// applies minimumGroupingDigits: 2 (four-digit values silently lose their
// separator) and is not uniform across engines; both are correctness failures in
// a ledger, not style. See src/format.ts.
import tseslint from 'typescript-eslint';

const EDGE = 'locale edge (amendments §C):';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'Intl',
          message: `${EDGE} Intl drops the separator on four-digit values (minimumGroupingDigits: 2) and is not engine-uniform. Format through @koi/domain's formatAmount.`,
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name=/^toLocale/]",
          message: `${EDGE} never toLocaleString for a Koi figure — 1148, not 1.148.`,
        },
        {
          selector: "MemberExpression[object.name='globalThis'][property.name='Intl']",
          message: `${EDGE} globalThis member access does not escape the ban.`,
        },
      ],
    },
  },
);
