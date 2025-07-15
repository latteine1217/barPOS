-- 餐廳 POS 系統 Supabase 資料庫建立腳本（完整修正版）
-- 請在 Supabase SQL Editor 中執行此腳本

-- 清理可能存在的舊資料表（小心使用！）
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS menu_items CASCADE;
-- DROP TABLE IF EXISTS tables CASCADE;

-- 建立桌位資料表
CREATE TABLE tables (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  position JSONB DEFAULT '{"x": 0, "y": 0}',
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  customers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立訂單資料表（修正：包含 'paid' 狀態）
CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY,
  table_id INTEGER REFERENCES tables(id),
  table_name VARCHAR(100),
  table_number INTEGER,
  customer_count INTEGER DEFAULT 1,
  total_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'paid', 'cancelled')),
  items JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立菜單項目資料表
CREATE TABLE menu_items (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(8,2) NOT NULL,
  category VARCHAR(50) DEFAULT '主食',
  description TEXT DEFAULT '',
  image_url VARCHAR(255) DEFAULT '',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立更新時間觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為每個表建立觸發器
CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 建立索引以提升查詢效能
CREATE INDEX idx_orders_table_number ON orders(table_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_menu_items_category ON menu_items(category);

-- 插入預設桌位資料
INSERT INTO tables (id, name, position, status, customers) VALUES
(1, '桌 1', '{"x": 50, "y": 50}', 'available', 0),
(2, '桌 2', '{"x": 250, "y": 50}', 'available', 0),
(3, '桌 3', '{"x": 450, "y": 50}', 'available', 0),
(4, '桌 4', '{"x": 650, "y": 50}', 'available', 0),
(5, '桌 5', '{"x": 50, "y": 200}', 'available', 0),
(6, '桌 6', '{"x": 250, "y": 200}', 'available', 0),
(7, '桌 7', '{"x": 450, "y": 200}', 'available', 0),
(8, '桌 8', '{"x": 650, "y": 200}', 'available', 0),
(9, '桌 9', '{"x": 50, "y": 350}', 'available', 0),
(10, '桌 10', '{"x": 250, "y": 350}', 'available', 0),
(11, '桌 11', '{"x": 450, "y": 350}', 'available', 0),
(12, '桌 12', '{"x": 650, "y": 350}', 'available', 0);

-- 插入預設菜單項目（修正：統一使用 '飲料' 分類）
INSERT INTO menu_items (id, name, price, category) VALUES
(1, '招牌牛肉麵', 180, '主食'),
(2, '蔥爆牛肉', 220, '主食'),
(3, '宮保雞丁', 160, '主食'),
(4, '麻婆豆腐', 120, '主食'),
(5, '可樂', 30, '飲料'),
(6, '熱茶', 20, '飲料');

-- 驗證資料表建立成功
SELECT 'Database setup completed successfully!' as status;

-- 檢查約束是否正確設定（使用更兼容的查詢）
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE contype = 'c' 
AND conrelid::regclass::text IN ('orders', 'tables');

-- 檢查資料是否插入成功
SELECT 'Tables:' as info, COUNT(*) as count FROM tables
UNION ALL
SELECT 'Menu Items:' as info, COUNT(*) as count FROM menu_items;
