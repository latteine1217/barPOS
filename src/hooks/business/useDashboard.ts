import { useState, useEffect, useMemo } from 'react';
import { useOrderStore } from '@/stores';
import { useSettingsStore } from '@/stores/settingsStore';
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
  const cutoffHour = useSettingsStore((s) => s.businessDayCutoffHour ?? 3);
  const orders = useOrderStore((state) => state.orders);
  const [now, setNow] = useState(() => new Date());
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const hour = now.getHours();

  // 每秒刷新時間，讓日期/時間在跨日與跨 cutoff 時可以更新
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const todayStats = useMemo(() => {
    const end = new Date(year, month, day, hour, 0, 0, 0);
    if (hour >= cutoffHour) {
      end.setDate(end.getDate() + 1);
    }
    end.setHours(cutoffHour, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - 1);

    const todayOrders = orders.filter((order) => {
      const time = new Date(order.createdAt).getTime();
      return time >= start.getTime() && time < end.getTime();
    });

    return {
      todayOrderCount: todayOrders.length,
      todayRevenue: todayOrders.reduce((sum, order) => sum + order.total, 0),
      pendingCount: todayOrders.filter((order) => order.status === 'pending').length,
      completedCount: todayOrders.filter((order) => order.status === 'completed').length
    };
  }, [orders, cutoffHour, year, month, day, hour]);

  const recentOrders = useMemo(() => {
    return orders
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [orders]);

  const currentTime = useMemo(() =>
    now.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }), [now]
  );

  const currentDateSource = useMemo(() => new Date(year, month, day, 0, 0, 0, 0), [year, month, day]);
  const currentDate = useMemo(() =>
    currentDateSource.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }), [currentDateSource]
  );

  return {
    currentTime,
    currentDate,
    ...todayStats,
    recentOrders,
  };
};
