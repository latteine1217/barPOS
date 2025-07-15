import { useApp } from '../contexts/AppContext';

const Dashboard = () => {
  const { state } = useApp();

  const recentOrders = state.orders
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'preparing': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '待處理';
      case 'preparing': return '製作中';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">儀表板</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">今日營收</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                ${state.stats.todayRevenue}
              </p>
            </div>
            <div className="text-2xl sm:text-3xl">💰</div>
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">今日訂單</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">
                {state.stats.todayOrders}
              </p>
            </div>
            <div className="text-2xl sm:text-3xl">📋</div>
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">當前客人</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600">
                {state.stats.activeCustomers}
              </p>
            </div>
            <div className="text-2xl sm:text-3xl">👥</div>
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">空桌數量</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600">
                {state.tables.filter(t => t.status === 'available').length}
              </p>
            </div>
            <div className="text-2xl sm:text-3xl">🪑</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 桌位概覽 */}
        <div className="card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">桌位概覽</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {state.tables.map((table) => (
              <div
                key={table.id}
                className={`p-2 sm:p-3 rounded-lg text-center text-xs sm:text-sm font-medium ${
                  table.status === 'available'
                    ? 'bg-green-100 text-green-800'
                    : table.status === 'occupied'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                <div className="font-bold">桌 {table.number}</div>
                <div className="text-xs">
                  {table.status === 'available' ? '空桌' : 
                   table.status === 'occupied' ? `${table.customers}人` : '清潔中'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 最近訂單 */}
        <div className="card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">最近訂單</h2>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">暫無訂單</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-medium">桌 {order.tableNumber}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {new Date(order.createdAt).toLocaleTimeString('zh-TW', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="font-semibold text-green-600">
                    ${order.total}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;