import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore, useOrderStore, useTableStore, useMenuStore, useSettingsStore } from './stores';
import { logger } from '@/services/loggerService';

import ErrorBoundary from './components/ErrorBoundary';
import GlobalErrorBoundary from './components/ErrorBoundary/GlobalErrorBoundary';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Menu from './components/Menu';
import Tables from './components/Tables';
import History from './components/History';
import Analytics from './components/EnhancedAnalytics';
import Settings from './components/Settings';
import TableLayoutEditor from './components/TableLayoutEditor';
import BubbleBackground from './components/BubbleBackground';
import LogViewer from './components/LogViewer';
import VisualOrderingModal from './components/VisualOrderingModal';
import './index.css';

type TabType = 'tables' | 'dashboard' | 'menu' | 'history' | 'analytics' | 'settings' | 'layout' | 'members';

function AppContent() {
  // 直接使用個別 store hooks 避免組合選擇器的循環依賴
  const isInitialized = useAppStore((state) => state.isInitialized);
  const orderLoaded = useOrderStore((state) => state.isLoaded);
  const tableLoaded = useTableStore((state) => state.isLoaded);
  const menuLoaded = useMenuStore((state) => state.isLoaded);
  
  // 暫時移除 settingsStore 依賴以快速恢復功能
  const settingsLoaded = useSettingsStore((state: any) => state.isLoaded);
  
  // 計算載入狀態 - 簡化條件
  const isLoaded = orderLoaded && tableLoaded && menuLoaded && settingsLoaded;
  
  const [activeTab, setActiveTab] = useState<TabType>(() => 'tables');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => false);

  // ✅ 使用 useCallback 穩定狀態更新函數引用
  const handleSetActiveTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const handleSetSidebarOpen = useCallback((open: boolean) => {
    setSidebarOpen(open);
  }, []);

  // 初始化所有 stores - 僅執行一次
  const initStartedRef = useRef(false);
  useEffect(() => {
    if (!isInitialized && !initStartedRef.current) {
      initStartedRef.current = true;
      logger.info('Starting app store initialization', { component: 'App' });
      useAppStore.getState().initialize();
      logger.info('App store initialization triggered', { component: 'App' });
    }
  }, [isInitialized]);

const renderActiveTab = () => {
    switch (activeTab) {
      case 'tables':
        return <div className="page-transition active"><Tables /></div>;
      case 'dashboard':
        return <div className="page-transition active"><Dashboard onNavigate={handleSetActiveTab} /></div>;
      case 'menu':
        return <div className="page-transition active"><Menu /></div>;
      case 'members':
        return <div className="page-transition active"><Members /></div>;
      case 'history':
        return <div className="page-transition active"><History /></div>;
      case 'analytics':
        return <div className="page-transition active"><Analytics /></div>;
      case 'settings':
        return <div className="page-transition active"><Settings /></div>;
      case 'layout':
        return <div className="page-transition active"><TableLayoutEditor /></div>;
      default:
        return <div className="page-transition active"><Tables /></div>;
    }
  };

  // 載入畫面
  if (!isInitialized || !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🍸</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            調酒酒吧 POS 系統
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">正在載入應用程式...</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen transition-colors duration-200">
      {/* 泡泡漸變背景 */}
      <BubbleBackground />
      
      {/* 移動端遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => handleSetSidebarOpen(false)}
        />
      )}
      
      <Sidebar 
          activeTab={activeTab} 
          setActiveTab={handleSetActiveTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={handleSetSidebarOpen}
          collapsed={sidebarCollapsed}
        />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* 桌面頂部工具列：收合側邊欄按鈕 + 標題 */}
        <div className="hidden lg:flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="p-2 rounded-lg hover:bg-gray-100 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
              aria-label={`切換側邊欄（${sidebarCollapsed ? '展開' : '收合'}）`}
              title="切換側邊欄"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base font-semibold text-slate-800">調酒酒吧 POS</h1>
          </div>
        </div>

        {/* 移動端頂部導航欄 - 玻璃風格 */}
        <div className="lg:hidden card border-0 border-b border-white/20 px-4 py-3 flex items-center justify-between backdrop-blur-xl">
          <button
            onClick={() => handleSetSidebarOpen(true)}
            className="btn btn-secondary p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-white">調酒酒吧 POS</h1>
          <div className="w-10"></div> {/* 佔位符保持平衡 */}
        </div>

       <main className="flex-1 overflow-auto">
            {renderActiveTab()}
         </main>
          
         {/* 開發環境下顯示日誌查看器 */}
         {import.meta.env.DEV && <LogViewer />}
       </div>
       <VisualOrderingModal />
     </div>
   );}

function App() {
  const theme = useSettingsStore((s: any) => s.theme) as 'light' | 'dark' | 'auto';
  const accent = useSettingsStore((s: any) => s.accent) as string;

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const isDark = theme === 'dark' || (theme === 'auto' && systemPrefersDark);
  const themeClass = isDark ? 'dark' : '';
  const accentClass = `theme-${accent || 'blue'}`;

  return (
    <div className={`${themeClass} ${accentClass}`}>
      <GlobalErrorBoundary>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </GlobalErrorBoundary>
    </div>
  );
}

export default App;
