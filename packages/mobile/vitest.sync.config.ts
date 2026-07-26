import { defineConfig } from 'vitest/config';

/**
 * The app-against-real-stack tier: real Postgres + PowerSync + @koi/server, with
 * @koi/mobile's own schema, connector and write functions on a @powersync/node
 * driver. Sequential — it owns the stack while it runs.
 */
export default defineConfig({
  test: {
    include: ['sync-tests/**/*.test.ts'],
    globalSetup: ['sync-tests/global-setup.ts'],
    fileParallelism: false,
    testTimeout: 300_000,
    hookTimeout: 300_000,
  },
});
