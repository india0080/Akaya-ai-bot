import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

/** Standalone build: inline the favicon and drop the touch icon so nothing is fetched from disk. */
function inlineIcons(): Plugin {
  return {
    name: 'akaya-inline-icons',
    transformIndexHtml(html) {
      const svg = readFileSync(new URL('./public/favicon.svg', import.meta.url), 'utf8');
      return html
        .replace('href="./favicon.svg"', `href="data:image/svg+xml,${encodeURIComponent(svg)}"`)
        .replace(/\s*<link rel="apple-touch-icon"[^>]*>/, '');
    },
  };
}

// `npm run build`             -> installable PWA in dist/
// `npm run build:standalone`  -> one self-contained HTML file in dist-standalone/ (opens via double-click)
// `npm run build:android`     -> dist/ without the service worker, synced into android/ by Capacitor
export default defineConfig(({ mode }) => {
  const standalone = mode === 'standalone';
  const android = mode === 'android';
  return {
    base: './',
    plugins: [
      react(),
      standalone
        ? [viteSingleFile(), inlineIcons()]
        : android
          ? [] // the APK bundles its files; a service worker would only add stale-cache risk
          : VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
              manifest: {
                name: 'Akaya: Your intelligent assistant',
                short_name: 'Akaya',
                description: 'Chat, speak, translate and get things done with one bubble.',
                theme_color: '#7625ef',
                background_color: '#f4f1fc',
                display: 'standalone',
                orientation: 'portrait',
                start_url: './',
                scope: './',
                icons: [
                  { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                  { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                  { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
              },
              workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
            }),
    ],
    build: standalone
      ? { outDir: 'dist-standalone', assetsInlineLimit: 100_000_000, cssCodeSplit: false }
      : { outDir: 'dist' },
  };
});
