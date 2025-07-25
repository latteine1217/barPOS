import { useState, useCallback, useEffect } from 'react';

export interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
  clearValue: () => void;
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
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  }, [defaultValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // 返回一個包裝版本的設定函數，該函數將新值持久化到 localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (typeof window === 'undefined') {
        console.warn(
          `Tried setting localStorage key "${key}" even though environment is not a client`
        );
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
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(defaultValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [defaultValue, key]);

  const clearValue = useCallback(() => {
    removeValue();
  }, [removeValue]);

  // 監聽其他實例的變化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if ((e as StorageEvent).key && (e as StorageEvent).key !== key) {
        return;
      }

      setStoredValue(readValue());
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
  };
};