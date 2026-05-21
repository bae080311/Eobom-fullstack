import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    alias: {
      '@eobom/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});
