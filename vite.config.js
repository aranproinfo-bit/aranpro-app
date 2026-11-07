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
      '/api-resend': {
        target: 'https://api.resend.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api-resend/, '')
      }
    }
  }
})

