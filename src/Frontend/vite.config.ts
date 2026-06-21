/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://elogateway.happywave-84e9a5c3.canadacentral.azurecontainerapps.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/rest'),
      },
    },
  },
})
