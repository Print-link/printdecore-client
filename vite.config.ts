import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logoIcon.png', 'logoIcon-192.png', 'logoIcon-maskable.png'],
      manifest: {
        name: 'Printdecore',
        short_name: 'Printdecore',
        description: 'Find trusted print vendors near you. Fast, secure, delivered.',
        theme_color: '#fbbf24',
        background_color: '#111111',
        display: 'standalone',
        orientation: 'portrait',
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
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/payment\/callback/],
        cleanupOutdatedCaches: true,
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
