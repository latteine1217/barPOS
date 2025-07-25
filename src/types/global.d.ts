/// <reference types="vite/client" />

// 環境變數類型定義
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_NOTION_API_VERSION: string;
  readonly VITE_APP_VERSION: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

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
      exportToFile: (data: unknown, filename: string) => Promise<{success: boolean; path?: string; canceled?: boolean; error?: string}>;
      importFromFile: () => Promise<{success: boolean; data?: unknown; canceled?: boolean; error?: string}>;
    };
    
    Capacitor?: {
      platform: string;
      isNativePlatform: () => boolean;
    };
  }
}

export {};