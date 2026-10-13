import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static site: `vite build` (client) + `vite build --ssr` (renderer) + scripts/prerender.mjs writes one HTML per route.
export default defineConfig({
  plugins: [react()],
  envPrefix: 'VITE_',
  build: { assetsInlineLimit: 0, ssrEmitAssets: true },
});
