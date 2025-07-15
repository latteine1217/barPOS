import { useApp } from '../contexts/AppContext';

const Sidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) => {
  const { state } = useApp();

  const menuItems = [
    { id: 'tables', label: '桌位管理', icon: '🪑' },
    { id: 'dashboard', label: '儀表板', icon: '📊' },
    { id: 'menu', label: '菜單管理', icon: '🍽️' },
    { id: 'history', label: '歷史訂單', icon: '📋' },
    { id: 'analytics', label: '營運分析', icon: '📈' },
    { id: 'settings', label: '設定', icon: '⚙️' }
  ];

  const currentTime = new Date().toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    // 在移動端點擊後關閉側邊欄
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* 桌面端側邊欄 */}
      <div className="hidden lg:flex lg:flex-col w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-800">餐廳POS系統</h1>
          <p className="text-sm text-gray-500 mt-1">{currentTime}</p>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`nav-item w-full text-left ${
                    activeTab === item.id ? 'active' : ''
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between mb-2">
              <span>今日營收</span>
              <span className="font-semibold text-green-600">
                ${state.stats.todayRevenue}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span>今日訂單</span>
              <span className="font-semibold">{state.stats.todayOrders}</span>
            </div>
            <div className="flex justify-between">
              <span>當前客人</span>
              <span className="font-semibold">{state.stats.activeCustomers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 移動端側邊欄 */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-800">餐廳POS系統</h1>
              <p className="text-xs text-gray-500 mt-1">{currentTime}</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`nav-item w-full text-left ${
                      activeTab === item.id ? 'active' : ''
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t">
            <div className="text-sm text-gray-600">
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between">
                  <span>今日營收</span>
                  <span className="font-semibold text-green-600">
                    ${state.stats.todayRevenue}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>今日訂單</span>
                  <span className="font-semibold">{state.stats.todayOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span>當前客人</span>
                  <span className="font-semibold">{state.stats.activeCustomers}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;