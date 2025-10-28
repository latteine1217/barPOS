import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/services/loggerService';
import type { Order, Table, MenuItem, ApiResponse, MemberRecord, TableStatus, OrderStatus } from '@/types';

interface SyncResult {
  success: number;
  failed: number;
  errors: string[];
}

interface SyncResults {
  orders: SyncResult;
  tables: SyncResult;
  menuItems: SyncResult;
  members: SyncResult;
}

interface LocalData {
  orders: Order[];
  tables: Table[];
  menuItems: MenuItem[];
  members: MemberRecord[];
}

interface ConnectionTestResult {
  success: boolean;
  message?: string;
  data?: { tablesCount: number };
  error?: string;
}

const ORDER_STATUS_MAP: Record<OrderStatus, OrderStatus> = {
  pending: 'pending',
  preparing: 'preparing',
  completed: 'completed',
  paid: 'paid',
  cancelled: 'cancelled',
};

const TABLE_STATUS_MAP: Record<TableStatus, TableStatus> = {
  available: 'available',
  occupied: 'occupied',
  reserved: 'reserved',
  cleaning: 'cleaning',
};

const safeParseJson = <T>(value: unknown, fallback: T): T => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn('Failed to parse JSON field, fallback applied', {
        component: 'SupabaseService',
        action: 'safeParseJson',
        valueSnippet: value.slice(0, 60),
        error: errorMessage,
      });
      return fallback;
    }
  }

  if (value === null || value === undefined) {
    return fallback;
  }

  return value as T;
};

const serializeJson = (value: unknown): string | null => {
  if (value === undefined || value === null) {
    return null;
  }
  try {
    return JSON.stringify(value);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn('Failed to stringify JSON field, returning null', {
      component: 'SupabaseService',
      action: 'serializeJson',
      error: errorMessage,
    });
    return null;
  }
};

class SupabaseService {
  private supabase: SupabaseClient;
  

  constructor(supabaseUrl: string, supabaseKey: string) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and API Key are required');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // 測試連接
  async testConnection(retries: number = 3): Promise<ConnectionTestResult> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < retries; i++) {
      try {
        logger.debug('Testing Supabase connection', { component: 'SupabaseService', action: 'testConnection', attempt: i + 1, retries });
        
        // 使用簡單的查詢來測試連接
        const { data, error } = await this.supabase
          .from('tables')
          .select('id')
          .limit(1);
        
        if (error) {
          throw error;
        }
        
        logger.info('Supabase connection successful', { component: 'SupabaseService', action: 'testConnection', tablesCount: data?.length || 0 });
        return { 
          success: true, 
          message: 'Successfully connected to Supabase',
          data: { tablesCount: data?.length || 0 }
        };
      } catch (error) {
        lastError = error as Error;
        logger.warn('Connection attempt failed', { component: 'SupabaseService', action: 'testConnection', attempt: i + 1, retries, error: lastError.message });
        
        if (i < retries - 1) {
          // 等待一秒後重試
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    return { 
      success: false, 
      error: lastError?.message || 'Failed to connect to Supabase after multiple attempts'
    };
  }

  // 狀態映射函數
  private mapStatusToDatabase(appStatus: OrderStatus): OrderStatus {
    const mappedStatus = ORDER_STATUS_MAP[appStatus] ?? ORDER_STATUS_MAP.pending;
    logger.debug('Order status mapping', { component: 'SupabaseService', action: 'mapStatusToDatabase', appStatus, mappedStatus });
    return mappedStatus;
  }

  private mapTableStatusToDatabase(appStatus: TableStatus): TableStatus {
    const mappedStatus = TABLE_STATUS_MAP[appStatus] ?? TABLE_STATUS_MAP.available;
    logger.debug('Table status mapping', { component: 'SupabaseService', action: 'mapTableStatusToDatabase', appStatus, mappedStatus });
    return mappedStatus;
  }

  // === 訂單管理 ===
  
  async createOrder(order: Order): Promise<ApiResponse<Order>> {
    try {
      const orderData = {
        id: order.id,
        table_number: order.tableNumber,
        table_name: order.tableName,
        items: serializeJson(order.items ?? []),
        total: order.total ?? 0,
        subtotal: order.subtotal ?? 0,
        tax: order.tax ?? 0,
        discount: order.discount ?? 0,
        status: this.mapStatusToDatabase(order.status),
        customers: order.customers,
        notes: order.notes,
        created_at: order.createdAt,
        updated_at: order.updatedAt,
        completed_at: order.completedAt
      };

      const { data, error } = await this.supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: this.transformOrderFromDatabase(data),
        message: 'Order created successfully'
      };
    } catch (error) {
      logger.error('Failed to create order', { component: 'SupabaseService', action: 'createOrder', orderId: order.id }, error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : '創建訂單失敗'
      };
    }
  }

  async fetchOrders(): Promise<ApiResponse<Order[]>> {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const orders = data?.map(order => this.transformOrderFromDatabase(order)) || [];

      return {
        success: true,
        data: orders,
        message: `Successfully fetched ${orders.length} orders`
      };
    } catch (error) {
      logger.error('Failed to fetch orders', { component: 'SupabaseService', action: 'fetchOrders' }, error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : '獲取訂單失敗'
      };
    }
  }

  private async upsertOrder(order: Order): Promise<ApiResponse<Order>> {
    try {
      const orderData = {
        id: order.id,
        table_number: order.tableNumber,
        table_name: order.tableName,
        items: serializeJson(order.items ?? []),
        total: order.total ?? 0,
        subtotal: order.subtotal ?? 0,
        tax: order.tax ?? 0,
        discount: order.discount ?? 0,
        status: this.mapStatusToDatabase(order.status),
        customers: order.customers,
        notes: order.notes,
        created_at: order.createdAt,
        updated_at: new Date().toISOString(),
        completed_at: order.completedAt
      };

      const { data, error } = await this.supabase
        .from('orders')
        .upsert([orderData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: this.transformOrderFromDatabase(data),
        message: 'Order upserted successfully'
      };
    } catch (error) {
      logger.error('Failed to upsert order', { component: 'SupabaseService', action: 'upsertOrder', orderId: order.id }, error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新訂單失敗'
      };
    }
  }

  // === 桌位管理 ===
  
  async fetchTables(): Promise<ApiResponse<Table[]>> {
    try {
      const { data, error } = await this.supabase
        .from('tables')
        .select('*')
        .order('number', { ascending: true });

      if (error) {
        throw error;
      }

      const tables = data?.map(table => this.transformTableFromDatabase(table)) || [];

      return {
        success: true,
        data: tables,
        message: `Successfully fetched ${tables.length} tables`
      };
    } catch (error) {
      logger.error('Failed to fetch tables', { component: 'SupabaseService', action: 'fetchTables' }, error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : '獲取桌位失敗'
      };
    }
  }

  // === 菜單管理 ===
  
  async fetchMenuItems(): Promise<ApiResponse<MenuItem[]>> {
    try {
      const { data, error } = await this.supabase
        .from('menu_items')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      const menuItems = data?.map(item => this.transformMenuItemFromDatabase(item)) || [];

      return {
        success: true,
        data: menuItems,
        message: `Successfully fetched ${menuItems.length} menu items`
      };
    } catch (error) {
      logger.error('Failed to fetch menu items', { component: 'SupabaseService', action: 'fetchMenuItems' }, error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : '獲取菜單失敗'
      };
    }
  }

  // === 資料同步 ===
  
  async syncLocalData(localData: LocalData): Promise<ApiResponse<{ results: SyncResults }>> {
    try {
      const [ordersResult, tablesResult, menuResult, membersResult] = await Promise.all([
        this.syncEntities('orders', localData.orders ?? [], (order) => this.upsertOrder(order)),
        this.syncEntities('tables', localData.tables ?? [], (table) => this.upsertTable(table)),
        this.syncEntities('menuItems', localData.menuItems ?? [], (item) => this.upsertMenuItem(item)),
        this.syncEntities('members', localData.members ?? [], (member) => this.upsertMember(member)),
      ]);

      const results: SyncResults = {
        orders: ordersResult,
        tables: tablesResult,
        menuItems: menuResult,
        members: membersResult,
      };

      return {
        success: true,
        data: { results },
        message: 'Local data sync completed'
      };
    } catch (error) {
      logger.error('Sync local data failed', { component: 'SupabaseService', action: 'syncLocalData' }, error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : '同步失敗'
      };
    }
  }

  // === 私有方法：資料轉換 ===
  
  private transformOrderFromDatabase(dbOrder: any): Order {
    return {
      id: dbOrder.id,
      tableNumber: dbOrder.table_number,
      tableName: dbOrder.table_name,
      items: safeParseJson(dbOrder.items, []),
      total: Number(dbOrder.total) || 0,
      subtotal: Number(dbOrder.subtotal) || 0,
      tax: Number(dbOrder.tax) || 0,
      discount: Number(dbOrder.discount) || 0,
      status: (dbOrder.status as OrderStatus) ?? ORDER_STATUS_MAP.pending,
      customers: Number(dbOrder.customers) || 0,
      notes: dbOrder.notes,
      createdAt: dbOrder.created_at,
      updatedAt: dbOrder.updated_at,
      completedAt: dbOrder.completed_at
    };
  }

  private transformTableFromDatabase(dbTable: any): Table {
    return {
      id: dbTable.id,
      number: dbTable.number,
      name: dbTable.name,
      status: dbTable.status,
      customers: dbTable.customers || 0,
      maxCapacity: Number(dbTable.max_capacity) || 4,
      position: safeParseJson(dbTable.position, { x: 0, y: 0 }),
      orderId: dbTable.order_id,
      createdAt: dbTable.created_at,
      updatedAt: dbTable.updated_at
    };
  }

  private transformMenuItemFromDatabase(dbItem: any): MenuItem {
    return {
      id: dbItem.id,
      name: dbItem.name,
      category: dbItem.category,
      baseSpirit: dbItem.base_spirit,
      price: dbItem.price,
      cost: dbItem.cost ?? undefined,
      description: dbItem.description,
      available: dbItem.available,
      imageUrl: dbItem.image_url,
      ingredients: safeParseJson(dbItem.ingredients, []),
      alcoholContent: dbItem.alcohol_content,
      createdAt: dbItem.created_at,
      updatedAt: dbItem.updated_at
    };
  }

  // === 私有方法：更新操作 ===
  
  private async upsertTable(table: Table): Promise<ApiResponse<Table>> {
    try {
      const tableData = {
        id: table.id,
        number: table.number,
        name: table.name,
        status: this.mapTableStatusToDatabase(table.status),
        customers: table.customers,
        max_capacity: table.maxCapacity,
        position: serializeJson(table.position) ?? serializeJson({ x: 0, y: 0 }),
        order_id: table.orderId,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('tables')
        .upsert([tableData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: this.transformTableFromDatabase(data),
        message: 'Table upserted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新桌位失敗'
      };
    }
  }

  private async upsertMenuItem(menuItem: MenuItem): Promise<ApiResponse<MenuItem>> {
    try {
      const menuItemData = {
        id: menuItem.id,
        name: menuItem.name,
        category: menuItem.category,
        base_spirit: menuItem.baseSpirit,
        price: menuItem.price,
        cost: menuItem.cost ?? null,
        description: menuItem.description,
        available: menuItem.available,
        image_url: menuItem.imageUrl,
        ingredients: serializeJson(menuItem.ingredients),
        alcohol_content: menuItem.alcoholContent,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('menu_items')
        .upsert([menuItemData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: this.transformMenuItemFromDatabase(data),
        message: 'Menu item upserted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新菜單項目失敗'
      };
    }
  }

  // === Members ===
  async fetchMembers(): Promise<ApiResponse<MemberRecord[]>> {
    try {
      const { data, error } = await this.supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const members: MemberRecord[] = (data || []).map((m: any) => this.transformMemberFromDatabase(m));
      return { success: true, data: members, message: `Fetched ${members.length} members` };
    } catch (error) {
      logger.error('Failed to fetch members', { component: 'SupabaseService', action: 'fetchMembers' }, error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error instanceof Error ? error.message : '獲取會員失敗' };
    }
  }

  private transformMemberFromDatabase(db: any): MemberRecord {
      return {
        id: db.id,
        name: db.name,
        cups: Number(db.cups) || 0,
        ...(typeof db.notes === 'string' ? { notes: db.notes } : {}),
        createdAt: db.created_at,
        updatedAt: db.updated_at
      };
  }

  private async upsertMember(member: MemberRecord): Promise<ApiResponse<MemberRecord>> {
    try {
      const payload = {
        id: member.id,
        name: member.name,
        cups: member.cups,
        notes: member.notes ?? null,
        updated_at: new Date().toISOString()
      };
      const { data, error } = await this.supabase
        .from('members')
        .upsert([payload])
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: this.transformMemberFromDatabase(data), message: 'Member upserted' };
    } catch (error) {
      logger.error('Failed to upsert member', { component: 'SupabaseService', action: 'upsertMember', memberId: member.id }, error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error instanceof Error ? error.message : '更新會員失敗' };
    }
  }

  private async syncEntities<T>(
    label: keyof SyncResults,
    items: readonly T[],
    handler: (item: T) => Promise<ApiResponse<unknown>>
  ): Promise<SyncResult> {
    if (!Array.isArray(items) || items.length === 0) {
      return { success: 0, failed: 0, errors: [] };
    }

    const settled = await Promise.allSettled(items.map(async (item) => handler(item)));

    return settled.reduce<SyncResult>((acc, result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          acc.success += 1;
        } else {
          acc.failed += 1;
          acc.errors.push(result.value.error ?? `${String(label)}[${index}] failed`);
        }
      } else {
        acc.failed += 1;
        const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
        acc.errors.push(`${String(label)}[${index}] rejected: ${reason}`);
        logger.error('Sync entity rejected', {
          component: 'SupabaseService',
          action: 'syncEntities',
          label,
          index,
        }, result.reason instanceof Error ? result.reason : new Error(reason));
      }
      return acc;
    }, { success: 0, failed: 0, errors: [] });
  }
}

export default SupabaseService;
