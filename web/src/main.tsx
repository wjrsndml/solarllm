import { StrictMode } from 'react'
import React, { Component, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import logger from './utils/logger'

// 记录应用启动信息
logger.info('应用启动', { timestamp: new Date().toISOString() });

// 记录系统信息
logger.logSystemInfo();

// 错误边界组件的接口定义
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// 创建一个简单的错误边界组件
class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 记录错误信息
    logger.error('React组件错误', { error, errorInfo });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>应用发生错误</h2>
          <p>请刷新页面或联系管理员</p>
          <details>
            <summary>错误详情</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// 添加进程退出前的日志记录
window.addEventListener('beforeunload', () => {
  logger.info('应用即将关闭', { timestamp: new Date().toISOString() });
  
  // 记录性能指标
  logger.logPerformance();
  
  // 强制保存日志到localStorage
  try {
    const logs = logger.getLogs();
    localStorage.setItem('app_logs', JSON.stringify(logs));
  } catch (e) {
    console.error('保存最终日志失败', e);
  }
});

// 定期记录应用状态
setInterval(() => {
  // 使用info级别而不是debug级别，并且减少记录的信息量
  logger.info('应用心跳检查');
}, 300000); // 从每分钟改为每5分钟记录一次

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
