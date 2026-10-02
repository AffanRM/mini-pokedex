import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Angular defaults to shared modules. Keep suite-specific Chart.js mocks separate.
    isolate: true,
  },
});
