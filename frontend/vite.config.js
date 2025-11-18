import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: backendUrl, // Backend dinámico desde .env
          changeOrigin: true,
          secure: false, // Cambiar a true para HTTPS en producción
          rewrite: (path) => path,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('🔴 Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('🚀 Sending Request to Target:', req.method, req.url, '-> Target:', backendUrl);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('✅ Received Response from Target:', proxyRes.statusCode, req.url);
            });
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': '/src'
      }
    }
  }
})