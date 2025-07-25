import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

// 設定狀態接口
interface SettingsState {
  theme: 'light' | 'dark';
  notionConfig: {
    token: string;
    databaseId: string;
  };
  supabaseConfig: {
    url: string;
    key: string;
  };
  layoutConfig: {
    canvasWidth: number;
    canvasHeight: number;
    gridSize: number;
    showGrid: boolean;
    backgroundImage: string | null;
  };
  isLoaded: boolean;
}

// 設定操作接口
interface SettingsActions {
  // 主題
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Notion 設定
  updateNotionConfig: (config: Partial<SettingsState['notionConfig']>) => void;
  
  // Supabase 設定
  updateSupabaseConfig: (config: Partial<SettingsState['supabaseConfig']>) => void;
  
  // 佈局設定
  updateLayoutConfig: (config: Partial<SettingsState['layoutConfig']>) => void;
  
  // 初始化
  initialize: () => Promise<void>;
  setLoaded: (loaded: boolean) => void;
}

// 組合 Store 類型
export type SettingsStore = SettingsState & SettingsActions;

// 初始狀態
const initialState: SettingsState = {
  theme: 'light',
  notionConfig: {
    token: '',
    databaseId: ''
  },
  supabaseConfig: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  },
  layoutConfig: {
    canvasWidth: 1000,
    canvasHeight: 600,
    gridSize: 20,
    showGrid: true,
    backgroundImage: null
  },
  isLoaded: false
};

// 創建設定 Store
export const useSettingsStore = create<SettingsStore>()(
  persist(
    immer((set) => ({
      ...initialState,

      // 主題操作
      toggleTheme: () => {
        set((state) => {
          state.theme = state.theme === 'light' ? 'dark' : 'light';
        });
      },

      setTheme: (theme: 'light' | 'dark') => {
        set((state) => {
          state.theme = theme;
        });
      },

      // Notion 設定
      updateNotionConfig: (config: Partial<SettingsState['notionConfig']>) => {
        set((state) => {
          state.notionConfig = { ...state.notionConfig, ...config };
        });
      },

      // Supabase 設定
      updateSupabaseConfig: (config: Partial<SettingsState['supabaseConfig']>) => {
        set((state) => {
          state.supabaseConfig = { ...state.supabaseConfig, ...config };
        });
      },

      // 佈局設定
      updateLayoutConfig: (config: Partial<SettingsState['layoutConfig']>) => {
        set((state) => {
          state.layoutConfig = { ...state.layoutConfig, ...config };
        });
      },

      // 初始化
      initialize: async () => {
        try {
          // 檢測系統主題偏好
          if (typeof window !== 'undefined') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const savedTheme = localStorage.getItem('settings-theme');
            
            if (!savedTheme && prefersDark) {
              set((state) => {
                state.theme = 'dark';
              });
            }
          }
          
          set((state) => {
            state.isLoaded = true;
          });
        } catch (error) {
          console.error('Failed to initialize settings:', error);
          set((state) => {
            state.isLoaded = true;
          });
        }
      },

      setLoaded: (loaded: boolean) => {
        set((state) => {
          state.isLoaded = loaded;
        });
      },
    })),
    {
      name: 'restaurant-pos-settings',
      partialize: (state) => ({
        theme: state.theme,
        notionConfig: state.notionConfig,
        supabaseConfig: state.supabaseConfig,
        layoutConfig: state.layoutConfig,
      }),
    }
  )
);

// 統計 Store (簡化版)
interface StatsState {
  todayRevenue: number;
  todayOrders: number;
  activeCustomers: number;
  isLoaded: boolean;
}

interface StatsActions {
  updateStats: (stats: Partial<Omit<StatsState, 'isLoaded'>>) => void;
  calculateStats: () => void;
  initialize: () => Promise<void>;
}

export type StatsStore = StatsState & StatsActions;

export const useStatsStore = create<StatsStore>()(
  immer((set, get) => ({
    todayRevenue: 0,
    todayOrders: 0,
    activeCustomers: 0,
    isLoaded: false,

    updateStats: (stats: Partial<Omit<StatsState, 'isLoaded'>>) => {
      set((state) => {
        Object.assign(state, stats);
      });
    },

    calculateStats: () => {
      // 暫時使用模擬數據，避免循環依賴
      // TODO: 實現適當的統計計算邏輯
      try {
        set((state) => {
          state.todayRevenue = Math.floor(Math.random() * 10000);
          state.todayOrders = Math.floor(Math.random() * 50);
          state.activeCustomers = Math.floor(Math.random() * 20);
        });
      } catch (error) {
        console.error('Failed to calculate stats:', error);
      }
    },

    initialize: async () => {
      try {
        const { calculateStats } = get();
        calculateStats();
        
        set((state) => {
          state.isLoaded = true;
        });
      } catch (error) {
        console.error('Failed to initialize stats:', error);
        set((state) => {
          state.isLoaded = true;
        });
      }
    },
  }))
);

// 選擇器 hooks
export const useSettings = () => {
  const {
    theme,
    notionConfig,
    supabaseConfig,
    layoutConfig,
    isLoaded,
    toggleTheme,
    setTheme,
    updateNotionConfig,
    updateSupabaseConfig,
    updateLayoutConfig,
    initialize
  } = useSettingsStore();

  return {
    state: {
      theme,
      notionConfig,
      supabaseConfig,
      layoutConfig
    },
    actions: {
      toggleTheme,
      setTheme,
      updateNotionConfig,
      updateSupabaseConfig,
      updateLayoutConfig,
      initialize
    },
    isLoaded
  };
};

export const useStats = () => {
  const {
    todayRevenue,
    todayOrders,
    activeCustomers,
    isLoaded,
    updateStats,
    calculateStats,
    initialize
  } = useStatsStore();

  return {
    state: {
      todayRevenue,
      todayOrders,
      activeCustomers
    },
    actions: {
      updateStats,
      calculateStats,
      initialize
    },
    isLoaded
  };
};