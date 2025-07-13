# Notion Database 設定指南 - 問題排解

## 🚨 常見連接問題

### 1. Token 認證問題
**症狀**: 401 Unauthorized 錯誤
**解決方案**:
- 確認 Token 格式正確 (以 `ntn_` 開頭)
- 檢查 Token 是否已過期
- 重新生成 Integration Token

### 2. Database 權限問題  
**症狀**: 404 Not Found 錯誤
**解決方案**:
- 確認 Database ID 正確
- **重要**: 必須將 Database 分享給 Integration

### 如何正確分享 Database:
1. 在 Notion 中開啟您的 Database
2. 點擊右上角的 `...` (More) 按鈕
3. 選擇 `+ Add connections`
4. 搜尋您的 Integration 名稱
5. 點擊選擇並確認權限

### 3. Database 結構問題
**症狀**: Validation 錯誤
**建議的 Database 欄位結構**:

| 欄位名稱 | 類型 | 說明 |
|---------|------|------|
| **Name** | Title | 訂單標題 (必需) |
| **Table** | Number | 桌號 |
| **Customers** | Number | 人數 |
| **Total** | Number | 總金額 |
| **Status** | Select | 訂單狀態 |
| **Created** | Date | 建立時間 |
| **Items** | Text | 訂單項目 |

### Status 選項設定:
請在 Status 欄位中添加以下選項:
- `pending` (待處理)
- `preparing` (製作中) 
- `ready` (已完成)
- `completed` (已結帳)

## 🛠️ 設定步驟

### 步驟 1: 檢查 Integration 設定
1. 前往 [Notion Integrations](https://www.notion.com/my-integrations)
2. 確認您的 Integration 有以下權限:
   - ✅ Read content
   - ✅ Update content  
   - ✅ Insert content

### 步驟 2: 檢查 Database ID
您的 Database URL: https://www.notion.so/22f2c142afa9807b896ad1c1d3cf315b
Database ID: `22f2c142afa9807b896ad1c1d3cf315b`

### 步驟 3: 使用診斷工具
1. 開啟 `notion-diagnostic.html`
2. 依序執行所有測試
3. 根據錯誤訊息進行修正

## 🔧 快速修復腳本

如果您的 Database 結構不正確，可以：

1. **選項 A**: 重新建立 Database
   - 在 Notion 中建立新的 Database
   - 按照上述結構添加欄位
   - 更新系統中的 Database ID

2. **選項 B**: 修改現有 Database
   - 在現有 Database 中添加缺少的欄位
   - 確認欄位類型正確
   - 為 Select 欄位添加必要選項

## 📝 測試流程

1. **基本認證測試**
   ```
   GET https://api.notion.com/v1/users/me
   ```

2. **Database 存取測試**
   ```
   GET https://api.notion.com/v1/databases/22f2c142afa9807b896ad1c1d3cf315b
   ```

3. **建立頁面測試**
   ```
   POST https://api.notion.com/v1/pages
   ```

## 💡 除錯建議

- 開啟瀏覽器 Console 查看詳細錯誤訊息
- 使用 `notion-diagnostic.html` 工具進行系統性測試
- 確認網路連接正常
- 檢查是否有防火牆或代理伺服器阻擋

## 📞 獲得協助

如果問題持續存在：
1. 複製診斷工具的完整錯誤訊息
2. 截圖您的 Notion Database 結構
3. 確認 Integration 權限設定
4. 檢查 Notion API 狀態: https://status.notion.so/