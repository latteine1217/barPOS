import { useApp } from '../contexts/AppContext';

const Dashboard = () => {
  const { state } = useApp();

  const recentOrders = state.orders
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'status-badge status-pending';
      case 'preparing': return 'status-badge status-preparing';
      case 'completed': return 'status-badge status-completed';
      case 'paid': return 'status-badge status-paid';
      case 'cancelled': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
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
                ${state.stats.todayRevenue?.toLocaleString() || '0'}
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
                {state.stats.todayOrders || 0}
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
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {state.stats.activeCustomers || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                正在享用
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              👥
            </div>
          </div>
        </div>

        <div className="card p-6 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">空位數量</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {state.tables.filter(t => t.status === 'available').length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                / {state.tables.length} 總位數
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              🪑
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Table Overview */}
        <div className="xl:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">座位概覽</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">即時狀態</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {state.tables.map((table) => (
                <div
                  key={table.id}
                  className={`p-6 rounded-xl text-center font-medium transition-all hover:scale-105 ${
                    table.status === 'available'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
                      : table.status === 'occupied'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700'
                  }`}
                >
                  <div className="text-lg font-bold mb-1">位 {table.number}</div>
                  <div className="text-xs opacity-75">
                    {table.status === 'available' ? '空位' : 
                     table.status === 'occupied' ? `${table.customers || 0}人` : '清潔中'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">最近訂單</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">最新 5 筆</span>
            </div>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">#{order.id}</span>
                        <span className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        位 {order.tableNumber} • ${order.total}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleString('zh-TW')}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">📝</div>
                  <p>暫無訂單</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">快速操作</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button className="btn btn-primary text-center py-6 flex-col">
            <div className="text-2xl mb-3">➕</div>
            <span className="text-sm">新增訂單</span>
          </button>
          <button className="btn btn-info text-center py-6 flex-col">
            <div className="text-2xl mb-3">📊</div>
            <span className="text-sm">營運分析</span>
          </button>
          <button className="btn btn-success text-center py-6 flex-col">
            <div className="text-2xl mb-3">🍽️</div>
            <span className="text-sm">菜單管理</span>
          </button>
          <button className="btn btn-secondary text-center py-6 flex-col">
            <div className="text-2xl mb-3">⚙️</div>
            <span className="text-sm">系統設定</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;