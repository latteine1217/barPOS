# 餐廳管理系統 - Restaurant POS

這是一個類似 iChef 功能的餐廳管理系統，整合 Notion API 作為後端資料庫。

## 功能特色

### 🏪 核心功能
- **儀表板** - 即時顯示營收、訂單數量、用餐人數統計
- **訂單管理** - 新增、編輯、更新訂單狀態
- **菜單管理** - 管理菜品資訊、價格、分類
- **桌位管理** - 監控桌位狀態、容納人數
- **營收報表** - 查看營業數據分析
- **Notion 整合** - 資料同步至 Notion 資料庫

### 🎨 使用者介面
- 響應式設計，支援手機、平板、電腦
- 現代化的 UI/UX 設計
- 直觀的操作流程
- 即時狀態更新

### 🔧 技術架構
- **前端**: HTML5, CSS3, Vanilla JavaScript
- **後端**: Notion API
- **資料庫**: Notion Database
- **樣式**: CSS Grid, Flexbox, CSS 動畫
- **圖示**: Font Awesome 6

## 安裝與設定

### 1. 下載專案
```bash
git clone [repository-url]
cd restaurant-pos
```

### 2. 設定 Notion 整合

#### 建立 Notion Integration
1. 前往 [Notion Developers](https://www.notion.so/my-integrations)
2. 點選 "New integration"
3. 填入基本資訊，並選擇適當的權限
4. 複製 "Internal Integration Token"

#### 建立 Notion 資料庫
1. 在 Notion 中建立一個新的資料庫
2. 設定以下欄位：
   - **訂單編號** (Title)
   - **桌號** (Number)
   - **人數** (Number)
   - **總額** (Number)
   - **狀態** (Select: pending, preparing, ready, completed)
   - **建立時間** (Date)

3. 分享資料庫給你的 Integration
4. 複製資料庫 ID (URL 中的 32 字元字串)

### 3. 啟動應用程式
1. 用瀏覽器開啟 `index.html`
2. 進入「設定」頁面
3. 輸入 Notion Integration Token 和 Database ID
4. 點擊「儲存設定」

## 使用說明

### 📊 儀表板
- 查看今日營收、訂單數量、用餐人數
- 快速新增訂單或菜品
- 同步 Notion 資料

### 🧾 訂單管理
- **新增訂單**: 選擇桌號、人數，添加菜品
- **更新狀態**: 待處理 → 製作中 → 已完成 → 已結帳
- **查看詳情**: 檢視訂單內容和總額

### 🍽️ 菜單管理
- **新增菜品**: 設定名稱、價格、分類、描述
- **編輯菜品**: 修改現有菜品資訊
- **刪除菜品**: 移除不再供應的菜品

### 🪑 桌位管理
- **查看狀態**: 空桌、用餐中、已預約
- **快速點餐**: 點擊空桌直接開始點餐
- **容量管理**: 顯示桌位可容納人數

## API 整合

### Notion API 設定
```javascript
const NOTION_API_VERSION = '2022-06-28';
const NOTION_BASE_URL = 'https://api.notion.com/v1';

// 設定認證
headers: {
    'Authorization': `Bearer ${notionToken}`,
    'Notion-Version': NOTION_API_VERSION,
    'Content-Type': 'application/json'
}
```

### 資料同步
- 自動同步訂單資料至 Notion
- 本地儲存設定資訊
- 離線模式支援（使用本地資料）

## 自訂設定

### 修改菜品分類
在 `app.js` 中找到 `getCategoryText` 函數：
```javascript
function getCategoryText(category) {
    const categoryMap = {
        'appetizer': '前菜',
        'main': '主菜',
        'dessert': '甜點',
        'beverage': '飲品'
        // 可新增更多分類
    };
    return categoryMap[category] || category;
}
```

### 調整桌位數量
在 `initializeSampleData` 函數中修改：
```javascript
// 建立 20 個桌位
for (let i = 1; i <= 20; i++) {
    currentData.tables.push({
        id: i.toString(),
        number: i,
        status: 'available',
        capacity: Math.floor(Math.random() * 6) + 2
    });
}
```

## 瀏覽器支援
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 安全性考量
- Notion Token 儲存在 localStorage
- 建議在生產環境使用 HTTPS
- 定期更新 Notion Integration Token

## 疑難排解

### 連接問題
1. 檢查 Notion Token 是否正確
2. 確認 Database ID 格式正確
3. 驗證 Integration 權限設定

### 資料同步問題
1. 確認網路連線狀態
2. 檢查 Notion API 限制
3. 查看瀏覽器 Console 錯誤訊息

## 授權
MIT License

## 聯絡資訊
如有問題或建議，請建立 Issue 或聯絡開發團隊。