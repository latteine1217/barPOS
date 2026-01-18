import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import type { MenuItem, MenuCategory, BaseSpirit, ID } from '@/types';

interface MenuState {
  menuItems: MenuItem[];
  isLoaded: boolean;
}

interface MenuActions {
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (id: ID, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: ID) => void;
  setMenuItems: (menuItems: MenuItem[]) => void;
  setLoaded: (loaded: boolean) => void;
  initialize: () => Promise<void>;
  getMenuItemById: (id: ID) => MenuItem | undefined;
  getMenuItemsByCategory: (category: MenuCategory) => MenuItem[];
  getMenuItemsBySpirit: (spirit: BaseSpirit) => MenuItem[];
  getAvailableMenuItems: () => MenuItem[];
  toggleMenuItemAvailability: (id: ID) => void;
  searchMenuItems: (query: string) => MenuItem[];
  resetToDefaultMenu: () => void;
}

export type MenuStore = MenuState & MenuActions;

// ID 生成輔助函數
function generateMenuItemId(category: MenuCategory, baseSpirit: BaseSpirit, existingItems: MenuItem[]): string {
  // 根據 category 和 baseSpirit 決定前綴
  let prefix = '';

  if (category === 'classic') {
    // 經典調酒根據基酒決定前綴
    if (baseSpirit === 'whiskey') prefix = 'W';
    else if (baseSpirit === 'gin') prefix = 'G';
    else if (baseSpirit === 'rum') prefix = 'R';
    else if (baseSpirit === 'vodka') prefix = 'V';
    else if (baseSpirit === 'liqueur') prefix = 'L';
    else if (baseSpirit === 'tequila') prefix = 'T';
    else if (baseSpirit === 'brandy') prefix = 'B';
    else prefix = 'O'; // Other
  } else if (category === 'signature') {
    prefix = 'S';
  } else if (category === 'mocktail') {
    prefix = 'M';
  } else if (category === 'wine') {
    prefix = 'WN';
  } else if (category === 'small_bite') {
    prefix = 'SB';
  } else {
    prefix = 'X'; // 其他未分類
  }

  // 找出該前綴下最大的編號
  const regex = new RegExp(`^${prefix}(\\d+)$`);
  let maxNum = 0;

  for (const item of existingItems) {
    const match = item.id.match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  // 生成新 ID：前綴 + (最大編號 + 1) 並補零到兩位數
  const newNum = maxNum + 1;
  return `${prefix}${newNum.toString().padStart(2, '0')}`;
}

const defaultMenuItems: MenuItem[] = [
  // WHISKY BASED 經典調酒
  { id: 'W01', name: 'Whiskey Sour', price: 150, category: 'classic', baseSpirit: 'whiskey', description: 'Bourbon Whiskey / Lemon / Simple Syrup', available: true },
  { id: 'W02', name: 'Old Fashioned', price: 150, category: 'classic', baseSpirit: 'whiskey', description: 'Whiskey / Cane Sugar / Bitter', available: true },
  { id: 'W03', name: 'Manhattan / Rob Roy', price: 150, category: 'classic', baseSpirit: 'whiskey', description: 'Rye Whiskey / Rosso Vermouth', available: true },
  { id: 'W04', name: 'Boulevardier', price: 150, category: 'classic', baseSpirit: 'whiskey', description: 'Whiskey / Rosso Vermouth / Campari', available: true },
  { id: 'W05', name: 'Godfather', price: 150, category: 'classic', baseSpirit: 'whiskey', description: 'Scotch Whisky / Amaretto', available: true },
  { id: 'W06', name: 'Highball ハイボール', price: 150, category: 'classic', baseSpirit: 'whiskey', description: 'Whiskey / Sparkling Water', available: true },
  { id: 'W07', name: 'John Collins', price: 150, category: 'classic', baseSpirit: 'whiskey', description: 'Whiskey / Lemon / Simple Syrup / Sparkling Water', available: true },
  { id: 'W08', name: 'New York Sour', price: 150, category: 'classic', baseSpirit: 'whiskey', description: 'Bourbon Whiskey / Lemon / Simple Syrup / Red Wine', available: true },
  { id: 'W09', name: 'Francis Albert', price: 200, category: 'classic', baseSpirit: 'whiskey', description: 'Whisky / Gin', available: true },

  // GIN BASED 經典調酒
  { id: 'G01', name: 'Gimlet', price: 150, category: 'classic', baseSpirit: 'gin', description: 'Dry Gin / Lime / Simple Syrup', available: true },
  { id: 'G02', name: 'White Lady', price: 150, category: 'classic', baseSpirit: 'gin', description: 'Dry Gin / Lemon / Cointreau', available: true },
  { id: 'G03', name: 'Gin Tonic', price: 150, category: 'classic', baseSpirit: 'gin', description: 'Dry Gin / Tonic Water', available: true },
  { id: 'G04', name: "Bee's Knee", price: 150, category: 'classic', baseSpirit: 'gin', description: 'Dry Gin / Lemon / Honey Syrup', available: true },
  { id: 'G05', name: 'Negroni', price: 150, category: 'classic', baseSpirit: 'gin', description: 'Gin / Rosso Vermouth / Campari', available: true },
  { id: 'G06', name: 'Gin Fizz', price: 150, category: 'classic', baseSpirit: 'gin', description: 'Dry Gin / Lemon / Simple Syrup / Soda', available: true },
  { id: 'G07', name: 'Vesper', price: 150, category: 'classic', baseSpirit: 'gin', description: 'Dry Gin / Vodka / Lillet Blanc', available: true },
  { id: 'G08', name: 'Martini', price: 150, category: 'classic', baseSpirit: 'gin', description: 'Dry Gin / Dry Vermouth', available: true },
  { id: 'G09', name: '20th Century', price: 150, category: 'classic', baseSpirit: 'gin', description: 'Dry Gin / Lillet / White Cocoa / Lemon', available: true },

  // Other Classic 經典調酒
  { id: 'O01', name: 'Shaked Campari', price: 150, category: 'classic', baseSpirit: 'liqueur', description: 'Campari', available: true },
  { id: 'O02', name: 'Spumoni', price: 150, category: 'classic', baseSpirit: 'liqueur', description: 'Campari / Grapefruit / Tonic Water', available: true },
  { id: 'O03', name: 'Grasshopper', price: 150, category: 'classic', baseSpirit: 'liqueur', description: 'Mint / White Cocoa / Heavy Cream', available: true },
  { id: 'O04', name: 'Americano', price: 150, category: 'classic', baseSpirit: 'liqueur', description: 'Campari / Rosso Vermouth / Sparkling Water', available: true },
  { id: 'O05', name: 'Mojito', price: 150, category: 'classic', baseSpirit: 'rum', description: 'Light Rum / Mint / Lime / Soda', available: true },
  { id: 'O06', name: 'Daiquiri', price: 150, category: 'classic', baseSpirit: 'rum', description: 'Light Rum / Lime / Simple Syrup', available: true },
  { id: 'O07', name: 'Treacle', price: 150, category: 'classic', baseSpirit: 'rum', description: 'Dark Rum / Apple / Bitter', available: true },
  { id: 'O08', name: 'Charlie Chaplin', price: 150, category: 'classic', baseSpirit: 'liqueur', description: 'Sloe Gin / Apricot Brandy / Lemon', available: true },
  { id: 'O09', name: 'Espresso Martini', price: 150, category: 'classic', baseSpirit: 'vodka', description: 'Vodka / Espresso / Simple Syrup', available: true },

  // Signature 茶酒系列
  { id: 'S01', name: '新潮流', price: 150, category: 'signature', baseSpirit: 'rum', description: 'Rum / 包種茶 / Orange / Apple / Honey Syrup', available: true },
  { id: 'S02', name: '地方椿腳', price: 150, category: 'signature', baseSpirit: 'rum', description: 'Rum / 老茶 / Orange / Pineapple', available: true },
  { id: 'S03', name: 'げいしゃ Geisha', price: 150, category: 'signature', baseSpirit: 'none', description: '煎茶 / Orange / Apple / Honey / Lemon', available: true },

  // Signature 四季系列
  { id: 'S04', name: '春寒料峭', price: 200, category: 'signature', baseSpirit: 'gin', description: 'Gin / 草莓果乾茶 / 伯爵茶 / Lemon', available: true },
  { id: 'S05', name: '仲夏之夜', price: 200, category: 'signature', baseSpirit: 'whiskey', description: 'Bourbon Whiskey / 大禹嶺茶 / 伯爵 / 鳳梨 / Lemon', available: true },
  { id: 'S06', name: '一葉知秋', price: 200, category: 'signature', baseSpirit: 'gin', description: 'Gin / 蜜香紅茶 / 桂花 / 肉桂', available: true },
  { id: 'S07', name: '橙黃橘綠時', price: 200, category: 'signature', baseSpirit: 'gin', description: 'Gin / 高山茶 / 日本柚子 / Lemon / Honey', available: true },
];

export const useMenuStore = create<MenuStore>()(
  persist(
    immer((set, get) => ({
      menuItems: defaultMenuItems,
      isLoaded: false,

    addMenuItem: (item: MenuItem) => {
      set((state) => {
        const now = new Date().toISOString();

        // 生成符合規範的 ID
        const newId = generateMenuItemId(
          item.category,
          item.baseSpirit || 'none',
          state.menuItems
        );

        // 檢查 ID 是否衝突（雙重保險）
        const idExists = state.menuItems.some(i => i.id === newId);
        if (idExists) {
          console.error(`ID 衝突: ${newId} 已存在`);
          return;
        }

        const newItem: MenuItem = {
          id: newId,
          name: item.name,
          price: item.price,
          cost: item.cost,
          category: item.category,
          baseSpirit: item.baseSpirit,
          description: item.description,
          available: item.available ?? true,
          createdAt: now,
          updatedAt: now,
        } as MenuItem;
        state.menuItems.push(newItem);
      });
    },

    updateMenuItem: (id: ID, updates: Partial<MenuItem>) => {
      set((state) => {
        const item = state.menuItems.find((i) => i.id === id);
        if (!item) return;
        if (updates.name !== undefined) item.name = updates.name;
        if (updates.price !== undefined) item.price = updates.price;
        if (updates.category !== undefined) item.category = updates.category;
        if (updates.baseSpirit !== undefined) item.baseSpirit = updates.baseSpirit;
        if (updates.description !== undefined) item.description = updates.description;
        if (updates.available !== undefined) item.available = updates.available;
        if (updates.cost !== undefined) item.cost = updates.cost;
        item.updatedAt = new Date().toISOString();
      });
    },

    deleteMenuItem: (id: ID) => {
      set((state) => {
        const idx = state.menuItems.findIndex((i) => i.id === id);
        if (idx === -1) return;
        state.menuItems.splice(idx, 1);
      });
    },

    setMenuItems: (menuItems: MenuItem[]) => {
      set((state) => {
        if (!Array.isArray(menuItems)) return;
        state.menuItems = menuItems.map((item) => ({ ...item }));
      });
    },

    setLoaded: (loaded: boolean) => {
      set((state) => {
        state.isLoaded = loaded;
      });
    },

    initialize: async () => {
      try {
        // persist middleware 會自動從 localStorage 恢復 menuItems
        // 檢查是否已經有資料（被 persist 恢復）
        const current = get().menuItems;

        if (current && current.length > 0) {
          // 已經有資料，可能是 persist 自動恢復的
          set((state) => {
            state.isLoaded = true;
          });
          return;
        }

        // 如果沒有資料，使用預設菜單
        set((state) => {
          state.menuItems = defaultMenuItems.map((it) => ({ ...it }));
          state.isLoaded = true;
        });
      } catch {
        set((state) => {
          state.isLoaded = true;
        });
      }
    },

    getMenuItemById: (id: ID) => get().menuItems.find((i) => i.id === id),
    getMenuItemsByCategory: (category: MenuCategory) => get().menuItems.filter((i) => i.category === category),
    getMenuItemsBySpirit: (spirit: BaseSpirit) => get().menuItems.filter((i) => i.baseSpirit === spirit),
    getAvailableMenuItems: () => get().menuItems.filter((i) => i.available),

    toggleMenuItemAvailability: (id: ID) => {
      set((state) => {
        const item = state.menuItems.find((i) => i.id === id);
        if (!item) return;
        item.available = !item.available;
      });
    },

    searchMenuItems: (query: string) => {
      const q = query.trim().toLowerCase();
      if (q.length === 0) return get().menuItems;
      if (q.length < 2) return [];
      return get().menuItems.filter((i) =>
        i.name.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.baseSpirit?.toLowerCase().includes(q)
      );
    },

    resetToDefaultMenu: () => {
      set((state) => {
        state.menuItems = defaultMenuItems.map((it) => ({ ...it }));
      });
    },
  })),
    {
      name: 'menu-store', // localStorage 儲存鍵名
      partialize: (state) => ({
        menuItems: state.menuItems
      }), // 只持久化 menuItems，不持久化 isLoaded
    }
  )
);

export const useMenuItems = () => useMenuStore((state) => state.menuItems);
export const useMenuLoaded = () => useMenuStore((state) => state.isLoaded);
// Actions 恆定不變，不需要訂閱 Store 更新
export const useMenuActions = () => {
  const state = useMenuStore.getState();
  return {
    addMenuItem: state.addMenuItem,
    updateMenuItem: state.updateMenuItem,
    deleteMenuItem: state.deleteMenuItem,
    setMenuItems: state.setMenuItems,
    toggleMenuItemAvailability: state.toggleMenuItemAvailability,
    resetToDefaultMenu: state.resetToDefaultMenu,
    setLoaded: state.setLoaded,
    initialize: state.initialize,
  };
};
export const useMenuItemById = (id: ID) => useMenuStore((state) => state.getMenuItemById(id));
export const useMenuItemsByCategory = (category: MenuCategory) => useMenuStore((state) => state.getMenuItemsByCategory(category));
export const useMenuItemsBySpirit = (spirit: BaseSpirit) => useMenuStore((state) => state.getMenuItemsBySpirit(spirit));
export const useAvailableMenuItems = () => useMenuStore((state) => state.getAvailableMenuItems());
export const useMenuSearch = (query: string) => useMenuStore((state) => state.searchMenuItems(query));
let lastMenuItemsRef: MenuItem[] | null = null;
let lastMenuStats: {
  totalItems: number;
  availableItems: number;
  classicCount: number;
  signatureCount: number;
  mocktailCount: number;
  wineCount: number;
  otherCount: number;
  smallBiteCount: number;
  averagePrice: number;
} | null = null;

export const useMenuStats = () => useMenuStore((state) => {
  const items = state.menuItems;
  if (items === lastMenuItemsRef && lastMenuStats) return lastMenuStats;
  const stats = {
    totalItems: items.length,
    availableItems: items.filter((i) => i.available).length,
    classicCount: items.filter((i) => i.category === 'classic').length,
    signatureCount: items.filter((i) => i.category === 'signature').length,
    mocktailCount: items.filter((i) => i.category === 'mocktail').length,
    wineCount: items.filter((i) => i.category === 'wine').length,
    otherCount: items.filter((i) => i.category === 'other').length,
    smallBiteCount: items.filter((i) => i.category === 'small_bite').length,
    averagePrice: items.length > 0 ? items.reduce((sum, i) => sum + i.price, 0) / items.length : 0,
  };
  lastMenuItemsRef = items;
  lastMenuStats = stats;
  return stats;
});
