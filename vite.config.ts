import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // 根据模式加载对应的环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  console.log('Vite配置初始化:', {
    环境: mode,
    API地址: env.VITE_API_URL,
    应用地址: env.VITE_APP_URL,
    WebSocket地址: env.VITE_SOCKET_URL
  })

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: Number(env.VITE_PORT) || 4173,
      host: true,
      proxy: {
        '/socket.io': {
          target: env.VITE_API_URL,
          ws: true,
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      sourcemap: true,
      minify: false,
      commonjsOptions: {
        transformMixedEsModules: true
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom']
    },
    define: {
      '__REACT_DEVTOOLS_GLOBAL_HOOK__': '{}',
      // Pass environment variables to the app
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID)
    }
  }
})