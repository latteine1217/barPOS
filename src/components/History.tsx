import { useState, useMemo, useCallback, memo } from 'react';
import { useOrders } from '@/stores';
import OrderDetailsModal from './OrderDetailsModal';
import type { Order, OrderStatus } from '../types';

interface Filters {
  status: string;
  dateRange: string;
  tableNumber: string;
  startDate: string;
  endDate: string;
}

const History = memo(() => {
  const orders = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    dateRange: 'all',
    tableNumber: 'all',
    startDate: '',
    endDate: ''
  });

  // 使用 useCallback 優化函數
  const getStatusColor = useCallback((status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'preparing': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'completed': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'paid': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30';
      case 'cancelled': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50';
    }
  }, []);

  const getStatusText = useCallback((status) => {
    switch (status) {
      case 'pending': return '待處理';
      case 'preparing': return '製作中';
      case 'completed': return '已完成';
      case 'paid': return '已結帳';
      case 'cancelled': return '已取消';
      default: return status;
    }
  }, []);

  // 使用 useCallback 優化日期範圍計算
  const getDateRange = useCallback((range) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'yesterday': {
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return { start: yesterday, end: today };
      }
      case 'week': {
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { start: weekStart, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      }
      case 'month': {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: monthStart, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      }
      case 'custom':
        return {
          start: filters.startDate ? new Date(filters.startDate) : new Date(0),
          end: filters.endDate ? new Date(`${filters.endDate}T23:59:59`) : new Date()
        };
      default:
        return { start: new Date(0), end: new Date() };
    }
  }, [filters.startDate, filters.endDate]);

  // 過濾後的訂單
  const filteredOrders = useMemo(() => {
    let filtered = [...(orders || [])];

    // 狀態過濾
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // 桌號過濾
    if (filters.tableNumber !== 'all') {
      filtered = filtered.filter(order => order.tableNumber === parseInt(filters.tableNumber));
    }

    // 日期過濾
    if (filters.dateRange !== 'all') {
      const { start, end } = getDateRange(filters.dateRange);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= start && orderDate < end;
      });
    }

    // 按創建時間降序排列
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, filters, getDateRange]);

  // 統計數據
  const statistics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const statusCounts = filteredOrders.reduce((counts, order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;
      return counts;
    }, {} as Record<OrderStatus, number>);

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      statusCounts
    };
  }, [filteredOrders]);

  // 使用 useMemo 緩存唯一桌號列表
  const uniqueTableNumbers = useMemo(() => {
    return [...new Set((orders || []).map(order => order.tableNumber))].sort((a, b) => a - b);
  }, [orders]);

  // 使用 useCallback 優化事件處理函數
  const handleOrderClick = useCallback((order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      status: 'all',
      dateRange: 'all',
      tableNumber: 'all',
      startDate: '',
      endDate: ''
    });
  }, []);

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">歷史訂單</h1>
      </div>

      {/* 過濾器 */}
      <div className="card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-white mb-6">篩選條件</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="form-label">訂單狀態</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="form-input text-sm"
            >
              <option value="all">全部狀態</option>
              <option value="pending">待處理</option>
              <option value="preparing">製作中</option>
              <option value="completed">已完成</option>
              <option value="paid">已結帳</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>

          <div>
            <label className="form-label">時間範圍</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="form-input text-sm"
            >
              <option value="all">全部時間</option>
              <option value="today">今天</option>
              <option value="yesterday">昨天</option>
              <option value="week">最近7天</option>
              <option value="month">本月</option>
              <option value="custom">自定義</option>
            </select>
          </div>

          <div>
            <label className="form-label">桌號</label>
            <select
              value={filters.tableNumber}
              onChange={(e) => setFilters({ ...filters, tableNumber: e.target.value })}
              className="form-input text-sm"
            >
              <option value="all">全部桌號</option>
              {uniqueTableNumbers.map(tableNum => (
                <option key={tableNum} value={tableNum}>桌 {tableNum}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">操作</label>
            <button
              onClick={handleResetFilters}
              className="btn btn-secondary w-full text-sm"
            >
              重置篩選
            </button>
          </div>
        </div>

        {/* 自定義日期範圍 */}
        {filters.dateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div>
              <label className="form-label">開始日期</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="form-input text-sm"
              />
            </div>
            <div>
              <label className="form-label">結束日期</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="form-input text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* 統計概覽 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="card text-center p-6 sm:p-8">
          <div className="text-2xl font-bold text-blue-400">{statistics.totalOrders}</div>
          <div className="text-sm text-white/80">總訂單數</div>
        </div>
        <div className="card text-center p-6 sm:p-8">
          <div className="text-2xl font-bold text-green-400">${statistics.totalRevenue}</div>
          <div className="text-sm text-white/80">總營收</div>
        </div>
        <div className="card text-center p-6 sm:p-8">
          <div className="text-2xl font-bold text-purple-400">${Math.round(statistics.avgOrderValue)}</div>
          <div className="text-sm text-white/80">平均客單價</div>
        </div>
        <div className="card text-center p-6 sm:p-8">
          <div className="text-2xl font-bold text-orange-400">{statistics.statusCounts.paid || 0}</div>
          <div className="text-sm text-white/80">已結帳訂單</div>
        </div>
      </div>

      {/* 訂單列表 */}
      <div className="card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-white mb-6">
          訂單列表 ({filteredOrders.length} 筆)
        </h2>
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="card bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase">
                    訂單編號
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase">
                    桌號
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase">
                    餐點
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase">
                    總額
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase">
                    狀態
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase">
                    建立時間
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => handleOrderClick(order)}
                  >
                    <td className="px-6 py-5 text-sm font-medium text-white">
                      #{order.id}
                    </td>
                    <td className="px-6 py-5 text-sm text-white/90">
                      桌 {order.tableNumber}
                    </td>
                    <td className="px-6 py-5 text-sm text-white/90">
                      <div className="max-w-xs">
                        {order.items?.map((item, index) => (
                          <div key={index} className="text-xs text-white/70">
                            {item.name} x{item.quantity}
                          </div>
                        )) || '無餐點資訊'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-semibold text-white">
                      ${order.total}
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-white/70">
                      {new Date(order.createdAt).toLocaleString('zh-TW')}
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOrderClick(order);
                        }}
                        className="btn btn-sm btn-primary"
                      >
                        詳情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-white/60 text-center py-12">
            {(orders || []).length === 0 ? '暫無訂單紀錄' : '無符合條件的訂單'}
          </p>
        )}
      </div>

      {/* 訂單詳情模態框 */}
      {showDetailsModal && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={handleCloseModal}
          onUpdateStatus={() => {}} // 歷史頁面不允許修改狀態
          onReleaseTable={() => {}} // 歷史頁面不允許釋放桌位
          isHistoryMode={true}
        />
      )}
    </div>
  );
});

export default History;