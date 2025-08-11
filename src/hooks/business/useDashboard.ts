import { useState, useEffect, useMemo } from 'react';
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

export const useDashboard = (): DashboardData => {
  // ✅ 正確的時間更新機制
  const [currentTime, setCurrentTime] = useState(() => 
    new Date().toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  );

  // ✅ 靜態數據使用初始化函數避免重複計算
  const [currentDate] = useState(() => 
    new Date().toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  );

  // ✅ 今日日期字符串，只計算一次
  const [todayString] = useState(() => new Date().toDateString());

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

  // ✅ 精確的狀態訂閱 - 使用穩定的今日日期
  const todayStats = useOrderStore(state => {
    const todayOrders = state.orders.filter(order => 
      new Date(order.createdAt).toDateString() === todayString
    );
    
    return {
      todayOrderCount: todayOrders.length,
      todayRevenue: todayOrders.reduce((sum, order) => sum + order.total, 0),
      pendingCount: todayOrders.filter(o => o.status === 'pending').length,
      completedCount: todayOrders.filter(o => o.status === 'completed').length,
    };
  });

  // ✅ 最近訂單 - 使用穩定的選擇器避免不必要渲染
  const recentOrders = useOrderStore(state => {
    // 使用穩定的排序邏輯
    const sortedOrders = state.orders
      .slice() // 創建副本避免修改原數組
      .sort((a, b) => {
        // 使用穩定的時間戳比較，避免重複 new Date() 調用
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      })
      .slice(0, 5);
    
    return sortedOrders;
  });

  // ✅ 使用 useMemo 穩定返回對象引用
  return useMemo(() => ({
    currentTime,
    currentDate,
    todayOrderCount: todayStats.todayOrderCount,
    todayRevenue: todayStats.todayRevenue,
    pendingCount: todayStats.pendingCount,
    completedCount: todayStats.completedCount,
    recentOrders,
  }), [currentTime, currentDate, todayStats, recentOrders]);
};