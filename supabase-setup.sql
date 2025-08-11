-- 調酒酒吧 POS 系統 Supabase 資料庫建立腳本（完整修正版）
-- 請在 Supabase SQL Editor 中執行此腳本

-- 清理可能存在的舊資料表（小心使用！）
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS menu_items CASCADE;
-- DROP TABLE IF EXISTS tables CASCADE;

-- 建立座位資料表（酒吧座位）
CREATE TABLE tables (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  position JSONB DEFAULT '{"x": 0, "y": 0}',
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  customers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立訂單資料表（修正：包含 'paid' 狀態，調整為調製中）
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

-- 建立酒單項目資料表
CREATE TABLE menu_items (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(8,2) NOT NULL,
  category VARCHAR(50) DEFAULT '經典調酒',
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

-- 插入預設座位資料（酒吧座位）
INSERT INTO tables (id, name, position, status, customers) VALUES
(1, '位 1', '{"x": 50, "y": 50}', 'available', 0),
(2, '位 2', '{"x": 250, "y": 50}', 'available', 0),
(3, '位 3', '{"x": 450, "y": 50}', 'available', 0),
(4, '位 4', '{"x": 650, "y": 50}', 'available', 0),
(5, '位 5', '{"x": 50, "y": 200}', 'available', 0),
(6, '位 6', '{"x": 250, "y": 200}', 'available', 0),
(7, '位 7', '{"x": 450, "y": 200}', 'available', 0),
(8, '位 8', '{"x": 650, "y": 200}', 'available', 0),
(9, '位 9', '{"x": 50, "y": 350}', 'available', 0),
(10, '位 10', '{"x": 250, "y": 350}', 'available', 0),
(11, '位 11', '{"x": 450, "y": 350}', 'available', 0),
(12, '位 12', '{"x": 650, "y": 350}', 'available', 0);

-- 插入預設酒單項目（調酒項目）
INSERT INTO menu_items (id, name, price, category, description) VALUES
-- 經典調酒
(1, 'Old Fashioned', 150, '經典調酒', '威士忌、糖、苦精、橙皮'),
(2, 'Manhattan', 150, '經典調酒', '威士忌、甜苦艾酒、苦精'),
(3, 'Negroni', 150, '經典調酒', '琴酒、甜苦艾酒、金巴利'),
(4, 'Martini', 150, '經典調酒', '琴酒、乾苦艾酒、橄欖或檸檬皮'),
(5, 'Whiskey Sour', 150, '經典調酒', '威士忌、檸檬汁、糖漿、蛋白'),
(6, 'Gimlet', 150, '經典調酒', '琴酒、萊姆汁、糖漿'),
(7, 'Daiquiri', 150, '經典調酒', '蘭姆酒、萊姆汁、糖漿'),
(8, 'Margarita', 150, '經典調酒', '龍舌蘭、柑橘酒、萊姆汁'),
(9, 'Cosmopolitan', 150, '經典調酒', '伏特加、柑橘酒、蔓越莓汁、萊姆汁'),
(10, 'Moscow Mule', 150, '經典調酒', '伏特加、薑汁汽水、萊姆汁'),
-- Signature 調酒
(11, '招牌特調', 180, 'Signature', '本店獨家配方'),
-- Mocktail 無酒精調酒
(12, 'Virgin Mojito', 80, 'Mocktail', '薄荷、萊姆、蘇打水'),
(13, 'Shirley Temple', 80, 'Mocktail', '薑汁汽水、紅石榴糖漿、櫻桃');

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
SELECT 'Seats:' as info, COUNT(*) as count FROM tables
UNION ALL
SELECT 'Cocktail Menu Items:' as info, COUNT(*) as count FROM menu_items;
