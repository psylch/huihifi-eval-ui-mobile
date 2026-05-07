import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // VITE_BASE controls the public base path for production builds.
  // Set to '/m/' when deploying behind Caddy's `uri strip_prefix /m`
  // so <script src="/m/assets/..."> resolves correctly. Defaults to '/'
  // for local dev where no prefix is needed.
  base: process.env.VITE_BASE || '/',
  server: {
    host: true,
    port: 5174,
    proxy: {
      // Dev-only: forward /api/* to the locally running huihifi-eval-api
      // (started via portless on eval-api.localhost:1355). Avoids needing
      // to set VITE_API_BASE_URL or deal with CORS.
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
    },
  },
})
