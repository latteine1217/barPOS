import { useCallback, useRef } from 'react';
import type { DebouncedFunction } from '../utils/debounce';

// 防抖 Hook - 完全內聯實作避免依賴問題
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  func: T, 
  delay: number
): DebouncedFunction<T> {
  const funcRef = useRef(func);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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

// 定義可序列化的數據類型
type SerializableData = string | number | boolean | null | undefined | SerializableData[] | { [key: string]: SerializableData };

// 防抖儲存 Hook
export function useDebouncedStorage() {
  const localTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 防抖儲存到 localStorage 
  const debouncedSave = useCallback((key: string, data: SerializableData) => {
    if (localTimeoutRef.current) {
      clearTimeout(localTimeoutRef.current);
    }
    localTimeoutRef.current = setTimeout(() => {
      try {
        const serialized = JSON.stringify(data);
        localStorage.setItem(key, serialized);
        console.log(`已儲存到 localStorage: ${key}`);
      } catch (error) {
        console.error('儲存到 localStorage 失敗:', error);
      }
    }, 1000); // 1秒防抖延遲
  }, []);

  // 防抖儲存到 sessionStorage
  const debouncedSessionSave = useCallback((key: string, data: SerializableData) => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    sessionTimeoutRef.current = setTimeout(() => {
      try {
        const serialized = JSON.stringify(data);
        sessionStorage.setItem(key, serialized);
        console.log(`已儲存到 sessionStorage: ${key}`);
      } catch (error) {
        console.error('儲存到 sessionStorage 失敗:', error);
      }
    }, 500); // 0.5秒防抖延遲
  }, []);

  // 立即儲存函數（不防抖）
  const saveImmediately = useCallback((key: string, data: SerializableData) => {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      console.log(`立即儲存到 localStorage: ${key}`);
    } catch (error) {
      console.error('立即儲存失敗:', error);
    }
  }, []);

  return {
    debouncedSave,
    debouncedSessionSave,
    saveImmediately
  };
}