import { viteNodePreset } from '@shantry/vite-node-preset';
import { defineConfig } from 'vitest/config';

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
