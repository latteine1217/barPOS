import React, { useState, useMemo, useCallback, memo } from 'react';
import { useOrders } from '@/stores';
import type { Order, OrderItem } from '@/types';
import OrderDetailsModal from './OrderDetailsModal';

type TimePeriod = 'today' | 'week' | 'month' | 'all';

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  popularItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  hourlyData: Array<{
    hour: string;
    orders: number;
    revenue: number;
  }>;
  filteredOrders: Order[];
}

const Analytics: React.FC = memo(() => {
  const orders = useOrders();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // 使用 useMemo 緩存時間段選項
  const periodOptions = useMemo(() => [
    { value: 'today' as TimePeriod, label: '今日' },
    { value: 'week' as TimePeriod, label: '本週' },
    { value: 'month' as TimePeriod, label: '本月' },
    { value: 'all' as TimePeriod, label: '全部' }
  ], []);

  // 計算統計數據
  const analyticsData = useMemo((): AnalyticsData => {
    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week': {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart;
        break;
      }
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // 篩選訂單
    const filteredOrders = (orders || []).filter((order: Order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && order.status === 'paid';
    });

    // 計算基本統計
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum: number, order: Order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalCustomers = filteredOrders.reduce((sum: number, order: Order) => sum + order.customers, 0);

    // 計算熱門品項
    const itemStats = new Map<string, { quantity: number; revenue: number }>();
    filteredOrders.forEach((order: Order) => {
      order.items.forEach((item: OrderItem) => {
        const current = itemStats.get(item.name) || { quantity: 0, revenue: 0 };
        itemStats.set(item.name, {
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + (item.price * item.quantity)
        });
      });
    });

    const popularItems = Array.from(itemStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 計算每小時數據
    const hourlyStats = new Map<number, { orders: number; revenue: number }>();
    filteredOrders.forEach((order: Order) => {
      const hour = new Date(order.createdAt).getHours();
      const current = hourlyStats.get(hour) || { orders: 0, revenue: 0 };
      hourlyStats.set(hour, {
        orders: current.orders + 1,
        revenue: current.revenue + order.total
      });
    });

    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const stats = hourlyStats.get(hour) || { orders: 0, revenue: 0 };
      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        ...stats
      };
    });

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      totalCustomers,
      popularItems,
      hourlyData,
      filteredOrders
    };
  }, [orders, selectedPeriod]);

  // 使用 useCallback 優化事件處理函數
  const handleOrderClick = useCallback((order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  }, []);

  // 使用 useCallback 優化工具函數
  const formatCurrency = useCallback((amount: number): string => {
    return amount.toLocaleString();
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            營運分析
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            深入了解您的營運表現和趨勢
          </p>
        </div>
        
        {/* Period Selector */}
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
          {periodOptions.map((option) => (
            <button type="button"
              key={option.value}
              onClick={() => setSelectedPeriod(option.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === option.value
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">總營收</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                ${formatCurrency(analyticsData.totalRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">訂單數量</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {analyticsData.totalOrders}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">平均消費</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                ${formatCurrency(analyticsData.averageOrderValue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">總客人數</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {analyticsData.totalCustomers}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Items */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            熱門調酒
          </h3>
          {analyticsData.popularItems.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.popularItems.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.quantity} 杯
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ${formatCurrency(item.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">🍸</div>
              <p>暫無數據</p>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            最近訂單
          </h3>
          {analyticsData.filteredOrders.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {analyticsData.filteredOrders.slice(-10).reverse().map((order) => (
                <div
                  key={order.id}
                  onClick={() => handleOrderClick(order)}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      #{order.id.slice(-6)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      桌位 {order.tableNumber} • {order.customers} 人
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">
                      ${formatCurrency(order.total)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleTimeString('zh-TW', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">📋</div>
              <p>暫無訂單</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={handleCloseModal}
          onUpdateStatus={() => {}}
          onReleaseTable={() => {}}
          isHistoryMode={true}
        />
      )}
    </div>
  );
});

export default Analytics;