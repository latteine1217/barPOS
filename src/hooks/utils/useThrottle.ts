// 節流 Hook - 限制函數執行頻率
import { useCallback, useRef, useEffect } from 'react';

export interface UseThrottleOptions {
  leading?: boolean;  // 是否在開始時立即執行
  trailing?: boolean; // 是否在結束時執行
}

export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  options: UseThrottleOptions = {}
): T & { cancel: () => void; flush: () => ReturnType<T> | undefined } {
  const { leading = true, trailing = true } = options;
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  const lastResultRef = useRef<ReturnType<T> | undefined>(undefined);

  const throttledFn = useCallback((...args: Parameters<T>): ReturnType<T> | undefined => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;
    
    lastArgsRef.current = args;

    // 如果是第一次調用或者已經超過延遲時間，並且啟用了 leading
    if (leading && (lastCallTimeRef.current === 0 || timeSinceLastCall >= delay)) {
      lastCallTimeRef.current = now;
      lastResultRef.current = fn(...args);
      return lastResultRef.current;
    }

    // 如果已經有一個待執行的調用，清除它
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 如果啟用了 trailing，設置新的延遲執行
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        if (lastArgsRef.current) {
          lastCallTimeRef.current = Date.now();
          lastResultRef.current = fn(...lastArgsRef.current);
        }
        timeoutRef.current = null;
      }, delay - timeSinceLastCall);
    }

    return lastResultRef.current;
  }, [fn, delay, leading, trailing]);

  // 清理函數
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    lastCallTimeRef.current = 0;
  }, []);

  // 立即執行函數
  const flush = useCallback((): ReturnType<T> | undefined => {
    if (timeoutRef.current && lastArgsRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      lastCallTimeRef.current = Date.now();
      lastResultRef.current = fn(...lastArgsRef.current);
      return lastResultRef.current;
    }
    return lastResultRef.current;
  }, [fn]);

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 添加額外的方法到函數上
  const throttledWithMethods = throttledFn as unknown as T & { 
    cancel: () => void; 
    flush: () => ReturnType<T> | undefined 
  };
  
  // 將 cancel 和 flush 方法添加到函數上
  (throttledWithMethods as any).cancel = cancel;
  (throttledWithMethods as any).flush = flush;

  return throttledWithMethods;
}

export default useThrottle;