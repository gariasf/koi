import { defineConfig } from 'vitest/config';

/** Unit tier: the pure review/policy layer. The app-against-real-stack tier is vitest.sync.config.ts. */
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
  },
});
