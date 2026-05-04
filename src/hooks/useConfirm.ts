import { useCallback } from 'react';
import { useUIStore, type ConfirmOptions } from '@/stores/uiStore';

/**
 * 非同步確認對話框 hook。
 *
 * 用法：
 *   const confirm = useConfirm();
 *   const ok = await confirm({ title: '刪除？', variant: 'danger' });
 *   if (ok) deleteItem();
 */
export const useConfirm = () => {
  const requestConfirm = useUIStore((s) => s.requestConfirm);
  return useCallback(
    (options: ConfirmOptions) => requestConfirm(options),
    [requestConfirm],
  );
};
