import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { loadFromStorage, STORAGE_KEYS } from '../services/storageService';
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

const defaultMenuItems: MenuItem[] = [
  // 經典調酒
  { id: '101', name: 'Old Fashioned', price: 150, category: 'classic', baseSpirit: 'whiskey', description: '威士忌、糖、苦精、橙皮', available: true },
  { id: '102', name: 'Manhattan', price: 150, category: 'classic', baseSpirit: 'whiskey', description: '威士忌、甜苦艾酒、苦精', available: true },
  { id: '105', name: 'Whiskey Sour', price: 150, category: 'classic', baseSpirit: 'whiskey', description: '威士忌、檸檬汁、糖漿、蛋白', available: true },
  { id: '103', name: 'Negroni', price: 150, category: 'classic', baseSpirit: 'gin', description: '琴酒、甜苦艾酒、金巴利', available: true },
  { id: '104', name: 'Martini', price: 150, category: 'classic', baseSpirit: 'gin', description: '琴酒、乾苦艾酒、橄欖或檸檬皮', available: true },
  { id: '106', name: 'Gimlet', price: 150, category: 'classic', baseSpirit: 'gin', description: '琴酒、萊姆汁、糖漿', available: true },
  { id: '107', name: 'Daiquiri', price: 150, category: 'classic', baseSpirit: 'rum', description: '蘭姆酒、萊姆汁、糖漿', available: false },
  { id: '108', name: 'Margarita', price: 150, category: 'classic', baseSpirit: 'tequila', description: '龍舌蘭、柑橘酒、萊姆汁', available: true },
  { id: '109', name: 'Cosmopolitan', price: 150, category: 'classic', baseSpirit: 'vodka', description: '伏特加、柑橘酒、蔓越莓汁、萊姆汁', available: true },
  { id: '110', name: 'Moscow Mule', price: 150, category: 'classic', baseSpirit: 'vodka', description: '伏特加、薑汁汽水、萊姆汁', available: true },
  { id: '111', name: 'Sidecar', price: 150, category: 'classic', baseSpirit: 'brandy', description: '干邑白蘭地、柑橘酒、檸檬汁', available: true },
  { id: '115', name: 'Mojito', price: 150, category: 'classic', baseSpirit: 'rum', description: '蘭姆酒、薄荷、萊姆、糖、蘇打水', available: true },
  { id: '116', name: 'Tom Collins', price: 150, category: 'classic', baseSpirit: 'gin', description: '琴酒、檸檬汁、糖漿、蘇打水', available: true },
  { id: '117', name: 'Piña Colada', price: 150, category: 'classic', baseSpirit: 'rum', description: '蘭姆酒、椰奶、鳳梨汁', available: true },
  { id: '118', name: 'Mai Tai', price: 150, category: 'classic', baseSpirit: 'rum', description: '蘭姆酒、柑橘酒、萊姆汁、杏仁糖漿', available: true },
  { id: '119', name: 'Sazerac', price: 150, category: 'classic', baseSpirit: 'whiskey', description: '威士忌、苦艾酒漂洗、糖、苦精', available: true },
  { id: '120', name: 'Boulevardier', price: 150, category: 'classic', baseSpirit: 'whiskey', description: '威士忌、甜苦艾酒、金巴利', available: true },
  { id: '121', name: 'Paloma', price: 150, category: 'classic', baseSpirit: 'tequila', description: '龍舌蘭、葡萄柚汽水、萊姆汁', available: true },
  { id: '123', name: 'Gin & Tonic', price: 150, category: 'classic', baseSpirit: 'gin', description: '琴酒、通寧水、檸檬', available: true },
  { id: '124', name: 'Whiskey Highball', price: 150, category: 'classic', baseSpirit: 'whiskey', description: '威士忌、蘇打水', available: true },
  { id: '125', name: 'Bloody Mary', price: 150, category: 'classic', baseSpirit: 'vodka', description: '伏特加、番茄汁、香料', available: true },
  { id: '126', name: 'Mint Julep', price: 150, category: 'classic', baseSpirit: 'whiskey', description: '威士忌、薄荷、糖、水', available: true },
  { id: '127', name: 'French 75', price: 150, category: 'classic', baseSpirit: 'gin', description: '琴酒、檸檬汁、糖、香檳', available: true },
  
  // 招牌調酒
  { id: '201', name: '招牌特調', price: 180, category: 'signature', baseSpirit: 'liqueur', description: '本店獨家配方', available: true },
  { id: '202', name: '金色黃昏', price: 200, category: 'signature', baseSpirit: 'whiskey', description: '威士忌、蜂蜜、檸檬、薑汁', available: true },
  { id: '203', name: '紫羅蘭之夢', price: 190, category: 'signature', baseSpirit: 'gin', description: '琴酒、薰衣草、柚子、蘇打', available: true },
  
  // 無酒精調酒 (Mocktail)
  { id: '301', name: 'Virgin Mojito', price: 80, category: 'mocktail', baseSpirit: 'none', description: '薄荷、萊姆、蘇打水', available: true },
  { id: '302', name: 'Shirley Temple', price: 80, category: 'mocktail', baseSpirit: 'none', description: '薑汁汽水、紅石榴糖漿、櫻桃', available: true },
  { id: '303', name: '蘋果氣泡飲', price: 70, category: 'mocktail', baseSpirit: 'none', description: '蘋果汁、薑汁汽水、檸檬', available: true },
  
  // 葡萄酒
  { id: '401', name: 'Cabernet Sauvignon', price: 280, category: 'wine', baseSpirit: 'none', description: '加州卡本內蘇維翁紅酒', available: true },
  { id: '402', name: 'Chardonnay', price: 260, category: 'wine', baseSpirit: 'none', description: '法國夏多內白酒', available: true },
  { id: '403', name: 'Pinot Noir', price: 320, category: 'wine', baseSpirit: 'none', description: '俄勒岡州黑皮諾紅酒', available: true },
  { id: '404', name: 'Sauvignon Blanc', price: 240, category: 'wine', baseSpirit: 'none', description: '紐西蘭白蘇維翁', available: true },
  
  // 其他酒類
  { id: '112', name: 'B-52', price: 150, category: 'other', baseSpirit: 'liqueur', description: '咖啡利口酒、愛爾蘭奶酒、伏特加', available: true },
  { id: '113', name: 'Amaretto Sour', price: 150, category: 'other', baseSpirit: 'liqueur', description: '杏仁利口酒、檸檬汁、糖漿', available: true },
  { id: '114', name: 'Mudslide', price: 150, category: 'other', baseSpirit: 'liqueur', description: '咖啡利口酒、愛爾蘭奶酒、鮮奶油', available: true },
  { id: '122', name: 'Aperol Spritz', price: 150, category: 'other', baseSpirit: 'liqueur', description: 'Aperol、普羅賽克、蘇打水', available: true },
  { id: '140', name: 'Bellini', price: 150, category: 'other', baseSpirit: 'liqueur', description: '白桃泥、氣泡酒', available: true },
  { id: '141', name: 'Americano', price: 150, category: 'other', baseSpirit: 'liqueur', description: '金巴利、甜苦艾酒、蘇打水', available: true },
  
  // 小點
  { id: '501', name: '花生米', price: 60, category: 'small_bite', baseSpirit: 'none', description: '香酥花生米', available: true },
  { id: '502', name: '魷魚絲', price: 80, category: 'small_bite', baseSpirit: 'none', description: '炭烤魷魚絲', available: true },
  { id: '503', name: '起司拼盤', price: 180, category: 'small_bite', baseSpirit: 'none', description: '精選三種起司搭配餅乾', available: true },
  { id: '504', name: '橄欖', price: 90, category: 'small_bite', baseSpirit: 'none', description: '醃漬橄欖', available: true }
];

export const useMenuStore = create<MenuStore>()(
  immer((set, get) => ({
    menuItems: defaultMenuItems,
    isLoaded: true,

    addMenuItem: (item: MenuItem) => {
      set((state) => {
        const now = new Date().toISOString();
        const newItem: MenuItem = {
          id: Date.now().toString(),
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
        const saved = (await loadFromStorage(STORAGE_KEYS.MENU_ITEMS, [])) as MenuItem[];
        set((state) => {
          if (Array.isArray(saved) && saved.length > 0) {
            state.menuItems = saved.map((it) => ({ ...it }));
          }
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
  }))
);

export const useMenuItems = () => useMenuStore((state) => state.menuItems);
export const useMenuLoaded = () => useMenuStore((state) => state.isLoaded);
const actionsSelector = (state: MenuStore) => ({
  addMenuItem: state.addMenuItem,
  updateMenuItem: state.updateMenuItem,
  deleteMenuItem: state.deleteMenuItem,
  setMenuItems: state.setMenuItems,
  toggleMenuItemAvailability: state.toggleMenuItemAvailability,
  resetToDefaultMenu: state.resetToDefaultMenu,
});
export const useMenuActions = () => useMenuStore(actionsSelector);
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
