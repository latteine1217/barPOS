import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOrderStore } from '@/stores';
import type { Order } from '@/types';

interface DashboardData {
  currentTime: string;
  currentDate: string;
  todayOrderCount: number;
  todayRevenue: number;
  pendingCount: number;
  completedCount: number;
  recentOrders: Order[];
}

// 緩存今天的日期字符串
let cachedTodayString: string | null = null;
let lastTodayUpdate = 0;

const getTodayString = (): string => {
  const now = Date.now();
  if (!cachedTodayString || now - lastTodayUpdate > 60000) { // 每分鐘更新
    cachedTodayString = new Date().toDateString();
    lastTodayUpdate = now;
  }
  return cachedTodayString;
};

// 緩存計算結果避免重複計算
let lastOrdersRef: Order[] | null = null;
let lastTodayStatsCache: {
  todayOrderCount: number;
  todayRevenue: number;
  pendingCount: number;
  completedCount: number;
} | null = null;

let lastRecentOrdersRef: Order[] | null = null;
let lastRecentOrdersCache: Order[] | null = null;

export const useDashboard = (): DashboardData => {
  // ✅ 正確的時間更新機制
  const [currentTime, setCurrentTime] = useState(() => 
    new Date().toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  );

  // ✅ 每秒更新時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit', 
        second: '2-digit'
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ✅ 使用穩定的 selector 避免新引用
  const todayStats = useOrderStore(useCallback((state) => {
    const orders = state.orders;
    
    // 如果訂單引用沒變，返回緩存結果
    if (orders === lastOrdersRef && lastTodayStatsCache) {
      return lastTodayStatsCache;
    }
    
    const todayString = getTodayString();
    const todayOrders = orders.filter(order => 
      new Date(order.createdAt).toDateString() === todayString
    );
    
    const result = {
      todayOrderCount: todayOrders.length,
      todayRevenue: todayOrders.reduce((sum, order) => sum + order.total, 0),
      pendingCount: todayOrders.filter(o => o.status === 'pending').length,
      completedCount: todayOrders.filter(o => o.status === 'completed').length,
    };
    
    lastOrdersRef = orders;
    lastTodayStatsCache = result;
    
    return result;
  }, []));

  // ✅ 使用穩定的 selector 避免新引用
  const recentOrders = useOrderStore(useCallback((state) => {
    const orders = state.orders;
    
    // 如果訂單引用沒變，返回緩存結果
    if (orders === lastRecentOrdersRef && lastRecentOrdersCache) {
      return lastRecentOrdersCache;
    }
    
    const result = orders
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    lastRecentOrdersRef = orders;
    lastRecentOrdersCache = result;
    
    return result;
  }, []));

  // ✅ 靜態數據不需要記憶化
  const currentDate = useMemo(() => 
    new Date().toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }), []); // 只在組件首次渲染時計算一次

  return {
    currentTime,
    currentDate,
    ...todayStats,
    recentOrders,
  };
};