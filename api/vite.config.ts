import { viteNodePreset } from '@shantry/vite-node-preset';
import { prouteVitePlugin } from 'proute/plugins/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    viteNodePreset({
      entry: './src/index.ts',
    }),
    prouteVitePlugin({
      inputPath: './src/router',
      docs: {
        uiEndpoint: '/docs',
      },
    }),
  ],
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
