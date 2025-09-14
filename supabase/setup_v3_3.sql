-- 調酒酒吧 POS 系統 Supabase 資料庫建立腳本（v3.3 對齊版）
-- 在 Supabase SQL Editor 執行本腳本即可完成資料表結構與預設資料

-- 可選：先清除舊表（如為首次安裝請忽略）。請小心操作！
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS tables CASCADE;
-- DROP TABLE IF EXISTS menu_items CASCADE;

-- === 座位資料表（與程式使用的欄位名稱對齊） ===
CREATE TABLE IF NOT EXISTS tables (
  id           INTEGER PRIMARY KEY,
  number       INTEGER NOT NULL,               -- 座位編號（程式使用）
  name         VARCHAR(100) NOT NULL,          -- 顯示名稱
  status       VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available','occupied','reserved','cleaning')),
  customers    INTEGER DEFAULT 0,
  max_capacity INTEGER DEFAULT 4,
  position     JSONB    DEFAULT '{"x":0, "y":0}',
  order_id     VARCHAR(64),                    -- 目前關聯中的訂單（可為空）
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tables_number ON tables(number);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);

-- === 訂單資料表（與程式使用的欄位名稱對齊） ===
CREATE TABLE IF NOT EXISTS orders (
  id           VARCHAR(64) PRIMARY KEY,        -- 前端產生（字串）
  table_number INTEGER,                        -- 對齊程式的 tableNumber
  table_name   VARCHAR(100),
  items        JSONB       DEFAULT '[]',       -- 訂單明細（JSON 陣列）
  total        NUMERIC(10,2) DEFAULT 0,
  subtotal     NUMERIC(10,2) DEFAULT 0,
  tax          NUMERIC(10,2) DEFAULT 0,
  discount     NUMERIC(10,2) DEFAULT 0,
  status       VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending','preparing','ready','completed','paid','cancelled')),
  customers    INTEGER      DEFAULT 1,
  notes        TEXT,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_table_number ON orders(table_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- === 酒單資料表（與程式使用的欄位名稱對齊） ===
CREATE TABLE IF NOT EXISTS menu_items (
  id             VARCHAR(64) PRIMARY KEY,     -- 程式端使用字串 ID（如 '101'）
  name           VARCHAR(100) NOT NULL,
  category       VARCHAR(50)  DEFAULT 'cocktails',
  base_spirit    VARCHAR(32),                 -- whiskey/gin/rum/tequila/vodka/brandy/liqueur/none
  price          NUMERIC(10,2) NOT NULL,
  cost           NUMERIC(10,2),               -- 選填：成本（v3.3 新增，前端目前不強制上傳）
  description    TEXT       DEFAULT '',
  image_url      VARCHAR(255) DEFAULT '',
  available      BOOLEAN    DEFAULT true,
  ingredients    JSONB      DEFAULT '[]',      -- 材料（選填）
  alcohol_content NUMERIC(5,2),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);

-- === 觸發器：自動更新 updated_at ===
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tables_updated_at'
  ) THEN
    CREATE TRIGGER trg_tables_updated_at
      BEFORE UPDATE ON tables
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_orders_updated_at'
  ) THEN
    CREATE TRIGGER trg_orders_updated_at
      BEFORE UPDATE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_menu_items_updated_at'
  ) THEN
    CREATE TRIGGER trg_menu_items_updated_at
      BEFORE UPDATE ON menu_items
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END$$;

-- === 預設資料（可依需要調整） ===
-- 座位（12 桌）
INSERT INTO tables (id, number, name, status, customers, max_capacity, position)
VALUES
  (1, 1,  '位 1',  'available', 0, 4, '{"x":50,  "y":50 }'),
  (2, 2,  '位 2',  'available', 0, 4, '{"x":250, "y":50 }'),
  (3, 3,  '位 3',  'available', 0, 4, '{"x":450, "y":50 }'),
  (4, 4,  '位 4',  'available', 0, 4, '{"x":650, "y":50 }'),
  (5, 5,  '位 5',  'available', 0, 4, '{"x":50,  "y":200}'),
  (6, 6,  '位 6',  'available', 0, 4, '{"x":250, "y":200}'),
  (7, 7,  '位 7',  'available', 0, 4, '{"x":450, "y":200}'),
  (8, 8,  '位 8',  'available', 0, 4, '{"x":650, "y":200}'),
  (9, 9,  '位 9',  'available', 0, 4, '{"x":50,  "y":350}'),
  (10,10, '位 10', 'available', 0, 4, '{"x":250, "y":350}'),
  (11,11, '位 11', 'available', 0, 4, '{"x":450, "y":350}'),
  (12,12, '位 12', 'available', 0, 4, '{"x":650, "y":350}')
ON CONFLICT (id) DO NOTHING;

-- 酒單（對齊前端預設清單）
INSERT INTO menu_items (id, name, price, category, base_spirit, description, available)
VALUES
('101','Old Fashioned',150,'cocktails','whiskey','威士忌、糖、苦精、橙皮',true),
('102','Manhattan',150,'cocktails','whiskey','威士忌、甜苦艾酒、苦精',true),
('105','Whiskey Sour',150,'cocktails','whiskey','威士忌、檸檬汁、糖漿、蛋白',true),
('103','Negroni',150,'cocktails','gin','琴酒、甜苦艾酒、金巴利',true),
('104','Martini',150,'cocktails','gin','琴酒、乾苦艾酒、橄欖或檸檬皮',true),
('106','Gimlet',150,'cocktails','gin','琴酒、萊姆汁、糖漿',true),
('107','Daiquiri',150,'cocktails','rum','蘭姆酒、萊姆汁、糖漿',false),
('108','Margarita',150,'cocktails','tequila','龍舌蘭、柑橘酒、萊姆汁',true),
('109','Cosmopolitan',150,'cocktails','vodka','伏特加、柑橘酒、蔓越莓汁、萊姆汁',true),
('110','Moscow Mule',150,'cocktails','vodka','伏特加、薑汁汽水、萊姆汁',true),
('111','Sidecar',150,'cocktails','brandy','干邑白蘭地、柑橘酒、檸檬汁',true),
('112','B-52',150,'cocktails','liqueur','咖啡利口酒、愛爾蘭奶酒、伏特加',true),
('113','Amaretto Sour',150,'cocktails','liqueur','杏仁利口酒、檸檬汁、糖漿',true),
('114','Mudslide',150,'cocktails','liqueur','咖啡利口酒、愛爾蘭奶酒、鮮奶油',true),
('201','招牌特調',180,'cocktails','liqueur','本店獨家配方',true),
('202','金色黃昏',200,'cocktails','whiskey','威士忌、蜂蜜、檸檬、薑汁',true),
('203','紫羅蘭之夢',190,'cocktails','gin','琴酒、薰衣草、柚子、蘇打',true),
('301','Virgin Mojito',80,'mocktails','none','薄荷、萊姆、蘇打水',true),
('302','Shirley Temple',80,'mocktails','none','薑汁汽水、紅石榴糖漿、櫻桃',true),
('303','蘋果氣泡飲',70,'mocktails','none','蘋果汁、薑汁汽水、檸檬',true)
ON CONFLICT (id) DO NOTHING;

-- === 驗證 ===
SELECT 'Database setup completed successfully!' AS status;
SELECT 'Tables count' AS info, COUNT(*) AS count FROM tables
UNION ALL
SELECT 'Menu items count' AS info, COUNT(*) FROM menu_items;

