import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import Capacitor plugins for mobile functionality
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

// Import console interceptor service
import { initializeConsoleInterceptor } from './services/consoleInterceptorService';
import { logger } from '@/services/loggerService';

// Initialize mobile features if running on native platforms
const initializeMobileFeatures = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    // Configure status bar
    await StatusBar.setStyle({ style: Style.Light });
    
    // Hide splash screen after initialization
    setTimeout(async () => {
      await SplashScreen.hide();
    }, 2000);
    
    // Prevent app from being closed accidentally
    document.addEventListener('backbutton', (e: Event) => {
      e.preventDefault();
    });
  }
};

// Initialize console interceptor for development - StrictMode 安全版本
let devToolsInitialized = false; // ✅ 防止 StrictMode 雙重初始化

const initializeDevTools = (): void => {
  const enableLogViewer = import.meta.env.VITE_ENABLE_LOG_VIEWER === 'true';
  // 僅在 DEV 且開啟環境變數時啟用，並防止重複初始化
  if (import.meta.env.DEV && enableLogViewer && !devToolsInitialized) {
    devToolsInitialized = true;
    initializeConsoleInterceptor({
      viteDevUrl: 'http://localhost:5173',
      componentName: 'Cocktail-Bar-POS',
      enabledTypes: ['log', 'info', 'warn', 'error', 'debug'],
      enableViteLogger: false,
      enableLocalStorage: true,
    });
    logger.info('調酒酒吧 POS 系統啟動', { component: 'main' });
    logger.info('Console 日誌攔截器已啟用 (Vite 模式)', { component: 'main' });
    logger.info('使用 __console_interceptor__.report() 查看報告', { component: 'main' });
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Initialize mobile features after React app mounts
initializeMobileFeatures();

// Initialize development tools
initializeDevTools();
