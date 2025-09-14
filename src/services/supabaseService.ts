import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/services/loggerService';
import type { Order, Table, MenuItem, ApiResponse, MemberRecord } from '@/types';

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
  private mapStatusToDatabase(appStatus: string): string {
    const statusMapping: Record<string, string> = {
      'pending': 'pending',
      'preparing': 'preparing',
      'ready': 'ready',
      'completed': 'completed',
      'paid': 'paid',
      'cancelled': 'cancelled'
    };
    
    const mappedStatus = statusMapping[appStatus] || 'pending';
    logger.debug('Order status mapping', { component: 'SupabaseService', action: 'mapStatusToDatabase', appStatus, mappedStatus });
    return mappedStatus;
  }

  private mapTableStatusToDatabase(appStatus: string): string {
    const statusMapping: Record<string, string> = {
      'available': 'available',
      'occupied': 'occupied',
      'reserved': 'reserved',
      'cleaning': 'available'
    };
    
    const mappedStatus = statusMapping[appStatus] || 'available';
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
        items: JSON.stringify(order.items),
        total: order.total,
        subtotal: order.subtotal,
        tax: order.tax || 0,
        discount: order.discount || 0,
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
      console.error('獲取桌位錯誤:', error);
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
        .eq('available', true)
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
      console.error('獲取菜單錯誤:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '獲取菜單失敗'
      };
    }
  }

  // === 資料同步 ===
  
  async syncLocalData(localData: LocalData): Promise<ApiResponse<{ results: SyncResults }>> {
    try {
      const results: SyncResults = {
        orders: { success: 0, failed: 0, errors: [] },
        tables: { success: 0, failed: 0, errors: [] },
        menuItems: { success: 0, failed: 0, errors: [] },
        members: { success: 0, failed: 0, errors: [] }
      };

      // 同步訂單
      for (const order of localData.orders) {
        const result = await this.createOrder(order);
        if (result.success) {
          results.orders.success++;
        } else {
          results.orders.failed++;
          results.orders.errors.push(result.error || '未知錯誤');
        }
      }

      // 同步桌位
      for (const table of localData.tables) {
        const result = await this.upsertTable(table);
        if (result.success) {
          results.tables.success++;
        } else {
          results.tables.failed++;
          results.tables.errors.push(result.error || '未知錯誤');
        }
      }

      // 同步菜單項目
      for (const menuItem of localData.menuItems) {
        const result = await this.upsertMenuItem(menuItem);
        if (result.success) {
          results.menuItems.success++;
        } else {
          results.menuItems.failed++;
          results.menuItems.errors.push(result.error || '未知錯誤');
        }
      }

      // 同步會員資料
      for (const member of localData.members) {
        const result = await this.upsertMember(member);
        if (result.success) {
          results.members.success++;
        } else {
          results.members.failed++;
          results.members.errors.push(result.error || '未知錯誤');
        }
      }

      return {
        success: true,
        data: { results },
        message: 'Local data sync completed'
      };
    } catch (error) {
      console.error('同步本地資料錯誤:', error);
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
      items: typeof dbOrder.items === 'string' ? JSON.parse(dbOrder.items) : dbOrder.items,
      total: dbOrder.total,
      subtotal: dbOrder.subtotal,
      tax: dbOrder.tax,
      discount: dbOrder.discount,
      status: dbOrder.status,
      customers: dbOrder.customers,
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
      maxCapacity: dbTable.max_capacity || 4,
      position: typeof dbTable.position === 'string' ? JSON.parse(dbTable.position) : dbTable.position,
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
      ingredients: typeof dbItem.ingredients === 'string' ? JSON.parse(dbItem.ingredients) : dbItem.ingredients,
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
        position: JSON.stringify(table.position),
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
        ingredients: JSON.stringify(menuItem.ingredients),
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
      return { success: false, error: error instanceof Error ? error.message : '獲取會員失敗' };
    }
  }

  private transformMemberFromDatabase(db: any): MemberRecord {
    return {
      id: db.id,
      name: db.name,
      cups: Number(db.cups) || 0,
      notes: db.notes || undefined,
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
      return { success: false, error: error instanceof Error ? error.message : '更新會員失敗' };
    }
  }
}

export default SupabaseService;
