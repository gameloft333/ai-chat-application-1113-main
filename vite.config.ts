import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: true,
    },
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
    }
  }
})
