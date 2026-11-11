import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registered from src/main.jsx after the window load event so the script
      // never sits on the critical rendering path.
      injectRegister: null,
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Uttar Fitness',
        short_name: 'Uttar Fitness',
        description: 'AI-powered fitness tracker for workouts, weekly plans, nutrition, health metrics, and progress.',
        theme_color: '#20212d',
        background_color: '#20212d',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png' },
        ],
        shortcuts: [
          { name: 'Workouts', url: '/workouts', description: 'Browse workouts' },
          { name: 'Health', url: '/health', description: 'Log health metrics' },
        ],
        categories: ['fitness', 'health', 'sports'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        globIgnores: [
          // Large lazy chunks are cached on demand instead of downloaded at install time.
          '**/foods-*.js',
          '**/vendor-charts-*.js',
          '**/vendor-firestore-*.js',
          '**/vendor-zxing-*.js',
          '**/vendor-firebase-messaging-*.js',
        ],
        maximumFileSizeToCacheInBytes: 800 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/assets\/(foods|vendor-charts|vendor-firestore|vendor-zxing|vendor-firebase-messaging)-.*\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'lazy-code', expiration: { maxEntries: 4, maxAgeSeconds: 86400 * 30 } }
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'image-cache', expiration: { maxEntries: 50, maxAgeSeconds: 86400 * 7 } }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: { passes: 2, drop_debugger: true },
      mangle: true,
      format: { comments: false },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // Messaging is dynamically imported, so keep it out of the eager
          // auth/app bundle and let the browser fetch it only when needed.
          if (id.includes('/node_modules/@firebase/messaging/') || id.includes('/node_modules/firebase/messaging/')) {
            return 'vendor-firebase-messaging';
          }
          if (id.includes('/node_modules/@firebase/') || id.includes('/node_modules/firebase/')) {
            // Firestore is imported dynamically, so Rollup keeps this chunk async.
            if (id.includes('firestore')) return 'vendor-firestore';
            return 'vendor-firebase';
          }
          if (/\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) {
            return 'vendor-react';
          }
          if (id.includes('/node_modules/recharts/') || id.includes('/node_modules/d3-') || id.includes('/node_modules/victory-vendor/')) {
            return 'vendor-charts';
          }
          if (id.includes('/node_modules/@zxing/')) return 'vendor-zxing';
          if (id.includes('/node_modules/framer-motion/') || id.includes('/node_modules/@tanstack/')) {
            return 'vendor-ui';
          }
        }
      }
    }
  }
})
