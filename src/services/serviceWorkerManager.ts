// Service Worker 註冊與管理
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
  }

  public static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  // 註冊 Service Worker
  public async register(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('[SW] Service Worker is not supported in this browser');
      return false;
    }

    try {
      console.log('[SW] Registering Service Worker...');
      
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[SW] Service Worker registered successfully:', this.registration);

      // 監聽更新
      this.registration.addEventListener('updatefound', () => {
        console.log('[SW] New Service Worker found, installing...');
        this.handleUpdate();
      });

      // 監聽控制變化
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Service Worker controller changed');
        window.location.reload();
      });

      return true;
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
      return false;
    }
  }

  // 處理 Service Worker 更新
  private handleUpdate(): void {
    if (!this.registration) return;

    const newWorker = this.registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // 有新版本可用
        this.showUpdateNotification();
      }
    });
  }

  // 顯示更新通知
  private showUpdateNotification(): void {
    if (confirm('發現新版本，是否立即更新？')) {
      this.activateUpdate();
    }
  }

  // 激活更新
  public activateUpdate(): void {
    if (!this.registration || !this.registration.waiting) return;

    // 通知 Service Worker 跳過等待
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  // 清理緩存
  public async clearCache(): Promise<void> {
    if (!this.registration || !this.registration.active) return;

    this.registration.active.postMessage({ type: 'CACHE_CLEAR' });
    console.log('[SW] Cache clear requested');
  }

  // 檢查是否已安裝
  public isInstalled(): boolean {
    return this.registration !== null && this.registration.active !== null;
  }

  // 取消註冊
  public async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const result = await this.registration.unregister();
      console.log('[SW] Service Worker unregistered:', result);
      return result;
    } catch (error) {
      console.error('[SW] Failed to unregister Service Worker:', error);
      return false;
    }
  }
}

// 便利函數
export const swManager = ServiceWorkerManager.getInstance();

// 初始化 Service Worker
export const initServiceWorker = async (): Promise<boolean> => {
  return await swManager.register();
};