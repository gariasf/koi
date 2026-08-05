import { defineConfig } from 'vitest/config';

/** The locale edge is pure, so its tier is pure too — no stack, no fixtures. */
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
  },
});
