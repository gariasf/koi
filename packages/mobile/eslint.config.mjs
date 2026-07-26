// @koi/mobile lint: the same typescript-eslint baseline as the other packages,
// deliberately NOT eslint-config-expo — that config bundles its own
// @typescript-eslint, which would resolve a second copy alongside the workspace
// catalog's and give the repo two lint idioms for one codebase.
//
// The @koi/domain purity bans do not apply here: the app IS the edge that holds
// the clock, the locale and the ids, and hands them to the pure core as input.
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['ios/', 'android/', '.expo/', 'dist-conformance/', 'expo-env.d.ts'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // scripts/ and sync-tests/ run under Node, not in the app: the CI/tooling
    // half of this package legitimately has process, console and Buffer.
    files: ['scripts/**/*.mjs', 'sync-tests/**/*.ts', '*.config.ts', '*.config.mjs'],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly', Buffer: 'readonly' },
    },
  },
);
