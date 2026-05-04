import { useState, useCallback, useEffect, useMemo } from 'react';
import { logger } from '@/services/loggerService';

const LS_CTX = { component: 'useLocalStorage' } as const;
const toError = (e: unknown): Error => (e instanceof Error ? e : new Error(String(e)));

export interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
  clearValue: () => void;
  isDirty?: boolean;
}

export const useLocalStorage = <T>(
  key: string,
  defaultValue: T
): UseLocalStorageReturn<T> => {
  // 讀取初始值
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      logger.warn(`讀取 localStorage 失敗：${key}`, { ...LS_CTX, key, error: toError(error).message });
      return defaultValue;
    }
  }, [defaultValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // 使用 useMemo 優化深度比較性能
  const isDirtyMemo = useMemo(() => {
    return JSON.stringify(storedValue) !== JSON.stringify(defaultValue);
  }, [storedValue, defaultValue]);

  // 返回一個包裝版本的設定函數，該函數將新值持久化到 localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (typeof window === 'undefined') {
        logger.warn(`試圖在非瀏覽器環境寫入 localStorage：${key}`, { ...LS_CTX, key });
        return;
      }

      try {
        // 允許值是函數，以便有與 useState 相同的 API
        const newValue = value instanceof Function ? value(storedValue) : value;

        // 保存到本地存儲
        window.localStorage.setItem(key, JSON.stringify(newValue));

        // 保存狀態
        setStoredValue(newValue);

        // 觸發自定義事件，通知其他使用相同 key 的實例
        window.dispatchEvent(
          new CustomEvent('local-storage', {
            detail: {
              key,
              newValue,
            },
          })
        );
      } catch (error) {
        logger.warn(`寫入 localStorage 失敗：${key}`, { ...LS_CTX, key, error: toError(error).message });
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(defaultValue);
    } catch (error) {
      logger.warn(`移除 localStorage 失敗：${key}`, { ...LS_CTX, key, error: toError(error).message });
    }
  }, [defaultValue, key]);

  const clearValue = useCallback(() => {
    removeValue();
  }, [removeValue]);

  // 監聽其他實例的變化
  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      if (e instanceof StorageEvent) {
        // 當 'storage' 事件發生, 如果 key 匹配或整個 storage 被清除，則更新狀態
        if (e.key === key || e.key === null) {
          setStoredValue(readValue());
        }
      } else if (
        e instanceof CustomEvent &&
        e.type === 'local-storage' &&
        e.detail.key === key
      ) {
        // 當自定義的 'local-storage' 事件發生且 key 匹配時，更新狀態
        setStoredValue(readValue());
      }
    };

    // 監聽原生存儲事件和自定義事件
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleStorageChange);
    };
  }, [key, readValue]);

  return {
    value: storedValue,
    setValue,
    removeValue,
    clearValue,
    isDirty: isDirtyMemo,
  };
};