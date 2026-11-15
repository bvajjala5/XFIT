import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The renderer is loaded from `file://` inside Electron, so asset URLs must be
// relative (`base: './'`). Everything privileged (Firebase Admin) lives in the
// Electron main process and is reached over IPC.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
  },
})
