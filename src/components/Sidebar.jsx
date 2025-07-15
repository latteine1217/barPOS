import { useApp } from '../contexts/AppContext';

const Sidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) => {
  const { state, actions } = useApp();

  const menuItems = [
    { id: 'tables', label: '桌位管理', icon: '🪑' },
    { id: 'layout', label: '佈局編輯', icon: '🎨' },
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

  const handleThemeToggle = () => {
    actions.toggleTheme();
  };

  return (
    <>
      {/* 桌面端側邊欄 */}
      <div className="hidden lg:flex lg:flex-col w-64 bg-white dark:bg-gray-800 shadow-lg transition-colors duration-200">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">餐廳POS系統</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{currentTime}</p>
            </div>
            {/* 主題切換按鈕 */}
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={state.theme === 'light' ? '切換至深色模式' : '切換至淺色模式'}
            >
              {state.theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`nav-item w-full text-left transition-colors duration-200 ${
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

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between mb-2">
              <span>今日營收</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                ${state.stats.todayRevenue}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span>今日訂單</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{state.stats.todayOrders}</span>
            </div>
            <div className="flex justify-between">
              <span>當前客人</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{state.stats.activeCustomers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 移動端側邊欄 */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">餐廳POS系統</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{currentTime}</p>
            </div>
            <div className="flex items-center space-x-2">
              {/* 移動端主題切換按鈕 */}
              <button
                onClick={handleThemeToggle}
                className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={state.theme === 'light' ? '切換至深色模式' : '切換至淺色模式'}
              >
                {state.theme === 'light' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`nav-item w-full text-left transition-colors duration-200 ${
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

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between">
                  <span>今日營收</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    ${state.stats.todayRevenue}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>今日訂單</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{state.stats.todayOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span>當前客人</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{state.stats.activeCustomers}</span>
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