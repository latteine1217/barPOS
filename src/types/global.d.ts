export {}; // ensure this file is a module

declare global {
  interface Window {
    electronAPI?: {
      platform?: 'electron';
      version?: string;
      store?: {
        set: (key: string, value: string) => Promise<void>;
        get: (key: string) => Promise<string | null>;
        delete: (key: string) => Promise<void>;
        keys: () => Promise<string[]>;
        clear?: () => Promise<void>;
      };
      getAppVersion?: () => string;
      getDataPath?: () => string;
      exportToFile?: (data: unknown, filename: string) => Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean; }>;
      importFromFile?: () => Promise<{ success: boolean; data?: unknown; error?: string; canceled?: boolean; }>;
    };
    Capacitor?: unknown; // presence check only
  }
}

