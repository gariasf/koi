import { defineConfig } from 'vitest/config';

/**
 * The sync torture tier (D-013/H5): real Postgres + PowerSync + this server
 * + @powersync/node clients. Orchestrated by sync-tests/global-setup.ts;
 * sequential on purpose — scenarios share one stack.
 */
export default defineConfig({
  test: {
    include: ['sync-tests/**/*.test.ts'],
    globalSetup: ['sync-tests/global-setup.ts'],
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 300_000,
  },
});
