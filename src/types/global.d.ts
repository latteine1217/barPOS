// 全域類型定義
declare global {
  interface Window {
    electronAPI?: {
      store: {
        set: (key: string, value: string) => Promise<void>;
        get: (key: string) => Promise<string | null>;
        delete: (key: string) => Promise<void>;
        keys: () => Promise<string[]>;
        clear: () => Promise<void>;
      };
      platform: string;
      version: string;
      getAppVersion: () => string;
      getDataPath: () => string;
      exportToFile: (data: any, filename: string) => Promise<{success: boolean; path?: string; canceled?: boolean; error?: string}>;
      importFromFile: () => Promise<{success: boolean; data?: any; canceled?: boolean; error?: string}>;
    };
    
    Capacitor?: {
      platform: string;
      isNativePlatform: () => boolean;
    };
  }
}

export {};