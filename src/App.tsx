import { useState, useEffect, useCallback } from 'react';
import { useAppStore, useOrderStore, useTableStore, useMenuStore, initializeAllStores } from './stores';
import { useSettingsStore } from './stores/settingsStore';
import { ErrorProvider } from './contexts/ErrorContext';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalErrorBoundary from './components/ErrorBoundary/GlobalErrorBoundary';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Menu from './components/Menu';
import Tables from './components/Tables';
import History from './components/History';
import Analytics from './components/EnhancedAnalytics';
import Settings from './components/Settings';
import TableLayoutEditor from './components/TableLayoutEditor';
import BubbleBackground from './components/BubbleBackground';
import './index.css';

type TabType = 'tables' | 'dashboard' | 'menu' | 'history' | 'analytics' | 'settings' | 'layout';

function AppContent() {
  // 直接使用個別 store hooks 避免組合選擇器的循環依賴
  const isInitialized = useAppStore((state) => state.isInitialized);
  const orderLoaded = useOrderStore((state) => state.isLoaded);
  const tableLoaded = useTableStore((state) => state.isLoaded);
  const menuLoaded = useMenuStore((state) => state.isLoaded);
  const settingsLoaded = useSettingsStore((state) => state.isLoaded);
  
  // 計算載入狀態
  const isLoaded = orderLoaded && tableLoaded && menuLoaded && settingsLoaded;
  
  const [activeTab, setActiveTab] = useState<TabType>('tables');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [initAttempted, setInitAttempted] = useState(false);

  // ✅ 使用 useCallback 穩定狀態更新函數引用
  const handleSetActiveTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const handleSetSidebarOpen = useCallback((open: boolean) => {
    setSidebarOpen(open);
  }, []);

  // 初始化所有 stores - 僅執行一次
  useEffect(() => {
    if (!isInitialized && !initAttempted) {
      setInitAttempted(true);
      
      const initializeStores = async () => {
        try {
          console.log('Starting store initialization...');
          await initializeAllStores();
          // 初始化 Settings store
          await useSettingsStore.getState().initialize();
          console.log('Store initialization completed');
        } catch (error) {
          console.error('Failed to initialize stores:', error);
        }
      };
      
      initializeStores();
    }
  }, [isInitialized, initAttempted]);

  const renderActiveTab = () => {
    const TabComponent = () => {
      switch (activeTab) {
        case 'tables':
          return <Tables />;
        case 'dashboard':
          return <Dashboard />;
        case 'menu':
          return <Menu />;
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

    return (
      <div className="page-transition active">
        <TabComponent />
      </div>
    );
  };

  // 載入畫面
  if (!isLoaded) {
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
      
      <ErrorBoundary>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={handleSetActiveTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={handleSetSidebarOpen}
        />
      </ErrorBoundary>
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
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
          <ErrorBoundary>
            {renderActiveTab()}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <GlobalErrorBoundary>
      <ErrorProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </ErrorProvider>
    </GlobalErrorBoundary>
  );
}

export default App;