import { memo, useCallback } from 'react';

export type TabType = 'tables' | 'dashboard' | 'menu' | 'members' | 'history' | 'analytics' | 'settings' | 'layout';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  collapsed?: boolean;
}

const items: { id: TabType; label: string; icon: string }[] = [
  { id: 'tables', label: '座位管理', icon: '🪑' },
  { id: 'layout', label: '佈局編輯', icon: '🎨' },
  { id: 'dashboard', label: '儀表板', icon: '📊' },
  { id: 'menu', label: '酒單管理', icon: '🍸' },
  { id: 'members', label: '會員紀錄', icon: '👤' },
  { id: 'history', label: '歷史訂單', icon: '📋' },
  { id: 'analytics', label: '營運分析', icon: '📈' },
  { id: 'settings', label: '設定', icon: '⚙️' }
];

const Sidebar = memo<SidebarProps>(({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, collapsed = false }) => {
  const handleNavClick = useCallback((tabId: TabType) => {
    if (activeTab === tabId) return;
    setActiveTab(tabId);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(false);
  }, [activeTab, setActiveTab, setSidebarOpen]);

  return (
    <>
      {/* 桌面版側邊欄 - 現代白色設計 */}
      <div className={`hidden lg:flex lg:flex-col ${collapsed ? 'w-16' : 'w-60'} bg-white border-r border-gray-200 shadow-sm transition-all duration-200`}>
        <nav className="flex-1 p-6">
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <button type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left ${collapsed ? 'px-3 justify-center' : 'px-5'} py-3 rounded-xl font-medium transition-all duration-200 flex items-center border ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
                  }`}
                  aria-label={`切換到${item.label}`}
                  title={item.label}
                >
                  <span className={`text-2xl ${collapsed ? '' : 'mr-4'}`} aria-hidden="true" role="presentation">{item.icon}</span>
                  {!collapsed && <span className="text-base">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        {/* Footer (desktop) */}
        <div className={`${collapsed ? 'px-2' : 'px-4'} py-3 border-t border-gray-200 text-[11px] text-gray-500`}>
          {!collapsed ? (
            <div className="space-y-1">
              <div className="font-medium text-gray-600">barPOS - Cocktail Bar Management System</div>
              <div className="flex items-center justify-between gap-2">
                <a
                  href="https://github.com/latteine1217/barPOS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-700 underline-offset-2 hover:underline"
                >
                  GitHub
                </a>
                <a
                  href="mailto:felix.tc.tw@gmail.com"
                  className="hover:text-gray-700 underline-offset-2 hover:underline"
                >
                  felix.tc.tw@gmail.com
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <a
                href="https://github.com/latteine1217/barPOS"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub 專案連結"
                className="hover:text-gray-700"
                title="GitHub"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.08 3.292 9.384 7.862 10.9.575.106.788-.25.788-.557 0-.275-.01-1.004-.016-1.971-3.2.695-3.876-1.542-3.876-1.542-.523-1.328-1.278-1.682-1.278-1.682-1.044-.713.08-.699.08-.699 1.154.081 1.762 1.186 1.762 1.186 1.027 1.76 2.695 1.252 3.35.958.104-.744.402-1.252.73-1.54-2.555-.291-5.242-1.278-5.242-5.686 0-1.257.45-2.284 1.187-3.09-.119-.291-.515-1.463.113-3.05 0 0 .967-.31 3.17 1.18a11.02 11.02 0 0 1 2.887-.389c.98.004 1.97.133 2.887.39 2.203-1.49 3.168-1.18 3.168-1.18.63 1.588.234 2.76.115 3.05.74.806 1.186 1.833 1.186 3.09 0 4.42-2.692 5.392-5.258 5.678.412.355.78 1.055.78 2.129 0 1.538-.014 2.778-.014 3.157 0 .31.208.67.796.555A11.504 11.504 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z"/></svg>
              </a>
              <a href="mailto:felix.tc.tw@gmail.com" aria-label="作者聯絡信箱" title="Email" className="hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M1.5 6.75A2.25 2.25 0 0 1 3.75 4.5h16.5A2.25 2.25 0 0 1 22.5 6.75v10.5A2.25 2.25 0 0 1 20.25 19.5H3.75A2.25 2.25 0 0 1 1.5 17.25V6.75Zm1.8-.45a.75.75 0 0 0-.3.6v.127l8.727 5.455a.75.75 0 0 0 .646 0L21 7.027V6.9a.75.75 0 0 0-.3-.6.75.75 0 0 0-.45-.15H3.75a.75.75 0 0 0-.45.15Zm18.9 2.223-7.95 4.97a2.25 2.25 0 0 1-1.998 0L2.25 8.523v8.727c0 .414.336.75.75.75h16.5c.414 0 .75-.336.75-.75V8.523Z"/></svg>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 移動版側邊欄 - 現代白色設計 */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 shadow-xl transform transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between border-b border-gray-200 bg-white">
            <h1 className="text-xl font-bold text-slate-900">調酒酒吧POS</h1>
            <button type="button" 
              onClick={() => setSidebarOpen(false)} 
              aria-label="關閉側邊欄" 
              className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-slate-600 hover:text-slate-900"
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
                  <button type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full text-left px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center border ${
                      activeTab === item.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
                    }`}
                    aria-label={`切換到${item.label}`}
                  >
                    <span className="text-2xl mr-4" aria-hidden="true" role="presentation">{item.icon}</span>
                    <span className="text-lg">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          {/* Footer (mobile) */}
          <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
            <div className="font-medium text-gray-600 mb-1">barPOS - Cocktail Bar Management System</div>
            <div className="flex items-center justify-between gap-3">
              <a
                href="https://github.com/latteine1217/barPOS"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700 underline-offset-2 hover:underline"
              >
                GitHub
              </a>
              <a
                href="mailto:felix.tc.tw@gmail.com"
                className="hover:text-gray-700 underline-offset-2 hover:underline"
              >
                felix.tc.tw@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default Sidebar;
