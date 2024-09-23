import { defineConfig } from 'vite';
import { viteNodePreset } from '@shantry/vite-node-preset';

export default defineConfig({
  plugins: [
    viteNodePreset({
      entry: './src/index.ts',
    }),
  ],
});
