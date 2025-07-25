import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { loadFromStorage, STORAGE_KEYS } from '../services/storageService';
import type { MenuItem, MenuCategory, BaseSpirit, ID } from '@/types';

// Menu Store 狀態接口
interface MenuState {
  menuItems: MenuItem[];
  isLoaded: boolean;
}

// Menu Store 行為接口
interface MenuActions {
  // 基本 CRUD 操作
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (id: ID, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: ID) => void;
  setMenuItems: (menuItems: MenuItem[]) => void;
  
  // 狀態管理
  setLoaded: (loaded: boolean) => void;
  initialize: () => Promise<void>;
  
  // 便利方法
  getMenuItemById: (id: ID) => MenuItem | undefined;
  getMenuItemsByCategory: (category: MenuCategory) => MenuItem[];
  getMenuItemsBySpirit: (spirit: BaseSpirit) => MenuItem[];
  getAvailableMenuItems: () => MenuItem[];
  toggleMenuItemAvailability: (id: ID) => void;
  searchMenuItems: (query: string) => MenuItem[];
  resetToDefaultMenu: () => void;
}

// 組合 Store 類型
export type MenuStore = MenuState & MenuActions;

// 預設菜單項目
const defaultMenuItems: MenuItem[] = [
  // 經典調酒 - Whisky/Whiskey 基酒
  { id: '101', name: 'Old Fashioned', price: 150, category: 'cocktails', baseSpirit: 'whiskey', description: '威士忌、糖、苦精、橙皮', available: true },
  { id: '102', name: 'Manhattan', price: 150, category: 'cocktails', baseSpirit: 'whiskey', description: '威士忌、甜苦艾酒、苦精', available: true },
  { id: '105', name: 'Whiskey Sour', price: 150, category: 'cocktails', baseSpirit: 'whiskey', description: '威士忌、檸檬汁、糖漿、蛋白', available: true },
  // 經典調酒 - Gin 基酒
  { id: '103', name: 'Negroni', price: 150, category: 'cocktails', baseSpirit: 'gin', description: '琴酒、甜苦艾酒、金巴利', available: true },
  { id: '104', name: 'Martini', price: 150, category: 'cocktails', baseSpirit: 'gin', description: '琴酒、乾苦艾酒、橄欖或檸檬皮', available: true },
  { id: '106', name: 'Gimlet', price: 150, category: 'cocktails', baseSpirit: 'gin', description: '琴酒、萊姆汁、糖漿', available: true },
  // 經典調酒 - Rum 基酒
  { id: '107', name: 'Daiquiri', price: 150, category: 'cocktails', baseSpirit: 'rum', description: '蘭姆酒、萊姆汁、糖漿', available: true },
  // 經典調酒 - Tequila 基酒
  { id: '108', name: 'Margarita', price: 150, category: 'cocktails', baseSpirit: 'tequila', description: '龍舌蘭、柑橘酒、萊姆汁', available: true },
  // 經典調酒 - Vodka 基酒
  { id: '109', name: 'Cosmopolitan', price: 150, category: 'cocktails', baseSpirit: 'vodka', description: '伏特加、柑橘酒、蔓越莓汁、萊姆汁', available: true },
  { id: '110', name: 'Moscow Mule', price: 150, category: 'cocktails', baseSpirit: 'vodka', description: '伏特加、薑汁汽水、萊姆汁', available: true },
  // 經典調酒 - Brandy 基酒
  { id: '111', name: 'Sidecar', price: 150, category: 'cocktails', baseSpirit: 'brandy', description: '干邑白蘭地、柑橘酒、檸檬汁', available: true },
  // 經典調酒 - 利口酒為主
  { id: '112', name: 'B-52', price: 150, category: 'cocktails', baseSpirit: 'liqueur', description: '咖啡利口酒、愛爾蘭奶酒、伏特加', available: true },
  { id: '113', name: 'Amaretto Sour', price: 150, category: 'cocktails', baseSpirit: 'liqueur', description: '杏仁利口酒、檸檬汁、糖漿', available: true },
  { id: '114', name: 'Mudslide', price: 150, category: 'cocktails', baseSpirit: 'liqueur', description: '咖啡利口酒、愛爾蘭奶酒、鮮奶油', available: true },
  // Signature 調酒
  { id: '201', name: '招牌特調', price: 180, category: 'cocktails', baseSpirit: 'liqueur', description: '本店獨家配方', available: true },
  { id: '202', name: '金色黃昏', price: 200, category: 'cocktails', baseSpirit: 'whiskey', description: '威士忌、蜂蜜、檸檬、薑汁', available: true },
  { id: '203', name: '紫羅蘭之夢', price: 190, category: 'cocktails', baseSpirit: 'gin', description: '琴酒、薰衣草、柚子、蘇打', available: true },
  // Mocktail 無酒精飲品
  { id: '301', name: 'Virgin Mojito', price: 80, category: 'mocktails', baseSpirit: 'none', description: '薄荷、萊姆、蘇打水', available: true },
  { id: '302', name: 'Shirley Temple', price: 80, category: 'mocktails', baseSpirit: 'none', description: '薑汁汽水、紅石榴糖漿、櫻桃', available: true },
  { id: '303', name: '蘋果氣泡飲', price: 70, category: 'mocktails', baseSpirit: 'none', description: '蘋果汁、薑汁汽水、檸檬', available: true }
];

// 創建 Menu Store
export const useMenuStore = create<MenuStore>()(
  persist(
    immer((set, get) => ({
      // 初始狀態
      menuItems: defaultMenuItems,
      isLoaded: false,

      // 基本 CRUD 操作
      addMenuItem: (item: MenuItem) => {
        set((state) => {
          const newItem: MenuItem = {
            ...item,
            id: item.id || Date.now().toString(),
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          state.menuItems.push(newItem);
        });
      },

      updateMenuItem: (id: ID, updates: Partial<MenuItem>) => {
        set((state) => {
          const itemIndex = state.menuItems.findIndex(item => item.id === id);
          if (itemIndex !== -1) {
            Object.assign(state.menuItems[itemIndex], updates, {
              updatedAt: new Date().toISOString()
            });
          } else {
            console.error('Menu item not found for update:', id);
          }
        });
      },

      deleteMenuItem: (id: ID) => {
        set((state) => {
          const initialLength = state.menuItems.length;
          state.menuItems = state.menuItems.filter(item => item.id !== id);
          
          if (state.menuItems.length === initialLength) {
            console.error('Menu item not found for deletion:', id);
          }
        });
      },

      setMenuItems: (menuItems: MenuItem[]) => {
        set((state) => {
          if (!Array.isArray(menuItems)) {
            console.error('Invalid menu items data - must be array:', menuItems);
            return;
          }
          state.menuItems = menuItems;
        });
      },

      // 狀態管理
      setLoaded: (loaded: boolean) => {
        set((state) => {
          state.isLoaded = loaded;
        });
      },

      initialize: async () => {
        try {
          const savedMenuItems = await loadFromStorage(STORAGE_KEYS.MENU_ITEMS, []) as MenuItem[];
          
          set((state) => {
            if (savedMenuItems.length > defaultMenuItems.length) {
              // 如果儲存的菜單項目比預設多，使用儲存的
              state.menuItems = savedMenuItems;
            } else {
              // 否則合併新項目到預設菜單
              const currentItems = [...defaultMenuItems];
              savedMenuItems.forEach(item => {
                if (!currentItems.find(defaultItem => defaultItem.id === item.id)) {
                  currentItems.push(item);
                }
              });
              state.menuItems = currentItems;
            }
            state.isLoaded = true;
          });
        } catch (error) {
          console.error('Failed to load menu items:', error);
          set((state) => {
            state.isLoaded = true;
          });
        }
      },

      // 便利方法
      getMenuItemById: (id: ID) => {
        return get().menuItems.find(item => item.id === id);
      },

      getMenuItemsByCategory: (category: MenuCategory) => {
        return get().menuItems.filter(item => item.category === category);
      },

      getMenuItemsBySpirit: (spirit: BaseSpirit) => {
        return get().menuItems.filter(item => item.baseSpirit === spirit);
      },

      getAvailableMenuItems: () => {
        return get().menuItems.filter(item => item.available);
      },

      toggleMenuItemAvailability: (id: ID) => {
        set((state) => {
          const item = state.menuItems.find(item => item.id === id);
          if (item) {
            item.available = !item.available;
            item.updatedAt = new Date().toISOString();
          } else {
            console.error('Menu item not found for availability toggle:', id);
          }
        });
      },

      searchMenuItems: (query: string) => {
        const lowerQuery = query.toLowerCase();
        return get().menuItems.filter(item => 
          item.name.toLowerCase().includes(lowerQuery) ||
          item.description?.toLowerCase().includes(lowerQuery) ||
          item.category.toLowerCase().includes(lowerQuery) ||
          item.baseSpirit?.toLowerCase().includes(lowerQuery)
        );
      },

      resetToDefaultMenu: () => {
        set((state) => {
          state.menuItems = [...defaultMenuItems];
        });
      },
    })),
    {
      name: 'menu-store',
      partialize: (state) => ({ 
        menuItems: state.menuItems 
      }),
    }
  )
);

// 暫時禁用自動儲存避免循環更新問題
// TODO: 在 v3.2 重新實作更安全的自動儲存機制
/*
// 自動儲存到儲存服務 - 避免無限循環
let previousMenuItemsLength = 0;
let previousMenuItemsString = '';

useMenuStore.subscribe((state) => {
  const currentMenuItems = state.menuItems;
  const isLoaded = state.isLoaded;
  
  // 只有在載入完成且菜單真的有變化時才儲存
  if (isLoaded && currentMenuItems.length > 0) {
    const currentMenuItemsString = JSON.stringify(currentMenuItems);
    
    if (currentMenuItems.length !== previousMenuItemsLength || 
        currentMenuItemsString !== previousMenuItemsString) {
      
      try {
        saveToStorage(STORAGE_KEYS.MENU_ITEMS, currentMenuItems);
        previousMenuItemsLength = currentMenuItems.length;
        previousMenuItemsString = currentMenuItemsString;
      } catch (error) {
        console.error('Failed to save menu items to storage:', error);
      }
    }
  }
});
*/

// 便利的選擇器 hooks
export const useMenuItems = () => useMenuStore((state) => state.menuItems);
export const useMenuLoaded = () => useMenuStore((state) => state.isLoaded);
// 優化的選擇器：避免重新渲染問題
const actionsSelector = (state: MenuStore) => ({
  addMenuItem: state.addMenuItem,
  updateMenuItem: state.updateMenuItem,
  deleteMenuItem: state.deleteMenuItem,
  setMenuItems: state.setMenuItems,
  toggleMenuItemAvailability: state.toggleMenuItemAvailability,
  resetToDefaultMenu: state.resetToDefaultMenu,
});

export const useMenuActions = () => useMenuStore(actionsSelector);

// 特定功能的選擇器
export const useMenuItemById = (id: ID) => 
  useMenuStore((state) => state.getMenuItemById(id));

export const useMenuItemsByCategory = (category: MenuCategory) => 
  useMenuStore((state) => state.getMenuItemsByCategory(category));

export const useMenuItemsBySpirit = (spirit: BaseSpirit) => 
  useMenuStore((state) => state.getMenuItemsBySpirit(spirit));

export const useAvailableMenuItems = () => 
  useMenuStore((state) => state.getAvailableMenuItems());

export const useMenuSearch = (query: string) => 
  useMenuStore((state) => state.searchMenuItems(query));

// 統計選擇器
export const useMenuStats = () => 
  useMenuStore((state) => ({
    totalItems: state.menuItems.length,
    availableItems: state.menuItems.filter(item => item.available).length,
    cocktailCount: state.menuItems.filter(item => item.category === 'cocktails').length,
    mocktailCount: state.menuItems.filter(item => item.category === 'mocktails').length,
    spiritCount: state.menuItems.filter(item => item.category === 'spirits').length,
    averagePrice: state.menuItems.length > 0 
      ? state.menuItems.reduce((sum, item) => sum + item.price, 0) / state.menuItems.length 
      : 0,
  }));