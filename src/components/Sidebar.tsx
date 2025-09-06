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
      {/* 桌面版側邊欄 - Glassmorphism 設計 */}
      <div className="hidden lg:flex lg:flex-col w-72 bg-white/10 backdrop-blur-xl border-r border-white/20 shadow-2xl">
        <nav className="flex-1 p-6">
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-6 py-4 rounded-2xl font-medium transition-all duration-200 flex items-center ${
                    activeTab === item.id 
                      ? 'bg-white/20 text-white border border-white/30 shadow-lg backdrop-blur-sm' 
                      : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-105'
                  }`}
                  aria-label={`切換到${item.label}`}
                >
                  <span className="text-2xl mr-4" aria-hidden="true" role="presentation">{item.icon}</span>
                  <span className="text-lg drop-shadow-md">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* 移動版側邊欄 - Glassmorphism 設計 */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white/10 backdrop-blur-xl border-r border-white/20 shadow-2xl transform transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between border-b border-white/20">
            <h1 className="text-xl font-bold text-white drop-shadow-lg">調酒酒吧POS</h1>
            <button 
              onClick={() => setSidebarOpen(false)} 
              aria-label="關閉側邊欄" 
              className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200 text-white/80 hover:text-white hover:scale-110"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 p-6">
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full text-left px-6 py-4 rounded-2xl font-medium transition-all duration-200 flex items-center ${
                      activeTab === item.id 
                        ? 'bg-white/20 text-white border border-white/30 shadow-lg backdrop-blur-sm' 
                        : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-105'
                    }`}
                    aria-label={`切換到${item.label}`}
                  >
                    <span className="text-2xl mr-4" aria-hidden="true" role="presentation">{item.icon}</span>
                    <span className="text-lg drop-shadow-md">{item.label}</span>
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
