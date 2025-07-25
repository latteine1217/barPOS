# 🍸 調酒酒吧風格設計系統

您的調酒酒吧 POS 系統現在擁有了全新的現代化玻璃質感設計！✨

## 🎨 新增設計特色

### 📱 漸變泡泡背景
- **四個動態漸變泡泡**：使用 CSS 變數定義的調酒酒吧主題色彩
- **色彩組合**：
  - 主色：`#ff3366` (熱情紅) + `#3366ff` (深邃藍)
  - 輔助色：`#33ddff` (清新青) + `#ffcc00` (金黃)
  - 成功色：`#22c55e` (翠綠)
- **動畫效果**：20秒無限循環浮動動畫

### 🃏 玻璃質感卡片
- **背景**：`rgba(255, 255, 255, 0.03)` 超透明玻璃效果
- **邊框**：`rgba(255, 255, 255, 0.1)` 細緻光暈邊框
- **陰影**：`0 15px 30px -12px rgba(0, 0, 0, 0.5)` 深度陰影
- **模糊效果**：`backdrop-filter: blur(10px)` 背景模糊
- **互動動畫**：懸停時上浮 4px + 發光效果

### 🔘 調酒酒吧風格按鈕
- **基礎按鈕**：玻璃質感 + 圓角設計
- **主要按鈕**：紅藍漸變 + 發光效果
- **成功按鈕**：綠青漸變
- **警告按鈕**：橙黃漸變
- **危險按鈕**：紅色漸變
- **特效**：點擊時放射光暈動畫

## 🛠 使用方式

### CSS 類別使用

```jsx
// 卡片組件
<div className="cocktail-card">
  <div className="cocktail-card-content">
    <h2>調酒名稱</h2>
    <p>調酒描述</p>
    <div className="cocktail-card-footer">
      <button className="cocktail-button cocktail-button-primary">
        加入購物車
      </button>
      <span className="cocktail-icon">🍸</span>
    </div>
  </div>
</div>

// 按鈕樣式
<button className="cocktail-button">基礎按鈕</button>
<button className="cocktail-button cocktail-button-primary">主要按鈕</button>
<button className="cocktail-button cocktail-button-success">成功按鈕</button>
<button className="cocktail-button cocktail-button-warning">警告按鈕</button>
<button className="cocktail-button cocktail-button-danger">危險按鈕</button>

// 玻璃效果
<div className="glass-card">玻璃卡片</div>
<input className="input-glass" placeholder="玻璃輸入框" />
<div className="modal-glass">玻璃模態框</div>
```

### 工具類別

```jsx
// 發光效果
<div className="glow-primary">主色發光</div>
<div className="glow-secondary">輔助色發光</div>
<div className="glow-success">成功色發光</div>

// 文字漸變
<h1 className="text-gradient-primary">主色漸變文字</h1>
<h2 className="text-gradient-cocktail">調酒漸變文字</h2>
<p className="text-gradient-white">白色漸變文字</p>

// 動畫效果
<div className="animate-float">浮動動畫</div>
<div className="animate-pulse-glow">脈衝發光</div>
<div className="interactive-transform">互動變換</div>

// 背景模糊
<div className="backdrop-blur-cocktail">調酒模糊</div>
<div className="backdrop-blur-heavy">重度模糊</div>
```

## 🎯 CSS 變數系統

```css
:root {
  --color-bg: #050505;           /* 背景色 */
  --color-text: #ffffff;         /* 文字色 */
  --color-primary: #ff3366;      /* 主色 */
  --color-secondary: #3366ff;    /* 輔助色 */
  --color-tertiary: #33ddff;     /* 第三色 */
  --color-accent: #ffcc00;       /* 強調色 */
  --color-success: #22c55e;      /* 成功色 */
  
  --card-radius: 16px;           /* 卡片圓角 */
  --card-bg: rgba(255, 255, 255, 0.03);     /* 卡片背景 */
  --card-border: rgba(255, 255, 255, 0.1);  /* 卡片邊框 */
  --card-shadow: 0 15px 30px -12px rgba(0, 0, 0, 0.5); /* 卡片陰影 */
  
  --transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* 轉場 */
}
```

## 🌟 特殊效果

### 霓虹發光效果
```jsx
<div className="neon-glow cocktail-button">
  霓虹按鈕
</div>
```

### 邊框漸變
```jsx
<div className="border-gradient">
  漸變邊框
</div>
```

### 表格玻璃效果
```jsx
<table className="table-glass">
  <thead>
    <tr>
      <th>調酒名稱</th>
      <th>價格</th>
    </tr>
  </thead>
</table>
```

## 📱 響應式設計

所有組件都支援響應式設計：
- **手機**：基礎尺寸
- **平板** (≥768px)：增強效果
- **桌面** (≥1024px)：完整特效

## 🎉 下一步

1. 在各組件中使用新的 CSS 類別
2. 替換舊的 Tailwind 類別為新的設計系統
3. 測試在不同設備上的顯示效果
4. 根據需要調整色彩和動畫參數

享受您的全新調酒酒吧風格 POS 系統！🍹✨