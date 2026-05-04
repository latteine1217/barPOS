import { useCallback, useRef } from 'react';
import { logger } from '@/services/loggerService';
import type { DebouncedFunction } from '../utils/debounce';

// 防抖 Hook
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): DebouncedFunction<T> {
  const funcRef = useRef(func);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  funcRef.current = func;

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      funcRef.current(...args);
    }, delay);
  }, [delay]) as DebouncedFunction<T>;
}

// 可序列化資料型別
type SerializableData =
  | string | number | boolean | null | undefined
  | SerializableData[]
  | { [key: string]: SerializableData };

const persist = (
  storage: Storage,
  storageName: string,
  key: string,
  data: SerializableData,
  immediate: boolean,
): void => {
  try {
    storage.setItem(key, JSON.stringify(data));
    if (immediate) {
      logger.debug('Storage saved (immediate)', {
        component: 'useDebouncedStorage',
        storage: storageName,
        key,
      });
    }
  } catch (error) {
    logger.error(
      `${storageName} 儲存失敗`,
      { component: 'useDebouncedStorage', storage: storageName, key },
      error instanceof Error ? error : new Error(String(error))
    );
  }
};

// 防抖儲存 Hook
export function useDebouncedStorage() {
  const localTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback((key: string, data: SerializableData) => {
    if (localTimeoutRef.current) clearTimeout(localTimeoutRef.current);
    localTimeoutRef.current = setTimeout(() => {
      persist(localStorage, 'localStorage', key, data, false);
    }, 1000);
  }, []);

  const debouncedSessionSave = useCallback((key: string, data: SerializableData) => {
    if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
    sessionTimeoutRef.current = setTimeout(() => {
      persist(sessionStorage, 'sessionStorage', key, data, false);
    }, 500);
  }, []);

  const saveImmediately = useCallback((key: string, data: SerializableData) => {
    persist(localStorage, 'localStorage', key, data, true);
  }, []);

  return {
    debouncedSave,
    debouncedSessionSave,
    saveImmediately,
  };
}
