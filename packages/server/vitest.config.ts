import { defineConfig } from 'vitest/config';

/** Unit tier only — the torture tier lives behind vitest.sync.config.ts. */
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
  },
});
