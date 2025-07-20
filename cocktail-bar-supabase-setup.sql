-- 調酒酒吧 POS 系統 Supabase 資料庫建立腳本
-- 請在 Supabase SQL Editor 中執行此腳本
-- 注意：如果你已經有現有資料，請先備份！

-- 如果是升級現有資料庫，執行以下遷移腳本
-- 將 INTEGER ID 欄位升級為 BIGINT 以支援大時間戳
DO $$ 
BEGIN
    -- 檢查並升級 tables.id 欄位
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tables' AND column_name = 'id' AND data_type = 'integer'
    ) THEN
        ALTER TABLE tables ALTER COLUMN id TYPE BIGINT;
        ALTER TABLE orders ALTER COLUMN table_id TYPE BIGINT;
        RAISE NOTICE 'Tables ID 欄位已升級為 BIGINT';
    END IF;
    
    -- 檢查並升級 menu_items.id 欄位
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menu_items' AND column_name = 'id' AND data_type = 'integer'
    ) THEN
        ALTER TABLE menu_items ALTER COLUMN id TYPE BIGINT;
        RAISE NOTICE 'Menu Items ID 欄位已升級為 BIGINT';
    END IF;
END $$;

-- 清理可能存在的舊資料表（小心使用！）
-- 如果你想保留現有資料，請註解掉下面三行
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS menu_items CASCADE;
-- DROP TABLE IF EXISTS tables CASCADE;

-- 建立座位資料表（酒吧座位）
CREATE TABLE IF NOT EXISTS tables (
  id BIGINT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  position JSONB DEFAULT '{"x": 0, "y": 0}',
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  customers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立訂單資料表（調酒訂單）
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  table_id BIGINT REFERENCES tables(id),
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
CREATE TABLE IF NOT EXISTS menu_items (
  id BIGINT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(8,2) NOT NULL,
  category VARCHAR(50) DEFAULT '經典調酒',
   base_spirit VARCHAR(20) DEFAULT NULL, -- 基酒分類: gin(琴酒), whisky(威士忌), rum(蘭姆酒), tequila(龍舌蘭), vodka(伏特加), brandy(白蘭地), others(利口酒為主), NULL(無酒精)  description TEXT DEFAULT '',
  image_url VARCHAR(255) DEFAULT '',
  is_available BOOLEAN DEFAULT true,
  alcohol_content DECIMAL(4,2) DEFAULT 0, -- 酒精濃度
  ingredients TEXT[] DEFAULT '{}', -- 成分陣列
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_base_spirit CHECK (
    base_spirit IS NULL OR 
    base_spirit IN ('gin', 'whisky', 'whiskey', 'rum', 'tequila', 'vodka', 'brandy', 'others')
  )
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
DROP TRIGGER IF EXISTS update_tables_updated_at ON tables;
CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_orders_table_number ON orders(table_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_base_spirit ON menu_items(base_spirit);
CREATE INDEX IF NOT EXISTS idx_menu_items_alcohol_content ON menu_items(alcohol_content);

-- 清空現有資料（如果需要重新開始）
-- TRUNCATE TABLE orders, menu_items, tables RESTART IDENTITY CASCADE;

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
(12, '位 12', '{"x": 650, "y": 350}', 'available', 0)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  status = EXCLUDED.status,
  customers = EXCLUDED.customers;

-- 插入預設酒單項目（調酒項目）
-- 使用較小的 ID 值確保相容性
INSERT INTO menu_items (id, name, price, category, base_spirit, description, alcohol_content, ingredients) VALUES
-- 經典調酒 - Whisky/Whiskey 基酒
(101, 'Old Fashioned', 150, '經典調酒', 'whisky', '威士忌、糖、苦精、橙皮', 40.0, ARRAY['威士忌', '糖', '苦精', '橙皮']),
(102, 'Manhattan', 150, '經典調酒', 'whisky', '威士忌、甜苦艾酒、苦精', 35.0, ARRAY['威士忌', '甜苦艾酒', '苦精']),
(105, 'Whiskey Sour', 150, '經典調酒', 'whisky', '威士忌、檸檬汁、糖漿、蛋白', 25.0, ARRAY['威士忌', '檸檬汁', '糖漿', '蛋白']),
-- 經典調酒 - Gin 基酒
(103, 'Negroni', 150, '經典調酒', 'gin', '琴酒、甜苦艾酒、金巴利', 28.0, ARRAY['琴酒', '甜苦艾酒', '金巴利']),
(104, 'Martini', 150, '經典調酒', 'gin', '琴酒、乾苦艾酒、橄欖或檸檬皮', 42.0, ARRAY['琴酒', '乾苦艾酒', '橄欖', '檸檬皮']),
(106, 'Gimlet', 150, '經典調酒', 'gin', '琴酒、萊姆汁、糖漿', 30.0, ARRAY['琴酒', '萊姆汁', '糖漿']),
-- 經典調酒 - Rum 基酒
(107, 'Daiquiri', 150, '經典調酒', 'rum', '蘭姆酒、萊姆汁、糖漿', 25.0, ARRAY['蘭姆酒', '萊姆汁', '糖漿']),
-- 經典調酒 - Tequila 基酒
(108, 'Margarita', 150, '經典調酒', 'tequila', '龍舌蘭、柑橘酒、萊姆汁', 22.0, ARRAY['龍舌蘭', '柑橘酒', '萊姆汁']),
-- 經典調酒 - Vodka 基酒
(109, 'Cosmopolitan', 150, '經典調酒', 'vodka', '伏特加、柑橘酒、蔓越莓汁、萊姆汁', 20.0, ARRAY['伏特加', '柑橘酒', '蔓越莓汁', '萊姆汁']),
(110, 'Moscow Mule', 150, '經典調酒', 'vodka', '伏特加、薑汁汽水、萊姆汁', 15.0, ARRAY['伏特加', '薑汁汽水', '萊姆汁']),
-- Signature 調酒（混合基酒或特殊配方）
(201, '招牌特調', 180, 'Signature', 'others', '本店獨家配方', 25.0, ARRAY['秘密配方']),
(202, '金色黃昏', 200, 'Signature', 'whisky', '威士忌、蜂蜜、檸檬、薑汁', 28.0, ARRAY['威士忌', '蜂蜜', '檸檬', '薑汁']),
(203, '紫羅蘭之夢', 190, 'Signature', 'gin', '琴酒、薰衣草、柚子、蘇打', 22.0, ARRAY['琴酒', '薰衣草', '柚子', '蘇打']),
-- Mocktail 無酒精調酒（無基酒）
(301, 'Virgin Mojito', 80, 'Mocktail', NULL, '薄荷、萊姆、蘇打水', 0.0, ARRAY['薄荷', '萊姆', '蘇打水']),
(302, 'Shirley Temple', 80, 'Mocktail', NULL, '薑汁汽水、紅石榴糖漿、櫻桃', 0.0, ARRAY['薑汁汽水', '紅石榴糖漿', '櫻桃']),
(303, '熱帶風情', 90, 'Mocktail', NULL, '鳳梨汁、椰漿、萊姆、薄荷', 0.0, ARRAY['鳳梨汁', '椰漿', '萊姆', '薄荷'])
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  base_spirit = EXCLUDED.base_spirit,
  description = EXCLUDED.description,
  alcohol_content = EXCLUDED.alcohol_content,
  ingredients = EXCLUDED.ingredients;

-- 驗證資料表建立成功
SELECT 'Cocktail Bar Database setup completed successfully!' as status;

-- 檢查約束是否正確設定
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE contype = 'c' 
AND conrelid::regclass::text IN ('orders', 'tables', 'menu_items');

-- 檢查資料是否插入成功
SELECT 'Bar Seats:' as info, COUNT(*) as count FROM tables
UNION ALL
SELECT 'Cocktail Menu Items:' as info, COUNT(*) as count FROM menu_items
UNION ALL
SELECT 'Categories:' as info, COUNT(DISTINCT category) as count FROM menu_items;

-- 顯示各分類和基酒的調酒數量
SELECT 
    category as "分類",
    COALESCE(base_spirit, 'None') as "基酒",
    COUNT(*) as "品項數量",
    ROUND(AVG(price), 0) as "平均價格",
    ROUND(AVG(alcohol_content), 1) as "平均酒精濃度%"
FROM menu_items 
GROUP BY category, base_spirit
ORDER BY category, base_spirit NULLS LAST;