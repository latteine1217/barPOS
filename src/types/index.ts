// 基礎類型定義
export type ID = string;
export type Timestamp = string;

// ===== 訂單相關類型 =====
export interface OrderItem {
  id: ID;
  name: string;
  baseSpirit?: string;
  price: number;
  quantity: number;
  notes?: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'completed' | 'paid';

export interface Order {
  id: ID;
  tableNumber: number;
  tableName?: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  tax?: number;
  discount?: number;
  status: OrderStatus;
  customers: number;
  customerId?: string; // 添加客戶ID用於CRM分析
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

export interface NewOrderData {
  tableNumber: number;
  tableName?: string;
  items: Omit<OrderItem, 'id'>[];
  customers: number;
  notes?: string;
}

// ===== 桌位相關類型 =====
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export interface Position {
  x: number;
  y: number;
}

export interface Table {
  id: number;
  number: number;
  name: string;
  status: TableStatus;
  customers: number;
  maxCapacity: number;
  position: Position;
  orderId?: ID;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface TableLayoutSettings {
  width: number;
  height: number;
  backgroundImage?: string;
}

// ===== 菜單相關類型 =====
export type MenuCategory = 
  | 'cocktails' 
  | 'mocktails' 
  | 'spirits' 
  | 'wine' 
  | 'beer' 
  | 'snacks' 
  | 'others';

export type BaseSpirit = 
  | 'vodka' 
  | 'gin' 
  | 'rum' 
  | 'whiskey' 
  | 'tequila' 
  | 'brandy' 
  | 'liqueur' 
  | 'none';

export interface MenuItem {
  id: ID;
  name: string;
  category: MenuCategory;
  baseSpirit?: BaseSpirit;
  price: number;
  description?: string;
  available: boolean;
  imageUrl?: string;
  ingredients?: string[];
  alcoholContent?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface MenuSettings {
  categories: MenuCategory[];
  baseSpirits: BaseSpirit[];
  defaultCategory: MenuCategory;
  showPrices: boolean;
  showDescriptions: boolean;
}

// ===== 設定相關類型 =====
export type BackendType = 'supabase' | 'notion';

export interface SupabaseConfig {
  url: string;
  key: string;
}

export interface NotionConfig {
  token: string;
  databaseId: string;
}

export interface AppSettings {
  backendType: BackendType;
  supabaseConfig: SupabaseConfig;
  notionConfig: NotionConfig;
  currency: string;
  taxRate: number;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  autoSyncInterval: number;
  enableOfflineMode: boolean;
}

// ===== 統計相關類型 =====
export interface DailyStats {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  completedOrders: number;
  pendingOrders: number;
}

export interface MenuItemStats {
  itemId: ID;
  itemName: string;
  orderCount: number;
  revenue: number;
  popularity: number;
}

export interface BusinessStats {
  today: DailyStats;
  thisWeek: DailyStats[];
  thisMonth: DailyStats[];
  popularItems: MenuItemStats[];
  peakHours: number[];
  averageTableTurnover: number;
}

// ===== 應用狀態類型 =====
export interface AppState {
  orders: Order[];
  tables: Table[];
  menuItems: MenuItem[];
  settings: AppSettings;
  stats: BusinessStats;
  isLoading: boolean;
  error: string | null;
  lastSyncTime?: Timestamp;
}

// ===== Context Actions 類型 =====
export interface OrderActions {
  addOrder: (orderData: NewOrderData) => Promise<Order>;
  updateOrder: (orderId: ID, updates: Partial<Order>) => Promise<void>;
  deleteOrder: (orderId: ID) => Promise<void>;
  completeOrder: (orderId: ID) => Promise<void>;
  addItemToOrder: (orderId: ID, item: Omit<OrderItem, 'id'>) => Promise<void>;
  removeItemFromOrder: (orderId: ID, itemId: ID) => Promise<void>;
}

export interface TableActions {
  updateTable: (tableId: number, updates: Partial<Table>) => Promise<void>;
  addTable: (table: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  removeTable: (tableId: number) => Promise<void>;
  resetTableLayout: () => Promise<void>;
}

export interface MenuActions {
  addMenuItem: (item: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMenuItem: (itemId: ID, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (itemId: ID) => Promise<void>;
  toggleMenuItemAvailability: (itemId: ID) => Promise<void>;
}

export interface SettingsActions {
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  testConnection: () => Promise<boolean>;
  syncData: () => Promise<void>;
  exportData: () => Promise<void>;
  importData: (data: any) => Promise<void>;
}

export interface AppContextType {
  state: AppState;
  actions: OrderActions & TableActions & MenuActions & SettingsActions;
}

// ===== API 相關類型 =====
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// ===== 錯誤處理類型 =====
export type ErrorType = 'network' | 'validation' | 'authorization' | 'server' | 'unknown';

export interface AppError {
  id: ID;
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Timestamp;
  resolved: boolean;
}

export interface ErrorContextType {
  errors: AppError[];
  addError: (error: Omit<AppError, 'id' | 'timestamp' | 'resolved'>) => void;
  removeError: (errorId: ID) => void;
  clearErrors: () => void;
  resolveError: (errorId: ID) => void;
  
  // Toast 相關方法
  showToast: (message: string, type?: ToastNotification['type'], duration?: number) => string;
  removeToast: (id: string) => void;
  showError: (error: unknown, context?: string) => string;
  showSuccess: (message: string) => string;
  showWarning: (message: string) => string;
  showInfo: (message: string) => string;
  handleApiError: (error: unknown, context?: string) => void;
  toasts: any[];
}

// ===== 分析相關類型 =====
export interface RFMAnalysis {
  customerId: string;
  recency: number;
  frequency: number;
  monetary: number;
  score: string;
  segment?: CustomerSegment;
}

export type CustomerSegment = 
  | 'Champions' 
  | 'Loyal' 
  | 'Potential' 
  | 'New' 
  | 'At Risk' 
  | 'Cannot Lose' 
  | 'Hibernating' 
  | 'Others';

export type TimePeriod = 'today' | 'week' | 'month' | 'all';
export type TrendPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface TrendData {
  period: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
  customerCount: number;
  isPrediction?: boolean;
}

export interface ProductAnalysis {
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  averagePrice: number;
  uniqueCustomers: number;
}

export interface SeatingAnalysis {
  tableNumber: number;
  orderCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  uniqueCustomers: number;
  utilizationRate: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface ChartConfig {
  width?: number;
  height?: number;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

// ===== UI 相關類型 =====
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface ToastNotification {
  id: ID;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  autoClose?: boolean;
}

export interface FormFieldProps {
  label: string;
  name: string;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}