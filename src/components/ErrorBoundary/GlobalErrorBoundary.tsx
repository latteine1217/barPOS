import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/services/loggerService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error, errorInfo });
    logger.error(
      'GlobalErrorBoundary caught an error',
      {
        component: 'GlobalErrorBoundary',
        action: 'componentDidCatch',
        stack: errorInfo.componentStack ?? undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
      error,
    );
  }

  handleRetry = (): void => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleReload = (): void => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    const isDevelopment = import.meta.env.DEV;
    const retryDisabled = this.state.retryCount >= 3;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            系統發生錯誤
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            很抱歉，調酒酒吧 POS 系統遇到了意外錯誤。我們已經記錄了這個問題，請稍後再試。
          </p>

          {isDevelopment && this.state.error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-left">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                錯誤詳情 (開發模式)
              </h3>
              <p className="text-xs text-red-700 dark:text-red-400 mb-2 break-all">
                {this.state.error.message}
              </p>
              {this.state.errorInfo?.componentStack && (
                <details className="text-xs text-red-600 dark:text-red-400">
                  <summary className="cursor-pointer font-medium">Component stack</summary>
                  <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-48">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={this.handleRetry}
              className="btn btn-primary"
              disabled={retryDisabled}
            >
              {retryDisabled ? '重試次數已達上限' : '重試'}
            </button>

            <button
              type="button"
              onClick={this.handleReload}
              className="btn btn-secondary"
            >
              重新載入頁面
            </button>
          </div>

          {this.state.retryCount > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              重試次數: {this.state.retryCount}/3
            </p>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              如果問題持續發生，請聯絡技術支援
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              錯誤 ID: {Date.now().toString(36)}
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default GlobalErrorBoundary;
