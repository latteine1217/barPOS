import React, { useState, useCallback, createContext, useContext } from 'react';
import type { ErrorContextType, ToastNotification, ErrorType } from '@/types';

// 錯誤類型定義
export const ErrorTypes: Record<string, ErrorType> = {
  API_ERROR: 'server',
  VALIDATION_ERROR: 'validation',
  NETWORK_ERROR: 'network',
  UNKNOWN_ERROR: 'unknown'
} as const;

// 錯誤 Context
const ErrorContext = createContext<ErrorContextType | null>(null);

export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
};

// Toast 通知組件
interface ToastProps {
  message: string;
  type: ToastNotification['type'];
  onClose: () => void;
  isRemoving?: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, isRemoving = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    // 延遲顯示動畫
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (isRemoving) {
      setIsVisible(false);
    }
  }, [isRemoving]);

  const getToastStyles = (): string => {
    const baseStyles = `
      transform transition-all duration-300 ease-in-out
      p-4 rounded-lg shadow-lg max-w-sm
      flex items-start space-x-3
      backdrop-blur-sm border
    `;
    
    const animationStyles = isVisible && !isRemoving
      ? 'translate-x-0 opacity-100 scale-100'
      : 'translate-x-full opacity-0 scale-95';
    
    switch (type) {
      case 'error':
        return `${baseStyles} ${animationStyles} bg-red-500/90 text-white border-red-400`;
      case 'warning':
        return `${baseStyles} ${animationStyles} bg-yellow-500/90 text-white border-yellow-400`;
      case 'success':
        return `${baseStyles} ${animationStyles} bg-green-500/90 text-white border-green-400`;
      case 'info':
      default:
        return `${baseStyles} ${animationStyles} bg-blue-500/90 text-white border-blue-400`;
    }
  };

  const getIcon = (): string => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={getToastStyles()}>
      <span className="text-lg flex-shrink-0">{getIcon()}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white transition-colors flex-shrink-0 ml-2"
        aria-label="關閉通知"
      >
        ✕
      </button>
    </div>
  );
};

interface ToastItem {
  id: string;
  message: string;
  type: ToastNotification['type'];
  isRemoving: boolean;
}

interface ErrorProviderProps {
  children: React.ReactNode;
}

// 錯誤提供者組件
export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  const removeToast = useCallback((id: string): void => {
    // 先標記為移除中，添加移除動畫
    setToasts(prev => 
      prev.map(toast => 
        toast.id === id ? { ...toast, isRemoving: true } : toast
      )
    );
    
    // 300ms 後真正移除（配合動畫時間）
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback((message: string, type: ToastNotification['type'] = 'info', duration: number = 5000): string => {
    const id = Date.now().toString();
    const newToast: ToastItem = { id, message, type, isRemoving: false };
    
    setToasts(prev => [...prev, newToast]);
    
    // 自動移除 toast
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  }, [removeToast]);

  const showError = useCallback((error: unknown, context: string = ''): string => {
    console.error(`Error in ${context}:`, error);
    
    let message = '發生未知錯誤';
    let type: ToastNotification['type'] = 'error';
    
    if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = (error as { message: string }).message;
    } else if (error && typeof error === 'object' && 'response' in error) {
      // API 錯誤回應
      const apiError = error as { response?: { data?: { message?: string } } };
      if (apiError.response?.data?.message) {
        message = apiError.response.data.message;
      }
    }
    
    // 根據錯誤類型調整訊息
    if (error && typeof error === 'object' && 'code' in error) {
      const errorWithCode = error as { code: string };
      if (errorWithCode.code === 'NETWORK_ERROR') {
        message = '網路連線錯誤，請檢查您的網路連線';
      } else if (errorWithCode.code === 'VALIDATION_ERROR') {
        type = 'warning';
      }
    }
    
    return showToast(message, type);
  }, [showToast]);

  const showSuccess = useCallback((message: string): string => {
    return showToast(message, 'success');
  }, [showToast]);

  const showWarning = useCallback((message: string): string => {
    return showToast(message, 'warning');
  }, [showToast]);

  const showInfo = useCallback((message: string): string => {
    return showToast(message, 'info');
  }, [showToast]);

  const handleApiError = useCallback((error: unknown, context: string = 'API call'): void => {
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response?: { status?: number } };
      if (apiError.response?.status === 401) {
        showError('登入已過期，請重新登入', context);
      } else if (apiError.response?.status === 403) {
        showError('沒有權限執行此操作', context);
      } else if (apiError.response?.status === 404) {
        showError('找不到請求的資源', context);
      } else if (apiError.response?.status && apiError.response.status >= 500) {
        showError('伺服器錯誤，請稍後再試', context);
      } else {
        showError(error, context);
      }
    } else if (error && typeof error === 'object' && 'code' in error) {
      const errorWithCode = error as { code: string };
      if (errorWithCode.code === 'NETWORK_ERROR') {
        showError('網路連線錯誤，請檢查您的網路連線', context);
      } else {
        showError(error, context);
      }
    } else {
      showError(error, context);
    }
  }, [showError]);

  // ErrorContext 需要的 methods 但尚未實作
  const addError = useCallback(() => {
    // TODO: 實作完整的錯誤管理
  }, []);

  const clearErrors = useCallback(() => {
    setToasts([]);
  }, []);

  const resolveError = useCallback(() => {
    // TODO: 實作錯誤解決
  }, []);

  const value: ErrorContextType = {
    errors: [], // TODO: 完整實作錯誤列表
    addError,
    removeError: removeToast,
    clearErrors,
    resolveError,
    // 額外的便利方法
    showToast,
    removeToast,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    handleApiError,
    toasts
  } as ErrorContextType;

  return (
    <ErrorContext.Provider value={value}>
      {children}
      {/* 渲染所有 Toast 通知 */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            isRemoving={toast.isRemoving}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ErrorContext.Provider>
  );
};