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
      host: env.VITE_DEV_SERVER_HOST || 'localhost',
      strictPort: true,
      hmr: {
        protocol: 'ws',
        host: env.VITE_DEV_SERVER_HOST || 'localhost',
        port: Number(env.VITE_CLIENT_PORT) || 4173,
        clientPort: Number(env.VITE_CLIENT_PORT) || 4173,
        timeout: 10000,
        overlay: false
      },
      watch: {
        usePolling: false,
        interval: 1000
      },
      proxy: {
        '/socket.io': {
          target: env.VITE_API_URL,
          ws: true,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/socket\.io/, ''),
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('WebSocket proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('WebSocket proxy request:', req.method, req.url);
            });
          }
        },
        '/stripe': {
          target: 'https://js.stripe.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/stripe/, '')
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
      },
      outDir: 'dist'
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