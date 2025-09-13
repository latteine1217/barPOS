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
  { id: '101', name: 'Old Fashioned', price: 150, category: 'cocktails', baseSpirit: 'whiskey', description: '威士忌、糖、苦精、橙皮', available: true },
  { id: '102', name: 'Manhattan', price: 150, category: 'cocktails', baseSpirit: 'whiskey', description: '威士忌、甜苦艾酒、苦精', available: true },
  { id: '105', name: 'Whiskey Sour', price: 150, category: 'cocktails', baseSpirit: 'whiskey', description: '威士忌、檸檬汁、糖漿、蛋白', available: true },
  { id: '103', name: 'Negroni', price: 150, category: 'cocktails', baseSpirit: 'gin', description: '琴酒、甜苦艾酒、金巴利', available: true },
  { id: '104', name: 'Martini', price: 150, category: 'cocktails', baseSpirit: 'gin', description: '琴酒、乾苦艾酒、橄欖或檸檬皮', available: true },
  { id: '106', name: 'Gimlet', price: 150, category: 'cocktails', baseSpirit: 'gin', description: '琴酒、萊姆汁、糖漿', available: true },
  { id: '107', name: 'Daiquiri', price: 150, category: 'cocktails', baseSpirit: 'rum', description: '蘭姆酒、萊姆汁、糖漿', available: false },
  { id: '108', name: 'Margarita', price: 150, category: 'cocktails', baseSpirit: 'tequila', description: '龍舌蘭、柑橘酒、萊姆汁', available: true },
  { id: '109', name: 'Cosmopolitan', price: 150, category: 'cocktails', baseSpirit: 'vodka', description: '伏特加、柑橘酒、蔓越莓汁、萊姆汁', available: true },
  { id: '110', name: 'Moscow Mule', price: 150, category: 'cocktails', baseSpirit: 'vodka', description: '伏特加、薑汁汽水、萊姆汁', available: true },
  { id: '111', name: 'Sidecar', price: 150, category: 'cocktails', baseSpirit: 'brandy', description: '干邑白蘭地、柑橘酒、檸檬汁', available: true },
  { id: '112', name: 'B-52', price: 150, category: 'cocktails', baseSpirit: 'liqueur', description: '咖啡利口酒、愛爾蘭奶酒、伏特加', available: true },
  { id: '113', name: 'Amaretto Sour', price: 150, category: 'cocktails', baseSpirit: 'liqueur', description: '杏仁利口酒、檸檬汁、糖漿', available: true },
  { id: '114', name: 'Mudslide', price: 150, category: 'cocktails', baseSpirit: 'liqueur', description: '咖啡利口酒、愛爾蘭奶酒、鮮奶油', available: true },
  { id: '201', name: '招牌特調', price: 180, category: 'cocktails', baseSpirit: 'liqueur', description: '本店獨家配方', available: true },
  { id: '202', name: '金色黃昏', price: 200, category: 'cocktails', baseSpirit: 'whiskey', description: '威士忌、蜂蜜、檸檬、薑汁', available: true },
  { id: '203', name: '紫羅蘭之夢', price: 190, category: 'cocktails', baseSpirit: 'gin', description: '琴酒、薰衣草、柚子、蘇打', available: true },
  { id: '301', name: 'Virgin Mojito', price: 80, category: 'mocktails', baseSpirit: 'none', description: '薄荷、萊姆、蘇打水', available: true },
  { id: '302', name: 'Shirley Temple', price: 80, category: 'mocktails', baseSpirit: 'none', description: '薑汁汽水、紅石榴糖漿、櫻桃', available: true },
  { id: '303', name: '蘋果氣泡飲', price: 70, category: 'mocktails', baseSpirit: 'none', description: '蘋果汁、薑汁汽水、檸檬', available: true }
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
  cocktailCount: number;
  mocktailCount: number;
  spiritCount: number;
  averagePrice: number;
} | null = null;

export const useMenuStats = () => useMenuStore((state) => {
  const items = state.menuItems;
  if (items === lastMenuItemsRef && lastMenuStats) return lastMenuStats;
  const stats = {
    totalItems: items.length,
    availableItems: items.filter((i) => i.available).length,
    cocktailCount: items.filter((i) => i.category === 'cocktails').length,
    mocktailCount: items.filter((i) => i.category === 'mocktails').length,
    spiritCount: items.filter((i) => i.category === 'spirits').length,
    averagePrice: items.length > 0 ? items.reduce((sum, i) => sum + i.price, 0) / items.length : 0,
  };
  lastMenuItemsRef = items;
  lastMenuStats = stats;
  return stats;
});
