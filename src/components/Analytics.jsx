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
      case 'preparing': return '製作中';
      case 'completed': return '已完成';
      case 'paid': return '已結帳';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'preparing': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'paid': return 'text-purple-600 bg-purple-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* 標題和時間篩選 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">營運分析</h1>
        <div className="flex flex-wrap gap-2">
          {['today', 'week', 'month', 'all'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {getPeriodText(period)}
            </button>
          ))}
        </div>
      </div>

      {/* 主要統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {analyticsData.totalOrders}
          </div>
          <div className="text-gray-600">總訂單數</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            ${analyticsData.totalRevenue.toLocaleString()}
          </div>
          <div className="text-gray-600">總營收</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            ${Math.round(analyticsData.averageOrderValue)}
          </div>
          <div className="text-gray-600">平均客單價</div>
        </div>
      </div>

      {/* 訂單狀態分析 */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">訂單狀態分析</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {['pending', 'preparing', 'completed', 'paid', 'cancelled'].map(status => (
            <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold mb-2 ${getStatusColor(status).split(' ')[0]}`}>
                {analyticsData.ordersByStatus[status] || 0}
              </div>
              <div className="text-sm text-gray-600 mb-2">{getStatusText(status)}</div>
              <div className="text-xs text-gray-500">
                ${(analyticsData.ordersByStatus[`${status}_revenue`] || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 桌位營收排行 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">桌位營收排行</h2>
          <div className="space-y-3">
            {analyticsData.ordersByTable.slice(0, 10).map((table, index) => (
              <div key={table.tableNumber} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                    index === 2 ? 'bg-orange-300 text-orange-900' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">桌 {table.tableNumber}</div>
                    <div className="text-sm text-gray-600">{table.orderCount} 筆訂單</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">${table.revenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">
                    平均 ${Math.round(table.revenue / table.orderCount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 熱門餐點排行 */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">熱門餐點排行</h2>
          <div className="space-y-3">
            {analyticsData.topItems.slice(0, 8).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-red-400 text-red-900' :
                    index === 1 ? 'bg-orange-300 text-orange-900' :
                    index === 2 ? 'bg-yellow-300 text-yellow-900' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600">單價 ${item.price}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">{item.quantity} 份</div>
                  <div className="text-sm text-gray-500">${item.revenue.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 最近訂單 */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">最近訂單</h2>
        {analyticsData.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    訂單編號
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    桌號
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    總額
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    狀態
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    建立時間
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analyticsData.recentOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleOrderClick(order)}
                  >
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      #{order.id}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      桌 {order.tableNumber}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                      ${order.total}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString('zh-TW')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">暫無訂單資料</p>
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