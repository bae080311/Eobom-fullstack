import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    alias: {
      '@': resolve(__dirname, './src'),
      '@app': resolve(__dirname, './app'),
      '@shared': resolve(__dirname, './src/shared'),
      '@features': resolve(__dirname, './src/features'),
      '@entities': resolve(__dirname, './src/entities'),
      '@widgets': resolve(__dirname, './src/widgets'),
      '@eobom/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});
