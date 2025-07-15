import { createClient } from '@supabase/supabase-js';

class SupabaseService {
  constructor(supabaseUrl, supabaseKey) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and API Key are required');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.isConnected = false;
  }

  // 測試連接（增強版本）
  async testConnection(retries = 3) {
    let lastError = null;
    
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Supabase 連線測試 (嘗試 ${i + 1}/${retries})...`);
        
        // 使用更簡單的查詢來測試連接
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
        lastError = error;
        console.error(`連線嘗試 ${i + 1} 失敗:`, error.message);
        
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

  // === 訂單管理 ===

  // 狀態映射函數：將應用狀態映射到資料庫允許的狀態
  mapStatusToDatabase(appStatus) {
    const statusMapping = {
      'pending': 'pending',        // 待處理
      'preparing': 'preparing',    // 製作中
      'ready': 'ready',           // 準備完成
      'completed': 'completed',    // 已完成
      'paid': 'paid',             // 已結帳
      'cancelled': 'cancelled'     // 已取消
    };
    
    const mappedStatus = statusMapping[appStatus] || 'pending';
    console.log(`訂單狀態映射: ${appStatus} → ${mappedStatus}`);
    return mappedStatus;
  }

  // 狀態映射函數：將資料庫狀態映射回應用狀態
  mapStatusFromDatabase(dbStatus) {
    // 保持一對一映射
    return dbStatus;
  }

  // 桌位狀態映射函數：將應用桌位狀態映射到資料庫允許的狀態
  mapTableStatusToDatabase(appStatus) {
    const statusMapping = {
      'available': 'available',    // 空桌
      'occupied': 'occupied',      // 使用中
      'reserved': 'reserved',      // 預約
      'cleaning': 'available'      // 清潔中 → 映射為空桌 (或可考慮加入新狀態)
    };
    
    const mappedStatus = statusMapping[appStatus] || 'available';
    console.log(`桌位狀態映射: ${appStatus} → ${mappedStatus}`);
    return mappedStatus;
  }

  // 桌位狀態映射函數：將資料庫狀態映射回應用狀態
  mapTableStatusFromDatabase(dbStatus) {
    // 保持一對一映射
    return dbStatus;
  }

  // 建立新訂單
  async createOrder(order) {
    try {
      const orderData = {
        id: order.id,
        table_id: order.tableId,
        table_name: order.tableName || `桌 ${order.tableNumber}`,
        table_number: order.tableNumber,
        customer_count: order.customerCount || 1,
        total_amount: order.total || 0,
        status: this.mapStatusToDatabase(order.status) || 'pending',
        items: order.items || [],
        created_at: order.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data: this.transformOrderFromDB(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 更新訂單
  async updateOrder(orderId, updates) {
    try {
      const updateData = {
        updated_at: new Date().toISOString()
      };

      // 對應欄位轉換
      if (updates.status) updateData.status = this.mapStatusToDatabase(updates.status);
      if (updates.total !== undefined) updateData.total_amount = updates.total;
      if (updates.items) updateData.items = updates.items;
      if (updates.customerCount) updateData.customer_count = updates.customerCount;

      const { data, error } = await this.supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data: this.transformOrderFromDB(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 刪除訂單
  async deleteOrder(orderId) {
    try {
      const { error } = await this.supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 獲取所有訂單
  async fetchOrders(limit = 100) {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      const transformedOrders = data.map(order => this.transformOrderFromDB(order));
      return { success: true, data: transformedOrders };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 獲取特定桌號的訂單
  async fetchOrdersByTable(tableNumber) {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .eq('table_number', tableNumber)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const transformedOrders = data.map(order => this.transformOrderFromDB(order));
      return { success: true, data: transformedOrders };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // === 桌位管理 ===

  // 建立桌位
  async createTable(table) {
    try {
      const tableData = {
        id: table.id,
        name: table.name,
        position: table.position || { x: 0, y: 0 },
        status: this.mapTableStatusToDatabase(table.status) || 'available',
        customers: table.customers || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('tables')
        .insert([tableData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data: this.transformTableFromDB(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 更新桌位
  async updateTable(tableId, updates) {
    try {
      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.position) updateData.position = updates.position;
      if (updates.status) updateData.status = this.mapTableStatusToDatabase(updates.status);
      if (updates.customers !== undefined) updateData.customers = updates.customers;

      const { data, error } = await this.supabase
        .from('tables')
        .update(updateData)
        .eq('id', tableId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data: this.transformTableFromDB(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 獲取所有桌位
  async fetchTables() {
    try {
      const { data, error } = await this.supabase
        .from('tables')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        throw error;
      }

      const transformedTables = data.map(table => this.transformTableFromDB(table));
      return { success: true, data: transformedTables };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // === 菜單管理 ===

  // 建立菜單項目
  async createMenuItem(menuItem) {
    try {
      const itemData = {
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        category: menuItem.category || '主食',
        description: menuItem.description || '',
        image_url: menuItem.imageUrl || '',
        is_available: menuItem.isAvailable !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('menu_items')
        .insert([itemData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data: this.transformMenuItemFromDB(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 更新菜單項目
  async updateMenuItem(itemId, updates) {
    try {
      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.category) updateData.category = updates.category;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
      if (updates.isAvailable !== undefined) updateData.is_available = updates.isAvailable;

      const { data, error } = await this.supabase
        .from('menu_items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data: this.transformMenuItemFromDB(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 刪除菜單項目
  async deleteMenuItem(itemId) {
    try {
      const { error } = await this.supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 獲取所有菜單項目
  async fetchMenuItems() {
    try {
      const { data, error } = await this.supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      const transformedItems = data.map(item => this.transformMenuItemFromDB(item));
      return { success: true, data: transformedItems };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // === 即時同步 ===

  // 訂閱訂單變更
  subscribeToOrders(callback) {
    return this.supabase
      .channel('orders-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          const transformedData = payload.new ? 
            this.transformOrderFromDB(payload.new) : payload.old;
          callback({
            eventType: payload.eventType,
            data: transformedData,
            old: payload.old
          });
        }
      )
      .subscribe();
  }

  // 訂閱桌位變更
  subscribeToTables(callback) {
    return this.supabase
      .channel('tables-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tables' },
        (payload) => {
          const transformedData = payload.new ? 
            this.transformTableFromDB(payload.new) : payload.old;
          callback({
            eventType: payload.eventType,
            data: transformedData,
            old: payload.old
          });
        }
      )
      .subscribe();
  }

  // 取消訂閱
  unsubscribe(subscription) {
    if (subscription) {
      this.supabase.removeChannel(subscription);
    }
  }

  // === 資料轉換函數 ===

  // 轉換訂單資料從資料庫格式到應用格式
  transformOrderFromDB(dbOrder) {
    return {
      id: dbOrder.id,
      tableId: dbOrder.table_id,
      tableName: dbOrder.table_name,
      tableNumber: dbOrder.table_number,
      customerCount: dbOrder.customer_count,
      total: dbOrder.total_amount,
      status: this.mapStatusFromDatabase(dbOrder.status),
      items: dbOrder.items || [],
      createdAt: dbOrder.created_at,
      updatedAt: dbOrder.updated_at,
      // 保持向後相容性
      supabaseId: dbOrder.id
    };
  }

  // 轉換桌位資料從資料庫格式到應用格式
  transformTableFromDB(dbTable) {
    return {
      id: dbTable.id,
      number: dbTable.id, // 保持向後相容性
      name: dbTable.name,
      position: dbTable.position || { x: 0, y: 0 },
      status: this.mapTableStatusFromDatabase(dbTable.status),
      customers: dbTable.customers,
      createdAt: dbTable.created_at,
      updatedAt: dbTable.updated_at
    };
  }

  // 轉換菜單項目從資料庫格式到應用格式
  transformMenuItemFromDB(dbItem) {
    return {
      id: dbItem.id,
      name: dbItem.name,
      price: dbItem.price,
      category: dbItem.category,
      description: dbItem.description,
      imageUrl: dbItem.image_url,
      isAvailable: dbItem.is_available,
      createdAt: dbItem.created_at,
      updatedAt: dbItem.updated_at
    };
  }

  // === 批量操作 ===

  // 同步本地資料到 Supabase（增強版本）
  async syncLocalData(localData) {
    try {
      console.log('開始同步本地資料到 Supabase...', localData);
      
      // 首先檢查連線
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        throw new Error(`連線失敗: ${connectionTest.error}`);
      }
      
      const results = {
        orders: { success: 0, failed: 0, errors: [] },
        tables: { success: 0, failed: 0, errors: [] },
        menuItems: { success: 0, failed: 0, errors: [] }
      };

      // 同步訂單（防重複處理）
      if (localData.orders && localData.orders.length > 0) {
        console.log(`準備同步 ${localData.orders.length} 個訂單...`);
        
        for (const order of localData.orders) {
          try {
            // 檢查訂單是否已存在
            const { data: existingOrders } = await this.supabase
              .from('orders')
              .select('id')
              .eq('id', order.id);
            
            let result;
            if (existingOrders && existingOrders.length > 0) {
              // 如果存在則更新
              result = await this.updateOrder(order.id, order);
              console.log(`更新訂單 ${order.id}:`, result.success ? '成功' : result.error);
            } else {
              // 如果不存在則創建
              result = await this.createOrder(order);
              console.log(`創建訂單 ${order.id}:`, result.success ? '成功' : result.error);
            }
            
            if (result.success) {
              results.orders.success++;
            } else {
              results.orders.failed++;
              results.orders.errors.push(`Order ${order.id}: ${result.error}`);
            }
          } catch (error) {
            console.error(`訂單 ${order.id} 同步失敗:`, error);
            results.orders.failed++;
            results.orders.errors.push(`Order ${order.id}: ${error.message}`);
          }
        }
      }

      // 同步桌位（防重複處理）
      if (localData.tables && localData.tables.length > 0) {
        console.log(`準備同步 ${localData.tables.length} 個桌位...`);
        
        for (const table of localData.tables) {
          try {
            // 檢查桌位是否已存在
            const { data: existingTables } = await this.supabase
              .from('tables')
              .select('id')
              .eq('id', table.id);
            
            let result;
            if (existingTables && existingTables.length > 0) {
              // 如果存在則更新
              result = await this.updateTable(table.id, table);
              console.log(`更新桌位 ${table.id}:`, result.success ? '成功' : result.error);
            } else {
              // 如果不存在則創建
              result = await this.createTable(table);
              console.log(`創建桌位 ${table.id}:`, result.success ? '成功' : result.error);
            }
            
            if (result.success) {
              results.tables.success++;
            } else {
              results.tables.failed++;
              results.tables.errors.push(`Table ${table.id}: ${result.error}`);
            }
          } catch (error) {
            console.error(`桌位 ${table.id} 同步失敗:`, error);
            results.tables.failed++;
            results.tables.errors.push(`Table ${table.id}: ${error.message}`);
          }
        }
      }

      // 同步菜單項目（防重複處理）
      if (localData.menuItems && localData.menuItems.length > 0) {
        console.log(`準備同步 ${localData.menuItems.length} 個菜單項目...`);
        
        for (const item of localData.menuItems) {
          try {
            // 檢查菜單項目是否已存在
            const { data: existingItems } = await this.supabase
              .from('menu_items')
              .select('id')
              .eq('id', item.id);
            
            let result;
            if (existingItems && existingItems.length > 0) {
              // 如果存在則更新
              result = await this.updateMenuItem(item.id, item);
              console.log(`更新菜單項目 ${item.id}:`, result.success ? '成功' : result.error);
            } else {
              // 如果不存在則創建
              result = await this.createMenuItem(item);
              console.log(`創建菜單項目 ${item.id}:`, result.success ? '成功' : result.error);
            }
            
            if (result.success) {
              results.menuItems.success++;
            } else {
              results.menuItems.failed++;
              results.menuItems.errors.push(`MenuItem ${item.id}: ${result.error}`);
            }
          } catch (error) {
            console.error(`菜單項目 ${item.id} 同步失敗:`, error);
            results.menuItems.failed++;
            results.menuItems.errors.push(`MenuItem ${item.id}: ${error.message}`);
          }
        }
      }

      console.log('同步完成，結果:', results);
      return { success: true, results };
    } catch (error) {
      console.error('同步過程發生錯誤:', error);
      return { success: false, error: error.message };
    }
  }
}

export default SupabaseService;