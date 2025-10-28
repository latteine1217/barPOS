import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { logger } from '@/services/loggerService';

// 設定狀態接口
type Accent = 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan';

interface SettingsState {
  theme: 'light' | 'dark' | 'auto';
  accent: Accent;
  // 營業日截止小時（0-23）。如設為 3，表示凌晨 3:00 才切換新的一天
  businessDayCutoffHour: number;
  
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
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setAccent: (accent: Accent) => void;
  setBusinessDayCutoff: (hour: number) => void;
  
  
  
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
  accent: 'blue',
  businessDayCutoffHour: 3,
  
  supabaseConfig: {
    url: '',
    key: ''
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
          // 在 auto 狀態時，根據系統偏好切換
          if (state.theme === 'auto') {
            const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            state.theme = prefersDark ? 'light' : 'dark';
          } else {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
          }
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('settings-theme', state.theme);
            }
          } catch {
            // Ignore localStorage errors
          }
        });
      },

      setTheme: (theme: 'light' | 'dark' | 'auto') => {
        set((state) => {
          state.theme = theme;
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('settings-theme', theme);
            }
          } catch {
            // Ignore localStorage errors
          }
        });
      },

      setAccent: (accent: Accent) => {
        set((state) => {
          state.accent = accent;
        });
      },

      setBusinessDayCutoff: (hour: number) => {
        set((state) => {
          const h = Math.max(0, Math.min(23, Math.floor(hour)));
          state.businessDayCutoffHour = h;
        });
      },



      // Supabase 設定
      updateSupabaseConfig: (config: Partial<SettingsState['supabaseConfig']>) => {
        set((state) => {
          const next = { ...state.supabaseConfig, ...config };
          state.supabaseConfig = next;
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
            const theme = (savedTheme as SettingsState['theme']) || (prefersDark ? 'dark' : 'light');
            set((state) => {
              state.theme = theme;
            });
          }          
          set((state) => {
            state.isLoaded = true;
          });
        } catch (error) {
          logger.storeLog.error('settingsStore', error as Error, { action: 'initialize' });
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
        accent: state.accent,
        businessDayCutoffHour: state.businessDayCutoffHour,
        
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
        if (stats.todayRevenue !== undefined) state.todayRevenue = stats.todayRevenue;
        if (stats.todayOrders !== undefined) state.todayOrders = stats.todayOrders;
        if (stats.activeCustomers !== undefined) state.activeCustomers = stats.activeCustomers;
      });
    },

    calculateStats: () => {
      try {
        const { isLoaded } = get();
        if (!isLoaded) {
          set((state) => {
            state.todayRevenue = 0;
            state.todayOrders = 0;
            state.activeCustomers = 0;
            state.isLoaded = true;
          });
        }
      } catch (error) {
        logger.storeLog.error('settingsStore', error as Error, { action: 'calculate-stats' });
      }
    },

    initialize: async () => {
      try {
        set((state) => {
          state.todayRevenue = 0;
          state.todayOrders = 0;
          state.activeCustomers = 0;
          state.isLoaded = true;
        });
      } catch (error) {
        logger.storeLog.error('settingsStore', error as Error, { action: 'initialize-stats' });
        set((state) => {
          state.isLoaded = true;
        });
      }
    },
  }))
);

// 選擇器 hooks - 修復無限循環問題
export const useSettings = () =>
  useSettingsStore((state) => state);

export const useStats = () => {
  // ✅ 暫時移除 shallow，避免 TypeScript 錯誤
  return useStatsStore(
    (state) => ({
      todayRevenue: state.todayRevenue,
      todayOrders: state.todayOrders,
      activeCustomers: state.activeCustomers,
      isLoaded: state.isLoaded,
      updateStats: state.updateStats,
      calculateStats: state.calculateStats,
      initialize: state.initialize,
    })  );
};
