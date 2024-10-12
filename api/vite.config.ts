import { defineConfig } from 'vitest/config';
import { viteNodePreset } from '@shantry/vite-node-preset';

export default defineConfig({
  plugins: [
    viteNodePreset({
      entry: './src/index.ts',
    }),
  ],
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
