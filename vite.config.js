import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/*.png', 'locked-in-cover.png'],
      manifest: {
        name: 'XFit - Stay Consistent. Stay Strong.',
        short_name: 'XFit',
        description: 'Your AI-powered fitness companion.',
        theme_color: '#f97316',
        background_color: '#080818',
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
          { name: 'Coach X', url: '/coach', description: 'AI fitness coach' },
          { name: 'Health', url: '/health', description: 'Log health metrics' },
        ],
        categories: ['fitness', 'health', 'sports'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'firebase-cache', networkTimeoutSeconds: 10 }
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
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-ui': ['framer-motion', '@tanstack/react-query'],
          'vendor-charts': ['recharts'],
        }
      }
    }
  }
})
