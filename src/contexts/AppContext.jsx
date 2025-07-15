import { createContext, useContext, useReducer, useEffect } from 'react';

// 初始狀態
const initialState = {
  orders: [
    // 測試資料：桌1的現有訂單
    {
      id: '1735152000000',
      tableNumber: 1,
      customers: 4,
      items: [
        { menuItemId: 1, name: '招牌牛肉麵', price: 180, quantity: 2 },
        { menuItemId: 5, name: '可樂', price: 30, quantity: 2 }
      ],
      total: 420,
      status: 'preparing',
      notes: '不要辣',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30分鐘前
    }
  ],
  menuItems: [
    { id: 1, name: '招牌牛肉麵', price: 180, category: '主食' },
    { id: 2, name: '蔥爆牛肉', price: 220, category: '主食' },
    { id: 3, name: '宮保雞丁', price: 160, category: '主食' },
    { id: 4, name: '麻婆豆腐', price: 120, category: '主食' },
    { id: 5, name: '可樂', price: 30, category: '飲料' },
    { id: 6, name: '熱茶', price: 20, category: '飲料' },
  ],
  tables: [
    // 桌1已佔用
    { id: 1, number: 1, status: 'occupied', customers: 4, currentOrder: '1735152000000' },
    // 其他桌位為空桌
    ...Array.from({ length: 11 }, (_, i) => ({
      id: i + 2,
      number: i + 2,
      status: 'available',
      customers: 0,
      currentOrder: null
    }))
  ],
  stats: {
    todayRevenue: 0,
    todayOrders: 0,
    activeCustomers: 0
  },
  notionConfig: {
    token: localStorage.getItem('notionToken') || '',
    databaseId: localStorage.getItem('databaseId') || ''
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
  SET_ORDERS: 'SET_ORDERS'
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
            table.id === newOrder.tableNumber 
              ? { ...table, status: 'occupied', currentOrder: newOrder.id }
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
        
        const deletedOrder = state.orders.find(order => order.id === action.payload);
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

      case actionTypes.SET_ORDERS:
        if (!Array.isArray(action.payload)) {
          console.error('Invalid set orders payload - must be array:', action.payload);
          return state;
        }
        
        return {
          ...state,
          orders: action.payload
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
    setOrders: (orders) => dispatch({ type: actionTypes.SET_ORDERS, payload: orders })
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