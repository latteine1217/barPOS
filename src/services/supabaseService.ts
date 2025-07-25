import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Order, Table, MenuItem, ApiResponse } from '@/types';

interface SyncResult {
  success: number;
  failed: number;
  errors: string[];
}

interface SyncResults {
  orders: SyncResult;
  tables: SyncResult;
  menuItems: SyncResult;
}

interface LocalData {
  orders: Order[];
  tables: Table[];
  menuItems: MenuItem[];
}

interface ConnectionTestResult {
  success: boolean;
  message?: string;
  data?: { connected: boolean; tablesCount: number };
  error?: string;
}

class SupabaseService {
  private supabase: SupabaseClient;
  private isConnected: boolean = false;

  constructor(supabaseUrl: string, supabaseKey: string) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and API Key are required');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.isConnected = false;
  }

  // 測試連接
  async testConnection(retries: number = 3): Promise<ConnectionTestResult> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Supabase 連線測試 (嘗試 ${i + 1}/${retries})...`);
        
        // 使用簡單的查詢來測試連接
        const { data, error } = await this.supabase
          .from('tables')
          .select('id')
          .limit(1);
        
        if (error) {
          throw error;
        }
        
        this.isConnected = true;
        console.log('Supabase 連線成功！');
        return { 
          success: true, 
          message: 'Successfully connected to Supabase',
          data: { connected: true, tablesCount: data?.length || 0 }
        };
      } catch (error) {
        lastError = error as Error;
        console.error(`連線嘗試 ${i + 1} 失敗:`, lastError.message);
        
        if (i < retries - 1) {
          // 等待一秒後重試
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    this.isConnected = false;
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
    console.log(`訂單狀態映射: ${appStatus} → ${mappedStatus}`);
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
    console.log(`桌位狀態映射: ${appStatus} → ${mappedStatus}`);
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
      console.error('創建訂單錯誤:', error);
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
      console.error('獲取訂單錯誤:', error);
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
        menuItems: { success: 0, failed: 0, errors: [] }
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
}

export default SupabaseService;