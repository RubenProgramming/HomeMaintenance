import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Alles wat de frontend naar /api/... stuurt, stuurt Vite door naar de backend.
    // Voorbeeld: /api/assets  ->  http://127.0.0.1:8000/assets
    // Voordeel: de browser praat maar met één adres, dus geen CORS-gedoe,
    // en straks op een server doe je precies hetzelfde met nginx/Caddy.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
