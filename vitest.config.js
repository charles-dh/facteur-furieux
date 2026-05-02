import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // jsdom — Phaser modules read `window`/`navigator` at import time, so
    // any test that imports Phaser (directly or transitively) needs a DOM.
    environment: 'jsdom',
    // Stub HTMLCanvasElement.getContext so Phaser's CanvasFeatures probe
    // doesn't crash. See tests/setup.ts.
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{js,ts}', 'src/**/*.test.{js,ts}']
  }
});
