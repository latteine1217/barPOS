import type { Entity, ID, Timestamp, DeepPartial } from './base';

// ========================
// 🍸 業務域類型定義
// ========================

// 訂單相關類型
// =============

export type OrderStatus = 
  | 'draft'      // 草稿
  | 'pending'    // 待處理
  | 'preparing'  // 製作中
  | 'ready'      // 完成待取
  | 'completed'  // 已完成
  | 'paid'       // 已付款
  | 'cancelled'; // 已取消

export type PaymentStatus = 
  | 'unpaid'     // 未付款
  | 'partial'    // 部分付款
  | 'paid'       // 已付款
  | 'refunded';  // 已退款

export type PaymentMethod = 
  | 'cash'       // 現金
  | 'card'       // 信用卡
  | 'mobile'     // 行動支付
  | 'other';     // 其他

export interface OrderItemBase {
  name: string;
  baseSpirit?: BaseSpirit;
  price: number;
  quantity: number;
  notes?: string;
  modifiers?: OrderModifier[];
  discounts?: OrderDiscount[];
}

export interface OrderModifier {
  id: ID;
  name: string;
  price: number;
  type: 'addon' | 'substitution' | 'customization';
}

export interface OrderDiscount {
  id: ID;
  name: string;
  type: 'percentage' | 'fixed' | 'promotion';
  value: number;
  reason?: string;
}

export interface OrderItem extends Entity<OrderItemBase> {
  orderId?: ID; // 關聯的訂單ID
}

export interface OrderBase {
  tableNumber: number;
  tableName?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  customers: number;
  customerId?: ID;
  staffId?: ID;
  notes?: string;
  estimatedTime?: number; // 預估完成時間（分鐘）
  completedAt?: Timestamp;
  paidAt?: Timestamp;
}

export interface Order extends Entity<OrderBase> {
  // 追加訂單相關方法
  calculateSubtotal?(): number;
  calculateTax?(): number;
  calculateTotal?(): number;
}

export interface CreateOrderData extends Omit<OrderBase, 'subtotal' | 'tax' | 'total' | 'status' | 'paymentStatus' | 'items'> {
  items: OrderItemBase[];
}

export interface UpdateOrderData extends DeepPartial<OrderBase> {
  // 更新訂單時的額外選項
  recalculateTotal?: boolean;
}

// 桌位相關類型
// ============

export type TableStatus = 
  | 'available' // 可用
  | 'occupied'  // 使用中
  | 'reserved'  // 預約
  | 'cleaning'  // 清潔中
  | 'maintenance'; // 維修中

export type TableType = 
  | 'regular'   // 一般桌
  | 'vip'       // VIP桌
  | 'booth'     // 包廂
  | 'bar'       // 吧台座
  | 'outdoor';  // 戶外座

export type TableShape = 
  | 'round'      // 圓形
  | 'square'     // 正方形
  | 'rectangle'  // 長方形
  | 'oval'       // 橢圓形
  | 'custom';    // 自定義

export type TableSize = 
  | 'small'   // 1-2人
  | 'medium'  // 3-4人
  | 'large'   // 5-8人
  | 'xlarge'; // 8+人

export interface Position {
  x: number;
  y: number;
}

export interface TableBase {
  number: number;
  name: string;
  status: TableStatus;
  type: TableType;
  shape: TableShape;
  size: TableSize;
  maxCapacity: number;
  currentCapacity: number;
  position: Position;
  area?: string; // 區域名稱
  floor?: number; // 樓層
  orderId?: ID;
  reservationId?: ID;
  assignedStaffId?: ID;
}

export type Table = Entity<TableBase>;

export interface CreateTableData extends Omit<TableBase, 'status' | 'currentCapacity'> {
  // 新增桌位時的預設值
  defaultStatus?: TableStatus;
}

export interface UpdateTableData extends DeepPartial<TableBase> {
  // 更新桌位時的額外選項
  resetStatus?: boolean;
}

export interface TableWithOrder extends Table {
  currentOrder?: Order;
  // 桌位與訂單的組合資訊
  orderStartTime?: string;
  estimatedServiceTime?: number;
}

// 菜單相關類型
// ============

export type MenuCategory =
  | 'classic'      // 經典調酒
  | 'signature'    // 招牌/自創
  | 'mocktail'     // 無酒精
  | 'wine'         // 葡萄酒
  | 'small_bite'   // 小點
  | 'other';       // 其他

export type BaseSpirit = 
  | 'vodka'     // 伏特加
  | 'gin'       // 琴酒
  | 'rum'       // 蘭姆酒
  | 'whiskey'   // 威士忌
  | 'tequila'   // 龍舌蘭
  | 'brandy'    // 白蘭地
  | 'liqueur'   // 利口酒
  | 'wine'      // 葡萄酒
  | 'beer'      // 啤酒
  | 'sake'      // 清酒
  | 'none';     // 無酒精

export type AllergenType = 
  | 'gluten'     // 麩質
  | 'dairy'      // 乳製品
  | 'nuts'       // 堅果
  | 'shellfish'  // 貝類
  | 'eggs'       // 雞蛋
  | 'soy'        // 大豆
  | 'fish';      // 魚類

export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  alcohol?: number; // 酒精含量百分比
}

export interface MenuItemBase {
  name: string;
  category: MenuCategory;
  baseSpirit?: BaseSpirit;
  price: number;
  cost?: number; // 成本價
  description?: string;
  ingredients: string[];
  allergens: AllergenType[];
  nutritional?: NutritionalInfo;
  available: boolean;
  featured: boolean; // 是否為推薦商品
  imageUrl?: string;
  preparationTime?: number; // 製作時間（分鐘）
  spicyLevel?: 1 | 2 | 3 | 4 | 5; // 辣度等級
  customizable: boolean; // 是否可客製化
  tags: string[]; // 標籤（如：素食、無酒精等）
}

export interface MenuItem extends Entity<MenuItemBase> {
  // 菜單項目的計算方法
  calculateMargin?(): number;
  isSpicy?(): boolean;
}

export interface CreateMenuItemData extends Omit<MenuItemBase, 'available' | 'featured'> {
  // 創建菜單項目時的預設值
  defaultAvailable?: boolean;
  defaultFeatured?: boolean;
}

export interface UpdateMenuItemData extends DeepPartial<MenuItemBase> {
  // 更新菜單項目時的額外選項
  maintainFeatured?: boolean;
}

// 統計分析類型
// ============

export type TimePeriod = 
  | 'hour'    // 小時
  | 'day'     // 日
  | 'week'    // 週
  | 'month'   // 月
  | 'quarter' // 季
  | 'year';   // 年

export type TrendDirection = 'up' | 'down' | 'stable';

export interface MetricValue<T = number> {
  value: T;
  previous?: T;
  change?: number;
  changePercent?: number;
  trend?: TrendDirection;
}

export interface BusinessMetrics {
  revenue: MetricValue;
  orders: MetricValue;
  customers: MetricValue;
  averageOrderValue: MetricValue;
  tableUtilization: MetricValue;
  customerSatisfaction?: MetricValue;
}

export interface TimeSeriesData {
  timestamp: Timestamp;
  value: number;
  label?: string;
}

export interface ReportData {
  period: {
    start: Timestamp;
    end: Timestamp;
    type: TimePeriod;
  };
  metrics: BusinessMetrics;
  trends: {
    revenue: TimeSeriesData[];
    orders: TimeSeriesData[];
    customers: TimeSeriesData[];
  };
  topProducts: Array<{
    item: MenuItem;
    quantity: number;
    revenue: number;
    orders: number;
  }>;
  tablePerformance: Array<{
    table: Table;
    orders: number;
    revenue: number;
    utilization: number;
  }>;
}

// 用戶和權限類型
// ==============

export type UserRole = 
  | 'admin'    // 管理員
  | 'manager'  // 經理
  | 'staff'    // 員工
  | 'waiter'   // 服務員
  | 'bartender' // 調酒師
  | 'cashier'  // 收銀員
  | 'kitchen'; // 廚房

export type Permission = 
  | 'orders:read'     | 'orders:write'     | 'orders:delete'
  | 'tables:read'     | 'tables:write'     | 'tables:delete'
  | 'menu:read'       | 'menu:write'       | 'menu:delete'
  | 'reports:read'    | 'reports:export'
  | 'settings:read'   | 'settings:write'
  | 'users:read'      | 'users:write'      | 'users:delete';

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  permissions: Permission[];
  avatar?: string;
  isActive: boolean;
  lastLogin?: Timestamp;
  preferences: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      orders: boolean;
      system: boolean;
      reports: boolean;
    };
  };
}

export interface User extends Entity<UserProfile> {
  // 用戶相關方法
  hasPermission?(permission: Permission): boolean;
  isManager?(): boolean;
}

// 系統設定類型
// ============

export interface BusinessInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  currency: string;
  timezone: string;
  taxRate: number;
  serviceCharge?: number;
  autoGratuity?: {
    enabled: boolean;
    percentage: number;
    minPartySize: number;
  };
}

export interface IntegrationSettings {
  pos?: {
    provider: string;
    apiKey?: string;
    endpoint?: string;
    enabled: boolean;
  };
  payment?: {
    provider: string;
    merchantId?: string;
    apiKey?: string;
    enabled: boolean;
  };
  analytics?: {
    provider: string;
    trackingId?: string;
    enabled: boolean;
  };
}

export interface SystemSettings {
  business: BusinessInfo;
  integrations: IntegrationSettings;
  features: {
    onlineOrdering: boolean;
    tableReservation: boolean;
    loyaltyProgram: boolean;
    inventoryManagement: boolean;
    staffScheduling: boolean;
  };
  security: {
    sessionTimeout: number;
    passwordPolicy: {
      minLength: number;
      requireSpecialChars: boolean;
      requireNumbers: boolean;
      requireUppercase: boolean;
    };
    twoFactorAuth: boolean;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    webhooks: string[];
  };
}