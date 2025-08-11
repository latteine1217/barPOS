// 分頁 Hook - 處理數據分頁邏輯
import { useState, useMemo, useCallback } from 'react';

export interface UsePaginationOptions<T> {
  data: T[];
  pageSize: number;
  initialPage?: number;
  onPageChange?: (page: number) => void;
}

export interface PaginationReturn<T> {
  // 當前頁數據
  currentItems: T[];
  
  // 分頁信息
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
  
  // 分頁操作
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToFirst: () => void;
  goToLast: () => void;
  
  // 頁面範圍
  getPageNumbers: () => number[];
  getItemRange: () => { start: number; end: number };
}

export function usePagination<T>({
  data,
  pageSize,
  initialPage = 1,
  onPageChange
}: UsePaginationOptions<T>): PaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(initialPage);

  // 計算總頁數
  const totalPages = useMemo(() => {
    return Math.ceil(data.length / pageSize);
  }, [data.length, pageSize]);

  // 計算當前頁數據
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize]);

  // 檢查是否有下一頁/上一頁
  const hasNext = currentPage < totalPages;
  const hasPrevious = currentPage > 1;

  // 跳轉到指定頁
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
    onPageChange?.(validPage);
  }, [totalPages, onPageChange]);

  // 下一頁
  const nextPage = useCallback(() => {
    if (hasNext) {
      goToPage(currentPage + 1);
    }
  }, [hasNext, currentPage, goToPage]);

  // 上一頁
  const previousPage = useCallback(() => {
    if (hasPrevious) {
      goToPage(currentPage - 1);
    }
  }, [hasPrevious, currentPage, goToPage]);

  // 第一頁
  const goToFirst = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  // 最後一頁
  const goToLast = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);

  // 獲取頁碼列表（用於分頁導航）
  const getPageNumbers = useCallback((maxVisible = 7): number[] => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  // 獲取當前項目範圍
  const getItemRange = useCallback(() => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, data.length);
    return { start, end };
  }, [currentPage, pageSize, data.length]);

  return {
    currentItems,
    currentPage,
    totalPages,
    totalItems: data.length,
    pageSize,
    hasNext,
    hasPrevious,
    goToPage,
    nextPage,
    previousPage,
    goToFirst,
    goToLast,
    getPageNumbers,
    getItemRange
  };
}

export default usePagination;