import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

interface ErrorReport {
  message: string;
  stack?: string | undefined;
  componentStack: string;
  timestamp: string;
  userAgent: string;
  url: string;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      errorInfo: null,
      retryCount: 0
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static getDerivedStateFromError(_error: Error): Partial<State> {
    // 更新 state 來顯示錯誤 UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 記錄錯誤詳情
    console.error('Global Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo
    });

    // 可以在這裡發送錯誤報告到監控服務
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error: Error, errorInfo: React.ErrorInfo): void => {
    // 在生產環境中，這裡可以發送錯誤到 Sentry, LogRocket 等服務
    try {
      const errorReport: ErrorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack || '',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      // 發送到錯誤監控服務
      console.log('Error report:', errorReport);
      
      // 示例：發送到後端 API
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // });
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  handleRetry = (): void => {
    this.setState(prevState => ({
      hasError: false,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            {/* 錯誤圖標 */}
            <div className="w-24 h-24 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg 
                className="w-12 h-12 text-red-600 dark:text-red-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            {/* 錯誤標題 */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              系統發生錯誤
            </h1>

            {/* 錯誤描述 */}
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              很抱歉，調酒酒吧 POS 系統遇到了意外錯誤。我們已經記錄了這個問題，並會盡快修復。
            </p>

            {/* 開發環境下顯示錯誤詳情 */}
            {isDevelopment && this.state.errorInfo && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-left">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                  錯誤詳情 (開發模式):
                </h3>
                <pre className="text-xs text-red-700 dark:text-red-400 overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            {/* 操作按鈕 */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="btn btn-primary"
                disabled={this.state.retryCount >= 3}
              >
                {this.state.retryCount >= 3 ? '重試次數已達上限' : '重試'}
              </button>
              
              <button
                onClick={this.handleReload}
                className="btn btn-secondary"
              >
                重新載入頁面
              </button>
            </div>

            {/* 重試計數 */}
            {this.state.retryCount > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                重試次數: {this.state.retryCount}/3
              </p>
            )}

            {/* 聯絡資訊 */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                如果問題持續發生，請聯絡技術支援
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                錯誤ID: {Date.now().toString(36)}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;