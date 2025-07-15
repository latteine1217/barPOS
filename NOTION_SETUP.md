# Notion 整合設定指南

> **開發工具**: 本專案使用 [opencode](https://opencode.ai) + GitHub Copilot 進行 AI 輔助開發

## 🚀 快速開始

本指南將協助您設定 Notion 整合，讓餐廳管理系統能夠自動將訂單資料同步到您的 Notion 工作區。

## 📋 設定前準備

### 系統需求
- Notion 帳號（個人或工作區）
- 網路連線
- 現代瀏覽器（Chrome 88+、Firefox 85+、Safari 14+）

### 預估設定時間
約 10-15 分鐘完成完整設定

## 步驟 1：建立 Notion Integration

### 1.1 前往 Notion Developers
1. 開啟瀏覽器，前往 [Notion Developers](https://www.notion.so/my-integrations)
2. 使用您的 Notion 帳號登入

### 1.2 建立新的 Integration
1. 點擊 **"+ New integration"** 按鈕
2. 填寫基本資訊：
   - **Name**: `餐廳管理系統` 或您偏好的名稱
   - **Logo**: 可選擇上傳 Logo 或使用預設
   - **Associated workspace**: 選擇您要使用的 Notion 工作區

### 1.3 設定權限
在 **Capabilities** 部分，請確保勾選以下權限：
- ✅ **Read content** - 讀取內容權限
- ✅ **Update content** - 更新內容權限  
- ✅ **Insert content** - 新增內容權限

> ⚠️ **重要**: 必須勾選所有三個權限，系統才能正常運作

### 1.4 完成建立
1. 點擊 **"Submit"** 提交
2. 建立成功後，複製 **"Internal Integration Token"**
3. Token 格式應為：`secret_xxxxxxxxxx...`

> 💡 **提示**: 請妥善保管這個 Token，它是您的系統與 Notion 連接的金鑰

## 步驟 2：建立 Notion Database

### 2.1 建立新的 Database
1. 在您的 Notion 工作區中，建立一個新頁面
2. 在頁面中輸入 `/database` 並選擇 **"Table"**
3. 將 Database 命名為 `餐廳訂單管理` 或您偏好的名稱

### 2.2 設定 Database 欄位
請確保您的 Database 包含以下欄位（欄位名稱必須完全一致）：

| 欄位名稱 | 欄位類型 | 必要性 | 說明 |
|---------|---------|--------|------|
| **Name** | Title | 必須 | 訂單編號或標題 |
| **桌號** | Number | 建議 | 桌位編號 |
| **人數** | Number | 建議 | 用餐人數 |
| **總額** | Number | 建議 | 訂單總金額 |
| **狀態** | Select | 建議 | 訂單狀態 |
| **建立時間** | Date | 建議 | 訂單建立時間 |
| **項目** | Rich text | 可選 | 訂購項目詳情 |

### 2.3 設定狀態選項
對於 **狀態** 欄位，請新增以下選項：
- `pending` - 待處理
- `preparing` - 製作中  
- `ready` - 已完成
- `completed` - 已結帳

> 📝 **注意**: 狀態選項名稱請使用英文，系統會自動對應

## 步驟 3：分享 Database 給 Integration

### 3.1 分享權限設定
1. 在您剛建立的 Database 頁面中，點擊右上角的 **"Share"** 按鈕
2. 或點擊右上角的 **"..."** (More) 選單，選擇 **"Add connections"**

### 3.2 新增 Integration 連接
1. 在連接列表中，搜尋您在步驟 1 建立的 Integration 名稱
2. 點擊選擇您的 **"餐廳管理系統"** Integration
3. 點擊 **"Allow access"** 或 **"Confirm"** 確認授權

### 3.3 驗證權限
分享成功後，您應該會在 Database 頁面看到：
- Integration 圖示出現在分享列表中
- 顯示 "Can edit" 權限狀態

## 步驟 4：取得 Database ID

### 4.1 複製 Database URL
1. 在 Database 頁面中，點擊瀏覽器地址欄
2. 複製完整的 URL

### 4.2 提取 Database ID
Database ID 是 URL 中的 32 位字元字串，格式如下：
```
https://www.notion.so/workspace/[32位字元Database ID]?v=[view ID]
```

範例：
```
https://www.notion.so/myworkspace/a1b2c3d4e5f6...xyz?v=...
```
其中 `a1b2c3d4e5f6...xyz` 就是您的 Database ID

> 💡 **簡化方法**: 系統也支援直接貼上完整的 Database URL，會自動提取 ID

## 步驟 5：在系統中完成設定

### 5.1 開啟系統設定頁面
1. 啟動餐廳管理系統
2. 點擊左側選單的 **"設定"** 選項

### 5.2 輸入連接資訊
1. **Notion Integration Token** 欄位：
   - 貼上步驟 1 複製的 Integration Token
   - 確認格式以 `secret_` 開頭

2. **Database ID 或 URL** 欄位：
   - 可以貼上完整的 Database URL
   - 或直接輸入 32 位的 Database ID
   - 系統會自動處理格式

### 5.3 測試連接
1. 點擊 **"測試連接"** 按鈕
2. 系統會自動驗證：
   - Token 是否有效
   - Database 是否可存取
   - 權限是否足夠

### 5.4 儲存設定
1. 確認測試成功後，點擊 **"儲存設定"**
2. 設定會自動儲存到瀏覽器的本地儲存
3. 下次開啟系統時會自動載入設定

## 🎉 設定完成！

恭喜您已完成 Notion 整合設定！現在系統將會：
- ✅ 自動同步所有新訂單到 Notion
- ✅ 即時更新訂單狀態
- ✅ 保持資料同步和備份

## 🧪 測試同步功能

### 建立測試訂單
1. 回到系統首頁
2. 點擊任一空桌開始點餐
3. 選擇幾樣餐點，完成訂單建立
4. 檢查 Notion Database 是否出現新記錄

### 驗證同步內容
確認以下資訊是否正確同步：
- ✅ 訂單編號
- ✅ 桌號和人數  
- ✅ 總金額
- ✅ 訂單狀態
- ✅ 建立時間
- ✅ 餐點項目明細

## ⚠️ 疑難排解

### 常見錯誤與解決方案

#### 🔴 401 錯誤 - 認證失敗
**原因**: Token 無效或格式錯誤
**解決**: 
- 重新檢查 Token 是否以 `secret_` 開頭
- 重新複製 Integration Token
- 確認沒有多餘的空格

#### 🔴 404 錯誤 - Database 不存在  
**原因**: Database ID 錯誤或權限不足
**解決**:
- 重新檢查 Database ID 格式（32位字元）
- 確認 Database 已分享給 Integration
- 重新執行步驟 3 的分享程序

#### 🔴 403 錯誤 - 權限不足
**原因**: Integration 權限不夠
**解決**:
- 確認 Integration 具有所有必要權限
- 重新分享 Database 給 Integration
- 檢查工作區權限設定

#### 🔴 400 錯誤 - 資料格式錯誤
**原因**: Database 欄位設定不正確
**解決**:
- 對照步驟 2.2 檢查欄位名稱和類型
- 確認狀態選項包含必要的值
- 重新建立 Database 欄位

### 自我檢查清單

在尋求支援前，請確認：
- [ ] Integration Token 格式正確（以 `secret_` 開頭）
- [ ] Database ID 為 32 位字元格式
- [ ] Database 已正確分享給 Integration
- [ ] Database 欄位名稱和類型完全符合要求
- [ ] 網路連線正常
- [ ] 瀏覽器支援現代 JavaScript 功能

### 取得更多協助

如果問題仍然存在：
1. 檢查瀏覽器開發者工具的 Console 錯誤訊息
2. 參考 [Notion API 官方文件](https://developers.notion.com/)
3. 確認 Notion 服務狀態是否正常

---

**🎯 設定成功後，您就可以開始享受高效的餐廳管理體驗了！**