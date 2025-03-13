/**
 * 前端日志工具类
 * 用于记录应用程序的各种事件和错误
 */

// 日志级别
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

// 日志配置
const config = {
  // 是否在控制台输出日志
  consoleOutput: true,
  // 最低日志级别
  minLevel: LogLevel.INFO,
  // 是否包含时间戳
  includeTimestamp: true,
  // 是否将日志保存到localStorage
  saveToStorage: true,
  // localStorage中的键名
  storageKey: 'app_logs',
  // 最大存储日志条数
  maxStoredLogs: 500
};

// 日志条目接口
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

/**
 * 日志记录器类
 */
class Logger {
  private logs: LogEntry[] = [];

  constructor() {
    // 添加全局错误处理
    this.setupGlobalErrorHandlers();
    
    // 从localStorage加载日志
    this.loadLogsFromStorage();
    
    // 定期保存日志到localStorage
    setInterval(() => this.saveLogsToStorage(), 30000);
  }

  /**
   * 设置全局错误处理器
   */
  private setupGlobalErrorHandlers() {
    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.error('未处理的Promise拒绝', {
        reason: event.reason,
        promise: event.promise
      });
    });

    // 捕获全局错误
    window.addEventListener('error', (event) => {
      this.error('全局错误', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    // 捕获网络状态变化
    window.addEventListener('online', () => this.info('网络连接已恢复'));
    window.addEventListener('offline', () => this.warn('网络连接已断开'));
  }

  /**
   * 从localStorage加载日志
   */
  private loadLogsFromStorage() {
    if (config.saveToStorage) {
      try {
        const storedLogs = localStorage.getItem(config.storageKey);
        if (storedLogs) {
          this.logs = JSON.parse(storedLogs);
        }
      } catch (error) {
        console.error('加载日志失败', error);
      }
    }
  }

  /**
   * 保存日志到localStorage
   */
  private saveLogsToStorage() {
    if (config.saveToStorage) {
      try {
        // 只保留最新的N条日志
        const logsToSave = this.logs.slice(-config.maxStoredLogs);
        localStorage.setItem(config.storageKey, JSON.stringify(logsToSave));
      } catch (error) {
        console.error('保存日志失败', error);
      }
    }
  }

  /**
   * 创建日志条目
   */
  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, data?: any) {
    // 检查日志级别
    if (this.getLevelValue(level) < this.getLevelValue(config.minLevel)) {
      return;
    }

    const entry = this.createLogEntry(level, message, data);
    this.logs.push(entry);

    // 控制台输出
    if (config.consoleOutput) {
      const timestamp = config.includeTimestamp ? `[${entry.timestamp}] ` : '';
      const formattedMessage = `${timestamp}[${level}] ${message}`;
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage, data || '');
          break;
        case LogLevel.INFO:
          console.info(formattedMessage, data || '');
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, data || '');
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(formattedMessage, data || '');
          break;
      }
    }
  }

  /**
   * 获取日志级别的数值
   */
  private getLevelValue(level: LogLevel): number {
    switch (level) {
      case LogLevel.DEBUG: return 0;
      case LogLevel.INFO: return 1;
      case LogLevel.WARN: return 2;
      case LogLevel.ERROR: return 3;
      case LogLevel.FATAL: return 4;
      default: return 0;
    }
  }

  /**
   * 记录调试日志
   */
  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * 记录信息日志
   */
  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * 记录警告日志
   */
  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * 记录错误日志
   */
  error(message: string, data?: any) {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * 记录致命错误日志
   */
  fatal(message: string, data?: any) {
    this.log(LogLevel.FATAL, message, data);
  }

  /**
   * 获取所有日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 清除日志
   */
  clearLogs() {
    this.logs = [];
    if (config.saveToStorage) {
      localStorage.removeItem(config.storageKey);
    }
  }

  /**
   * 导出日志为JSON字符串
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * 记录应用性能指标
   */
  logPerformance() {
    if (window.performance) {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      this.info('页面加载性能', {
        pageLoadTime: `${pageLoadTime}ms`,
        domContentLoaded: `${perfData.domContentLoadedEventEnd - perfData.navigationStart}ms`,
        firstPaint: `${perfData.responseEnd - perfData.navigationStart}ms`,
        domInteractive: `${perfData.domInteractive - perfData.navigationStart}ms`
      });
    }
  }

  /**
   * 记录系统信息
   */
  logSystemInfo() {
    this.info('系统信息', {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      } : 'Not available'
    });
  }
}

// 创建单例实例
const logger = new Logger();

// 导出单例
export default logger; 