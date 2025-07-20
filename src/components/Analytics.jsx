import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import OrderDetailsModal from './OrderDetailsModal';

const Analytics = () => {
  const { state } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('today'); // today, week, month, all
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // 計算統計數據
  const analyticsData = useMemo(() => {
    const now = new Date();
    let startDate;

    switch (selectedPeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart;
        break;
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
    const filteredOrders = state.orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate;
    });

    // 基本統計
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 按狀態分組
    const ordersByStatus = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      acc[`${order.status}_revenue`] = (acc[`${order.status}_revenue`] || 0) + order.total;
      return acc;
    }, {});

    // 按桌號分組
    const ordersByTable = filteredOrders.reduce((acc, order) => {
      const tableKey = `table_${order.tableNumber}`;
      if (!acc[tableKey]) {
        acc[tableKey] = {
          tableNumber: order.tableNumber,
          orderCount: 0,
          revenue: 0,
          orders: []
        };
      }
      acc[tableKey].orderCount++;
      acc[tableKey].revenue += order.total;
      acc[tableKey].orders.push(order);
      return acc;
    }, {});

    // 按日期分組（用於趨勢圖）
    const ordersByDate = filteredOrders.reduce((acc, order) => {
      const dateKey = new Date(order.createdAt).toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          orderCount: 0,
          revenue: 0
        };
      }
      acc[dateKey].orderCount++;
      acc[dateKey].revenue += order.total;
      return acc;
    }, {});

    // 熱門餐點統計
    const itemStats = filteredOrders.reduce((acc, order) => {
      if (order.items) {
        order.items.forEach(item => {
          if (!acc[item.name]) {
            acc[item.name] = {
              name: item.name,
              price: item.price,
              quantity: 0,
              revenue: 0
            };
          }
          acc[item.name].quantity += item.quantity;
          acc[item.name].revenue += item.price * item.quantity;
        });
      }
      return acc;
    }, {});

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
      ordersByTable: Object.values(ordersByTable).sort((a, b) => b.revenue - a.revenue),
      ordersByDate: Object.values(ordersByDate).sort((a, b) => new Date(a.date) - new Date(b.date)),
      topItems: Object.values(itemStats).sort((a, b) => b.quantity - a.quantity).slice(0, 10),
      recentOrders: filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20)
    };
  }, [state.orders, selectedPeriod]);

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  };

  const getPeriodText = (period) => {
    switch (period) {
      case 'today': return '今日';
      case 'week': return '本週';
      case 'month': return '本月';
      case 'all': return '全部';
      default: return period;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '待處理';
      case 'preparing': return '調製中';
      case 'completed': return '已完成';
      case 'paid': return '已結帳';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'preparing': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'completed': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'paid': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30';
      case 'cancelled': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50';
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* 標題和時間篩選 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">酒吧營運分析</h1>
        <div className="flex flex-wrap gap-3">
          {['today', 'week', 'month', 'all'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-5 py-3 rounded-xl font-medium transition-all text-sm sm:text-base ${
                selectedPeriod === period
                  ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {getPeriodText(period)}
            </button>
          ))}
        </div>
      </div>

      {/* 主要統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card text-center p-8">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-3">
            {analyticsData.totalOrders}
          </div>
          <div className="text-gray-600 dark:text-gray-400">總訂單數</div>
        </div>
        <div className="card text-center p-8">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-3">
            ${analyticsData.totalRevenue.toLocaleString()}
          </div>
          <div className="text-gray-600 dark:text-gray-400">總營收</div>
        </div>
        <div className="card text-center p-8">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-3">
            ${Math.round(analyticsData.averageOrderValue)}
          </div>
          <div className="text-gray-600 dark:text-gray-400">平均客單價</div>
        </div>
      </div>

      {/* 訂單狀態分析 */}
      <div className="card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">訂單狀態分析</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {['pending', 'preparing', 'completed', 'paid', 'cancelled'].map(status => (
            <div key={status} className="text-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div className={`text-2xl font-bold mb-3 ${getStatusColor(status).split(' ')[0]} ${getStatusColor(status).split(' ')[2]}`}>
                {analyticsData.ordersByStatus[status] || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{getStatusText(status)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                ${(analyticsData.ordersByStatus[`${status}_revenue`] || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 桌位營收排行 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">座位營收排行</h2>
          <div className="space-y-4">
            {analyticsData.ordersByTable.slice(0, 10).map((table, index) => (
              <div key={table.tableNumber} className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300' :
                    index === 2 ? 'bg-orange-300 text-orange-900' :
                    'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">位 {table.tableNumber}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{table.orderCount} 筆訂單</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600 dark:text-green-400">${table.revenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    平均 ${Math.round(table.revenue / table.orderCount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 熱門餐點排行 */}
        <div className="card p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">熱門調酒排行</h2>
          <div className="space-y-4">
            {analyticsData.topItems.slice(0, 8).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-red-400 text-red-900' :
                    index === 1 ? 'bg-orange-300 text-orange-900' :
                    index === 2 ? 'bg-yellow-300 text-yellow-900' :
                    'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">單價 ${item.price}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600 dark:text-blue-400">{item.quantity} 份</div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">${item.revenue.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 最近訂單 */}
      <div className="card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">最近訂單</h2>
        {analyticsData.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    訂單編號
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    座位編號
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    總額
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    狀態
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    建立時間
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {analyticsData.recentOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    onClick={() => handleOrderClick(order)}
                  >
                    <td className="px-6 py-5 text-sm font-medium text-gray-900 dark:text-white">
                      #{order.id}
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-900 dark:text-gray-300">
                      位 {order.tableNumber}
                    </td>
                    <td className="px-6 py-5 text-sm font-semibold text-gray-900 dark:text-white">
                      ${order.total}
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleString('zh-TW')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-12">暫無訂單資料</p>
        )}
      </div>

      {/* 訂單詳情模態框 */}
      {showDetailsModal && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={handleCloseModal}
          onUpdateStatus={() => {}} // 在分析頁面中，我們不提供修改功能
          onReleaseTable={() => {}}
          isHistoryMode={true} // 標記為歷史模式，隱藏修改按鈕
        />
      )}
    </div>
  );
};

export default Analytics;