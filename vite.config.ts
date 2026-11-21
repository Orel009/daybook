import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `vite build --mode single` produces one self-contained HTML file (handy for
// quick previews). The normal build is the installable PWA.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    react(),
    ...(mode === 'single'
      ? [viteSingleFile()]
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg'],
            workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
            manifest: {
              name: 'Daybook',
              short_name: 'Daybook',
              description: 'A personal habit tracker and scrapbook journal.',
              start_url: '.',
              scope: '.',
              display: 'standalone',
              orientation: 'any',
              background_color: '#E9E4F2',
              theme_color: '#E9E4F2',
              icons: [
                { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
                { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
            },
          }),
        ]),
  ],
  build: mode === 'single' ? { outDir: 'dist-single', assetsInlineLimit: 100_000_000 } : { outDir: 'dist' },
  test: { environment: 'node' },
}));
