/**
 * 跨平台資料儲存服務
 * 支援網頁端(localStorage)、桌面端(Electron)、行動端(Capacitor)
 */

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
};

// 平台檢測
const detectPlatform = () => {
  // 檢查是否為 Capacitor 環境（行動端）
  if (window.Capacitor) {
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
  constructor() {
    this.platform = detectPlatform();
    this.initializeStorage();
  }

  async initializeStorage() {
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
  initWebStorage() {
    console.log('🌐 Using Web Storage (localStorage)');
  }

  // 行動端儲存（Capacitor Preferences）
  async initMobileStorage() {
    try {
      // 只在 Capacitor 環境中導入
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        this.mobileStorage = Preferences;
        console.log('📱 Using Mobile Storage (Capacitor Preferences)');
      } else {
        throw new Error('Not in Capacitor environment');
      }
    } catch (error) {
      console.warn('Capacitor Preferences not available, falling back to localStorage');
      this.platform = 'web';
      this.initWebStorage();
    }
  }

  // 桌面端儲存（Electron Store）
  async initElectronStorage() {
    try {
      if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.store) {
        this.electronStore = window.electronAPI.store;
        console.log('🖥️ Using Desktop Storage (Electron Store)');
      } else {
        throw new Error('Electron store API not available');
      }
    } catch (error) {
      console.warn('Electron store not available, falling back to localStorage');
      this.platform = 'web';
      this.initWebStorage();
    }
  }

  // 統一的儲存介面
  async setItem(key, value) {
    try {
      const stringValue = JSON.stringify(value);
      
      switch (this.platform) {
        case 'mobile':
          await this.mobileStorage.set({ key, value: stringValue });
          break;
        case 'electron':
          await this.electronStore.set(key, stringValue);
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
  async getItem(key, defaultValue = null) {
    try {
      let stringValue = null;
      
      switch (this.platform) {
        case 'mobile':
          const result = await this.mobileStorage.get({ key });
          stringValue = result.value;
          break;
        case 'electron':
          stringValue = await this.electronStore.get(key);
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
  async removeItem(key) {
    try {
      switch (this.platform) {
        case 'mobile':
          await this.mobileStorage.remove({ key });
          break;
        case 'electron':
          await this.electronStore.delete(key);
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
  async clear() {
    try {
      const keys = Object.values(STORAGE_KEYS);
      
      switch (this.platform) {
        case 'mobile':
          await this.mobileStorage.clear();
          break;
        case 'electron':
          for (const key of keys) {
            await this.electronStore.delete(key);
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
  async getAllKeys() {
    try {
      switch (this.platform) {
        case 'mobile':
          const result = await this.mobileStorage.keys();
          return result.keys || [];
        case 'electron':
          return await this.electronStore.keys();
        case 'web':
        default:
          return Object.keys(localStorage);
      }
    } catch (error) {
      console.error('Failed to get keys:', error);
      return [];
    }
  }

  // 取得儲存統計資訊
  async getStorageInfo() {
    try {
      const keys = await this.getAllKeys();
      const appKeys = keys.filter(key => 
        Object.values(STORAGE_KEYS).includes(key)
      );
      
      const info = {
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
  async exportData() {
    try {
      const data = {};
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
  async importData(exportedData) {
    try {
      if (!exportedData || !exportedData.data) {
        throw new Error('Invalid export data');
      }
      
      const { data } = exportedData;
      
      for (const [key, value] of Object.entries(data)) {
        if (Object.values(STORAGE_KEYS).includes(key)) {
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
export const saveToStorage = (key, value) => storageService.setItem(key, value);
export const loadFromStorage = (key, defaultValue) => storageService.getItem(key, defaultValue);

export default storageService;