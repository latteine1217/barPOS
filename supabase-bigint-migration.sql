-- 🔧 Supabase BIGINT 修復腳本
-- 解決 "value is out of range for type integer" 錯誤
-- 將所有 ID 欄位從 INTEGER 升級為 BIGINT 以支援時間戳 ID
-- 並添加基酒分類功能

-- ⚠️  警告：執行前請先備份您的資料！
-- ⚠️  建議在維護時間執行此腳本

BEGIN;

DO $$ 
BEGIN
    RAISE NOTICE '🔧 開始 BIGINT 遷移修復...';
    
    -- 1. 檢查並修復 tables 表的 ID 類型
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tables' AND column_name = 'id' AND data_type = 'integer'
    ) THEN
        RAISE NOTICE '修復 tables.id 欄位...';
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_table_id_fkey;
        ALTER TABLE tables ALTER COLUMN id TYPE BIGINT;
        ALTER TABLE orders ALTER COLUMN table_id TYPE BIGINT;
        ALTER TABLE orders ADD CONSTRAINT orders_table_id_fkey 
            FOREIGN KEY (table_id) REFERENCES tables(id);
        RAISE NOTICE '✅ tables.id 已升級為 BIGINT';
    ELSE
        RAISE NOTICE '✅ tables.id 已經是正確類型';
    END IF;
    
    -- 2. 檢查並修復 menu_items 表的 ID 類型
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menu_items' AND column_name = 'id' AND data_type = 'integer'
    ) THEN
        RAISE NOTICE '修復 menu_items.id 欄位...';
        ALTER TABLE menu_items ALTER COLUMN id TYPE BIGINT;
        RAISE NOTICE '✅ menu_items.id 已升級為 BIGINT';
    ELSE
        RAISE NOTICE '✅ menu_items.id 已經是正確類型';
    END IF;
    
    -- 3. 檢查並添加 base_spirit 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menu_items' AND column_name = 'base_spirit'
    ) THEN
        RAISE NOTICE '添加 base_spirit 欄位...';
        ALTER TABLE menu_items ADD COLUMN base_spirit VARCHAR(20) DEFAULT NULL;
        ALTER TABLE menu_items ADD CONSTRAINT valid_base_spirit CHECK (
            base_spirit IS NULL OR 
            base_spirit IN ('gin', 'whisky', 'whiskey', 'rum', 'tequila', 'vodka', 'brandy', 'others')
        );
        CREATE INDEX IF NOT EXISTS idx_menu_items_base_spirit ON menu_items(base_spirit);
        RAISE NOTICE '✅ base_spirit 欄位已添加';
    ELSE
        RAISE NOTICE '✅ base_spirit 欄位已經存在';
    END IF;
    
    RAISE NOTICE '🎉 BIGINT 遷移修復完成！';
    RAISE NOTICE '現在您可以正常使用菜單項目同步功能和基酒分類了。';
    
END $$;

COMMIT;

-- 驗證修復結果
SELECT 
    table_name as "資料表",
    column_name as "欄位",
    data_type as "資料類型",
    CASE 
        WHEN column_name IN ('id', 'table_id') AND data_type = 'bigint' THEN '✅ 正確'
        WHEN column_name IN ('id', 'table_id') AND data_type = 'integer' THEN '❌ 需要修復'
        WHEN column_name = 'base_spirit' AND data_type = 'character varying' THEN '✅ 正確'
        ELSE '⚠️  其他'
    END as "狀態"
FROM information_schema.columns 
WHERE table_name IN ('tables', 'menu_items', 'orders') 
    AND column_name IN ('id', 'table_id', 'base_spirit')
ORDER BY table_name, column_name;