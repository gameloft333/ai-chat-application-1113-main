import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/payment.css'
import 'antd/dist/reset.css'  // Antd 5.x 的新样式导入方式
import logger from './utils/logger'; // Added logger import

// 错误边界组件
class ErrorBoundary extends React.Component<any, { hasError: boolean, error: Error | null }> { // Added types for props and state
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) { // Added type for error
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { // Added types for error and errorInfo
    logger.error('React错误边界捕获到错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: '20px' }}>
          <h1>组件渲染错误</h1>
          <pre>{this.state.error ? (this.state.error as any).toString() : 'Unknown error'}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// 增加详细的调试信息
logger.debug('环境变量检查:', {
  NODE_ENV: process.env.NODE_ENV,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_WS_URL: import.meta.env.VITE_WS_URL
});

// 添加加载状态元素
document.body.innerHTML = `
  <div id="root">
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
      <div style="text-align: center;">
        <h2>应用加载中...</h2>
        <p>请稍候</p>
      </div>
    </div>
  </div>
`;

// 检查DOM挂载点
const rootElement = document.getElementById('root');
logger.debug('Root element:', rootElement);

// 添加错误边界和详细日志
try {
  if (!rootElement) {
    throw new Error('找不到root元素，请检查HTML模板');
  }
  
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  logger.error('React渲染错误:', error);
  // 在页面上显示错误信息
  document.body.innerHTML = `
    <div style={{ color: 'red', padding: '20px' }}>
      <h1>应用加载失败</h1>
      <pre>${error instanceof Error ? error.message : '未知错误'}</pre>
    </div>
  `;
}
