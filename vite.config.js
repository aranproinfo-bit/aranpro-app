import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    proxy: {
      '/api/mail-gateway': {
        target: 'https://api.resend.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/mail-gateway/, ''),
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error('[MAIL PROXY ERROR]', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[MAIL PROXY REQ]', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[MAIL PROXY RES]', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
})

