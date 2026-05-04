import { useMemo } from 'react';
import { useUIStore, type ShowToastOptions } from '@/stores/uiStore';

/**
 * 全域 Toast hook。
 *
 * 用法：
 *   const toast = useToast();
 *   toast.success('已儲存');
 *   toast.error('儲存失敗', '請檢查網路連線');
 *   const id = toast.show({ variant: 'info', message: '同步中', duration: 0 });
 *   toast.dismiss(id);
 */
export const useToast = () => {
  const showToast = useUIStore((s) => s.showToast);
  const dismissToast = useUIStore((s) => s.dismissToast);
  const clearToasts = useUIStore((s) => s.clearToasts);

  return useMemo(
    () => ({
      success: (message: string, description?: string) =>
        showToast({ variant: 'success', message, ...(description ? { description } : {}) }),
      error: (message: string, description?: string) =>
        showToast({ variant: 'error', message, duration: 5000, ...(description ? { description } : {}) }),
      warning: (message: string, description?: string) =>
        showToast({ variant: 'warning', message, ...(description ? { description } : {}) }),
      info: (message: string, description?: string) =>
        showToast({ variant: 'info', message, ...(description ? { description } : {}) }),
      show: (options: ShowToastOptions) => showToast(options),
      dismiss: (id: string) => dismissToast(id),
      clear: () => clearToasts(),
    }),
    [showToast, dismissToast, clearToasts],
  );
};
