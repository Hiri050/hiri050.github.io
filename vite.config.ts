import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    // three.js is lazy-loaded behind the boot sequence; its chunk is expected to be large.
    chunkSizeWarningLimit: 1000,
  },
})
