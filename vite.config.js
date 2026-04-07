import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    proxy: {
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/anthropic/, '')
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png', 'icons/*.svg'],
      manifest: {
        name: "Mama's Kitchen",
        short_name: "Mama's Kitchen",
        description: 'AI-powered recipe app for breastfeeding mamas',
        theme_color: '#c0392b',
        background_color: '#fdf6f0',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/world\.openfoodfacts\.org\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'open-food-facts-cache', expiration: { maxEntries: 100, maxAgeSeconds: 86400 } }
          },
          {
            urlPattern: /^https:\/\/api\.anthropic\.com\//,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ]
});
