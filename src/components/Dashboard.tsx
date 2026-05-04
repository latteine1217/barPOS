import { memo, useCallback } from 'react';
import { useDashboard } from '@/hooks/business/useDashboard';
import type { OrderStatus, Order } from '@/types';
import { useSettingsStore } from '@/stores/settingsStore';

type TabNav = 'tables' | 'dashboard' | 'menu' | 'history' | 'analytics' | 'settings' | 'layout';

interface DashboardProps {
  onNavigate?: (tab: TabNav) => void;
}

const Dashboard: React.FC<DashboardProps> = memo(({ onNavigate }) => {
  // ✅ 使用新的 useDashboard hook
  const {
    currentTime,
    currentDate,
    todayOrderCount,
    todayRevenue,
    pendingCount,
    completedCount,
    recentOrders
  } = useDashboard();

  // ✅ 穩定的回調函數
  const getStatusColor = useCallback((status: OrderStatus): string => {
    const statusColors: Record<OrderStatus, string> = {
      pending: 'status-badge status-pending',
      preparing: 'status-badge status-preparing',
      completed: 'status-badge status-completed',
      paid: 'status-badge status-paid',
      cancelled: 'status-badge status-cancelled',
    };
    return statusColors[status] || 'status-badge status-pending';
  }, []);

  const getStatusText = useCallback((status: OrderStatus): string => {
    const statusTexts: Record<OrderStatus, string> = {
      pending: '待處理',
      preparing: '調製中',
      completed: '已完成',
      paid: '已結帳',
      cancelled: '已取消',
    };
    return statusTexts[status] || status;
  }, []);

  const formatCurrency = useCallback((amount: number): string => {
    return amount.toLocaleString();
  }, []);

  const cutoffHour = useSettingsStore((s) => s.businessDayCutoffHour ?? 3);

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* Header with greeting */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-2">
            歡迎回來 👋
          </h1>
          <p className="text-[var(--text-muted)]">
            今天是 {currentDate}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-[var(--text-muted)]">
            上次更新: {currentTime}
          </div>
        </div>
      </div>

      {/* KPI Cards with enhanced design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <div className="card p-6 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">今日營收</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                ${formatCurrency(todayRevenue)}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                +12% 較昨日
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              💰
            </div>
          </div>
        </div>

        {/* 營業結算（跨日 cutoff） */}
        <div className="card p-6 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">營業結算</p>
              <p className="text-3xl font-bold text-[var(--text-primary)]">
                ${formatCurrency(todayRevenue)}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                訂單 {todayOrderCount}，結算界線 {cutoffHour.toString().padStart(2,'0')}:00
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              🧾
            </div>
          </div>
        </div>

        <div className="card p-6 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">今日訂單</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {todayOrderCount}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
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
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">待處理</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {pendingCount}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                需要處理
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              ⏳
            </div>
          </div>
        </div>

        <div className="card p-6 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">已完成</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {completedCount}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                今日完成
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              ✅
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">最近訂單</h2>
          <button type="button" onClick={() => onNavigate?.('history')} className="text-[var(--color-accent)] hover:opacity-90 text-sm font-medium">
            查看全部
          </button>
        </div>
        
        {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🍸</div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">尚無訂單</h3>
            <p className="text-[var(--text-muted)]">開始您的第一筆訂單吧！</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-[var(--text-secondary)]">訂單編號</th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--text-secondary)]">桌位</th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--text-secondary)]">金額</th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--text-secondary)]">狀態</th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--text-secondary)]">時間</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: Order) => (
                  <tr key={order.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-[var(--text-primary)]">
                        #{order.id.slice(-6)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[var(--text-primary)]">
                        {order.tableName || `桌位 ${order.tableNumber}`}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[var(--text-primary)]">
                        ${formatCurrency(order.total)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-[var(--text-muted)]">
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
        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => onNavigate?.('menu')}>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">🍸</span>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">新增訂單</h3>
              <p className="text-sm text-[var(--text-muted)]">建立新的調酒訂單</p>
            </div>
          </div>
        </div>

        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => onNavigate?.('tables')}>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">🪑</span>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">座位管理</h3>
              <p className="text-sm text-[var(--text-muted)]">查看座位狀態</p>
            </div>
          </div>
        </div>

        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => onNavigate?.('analytics')}>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">📈</span>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">營運分析</h3>
              <p className="text-sm text-[var(--text-muted)]">查看詳細報表</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
