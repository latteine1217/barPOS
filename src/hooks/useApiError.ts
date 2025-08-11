import { useCallback } from 'react';


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
  status?: number;
}

const isApiError = (error: unknown): error is ApiError => {
  return typeof error === 'object' && error !== null && 
    ('code' in error || 'message' in error || 'status' in error);
};

export const useApiError = () => {
  

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
        console.log('處理中...');
      }

      // 執行 API 呼叫
      const result = await apiCall();

      // 移除載入提示
      if (loadingToastId) {
        console.log('移除載入提示');
      }

      // 顯示成功訊息
      if (successMessage) {
        console.log(successMessage);
      }

      // 執行成功回調
      if (onSuccess) {
        onSuccess(result);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error(`${errorContext} failed:`, error);
      
      // 處理 API 錯誤
      console.error('API 錯誤:', error, errorContext);
      
      // 執行錯誤回調
      if (onError) {
        onError(error);
      }

      return { success: false, error };
    }
  }, []);

  // 專門處理訂單相關 API 的錯誤
  const handleOrderError = useCallback((error: unknown, operation = '訂單操作') => {
    if (isApiError(error)) {
      if (error.code === 'TABLE_NOT_AVAILABLE') {
        console.error('桌位不可用，請選擇其他桌位', operation);
      } else if (error.code === 'INVALID_ORDER_DATA') {
        console.error('訂單資料不正確，請檢查後重試', operation);
      } else if (error.code === 'MENU_ITEM_NOT_FOUND') {
        console.error('菜單項目不存在，請重新選擇', operation);
      } else {
        console.error('API 錯誤:', error, operation);
      }
    } else {
      console.error('未知錯誤:', error, operation);
    }
  }, []);

  // 專門處理同步相關的錯誤
  const handleSyncError = useCallback((error: unknown, syncType = '資料同步') => {
    if (isApiError(error)) {
      if (error.code === 'NETWORK_ERROR') {
        console.error('網路連線錯誤，資料將在連線恢復後同步', syncType);
      } else if (error.code === 'SYNC_CONFLICT') {
        console.error('資料同步衝突，請重新整理頁面', syncType);
      } else if (error.code === 'AUTH_ERROR') {
        console.error('認證錯誤，請檢查 API 設定', syncType);
      } else {
        console.error('API 錯誤:', error, syncType);
      }
    } else {
      console.error('未知同步錯誤:', error, syncType);
    }
  }, []);

  return {
    executeWithErrorHandling,
    handleOrderError,
    handleSyncError,
  };
};