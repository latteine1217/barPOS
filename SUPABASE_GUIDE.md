# Supabase 設定指南

本指南將幫助你將餐廳 POS 系統從 Notion API 遷移到 Supabase 雲端資料庫。

## 🎯 為什麼選擇 Supabase？

相比 Notion，Supabase 提供：
- **即時同步**: WebSocket 連線，多裝置即時更新
- **真正的資料庫**: PostgreSQL，支援複雜查詢和關聯
- **更好的效能**: 專為應用程式設計的 API
- **離線優先**: 完整的離線模式支援
- **成本效益**: 慷慨的免費額度

## 🚀 快速開始

### 步驟 1: 建立 Supabase 專案

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 點擊 "New Project"
3. 設定專案資訊：
   - **Project name**: `restaurant-pos`
   - **Database Password**: 設定安全密碼
   - **Region**: 選擇 Asia Pacific
4. 點擊 "Create new project"

### 步驟 2: 設定資料庫

在 **SQL Editor** 中執行以下 SQL：

```sql
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

-- 建立訂單資料表
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

-- 建立更新時間觸發器
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

-- 建立索引
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

-- 插入預設菜單項目
INSERT INTO menu_items (id, name, price, category) VALUES
(1, '招牌牛肉麵', 180, '主食'),
(2, '蔥爆牛肉', 220, '主食'),
(3, '宮保雞丁', 160, '主食'),
(4, '麻婆豆腐', 120, '主食'),
(5, '可樂', 30, '飲料'),
(6, '熱茶', 20, '飲料');
```

### 步驟 3: 取得 API 資訊

1. 前往 **Settings → API**
2. 複製以下資訊：
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

⚠️ **重要**: 使用 `anon public` key，不是 `service_role` key！

### 步驟 4: 在應用中設定

1. 啟動應用程式並前往「設定」頁面
2. 選擇「🚀 Supabase (推薦)」標籤
3. 填入 Project URL 和 API Key
4. 點擊「測試連接」確認設定正確
5. 點擊「保存設定」

## 📊 資料同步

### 從本地上傳到 Supabase

如果你已有本地資料，可以使用「上傳資料」功能：

1. 前往設定頁面
2. 在「資料管理」區塊點擊「上傳資料」
3. 系統會自動同步所有訂單、桌位和菜單資料

### 從 Supabase 下載到本地

從其他裝置同步資料：

1. 前往設定頁面
2. 點擊「下載資料」
3. 系統會從雲端下載最新資料

## 🔄 即時同步功能

Supabase 提供即時同步功能，當其他裝置進行操作時，你的裝置會自動更新：

- 新增訂單 → 所有裝置即時顯示
- 更新桌位狀態 → 即時同步
- 修改菜單 → 立即反映

## 🔐 安全性設定

目前使用公開存取模式以簡化設定。如需要更高安全性，可以設定：

### Row Level Security (RLS)

1. 前往 **Authentication → Policies**
2. 啟用 RLS
3. 建立適當的存取規則

### 使用者認證

可以整合 Supabase Auth 進行使用者管理：

```javascript
// 範例：啟用使用者認證
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
})
```

## 🚫 疑難排解

### 連接失敗

1. **檢查 URL 格式**: 必須是 `https://your-project.supabase.co`
2. **確認 API Key**: 使用 anon public key，不是 service_role
3. **網路問題**: 確認網路連線正常

### 資料同步問題

1. **權限檢查**: 確認資料表權限設定正確
2. **資料格式**: 檢查本地資料是否符合資料庫 schema
3. **衝突解決**: 如有衝突，優先使用雲端資料

### 效能問題

1. **索引優化**: 已建立基本索引，如需要可新增更多
2. **查詢優化**: 使用分頁查詢處理大量資料
3. **連線池**: Supabase 自動管理連線池

## 📈 監控與分析

### Supabase Dashboard

使用 Supabase Dashboard 監控：

1. **Database → Tables**: 查看資料表內容
2. **Logs**: 監控 API 使用情況
3. **Settings → Usage**: 查看用量統計

### 本地監控

應用程式提供：

- 即時統計數據
- 訂單歷史記錄
- 系統狀態監控

## 🔄 從 Notion 遷移

如果你之前使用 Notion：

1. 在設定中切換到「📝 Notion (舊版)」
2. 使用「同步訂單」匯出現有資料
3. 切換回「🚀 Supabase (推薦)」
4. 使用「上傳資料」將資料匯入 Supabase

## 💡 最佳實踐

1. **定期備份**: 雖然 Supabase 提供備份，建議定期匯出重要資料
2. **監控用量**: 注意 API 請求數量，避免超出免費額度
3. **優化查詢**: 使用適當的篩選和分頁減少資料傳輸
4. **測試環境**: 建議設定測試專案進行開發測試

## 📞 支援

如遇到問題：

1. **Supabase 文檔**: [https://supabase.com/docs](https://supabase.com/docs)
2. **社群支援**: [Discord](https://discord.supabase.com/)
3. **GitHub Issues**: 在專案儲存庫建立 Issue

---

🎉 恭喜！你的餐廳 POS 系統現在已升級為專業級的雲端資料庫解決方案！