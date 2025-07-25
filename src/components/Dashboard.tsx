import { memo, useMemo, useCallback } from 'react';
import { useOrders, useOrderStats } from '@/stores';
import type { Order, OrderStatus } from '@/types';

const Dashboard = memo(() => {
  const orders = useOrders();
  const orderStats = useOrderStats();

  // 使用 useMemo 優化最近訂單計算
  const recentOrders = useMemo(() => {
    return orders
      ?.slice()
      .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5) || [];
  }, [orders]);

  // 使用 useCallback 優化狀態顏色函數
  const getStatusColor = useCallback((status: OrderStatus): string => {
    switch (status) {
      case 'pending': return 'status-badge status-pending';
      case 'preparing': return 'status-badge status-preparing';
      case 'completed': return 'status-badge status-completed';
      case 'paid': return 'status-badge status-paid';
      default: return 'status-badge status-pending';
    }
  }, []);

  // 使用 useCallback 優化狀態文字函數
  const getStatusText = useCallback((status: OrderStatus): string => {
    switch (status) {
      case 'pending': return '待處理';
      case 'preparing': return '調製中';
      case 'completed': return '已完成';
      case 'paid': return '已結帳';
      default: return status;
    }
  }, []);

  // 使用 useCallback 優化貨幣格式化函數
  const formatCurrency = useCallback((amount: number): string => {
    return amount.toLocaleString();
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* Header with greeting */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            歡迎回來 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            今天是 {new Date().toLocaleDateString('zh-TW', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            上次更新: {new Date().toLocaleTimeString('zh-TW')}
          </div>
        </div>
      </div>

      {/* KPI Cards with enhanced design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">今日營收</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                ${formatCurrency(0)} {/* TODO: 實現今日營收計算 */}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                +12% 較昨日
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              💰
            </div>
          </div>
        </div>

        <div className="card p-6 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">今日訂單</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {orderStats.todayOrders}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                +8% 較昨日
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              📋
            </div>
          </div>
        </div>

        <div className="card p-6 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">當前客人</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {0} {/* TODO: 從桌位狀態計算活躍客人數 */}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                正在用餐
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              👥
            </div>
          </div>
        </div>

        <div className="card p-6 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">平均消費</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                ${formatCurrency(0)} {/* TODO: 實現平均訂單價值計算 */}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                每筆訂單
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              📊
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">最近訂單</h2>
          <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
            查看全部
          </button>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍸</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">尚無訂單</h3>
            <p className="text-gray-500 dark:text-gray-400">開始您的第一筆訂單吧！</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">訂單編號</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">桌位</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">金額</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">狀態</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">時間</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: Order) => (
                  <tr key={order.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        #{order.id.slice(-6)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-900 dark:text-white">
                        {order.tableName || `桌位 ${order.tableNumber}`}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        ${formatCurrency(order.total)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleTimeString('zh-TW', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">🍸</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">新增訂單</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">建立新的調酒訂單</p>
            </div>
          </div>
        </div>

        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">🪑</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">座位管理</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">查看座位狀態</p>
            </div>
          </div>
        </div>

        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">📈</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">營運分析</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">查看詳細報表</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Dashboard;