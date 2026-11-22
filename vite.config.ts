import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Our own service worker (src/sw/sw.ts): app-shell caching plus push notifications
      strategies: 'injectManifest',
      srcDir: 'src/sw',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // iPhone launch images: iOS reads its one when the app is added; no need to cache all of them
        globIgnores: ['splash/**'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      includeAssets: ['favicon.svg', 'logoIcon.png', 'logoIcon-192.png', 'logoIcon-maskable.png'],
      manifest: {
        name: 'Printdecore',
        short_name: 'Printdecore',
        id: '/home',
        description: 'Order printing from trusted shops near you — priced fast, tracked live, delivered.',
        lang: 'en',
        categories: ['shopping', 'business', 'productivity'],
        theme_color: '#fbbf24',
        background_color: '#111111',
        display: 'standalone',
        orientation: 'portrait',
        shortcuts: [
          { name: 'Print Assistant', short_name: 'Assistant', url: '/home/print-assistant', icons: [{ src: '/logoIcon-192.png', sizes: '192x192' }] },
          { name: 'My orders', short_name: 'Orders', url: '/home/history', icons: [{ src: '/logoIcon-192.png', sizes: '192x192' }] },
        ],
        start_url: '/home',
        scope: '/',
        icons: [
          {
            src: '/logoIcon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/logoIcon.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/logoIcon-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  optimizeDeps: {
    include: ['pdf-lib'],
  },
})
