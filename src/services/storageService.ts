/**
 * 跨平台資料儲存服務
 * 支援網頁端(localStorage)、桌面端(Electron)、行動端(Capacitor)
 */

type Platform = 'web' | 'mobile' | 'electron';

interface StorageInfo {
  platform: Platform;
  totalKeys: number;
  keys: string[];
  size: number;
}

interface ExportData {
  platform: Platform;
  exportDate: string;
  version: string;
  data: Record<string, any>;
}

interface ElectronStore {
  set: (key: string, value: string) => Promise<void>;
  get: (key: string) => Promise<string | null>;
  delete: (key: string) => Promise<void>;
  keys: () => Promise<string[]>;
}

interface MobileStorage {
  set: (options: { key: string; value: string }) => Promise<void>;
  get: (options: { key: string }) => Promise<{ value: string | null }>;
  remove: (options: { key: string }) => Promise<void>;
  clear: () => Promise<void>;
  keys: () => Promise<{ keys: string[] }>;
}

// 擴展全域 Window 介面，與其他已定義的介面合併

// 儲存 keys 常數
export const STORAGE_KEYS = {
  ORDERS: 'restaurant_pos_orders',
  MENU_ITEMS: 'restaurant_pos_menu',
  TABLES: 'restaurant_pos_tables',
  LAYOUT_CONFIG: 'restaurant_pos_layout',
  STATS: 'restaurant_pos_stats',
  NOTION_TOKEN: 'notionToken',
  DATABASE_ID: 'databaseId',
  SUPABASE_URL: 'supabase_url',
  SUPABASE_KEY: 'supabase_key',
  THEME: 'restaurant_pos_theme'
} as const;

// 平台檢測
const detectPlatform = (): Platform => {
  // 檢查是否為 Capacitor 環境（行動端）
  if (typeof window !== 'undefined' && window.Capacitor) {
    return 'mobile';
  }
  
  // 檢查是否為 Electron 環境（桌面端）
  if (typeof window !== 'undefined' && window.electronAPI) {
    return 'electron';
  }
  
  // 預設為網頁端
  return 'web';
};

class StorageService {
  private platform: Platform;
  private mobileStorage?: MobileStorage;
  private electronStore?: ElectronStore;

  constructor() {
    this.platform = detectPlatform();
    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    try {
      switch (this.platform) {
        case 'mobile':
          await this.initMobileStorage();
          break;
        case 'electron':
          await this.initElectronStorage();
          break;
        case 'web':
        default:
          this.initWebStorage();
          break;
      }
    } catch (error) {
      console.error('Storage initialization failed:', error);
      // 降級到 localStorage
      this.platform = 'web';
      this.initWebStorage();
    }
  }

  // 網頁端儲存（localStorage）
  private initWebStorage(): void {
    console.log('🌐 Using Web Storage (localStorage)');
  }

  // 行動端儲存（Capacitor Preferences）
  private async initMobileStorage(): Promise<void> {
    try {
      // 只在 Capacitor 環境中導入
      if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        this.mobileStorage = Preferences;
        console.log('📱 Using Mobile Storage (Capacitor Preferences)');
      } else {
        throw new Error('Not in Capacitor environment');
      }
    } catch {
      console.warn('Capacitor Preferences not available, falling back to localStorage');
      this.platform = 'web';
      this.initWebStorage();
    }
  }

  // 桌面端儲存（Electron Store）
  private async initElectronStorage(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.store) {
        this.electronStore = window.electronAPI.store;
        console.log('🖥️ Using Desktop Storage (Electron Store)');
      } else {
        throw new Error('Electron store API not available');
      }
    } catch {
      console.warn('Electron store not available, falling back to localStorage');
      this.platform = 'web';
      this.initWebStorage();
    }
  }

  // 統一的儲存介面
  async setItem(key: string, value: any): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      
      switch (this.platform) {
        case 'mobile':
          if (this.mobileStorage) {
            await this.mobileStorage.set({ key, value: stringValue });
          }
          break;
        case 'electron':
          if (this.electronStore) {
            await this.electronStore.set(key, stringValue);
          }
          break;
        case 'web':
        default:
          localStorage.setItem(key, stringValue);
          break;
      }
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      throw error;
    }
  }

  // 統一的讀取介面
  async getItem<T = any>(key: string, defaultValue: T | null = null): Promise<T | null> {
    try {
      let stringValue: string | null = null;
      
      switch (this.platform) {
        case 'mobile':
          if (this.mobileStorage) {
            const result = await this.mobileStorage.get({ key });
            stringValue = result.value;
          }
          break;
        case 'electron':
          if (this.electronStore) {
            stringValue = await this.electronStore.get(key);
          }
          break;
        case 'web':
        default:
          stringValue = localStorage.getItem(key);
          break;
      }
      
      if (stringValue === null) {
        return defaultValue;
      }
      
      return JSON.parse(stringValue);
    } catch (error) {
      console.warn(`Failed to load ${key}:`, error);
      return defaultValue;
    }
  }

  // 統一的刪除介面
  async removeItem(key: string): Promise<void> {
    try {
      switch (this.platform) {
        case 'mobile':
          if (this.mobileStorage) {
            await this.mobileStorage.remove({ key });
          }
          break;
        case 'electron':
          if (this.electronStore) {
            await this.electronStore.delete(key);
          }
          break;
        case 'web':
        default:
          localStorage.removeItem(key);
          break;
      }
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
      throw error;
    }
  }

  // 清除所有資料
  async clear(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      
      switch (this.platform) {
        case 'mobile':
          if (this.mobileStorage) {
            await this.mobileStorage.clear();
          }
          break;
        case 'electron':
          if (this.electronStore) {
            for (const key of keys) {
              await this.electronStore.delete(key);
            }
          }
          break;
        case 'web':
        default:
          for (const key of keys) {
            localStorage.removeItem(key);
          }
          break;
      }
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  // 取得所有儲存的 keys
  async getAllKeys(): Promise<string[]> {
    try {
      switch (this.platform) {
        case 'mobile':
          if (this.mobileStorage) {
            const result = await this.mobileStorage.keys();
            return result.keys || [];
          }
          break;
        case 'electron':
          if (this.electronStore) {
            return await this.electronStore.keys();
          }
          break;
        case 'web':
        default:
          return Object.keys(localStorage);
      }
      return [];
    } catch (error) {
      console.error('Failed to get keys:', error);
      return [];
    }
  }

  // 取得儲存統計資訊
  async getStorageInfo(): Promise<StorageInfo> {
    try {
      const keys = await this.getAllKeys();
      const appKeys = keys.filter(key => 
        Object.values(STORAGE_KEYS).includes(key as any)
      );
      
      const info: StorageInfo = {
        platform: this.platform,
        totalKeys: appKeys.length,
        keys: appKeys,
        size: 0
      };

      // 計算大概的資料大小（僅對於 web 平台）
      if (this.platform === 'web') {
        let totalSize = 0;
        for (const key of appKeys) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
        info.size = totalSize;
      }

      return info;
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {
        platform: this.platform,
        totalKeys: 0,
        keys: [],
        size: 0
      };
    }
  }

  // 匯出資料（用於備份）
  async exportData(): Promise<ExportData> {
    try {
      const data: Record<string, any> = {};
      const keys = Object.values(STORAGE_KEYS);
      
      for (const key of keys) {
        const value = await this.getItem(key);
        if (value !== null) {
          data[key] = value;
        }
      }
      
      return {
        platform: this.platform,
        exportDate: new Date().toISOString(),
        version: '2.0.0',
        data
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  // 匯入資料（用於還原備份）
  async importData(exportedData: ExportData): Promise<boolean> {
    try {
      if (!exportedData || !exportedData.data) {
        throw new Error('Invalid export data');
      }
      
      const { data } = exportedData;
      
      for (const [key, value] of Object.entries(data)) {
        if (Object.values(STORAGE_KEYS).includes(key as any)) {
          await this.setItem(key, value);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }
}

// 建立單例實例
const storageService = new StorageService();

// 匯出便捷的儲存函數
export const saveToStorage = (key: string, value: any): Promise<void> => storageService.setItem(key, value);
export const loadFromStorage = <T = any>(key: string, defaultValue?: T | null): Promise<T | null> => storageService.getItem<T>(key, defaultValue);

// 防抖儲存函數
import { debounce } from '../hooks/useDebounce';

// 創建防抖儲存函數，避免頻繁寫入
const debouncedSaveMap = new Map<string, (value: any) => void>();

export const saveDebouncedToStorage = (key: string, value: any, delay: number = 1000): void => {
  if (!debouncedSaveMap.has(key)) {
    // 為每個 key 創建獨立的防抖函數
    const debouncedSave = debounce(async (val: any) => {
      try {
        await storageService.setItem(key, val);
        console.log(`防抖儲存完成: ${key}`);
      } catch (error) {
        console.error(`防抖儲存失敗 ${key}:`, error);
      }
    }, delay);
    
    debouncedSaveMap.set(key, debouncedSave);
  }
  
  const debouncedFn = debouncedSaveMap.get(key);
  if (debouncedFn) {
    debouncedFn(value);
  }
};

// 批量防抖儲存
export const saveBatchDebouncedToStorage = (data: Record<string, any>, delay: number = 1000): void => {
  Object.entries(data).forEach(([key, value]) => {
    saveDebouncedToStorage(key, value, delay);
  });
};

export default storageService;