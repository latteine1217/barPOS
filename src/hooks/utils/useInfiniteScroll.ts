// 無限滾動 Hook - 處理無限滾動加載邏輯
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

export interface UseInfiniteScrollOptions<T> {
  // 數據獲取函數
  fetchMore: (page: number, size: number) => Promise<T[]>;
  
  // 配置選項
  pageSize?: number;
  initialPage?: number;
  threshold?: number; // 距離底部多少像素時觸發加載
  direction?: 'down' | 'up' | 'both'; // 滾動方向
  
  // 狀態回調
  onLoadStart?: () => void;
  onLoadEnd?: (items: T[], hasMore: boolean) => void;
  onError?: (error: Error) => void;
  
  // 條件控制
  enabled?: boolean;
  hasMore?: boolean; // 外部控制是否還有更多數據
}

export interface InfiniteScrollReturn<T> {
  // 數據狀態
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  
  // 操作方法
  loadMore: () => Promise<void>;
  reload: () => Promise<void>;
  reset: () => void;
  
  // DOM 引用
  containerRef: React.RefObject<HTMLElement | null>;
  loadingRef: React.RefObject<HTMLElement | null>;
  
  // 狀態信息
  currentPage: number;
  totalLoaded: number;
}

export function useInfiniteScroll<T>({
  fetchMore,
  pageSize = 20,
  initialPage = 1,
  threshold = 100,
  direction = 'down',
  onLoadStart,
  onLoadEnd,
  onError,
  enabled = true,
  hasMore: externalHasMore
}: UseInfiniteScrollOptions<T>): InfiniteScrollReturn<T> {
  
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  
  const containerRef = useRef<HTMLElement>(null);
  const loadingRef = useRef<HTMLElement>(null);
  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);

  // 加載更多數據
  const loadMore = useCallback(async () => {
    if (!enabled || isLoadingRef.current || !hasMore) return;
    
    isLoadingRef.current = true;
    const isFirstLoad = items.length === 0;
    
    try {
      if (isFirstLoad) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      setError(null);
      onLoadStart?.();

      const newItems = await fetchMore(currentPage, pageSize);
      
      if (!isMountedRef.current) return;

      const hasMoreData = newItems.length === pageSize;
      const finalHasMore = externalHasMore !== undefined ? externalHasMore : hasMoreData;

      setItems(prev => {
        const combined = direction === 'up' 
          ? [...newItems, ...prev]
          : [...prev, ...newItems];
        return combined;
      });
      
      setCurrentPage(prev => prev + 1);
      setHasMore(finalHasMore);
      
      onLoadEnd?.(newItems, finalHasMore);
      
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const error = err instanceof Error ? err : new Error('Failed to load more');
      setError(error);
      onError?.(error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
        isLoadingRef.current = false;
      }
    }
  }, [
    enabled, hasMore, items.length, currentPage, pageSize, direction,
    externalHasMore, fetchMore, onLoadStart, onLoadEnd, onError
  ]);

  // 重新加載（重置到第一頁）
  const reload = useCallback(async () => {
    setItems([]);
    setCurrentPage(initialPage);
    setHasMore(true);
    setError(null);
    isLoadingRef.current = false;
    
    // 等待狀態更新後再加載
    setTimeout(() => {
      loadMore();
    }, 0);
  }, [initialPage, loadMore]);

  // 重置狀態
  const reset = useCallback(() => {
    setItems([]);
    setIsLoading(false);
    setIsLoadingMore(false);
    setError(null);
    setCurrentPage(initialPage);
    setHasMore(true);
    isLoadingRef.current = false;
  }, [initialPage]);

  // 滾動事件處理
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    const handleScroll = () => {
      if (!hasMore || isLoadingRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      
      if (direction === 'down' || direction === 'both') {
        // 向下滾動檢測
        if (scrollHeight - scrollTop - clientHeight <= threshold) {
          loadMore();
        }
      }
      
      if (direction === 'up' || direction === 'both') {
        // 向上滾動檢測
        if (scrollTop <= threshold) {
          loadMore();
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [enabled, hasMore, threshold, direction, loadMore]);

  // Intersection Observer 用於觸發元素
  useEffect(() => {
    const loadingElement = loadingRef.current;
    if (!loadingElement || !enabled || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.length > 0) {
          const target = entries[0];
          if (target?.isIntersecting && !isLoadingRef.current) {
            loadMore();
          }
        }
      },
      {
        root: containerRef.current,
        threshold: 0.1
      }
    );

    observer.observe(loadingElement);

    return () => {
      observer.unobserve(loadingElement);
    };
  }, [enabled, hasMore, loadMore]);

  // 初始加載
  useEffect(() => {
    if (enabled && items.length === 0) {
      loadMore();
    }
  }, [enabled]); // 只依賴 enabled，避免無限循環

  // 組件卸載清理
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    items,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    reload,
    reset,
    containerRef,
    loadingRef,
    currentPage,
    totalLoaded: items.length
  };
}

// 虛擬滾動 Hook（用於大量數據的性能優化）
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);
    
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      top: (visibleRange.start + index) * itemHeight
    }));
  }, [items, visibleRange, itemHeight]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    visibleRange
  };
}

export default useInfiniteScroll;