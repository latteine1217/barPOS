import { useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Menu from './components/Menu';
import Tables from './components/Tables';
import History from './components/History';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import TableLayoutEditor from './components/TableLayoutEditor';
import './index.css';

function AppContent() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState('tables');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderActiveTab = () => {
    try {
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
    } catch (error) {
      console.error('Error rendering tab:', error);
      return (
        <div className="p-4 sm:p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-red-800 dark:text-red-200 font-medium">載入頁面時發生錯誤</h3>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">請重新整理頁面或選擇其他功能</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`flex h-screen transition-colors duration-200 ${
      state.theme === 'dark' 
        ? 'dark bg-gray-900' 
        : 'bg-gray-100'
    }`}>
      {/* 移動端遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <ErrorBoundary>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </ErrorBoundary>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 移動端頂部導航欄 */}
        <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">餐廳POS系統</h1>
          <div className="w-10"></div> {/* 佔位符保持平衡 */}
        </div>

        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
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
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;