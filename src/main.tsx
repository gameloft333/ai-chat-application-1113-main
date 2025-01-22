import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/payment.css'

// 调试信息
console.log('React 初始化开始')
console.log('React version:', React.version)
console.log('Vite env:', import.meta.env.MODE)
console.log('Runtime check:', typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__)

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

// 添加错误边界
try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} catch (error) {
  console.error('React 渲染错误:', error)
}
