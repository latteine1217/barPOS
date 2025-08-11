import { memo, useCallback } from 'react';

export type TabType = 'tables' | 'dashboard' | 'menu' | 'history' | 'analytics' | 'settings' | 'layout';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const items: { id: TabType; label: string; icon: string }[] = [
  { id: 'tables', label: '座位管理', icon: '🪑' },
  { id: 'layout', label: '佈局編輯', icon: '🎨' },
  { id: 'dashboard', label: '儀表板', icon: '📊' },
  { id: 'menu', label: '酒單管理', icon: '🍸' },
  { id: 'history', label: '歷史訂單', icon: '📋' },
  { id: 'analytics', label: '營運分析', icon: '📈' },
  { id: 'settings', label: '設定', icon: '⚙️' }
];

const Sidebar = memo<SidebarProps>(({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) => {
  const handleNavClick = useCallback((tabId: TabType) => {
    if (activeTab === tabId) return;
    setActiveTab(tabId);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(false);
  }, [activeTab, setActiveTab, setSidebarOpen]);

  return (
    <>
      <div className="hidden lg:flex lg:flex-col w-64 bg-white dark:bg-gray-800 shadow-lg">
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`nav-item w-full text-left ${activeTab === item.id ? 'active' : ''}`}
                  aria-label={`切換到${item.label}`}
                >
                  <span className="mr-3" aria-hidden="true" role="presentation">{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-all ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">調酒酒吧POS</h1>
            <button onClick={() => setSidebarOpen(false)} aria-label="關閉側邊欄" className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              ✖️
            </button>
          </div>
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`nav-item w-full text-left ${activeTab === item.id ? 'active' : ''}`}
                    aria-label={`切換到${item.label}`}
                  >
                    <span className="mr-3" aria-hidden="true" role="presentation">{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
});

export default Sidebar;
