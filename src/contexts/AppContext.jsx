import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import storageService, { STORAGE_KEYS } from '../services/storageService';

// 本地儲存 keys（移到 storageService）
// const STORAGE_KEYS = ... (現在從 storageService 導入)

// 從跨平台儲存載入資料的工具函數
const loadFromStorage = async (key, defaultValue) => {
  try {
    return await storageService.getItem(key, defaultValue);
  } catch (error) {
    console.warn(`Failed to load ${key} from storage:`, error);
    return defaultValue;
  }
};

// 儲存資料到跨平台儲存的工具函數
const saveToStorage = async (key, data) => {
  try {
    await storageService.setItem(key, data);
  } catch (error) {
    console.warn(`Failed to save ${key} to storage:`, error);
  }
};

// 初始狀態 - 改為異步載入
const getInitialState = async () => {
  const orders = await loadFromStorage(STORAGE_KEYS.ORDERS, []);
  const menuItems = await loadFromStorage(STORAGE_KEYS.MENU_ITEMS, [
    { id: 1, name: '招牌牛肉麵', price: 180, category: '主食' },
    { id: 2, name: '蔥爆牛肉', price: 220, category: '主食' },
    { id: 3, name: '宮保雞丁', price: 160, category: '主食' },
    { id: 4, name: '麻婆豆腐', price: 120, category: '主食' },
    { id: 5, name: '可樂', price: 30, category: '飲料' },
    { id: 6, name: '熱茶', price: 20, category: '飲料' },
  ]);
  const tables = await loadFromStorage(STORAGE_KEYS.TABLES, [
    ...Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      number: i + 1,
      name: `桌 ${i + 1}`,
      status: 'available',
      customers: 0,
      currentOrder: null,
      position: {
        x: ((i % 4) * 200) + 50,
        y: (Math.floor(i / 4) * 150) + 50
      },
      size: 'medium',
      shape: 'round',
      capacity: 4,
      type: 'regular'
    }))
  ]);
  const layoutConfig = await loadFromStorage(STORAGE_KEYS.LAYOUT_CONFIG, {
    canvasWidth: 1000,
    canvasHeight: 600,
    gridSize: 20,
    showGrid: true,
    backgroundImage: null
  });
  const stats = await loadFromStorage(STORAGE_KEYS.STATS, {
    todayRevenue: 0,
    todayOrders: 0,
    activeCustomers: 0
  });

  return {
    orders,
    menuItems,
    tables,
    layoutConfig,
    stats,
    theme: await loadFromStorage(STORAGE_KEYS.THEME, 'light'),
    notionConfig: {
      token: await storageService.getItem(STORAGE_KEYS.NOTION_TOKEN, ''),
      databaseId: await storageService.getItem(STORAGE_KEYS.DATABASE_ID, '')
    },
    supabaseConfig: {
      url: await storageService.getItem(STORAGE_KEYS.SUPABASE_URL, 'https://nexvfdomttzwfrwwprko.supabase.co'),
      key: await storageService.getItem(STORAGE_KEYS.SUPABASE_KEY, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leHZmZG9tdHR6d2Zyd3dwcmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTkzNDksImV4cCI6MjA2ODE3NTM0OX0.9Nn9HDXkIgJtwIm5la4lUBqtwNRCUiUOctQbV1xqMIg')
    }
  };
};

// 同步初始狀態（用於 reducer 初始化）
const initialState = {
  orders: [],
  menuItems: [
    { id: 1, name: '招牌牛肉麵', price: 180, category: '主食' },
    { id: 2, name: '蔥爆牛肉', price: 220, category: '主食' },
    { id: 3, name: '宮保雞丁', price: 160, category: '主食' },
    { id: 4, name: '麻婆豆腐', price: 120, category: '主食' },
    { id: 5, name: '可樂', price: 30, category: '飲料' },
    { id: 6, name: '熱茶', price: 20, category: '飲料' },
  ],
  tables: [
    ...Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      number: i + 1,
      name: `桌 ${i + 1}`,
      status: 'available',
      customers: 0,
      currentOrder: null,
      position: {
        x: ((i % 4) * 200) + 50,
        y: (Math.floor(i / 4) * 150) + 50
      },
      size: 'medium',
      shape: 'round',
      capacity: 4,
      type: 'regular'
    }))
  ],
  layoutConfig: {
    canvasWidth: 1000,
    canvasHeight: 600,
    gridSize: 20,
    showGrid: true,
    backgroundImage: null
  },
  stats: {
    todayRevenue: 0,
    todayOrders: 0,
    activeCustomers: 0
  },
  theme: 'light',
  notionConfig: {
    token: '',
    databaseId: ''
  },
  supabaseConfig: {
    url: 'https://nexvfdomttzwfrwwprko.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leHZmZG9tdHR6d2Zyd3dwcmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTkzNDksImV4cCI6MjA2ODE3NTM0OX0.9Nn9HDXkIgJtwIm5la4lUBqtwNRCUiUOctQbV1xqMIg'
  }
};

// Actions
const actionTypes = {
  ADD_ORDER: 'ADD_ORDER',
  UPDATE_ORDER: 'UPDATE_ORDER',
  DELETE_ORDER: 'DELETE_ORDER',
  RELEASE_TABLE: 'RELEASE_TABLE',
  UPDATE_TABLE: 'UPDATE_TABLE',
  ADD_MENU_ITEM: 'ADD_MENU_ITEM',
  UPDATE_MENU_ITEM: 'UPDATE_MENU_ITEM',
  DELETE_MENU_ITEM: 'DELETE_MENU_ITEM',
  UPDATE_STATS: 'UPDATE_STATS',
  UPDATE_NOTION_CONFIG: 'UPDATE_NOTION_CONFIG',
  UPDATE_SUPABASE_CONFIG: 'UPDATE_SUPABASE_CONFIG',
  SET_ORDERS: 'SET_ORDERS',
  SET_TABLES: 'SET_TABLES',
  SET_MENU_ITEMS: 'SET_MENU_ITEMS',
  UPDATE_TABLE_LAYOUT: 'UPDATE_TABLE_LAYOUT',
  SAVE_LAYOUT_CONFIG: 'SAVE_LAYOUT_CONFIG',
  ADD_TABLE: 'ADD_TABLE',
  DELETE_TABLE: 'DELETE_TABLE',
  CLEAR_ALL_DATA: 'CLEAR_ALL_DATA',
  TOGGLE_THEME: 'TOGGLE_THEME'
};

// Reducer
function appReducer(state, action) {
  try {
    switch (action.type) {
      case actionTypes.ADD_ORDER:
        const newOrder = {
          ...action.payload,
          id: action.payload.id || Date.now().toString(),
          createdAt: action.payload.createdAt || new Date().toISOString(),
          status: action.payload.status || 'pending'
        };
        
        // 驗證必要欄位
        if (!newOrder.tableNumber || !newOrder.items || !Array.isArray(newOrder.items)) {
          console.error('Invalid order data:', newOrder);
          return state;
        }
        
        return {
          ...state,
          orders: [...state.orders, newOrder],
          tables: state.tables.map(table => 
            table.number === newOrder.tableNumber
              ? { 
                  ...table, 
                  status: 'occupied', 
                  currentOrder: newOrder.id,
                  customers: newOrder.customers || 0
                }
              : table
          )
        };

      case actionTypes.UPDATE_ORDER:
        if (!action.payload.id || !action.payload.updates) {
          console.error('Invalid update order payload:', action.payload);
          return state;
        }
        
        return {
          ...state,
          orders: state.orders.map(order =>
            order.id === action.payload.id
              ? { ...order, ...action.payload.updates }
              : order
          )
        };

      case actionTypes.DELETE_ORDER:
        if (!action.payload) {
          console.error('Invalid delete order payload:', action.payload);
          return state;
        }
        
        return {
          ...state,
          orders: state.orders.filter(order => order.id !== action.payload),
          tables: state.tables.map(table =>
            table.currentOrder === action.payload
              ? { ...table, status: 'available', currentOrder: null, customers: 0 }
              : table
          )
        };

      case actionTypes.RELEASE_TABLE:
        if (!action.payload?.orderId) {
          console.error('Invalid release table payload:', action.payload);
          return state;
        }
        
        // 只釋放桌位，不刪除訂單資料（用於統計）
        return {
          ...state,
          tables: state.tables.map(table =>
            table.currentOrder === action.payload.orderId
              ? { ...table, status: 'available', currentOrder: null, customers: 0 }
              : table
          )
        };

      case actionTypes.UPDATE_TABLE:
        if (!action.payload?.id || !action.payload?.updates) {
          console.error('Invalid update table payload:', action.payload);
          return state;
        }
        
        return {
          ...state,
          tables: state.tables.map(table =>
            table.id === action.payload.id
              ? { ...table, ...action.payload.updates }
              : table
          )
        };

      case actionTypes.ADD_MENU_ITEM:
        if (!action.payload) {
          console.error('Invalid add menu item payload:', action.payload);
          return state;
        }
        
        return {
          ...state,
          menuItems: [...state.menuItems, { ...action.payload, id: action.payload.id || Date.now() }]
        };

      case actionTypes.UPDATE_MENU_ITEM:
        if (!action.payload?.id || !action.payload?.updates) {
          console.error('Invalid update menu item payload:', action.payload);
          return state;
        }
        
        return {
          ...state,
          menuItems: state.menuItems.map(item =>
            item.id === action.payload.id
              ? { ...item, ...action.payload.updates }
              : item
          )
        };

      case actionTypes.DELETE_MENU_ITEM:
        if (!action.payload) {
          console.error('Invalid delete menu item payload:', action.payload);
          return state;
        }
        
        return {
          ...state,
          menuItems: state.menuItems.filter(item => item.id !== action.payload)
        };

      case actionTypes.UPDATE_STATS:
        return {
          ...state,
          stats: { ...state.stats, ...action.payload }
        };

      case actionTypes.UPDATE_NOTION_CONFIG:
        return {
          ...state,
          notionConfig: { ...state.notionConfig, ...action.payload }
        };

      case actionTypes.UPDATE_SUPABASE_CONFIG:
        return {
          ...state,
          supabaseConfig: { ...state.supabaseConfig, ...action.payload }
        };

      case actionTypes.SET_ORDERS:
        if (!Array.isArray(action.payload)) {
          console.error('Invalid set orders payload - must be array:', action.payload);
          return state;
        }
        
        return {
          ...state,
          orders: action.payload
        };

      case actionTypes.SET_TABLES:
        if (!Array.isArray(action.payload)) {
          console.error('Invalid set tables payload - must be array:', action.payload);
          return state;
        }
        
        return {
          ...state,
          tables: action.payload
        };

      case actionTypes.SET_MENU_ITEMS:
        if (!Array.isArray(action.payload)) {
          console.error('Invalid set menu items payload - must be array:', action.payload);
          return state;
        }
        
        return {
          ...state,
          menuItems: action.payload
        };

      case actionTypes.UPDATE_TABLE_LAYOUT:
        if (!action.payload?.id || !action.payload?.layoutData) {
          console.error('Invalid update table layout payload:', action.payload);
          return state;
        }
        
        return {
          ...state,
          tables: state.tables.map(table =>
            table.id === action.payload.id
              ? { ...table, ...action.payload.layoutData }
              : table
          )
        };

      case actionTypes.SAVE_LAYOUT_CONFIG:
        if (!action.payload) {
          console.error('Invalid layout config payload:', action.payload);
          return state;
        }
        
        return {
          ...state,
          layoutConfig: { ...state.layoutConfig, ...action.payload }
        };

      case actionTypes.ADD_TABLE:
        if (!action.payload) {
          console.error('Invalid add table payload:', action.payload);
          return state;
        }
        
        const newTable = {
          id: action.payload.id || Date.now(),
          number: action.payload.number || state.tables.length + 1,
          name: action.payload.name || `桌 ${state.tables.length + 1}`,
          status: 'available',
          customers: 0,
          currentOrder: null,
          position: action.payload.position || { x: 100, y: 100 },
          size: action.payload.size || 'medium',
          shape: action.payload.shape || 'round',
          capacity: action.payload.capacity || 4,
          type: action.payload.type || 'regular'
        };
        
        return {
          ...state,
          tables: [...state.tables, newTable]
        };

      case actionTypes.DELETE_TABLE:
        if (!action.payload) {
          console.error('Invalid delete table payload:', action.payload);
          return state;
        }
        
        return {
          ...state,
          tables: state.tables.filter(table => table.id !== action.payload)
        };

      case actionTypes.CLEAR_ALL_DATA:
        // 清除所有跨平台儲存資料
        storageService.clear().catch(error => {
          console.error('Failed to clear storage:', error);
        });
        
        // 重置狀態到初始值（但保留 Notion 設定）
        return {
          ...initialState,
          notionConfig: state.notionConfig // 保留 Notion 設定
        };

      case actionTypes.TOGGLE_THEME:
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        // 保存主題到儲存
        saveToStorage(STORAGE_KEYS.THEME, newTheme);
        return {
          ...state,
          theme: newTheme
        };

      default:
        console.warn('Unknown action type:', action.type);
        return state;
    }
  } catch (error) {
    console.error('Error in reducer:', error, action);
    return state; // 返回當前狀態，避免應用崩潰
  }
}

// Context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  // 初始化儲存並載入資料
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await storageService.initializeStorage();
        const loadedState = await getInitialState();
        
        // 批量設定載入的狀態
        Object.entries(loadedState).forEach(([key, value]) => {
          if (key === 'orders' && value.length > 0) {
            dispatch({ type: actionTypes.SET_ORDERS, payload: value });
          } else if (key === 'menuItems' && value.length > initialState.menuItems.length) {
            // 只有當載入的菜單項目比預設的多時才更新
            value.forEach(item => {
              if (!initialState.menuItems.find(defaultItem => defaultItem.id === item.id)) {
                dispatch({ type: actionTypes.ADD_MENU_ITEM, payload: item });
              }
            });
          } else if (key === 'tables' && value.length > 0) {
            // 更新所有桌位
            value.forEach(table => {
              dispatch({ type: actionTypes.UPDATE_TABLE, payload: { id: table.id, updates: table } });
            });
          } else if (key === 'layoutConfig') {
            dispatch({ type: actionTypes.SAVE_LAYOUT_CONFIG, payload: value });
          } else if (key === 'stats') {
            dispatch({ type: actionTypes.UPDATE_STATS, payload: value });
          } else if (key === 'notionConfig') {
            dispatch({ type: actionTypes.UPDATE_NOTION_CONFIG, payload: value });
          } else if (key === 'supabaseConfig') {
            dispatch({ type: actionTypes.UPDATE_SUPABASE_CONFIG, payload: value });
          }
        });
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsLoaded(true); // 即使失敗也要讓應用繼續運行
      }
    };

    initializeApp();
  }, []);

  // 計算統計數據
  useEffect(() => {
    try {
      const todayOrders = state.orders.filter(order => {
        try {
          if (!order.createdAt) return false;
          const orderDate = new Date(order.createdAt).toDateString();
          const today = new Date().toDateString();
          return orderDate === today;
        } catch (err) {
          console.warn('Error parsing order date:', order.createdAt, err);
          return false;
        }
      });

      const todayRevenue = todayOrders.reduce((sum, order) => {
        const total = Number(order.total) || 0;
        return sum + total;
      }, 0);
      
      const activeCustomers = state.tables.reduce((sum, table) => {
        if (table.status === 'occupied') {
          const customers = Number(table.customers) || 0;
          return sum + customers;
        }
        return sum;
      }, 0);

      dispatch({
        type: actionTypes.UPDATE_STATS,
        payload: {
          todayRevenue,
          todayOrders: todayOrders.length,
          activeCustomers
        }
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
      // 設置默認統計值
      dispatch({
        type: actionTypes.UPDATE_STATS,
        payload: {
          todayRevenue: 0,
          todayOrders: 0,
          activeCustomers: 0
        }
      });
    }
  }, [state.orders, state.tables]);

  // 自動儲存狀態到跨平台儲存
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.ORDERS, state.orders);
    }
  }, [state.orders, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.MENU_ITEMS, state.menuItems);
    }
  }, [state.menuItems, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.TABLES, state.tables);
    }
  }, [state.tables, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.LAYOUT_CONFIG, state.layoutConfig);
    }
  }, [state.layoutConfig, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.STATS, state.stats);
    }
  }, [state.stats, isLoaded]);

  useEffect(() => {
    if (isLoaded && state.notionConfig) {
      saveToStorage(STORAGE_KEYS.NOTION_TOKEN, state.notionConfig.token);
      saveToStorage(STORAGE_KEYS.DATABASE_ID, state.notionConfig.databaseId);
    }
  }, [state.notionConfig, isLoaded]);

  // Actions
  const actions = {
    addOrder: (order) => dispatch({ type: actionTypes.ADD_ORDER, payload: order }),
    updateOrder: (id, updates) => dispatch({ type: actionTypes.UPDATE_ORDER, payload: { id, updates } }),
    deleteOrder: (id) => dispatch({ type: actionTypes.DELETE_ORDER, payload: id }),
    releaseTable: (orderId) => dispatch({ type: actionTypes.RELEASE_TABLE, payload: { orderId } }),
    updateTable: (id, updates) => dispatch({ type: actionTypes.UPDATE_TABLE, payload: { id, updates } }),
    addMenuItem: (item) => dispatch({ type: actionTypes.ADD_MENU_ITEM, payload: item }),
    updateMenuItem: (id, updates) => dispatch({ type: actionTypes.UPDATE_MENU_ITEM, payload: { id, updates } }),
    deleteMenuItem: (id) => dispatch({ type: actionTypes.DELETE_MENU_ITEM, payload: id }),
    updateNotionConfig: (config) => dispatch({ type: actionTypes.UPDATE_NOTION_CONFIG, payload: config }),
    updateSupabaseConfig: async (config) => {
      dispatch({ type: actionTypes.UPDATE_SUPABASE_CONFIG, payload: config });
      // 同時保存到跨平台儲存
      await saveToStorage(STORAGE_KEYS.SUPABASE_URL, config.url);
      await saveToStorage(STORAGE_KEYS.SUPABASE_KEY, config.key);
    },
    setOrders: (orders) => dispatch({ type: actionTypes.SET_ORDERS, payload: orders }),
    setTables: (tables) => dispatch({ type: actionTypes.SET_TABLES, payload: tables }),
    setMenuItems: (menuItems) => dispatch({ type: actionTypes.SET_MENU_ITEMS, payload: menuItems }),
    // 桌位佈局相關 actions
    updateTableLayout: (id, layoutData) => dispatch({ type: actionTypes.UPDATE_TABLE_LAYOUT, payload: { id, layoutData } }),
    saveLayoutConfig: (config) => dispatch({ type: actionTypes.SAVE_LAYOUT_CONFIG, payload: config }),
    addTable: (tableData) => dispatch({ type: actionTypes.ADD_TABLE, payload: tableData }),
    deleteTable: (id) => dispatch({ type: actionTypes.DELETE_TABLE, payload: id }),
    // 資料管理
    clearAllData: () => dispatch({ type: actionTypes.CLEAR_ALL_DATA }),
    // 主題管理
    toggleTheme: () => dispatch({ type: actionTypes.TOGGLE_THEME })
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export { actionTypes };