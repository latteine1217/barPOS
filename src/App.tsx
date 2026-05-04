import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useAppStore, useOrderStore, useTableStore, useMenuStore, useSettingsStore } from './stores';
import { logger } from '@/services/loggerService';

import GlobalErrorBoundary from './components/ErrorBoundary/GlobalErrorBoundary';
import Sidebar from './components/Sidebar';
import Tables from './components/Tables';
import BubbleBackground from './components/BubbleBackground';
import VisualOrderingModal from './components/VisualOrderingModal';
import ToastViewport from './components/ui/ToastViewport';
import ConfirmDialog from './components/ui/ConfirmDialog';
import OfflineBanner from './components/ui/OfflineBanner';
import './index.css';

// 大型/低頻分頁採用 lazy loading，減少首屏 JS。
const Dashboard = lazy(() => import('./components/Dashboard'));
const Members = lazy(() => import('./components/Members'));
const MenuPage = lazy(() => import('./components/Menu'));
const History = lazy(() => import('./components/History'));
const Analytics = lazy(() => import('./components/EnhancedAnalytics'));
const Settings = lazy(() => import('./components/Settings'));
const TableLayoutEditor = lazy(() => import('./components/TableLayoutEditor'));
const LogViewer = lazy(() => import('./components/LogViewer'));

type TabType = 'tables' | 'dashboard' | 'menu' | 'history' | 'analytics' | 'settings' | 'layout' | 'members';

const TabFallback = () => (
  <div className="flex items-center justify-center h-full py-16">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]"></div>
  </div>
);

function AppContent() {
  // 直接使用個別 store hooks 避免組合選擇器的循環依賴
  const isInitialized = useAppStore((state) => state.isInitialized);
  const orderLoaded = useOrderStore((state) => state.isLoaded);
  const tableLoaded = useTableStore((state) => state.isLoaded);
  const menuLoaded = useMenuStore((state) => state.isLoaded);
  const settingsLoaded = useSettingsStore((state) => state.isLoaded);

  const isLoaded = orderLoaded && tableLoaded && menuLoaded && settingsLoaded;

  const [activeTab, setActiveTab] = useState<TabType>('tables');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const handleSetActiveTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const handleSetSidebarOpen = useCallback((open: boolean) => {
    setSidebarOpen(open);
  }, []);

  // 初始化所有 stores - 僅執行一次（防 StrictMode 雙重執行）
  const initStartedRef = useRef(false);
  useEffect(() => {
    if (!isInitialized && !initStartedRef.current) {
      initStartedRef.current = true;
      logger.info('Starting app store initialization', { component: 'App' });
      useAppStore.getState().initialize();
    }
  }, [isInitialized]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'tables':
        return <Tables />;
      case 'dashboard':
        return <Dashboard onNavigate={handleSetActiveTab} />;
      case 'menu':
        return <MenuPage />;
      case 'members':
        return <Members />;
      case 'history':
        return <History />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      case 'layout':
        return <TableLayoutEditor />;
      default:
        return <Tables />;
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
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="w-9 h-9 rounded-lg hover:bg-gray-100 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 flex items-center justify-center"
              aria-label={`切換側邊欄（${sidebarCollapsed ? '展開' : '收合'}）`}
              title="切換側邊欄"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base font-semibold text-slate-800">調酒酒吧 POS</h1>
          </div>
        </div>

        {/* 移動端頂部導航欄 */}
        <div className="lg:hidden card border-0 border-b border-white/20 px-4 py-3 flex items-center justify-between backdrop-blur-xl">
          <button
            type="button"
            onClick={() => handleSetSidebarOpen(true)}
            className="btn btn-secondary p-2"
            aria-label="開啟側邊欄"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-white">調酒酒吧 POS</h1>
          <div className="w-10" aria-hidden="true" />
        </div>

        <main className="flex-1 overflow-auto">
          <div className="page-transition active h-full">
            <Suspense fallback={<TabFallback />}>
              {renderActiveTab()}
            </Suspense>
          </div>
        </main>

        {/* 以環境變數控制是否顯示日誌查看器 */}
        {import.meta.env.DEV && import.meta.env.VITE_ENABLE_LOG_VIEWER === 'true' && (
          <Suspense fallback={null}>
            <LogViewer />
          </Suspense>
        )}
      </div>
      <VisualOrderingModal />
      <ToastViewport />
      <ConfirmDialog />
      <OfflineBanner />
    </div>
  );
}

function App() {
  const theme = useSettingsStore((s) => s.theme);
  const accent = useSettingsStore((s) => s.accent);

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
        <AppContent />
      </GlobalErrorBoundary>
    </div>
  );
}

export default App;
