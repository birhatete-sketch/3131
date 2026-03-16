import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Backend base URL for dev proxy (can be set via VITE_BACKEND_URL)
const backendTarget = process.env.VITE_BACKEND_URL || 'http://localhost:3001'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/uploads': {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
})
