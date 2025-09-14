-- 調酒酒吧 POS 系統 v3.3 遷移腳本（由舊結構升級）
-- 已有資料請執行本檔；全新安裝請改用 `supabase/setup_v3_3.sql`

-- ===== tables 表 遷移 =====
DO $$
BEGIN
  -- 新增 number 欄位（用於前端 tableNumber），預設以 id 填入
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='tables' AND column_name='number'
  ) THEN
    ALTER TABLE public.tables ADD COLUMN number INTEGER;
    UPDATE public.tables SET number = id WHERE number IS NULL;
  END IF;

  -- 新增 max_capacity、order_id、position 欄位（若不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='tables' AND column_name='max_capacity'
  ) THEN
    ALTER TABLE public.tables ADD COLUMN max_capacity INTEGER DEFAULT 4;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='tables' AND column_name='order_id'
  ) THEN
    ALTER TABLE public.tables ADD COLUMN order_id VARCHAR(64);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='tables' AND column_name='position'
  ) THEN
    ALTER TABLE public.tables ADD COLUMN position JSONB DEFAULT '{"x":0,"y":0}';
  END IF;
END$$;

-- 建立索引（若不存在）
CREATE INDEX IF NOT EXISTS idx_tables_number ON public.tables(number);
CREATE INDEX IF NOT EXISTS idx_tables_status ON public.tables(status);

-- ===== orders 表 遷移 =====
DO $$
BEGIN
  -- 對齊前端命名：table_number、customers、total/subtotal/tax/discount、notes、completed_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='table_number'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN table_number INTEGER;
    -- 舊欄位 table_id → table_number（若存在）
    IF EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='table_id'
    ) THEN
      UPDATE public.orders SET table_number = table_id WHERE table_number IS NULL;
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customers') THEN
    ALTER TABLE public.orders ADD COLUMN customers INTEGER DEFAULT 1;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_count') THEN
      UPDATE public.orders SET customers = COALESCE(customer_count, 1);
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='total') THEN
    ALTER TABLE public.orders ADD COLUMN total NUMERIC(10,2) DEFAULT 0;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='total_amount') THEN
      UPDATE public.orders SET total = COALESCE(total_amount, 0);
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='subtotal') THEN
    ALTER TABLE public.orders ADD COLUMN subtotal NUMERIC(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='tax') THEN
    ALTER TABLE public.orders ADD COLUMN tax NUMERIC(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='discount') THEN
    ALTER TABLE public.orders ADD COLUMN discount NUMERIC(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='notes') THEN
    ALTER TABLE public.orders ADD COLUMN notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='completed_at') THEN
    ALTER TABLE public.orders ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_orders_table_number ON public.orders(table_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- ===== menu_items 表 遷移 =====
DO $$
BEGIN
  -- 將 id 轉為字串型別（若目前為 integer）
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='menu_items' AND column_name='id' AND data_type IN ('integer','bigint','smallint')
  ) THEN
    ALTER TABLE public.menu_items ALTER COLUMN id TYPE VARCHAR(64) USING id::text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_items' AND column_name='available') THEN
    ALTER TABLE public.menu_items ADD COLUMN available BOOLEAN DEFAULT true;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_items' AND column_name='is_available') THEN
      UPDATE public.menu_items SET available = COALESCE(is_available, true);
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_items' AND column_name='category') THEN
    ALTER TABLE public.menu_items ADD COLUMN category VARCHAR(50) DEFAULT 'cocktails';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_items' AND column_name='base_spirit') THEN
    ALTER TABLE public.menu_items ADD COLUMN base_spirit VARCHAR(32);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_items' AND column_name='ingredients') THEN
    ALTER TABLE public.menu_items ADD COLUMN ingredients JSONB DEFAULT '[]';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_items' AND column_name='alcohol_content') THEN
    ALTER TABLE public.menu_items ADD COLUMN alcohol_content NUMERIC(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_items' AND column_name='cost') THEN
    ALTER TABLE public.menu_items ADD COLUMN cost NUMERIC(10,2);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(available);

-- 觸發器（若不存在）
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_tables_updated_at') THEN
    CREATE TRIGGER trg_tables_updated_at BEFORE UPDATE ON public.tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_orders_updated_at') THEN
    CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_menu_items_updated_at') THEN
    CREATE TRIGGER trg_menu_items_updated_at BEFORE UPDATE ON public.menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END$$;

-- 驗證輸出
SELECT 'Migration to v3.3 completed' AS status;
