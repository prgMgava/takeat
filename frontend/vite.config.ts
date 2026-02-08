import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente do .env e do Docker
  const env = loadEnv(mode, process.cwd(), '')

  // No Docker, o backend é acessível via nome do serviço 'backend'
  // Localmente, é localhost:3001
  const backendUrl = env.VITE_BACKEND_URL || process.env.VITE_BACKEND_URL || 'http://backend:3001'

  console.log('Proxy target:', backendUrl)

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3000,
      host: '0.0.0.0', // Necessário para funcionar no Docker
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
