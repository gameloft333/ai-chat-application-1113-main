import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  // 删除 .env 文件中的 NODE_ENV
  delete env.NODE_ENV

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
      }
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
      port: 4173
    }
  }
})
