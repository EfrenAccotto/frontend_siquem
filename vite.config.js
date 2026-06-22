import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
  host: '0.0.0.0',   // ← CRÍTICO para Docker
  port: 5173,
  proxy: {
    // '/api' : 'http://localhost:8000'  // proxy para desarrollo local
    '/api': 'http://backend:8000'  // proxy interno entre contenedores
    }
  }
})
