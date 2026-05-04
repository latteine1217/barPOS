import { useCallback } from 'react';
import { logger } from '@/services/loggerService';
import { toast } from '@/stores/uiStore';

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

const isApiError = (error: unknown): error is ApiError =>
  typeof error === 'object' && error !== null &&
  ('code' in error || 'message' in error || 'status' in error);

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String((error as { message?: string })?.message ?? error));

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
      let loadingToastId: string | null = null;
      if (showLoadingToast) {
        loadingToastId = toast.info(`${errorContext} 處理中…`);
      }

      const result = await apiCall();

      if (loadingToastId) {
        // duration 仍會自動結束；此處只是把 loading 提早收掉
        // (toast.info 直接寫到 store，可選擇性 dismiss)
      }

      if (successMessage) {
        toast.success(successMessage);
        logger.info(successMessage, { component: 'useApiError', action: errorContext });
      }

      onSuccess?.(result);

      return { success: true, data: result };
    } catch (error) {
      const err = toError(error);
      logger.error(
        `${errorContext} 失敗`,
        { component: 'useApiError', action: errorContext },
        err
      );
      toast.error(`${errorContext} 失敗`, err.message || undefined);

      onError?.(error);

      return { success: false, error };
    }
  }, []);

  // 訂單相關錯誤的標準化處理
  const handleOrderError = useCallback((error: unknown, operation = '訂單操作') => {
    const messageMap: Record<string, string> = {
      TABLE_NOT_AVAILABLE: '桌位不可用，請選擇其他桌位',
      INVALID_ORDER_DATA: '訂單資料不正確，請檢查後重試',
      MENU_ITEM_NOT_FOUND: '菜單項目不存在，請重新選擇',
    };

    const code = isApiError(error) ? error.code : undefined;
    const userMessage = (code && messageMap[code]) ?? '操作失敗，請稍後再試';

    logger.error(
      userMessage,
      { component: 'useApiError', action: operation, code },
      toError(error)
    );
    toast.error(userMessage);

    return userMessage;
  }, []);

  // 同步相關錯誤的標準化處理
  const handleSyncError = useCallback((error: unknown, syncType = '資料同步') => {
    const messageMap: Record<string, string> = {
      NETWORK_ERROR: '網路連線錯誤，資料將在連線恢復後同步',
      SYNC_CONFLICT: '資料同步衝突，請重新整理頁面',
      AUTH_ERROR: '認證錯誤，請檢查 API 設定',
    };

    const code = isApiError(error) ? error.code : undefined;
    const userMessage = (code && messageMap[code]) ?? '同步失敗，請稍後再試';

    logger.error(
      userMessage,
      { component: 'useApiError', action: syncType, code },
      toError(error)
    );
    toast.error(userMessage);

    return userMessage;
  }, []);

  return {
    executeWithErrorHandling,
    handleOrderError,
    handleSyncError,
  };
};
