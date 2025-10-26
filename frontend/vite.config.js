import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'https://dark-spooky-haunting-7qgp9jr9x56cx4v4-5000.app.github.dev',
        changeOrigin: true,
        secure: true
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})