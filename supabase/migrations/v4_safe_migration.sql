-- v4.0 Safe Migration Script for Cocktail Bar POS
-- Goal: align DB schema with app code and add members table.
-- Characteristics: additive and non-destructive; uses IF NOT EXISTS checks.

-- 1) Utility: upsert updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Tables: ensure required columns exist
-- 2.1 tables
CREATE TABLE IF NOT EXISTS public.tables (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  position JSONB DEFAULT '{"x":0,"y":0}',
  status TEXT DEFAULT 'available',
  customers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- add columns used by app if missing
ALTER TABLE public.tables
  ADD COLUMN IF NOT EXISTS number INTEGER,
  ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS order_id TEXT;

-- helpful index for lookups by number
CREATE UNIQUE INDEX IF NOT EXISTS idx_tables_number ON public.tables(number);

-- trigger
DROP TRIGGER IF EXISTS update_tables_updated_at ON public.tables;
CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON public.tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2.2 orders
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- align columns to app code (additive)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS table_number INTEGER,
  ADD COLUMN IF NOT EXISTS table_name TEXT,
  ADD COLUMN IF NOT EXISTS customers INTEGER,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- indexes
CREATE INDEX IF NOT EXISTS idx_orders_table_number ON public.orders(table_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- trigger
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2.3 menu_items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(8,2) NOT NULL,
  category TEXT DEFAULT '經典調酒',
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- add/normalize columns used by app
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS base_spirit TEXT,
  ADD COLUMN IF NOT EXISTS ingredients JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS alcohol_content NUMERIC(4,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost NUMERIC(8,2);

-- migrate legacy is_available -> available if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'is_available'
  ) THEN
    EXECUTE 'UPDATE public.menu_items SET available = COALESCE(available, is_available)';
    -- keep old column to avoid breaking other clients; drop only if you are sure
    -- EXECUTE 'ALTER TABLE public.menu_items DROP COLUMN is_available';
  END IF;
END $$;

-- convert ingredients text[] -> jsonb if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'ingredients' AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.menu_items
      ALTER COLUMN ingredients TYPE JSONB USING to_jsonb(ingredients);
  END IF;
END $$;

-- trigger
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON public.menu_items;
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_base_spirit ON public.menu_items(base_spirit);

-- 3) members table (new in v4)
CREATE TABLE IF NOT EXISTS public.members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cups INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_members_updated_at ON public.members;
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4) sanity checks (optional)
-- SELECT 'v4 migration applied' AS status;
