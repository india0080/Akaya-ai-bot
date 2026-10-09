import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const api = process.env.API_PROXY ?? 'http://localhost:8788';

// Dev and preview proxy /api to the backend. For a static deploy set VITE_API_URL to the backend origin.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5175, strictPort: true, host: true, proxy: { '/api': { target: api, changeOrigin: true } } },
  preview: { port: 5175, strictPort: true, host: true, proxy: { '/api': { target: api, changeOrigin: true } } },
});
