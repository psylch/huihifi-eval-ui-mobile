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
  },
})
