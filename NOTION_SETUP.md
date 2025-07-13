# Notion 設定指南

## 快速設定您的餐廳管理系統

您的 Notion Database ID 已經預設為：`31054bbd0e004118b6540645d872fd8f`

### 步驟 1：建立 Notion Integration

1. 前往 [Notion Developers](https://www.notion.so/my-integrations)
2. 點擊 **"+ New integration"**
3. 填寫基本資訊：
   - **Name**: 餐廳管理系統
   - **Logo**: 可選
   - **Associated workspace**: 選擇您的工作區
4. 在 **Capabilities** 部分選擇：
   - ✅ Read content
   - ✅ Update content
   - ✅ Insert content
5. 點擊 **"Submit"**
6. 複製 **"Internal Integration Token"**（以 `secret_` 開頭）

### 步驟 2：設定 Database 權限

1. 前往您的 [Notion Database](https://www.notion.so/31054bbd0e004118b6540645d872fd8f?v=d274d743dfe54ff79996628aa9f3e9a9)
2. 點擊右上角的 **"..."** (More) 按鈕
3. 選擇 **"+ Add connections"**
4. 搜尋並選擇您剛才建立的 **"餐廳管理系統"** integration
5. 點擊 **"Confirm"**

### 步驟 3：確認 Database 結構

請確保您的 Notion Database 包含以下欄位：

| 欄位名稱 | 類型 | 說明 |
|---------|------|------|
| **訂單編號** | Title | 主要識別欄位 |
| **桌號** | Number | 桌位編號 |
| **人數** | Number | 用餐人數 |
| **總額** | Number | 訂單金額 |
| **狀態** | Select | pending, preparing, ready, completed |
| **建立時間** | Date | 訂單建立時間 |
| **項目** | Rich text | 訂購項目詳情（可選） |

### 步驟 4：在系統中設定

1. 開啟餐廳管理系統
2. 點擊左側選單的 **"設定"**
3. 在 **"Notion Integration Token"** 欄位貼上您的 token
4. **"Database ID"** 已經預設填入，無需修改
5. 點擊 **"儲存設定"**
6. 系統會自動測試連接

### 疑難排解

#### 🔴 連接失敗
- 檢查 Integration Token 是否正確複製
- 確認 Database 已經分享給 Integration
- 驗證 Database ID 格式正確

#### 🔴 無法寫入資料
- 確認 Integration 具有 "Insert content" 權限
- 檢查 Database 欄位名稱是否與系統要求一致

#### 🔴 欄位不匹配
如果您的 Database 欄位名稱不同，可以修改 `app.js` 中的對應設定：

```javascript
// 在 syncOrderToNotion 函數中修改欄位對應
properties: {
    '您的欄位名稱': {  // 修改為您實際的欄位名稱
        title: [{ text: { content: order.id } }]
    },
    // ... 其他欄位
}
```

### 測試資料同步

1. 在系統中新增一筆測試訂單
2. 檢查 Notion Database 是否出現新記錄
3. 確認所有欄位資料正確同步

### 支援

如果遇到問題：
1. 檢查瀏覽器 Console 的錯誤訊息
2. 確認網路連線正常
3. 參考 [Notion API 文件](https://developers.notion.com/)

---

**恭喜！** 您的餐廳管理系統現在已經與 Notion 完全整合，可以開始管理您的餐廳營運了！