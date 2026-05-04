import { logger } from './loggerService';
import { confirmDialog, toast } from '@/stores/uiStore';

const SW_CTX = { component: 'ServiceWorkerManager' } as const;

// Service Worker 註冊與管理
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
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
      logger.warn('Service Worker is not supported in this browser', SW_CTX);
      return false;
    }

    try {
      logger.info('Registering Service Worker', SW_CTX);

      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      logger.info('Service Worker registered', SW_CTX);

      this.registration.addEventListener('updatefound', () => {
        logger.info('New Service Worker found, installing', SW_CTX);
        this.handleUpdate();
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        logger.info('Service Worker controller changed; reloading', SW_CTX);
        window.location.reload();
      });

      return true;
    } catch (error) {
      logger.error(
        'Service Worker registration failed',
        SW_CTX,
        error instanceof Error ? error : new Error(String(error))
      );
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

  // 顯示更新通知（改用 app 內建 ConfirmDialog 取代 window.confirm）
  private async showUpdateNotification(): Promise<void> {
    const ok = await confirmDialog({
      title: '發現新版本',
      description: '可立即更新至最新版本，更新將於下次重新整理頁面後生效。',
      confirmText: '立即更新',
      cancelText: '稍後',
    });
    if (ok) {
      toast.info('正在套用更新…');
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
    logger.info('Cache clear requested', SW_CTX);
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
      logger.info('Service Worker unregistered', { ...SW_CTX, result });
      return result;
    } catch (error) {
      logger.error(
        'Failed to unregister Service Worker',
        SW_CTX,
        error instanceof Error ? error : new Error(String(error))
      );
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