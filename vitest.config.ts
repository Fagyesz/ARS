// Unit tests for the pure helpers in app/lib (no Hydrogen/Oxygen plugins needed).
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {'~': fileURLToPath(new URL('./app', import.meta.url))},
  },
  test: {
    include: ['app/**/*.test.ts'],
    environment: 'node',
  },
});
