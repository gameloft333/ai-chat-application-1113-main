import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';
  
  // 根据环境确定代理目标
  const wsTarget = isDevelopment 
    ? 'ws://localhost:4242'
    : 'wss://love.saga4v.com';
    
  const apiTarget = isDevelopment
    ? 'http://localhost:4242'
    : 'https://love.saga4v.com';

  console.log('当前环境:', mode);
  console.log('WebSocket代理目标:', wsTarget);
  console.log('API代理目标:', apiTarget);

  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  // 删除 .env 文件中的 NODE_ENV
  delete env.NODE_ENV

  console.log('🚀 Vite Configuration Mode:', mode)
  console.log('🔧 Environment Variables:', JSON.stringify(env, null, 2))

  return {
    // 明确设置 NODE_ENV
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
    plugins: [react()],
    build: {
      // 使用 esbuild 压缩
      minify: 'esbuild',
      // 减小块大小警告阈值
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // 手动分割代码
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // 将第三方库拆分
              return 'vendor'
            }
            if (id.includes('src/pages')) {
              // 按页面拆分
              return 'pages'
            }
          }
        }
      },
      outDir: 'dist'
    },
    // 解决 CSS 嵌套问题
    css: {
      preprocessorOptions: {
        css: {
          additionalData: `
            :is(body) {
              /* 全局样式 */
            }
          `
        }
      },
      // 处理 CSS 警告
      modules: {
        generateScopedName: '[name]__[local]___[hash:base64:5]'
      }
    },
    // 预览服务器配置
    preview: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: true,
      open: false,
      allowedHosts: ['love.saga4v.com', 'localhost', '127.0.0.1'],
      cors: {
        origin: ['https://love.saga4v.com', 'http://localhost:4173'],
      },
      proxy: {
        '/socket.io': {
          target: 'wss://love.saga4v.com',
          ws: true,
          changeOrigin: true
        },
        '/api': {
          target: 'https://love.saga4v.com',
          changeOrigin: true
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: true,
      open: false,
      // 添加日志输出
      logger: {
        info: console.log,
        warn: console.warn,
        error: console.error
      },
      proxy: {
        '/socket.io': {
          target: wsTarget,
          ws: true,
          changeOrigin: true,
          // 添加代理日志
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.error('代理错误:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('代理请求:', {
                url: req.url,
                target: options.target
              });
            });
          }
        },
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          // 添加代理日志
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.error('API代理错误:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('API代理请求:', {
                url: req.url,
                target: options.target
              });
            });
          }
        }
      }
    }
  }
})
