import { useCallback } from 'react';
import { useError } from '../contexts/ErrorContext';

interface ApiCallOptions {
  successMessage?: string | null;
  errorContext?: string;
  showLoadingToast?: boolean;
  onSuccess?: ((result: unknown) => void) | null;
  onError?: ((error: unknown) => void) | null;
}

interface ApiResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: unknown;
}

interface ApiError {
  code?: string;
  message?: string;
}

export const useApiError = () => {
  const { handleApiError, showError, showSuccess, showInfo, removeToast } = useError();

  const executeWithErrorHandling = useCallback(async <T = unknown>(
    apiCall: () => Promise<T>, 
    options: ApiCallOptions = {}
  ): Promise<ApiResult<T>> => {
    const {
      successMessage = null,
      errorContext = 'API 操作',
      showLoadingToast = false,
      onSuccess = null,
      onError = null
    } = options;

    try {
      // 顯示載入提示（可選）
      let loadingToastId: string | null = null;
      if (showLoadingToast) {
        loadingToastId = showInfo('處理中...');
      }

      // 執行 API 呼叫
      const result = await apiCall();

      // 移除載入提示
      if (loadingToastId) {
        removeToast(loadingToastId);
      }

      // 顯示成功訊息
      if (successMessage) {
        showSuccess(successMessage);
      }

      // 執行成功回調
      if (onSuccess) {
        onSuccess(result);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error(`${errorContext} failed:`, error);
      
      // 處理 API 錯誤
      handleApiError(error, errorContext);
      
      // 執行錯誤回調
      if (onError) {
        onError(error);
      }

      return { success: false, error };
    }
  }, [handleApiError, showSuccess, showInfo, removeToast]);

  // 專門處理訂單相關 API 的錯誤
  const handleOrderError = useCallback((error: ApiError, operation = '訂單操作') => {
    if (error?.code === 'TABLE_NOT_AVAILABLE') {
      showError('桌位不可用，請選擇其他桌位', operation);
    } else if (error?.code === 'INVALID_ORDER_DATA') {
      showError('訂單資料不正確，請檢查後重試', operation);
    } else if (error?.code === 'MENU_ITEM_NOT_FOUND') {
      showError('菜單項目不存在，請重新選擇', operation);
    } else {
      handleApiError(error, operation);
    }
  }, [handleApiError, showError]);

  // 專門處理同步相關的錯誤
  const handleSyncError = useCallback((error: ApiError, syncType = '資料同步') => {
    if (error?.code === 'NETWORK_ERROR') {
      showError('網路連線錯誤，資料將在連線恢復後同步', syncType);
    } else if (error?.code === 'SYNC_CONFLICT') {
      showError('資料同步衝突，請重新整理頁面', syncType);
    } else if (error?.code === 'AUTH_ERROR') {
      showError('認證錯誤，請檢查 API 設定', syncType);
    } else {
      handleApiError(error, syncType);
    }
  }, [handleApiError, showError]);

  return {
    executeWithErrorHandling,
    handleOrderError,
    handleSyncError,
    handleApiError
  };
};