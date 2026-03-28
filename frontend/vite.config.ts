import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Use 127.0.0.1 to avoid slow or stuck IPv6 localhost resolution on some systems.
      // Timeouts prevent the dev server from hanging indefinitely when the API is down.
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        timeout: 15_000,
        proxyTimeout: 15_000,
      },
      '/healthz': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        timeout: 15_000,
        proxyTimeout: 15_000,
      },
    },
  },
})
