# 🧪 測試指南 - 調酒酒吧 POS 系統

> **更新日期**: 2025-01-25  
> **版本**: v4.0.0  
> **測試框架**: Vitest + Testing Library

## 📋 測試概覽

本專案使用現代化的測試框架來確保程式碼品質和系統穩定性。測試架構包含單元測試、整合測試和性能監控。

### 🛠️ 技術棧
- **測試框架**: Vitest (快速、現代化的測試執行器)
- **React 測試**: @testing-library/react (用戶行為導向測試)
- **斷言庫**: Vitest 內建 expect API
- **測試環境**: jsdom (模擬瀏覽器環境)
- **覆蓋率**: @vitest/coverage-v8

## 🚀 快速開始

### 安裝測試依賴
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event @vitest/coverage-v8 @vitest/ui
npm install -D jsdom happy-dom
```

### 執行測試
```bash
# 執行所有測試
npm run test

# 執行測試並監聽變化
npm run test:watch

# 執行測試一次（CI 模式）
npm run test:run

# 生成覆蓋率報告
npm run test:coverage

# 開啟測試 UI 界面
npm run test:ui

# TypeScript 型別檢查
npm run type-check
```

## 📂 測試檔案結構

```
src/test/
├── setup.ts              # 測試環境設定
├── framework.test.jsx     # 測試框架驗證
├── components/            # 組件測試
│   └── basic.test.jsx
├── contexts/              # Context 測試
│   └── AppContext.test.jsx
├── hooks/                 # Hooks 測試
│   └── hooks.test.js
├── services/              # 服務測試
│   └── storage.test.js
└── utils/                 # 工具函數測試
```

## 📝 測試撰寫指南

### 1. 基本測試結構
```javascript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'

describe('Component Name', () => {
  beforeEach(() => {
    // 測試前的準備工作
  })

  it('should render correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### 2. Context 測試模式
```javascript
import { AppProvider } from '@/contexts/AppContext'

function renderWithProvider(component) {
  return render(
    <AppProvider>
      {component}
    </AppProvider>
  )
}

// 使用
renderWithProvider(<TestComponent />)
```

### 3. Hooks 測試模式
```javascript
import { renderHook, act } from '@testing-library/react'

describe('useCustomHook', () => {
  it('should return expected values', () => {
    const { result } = renderHook(() => useCustomHook())
    
    expect(result.current.someValue).toBe(expectedValue)
  })
  
  it('should handle state updates', () => {
    const { result } = renderHook(() => useCustomHook())
    
    act(() => {
      result.current.updateFunction(newValue)
    })
    
    expect(result.current.someValue).toBe(newValue)
  })
})
```

### 4. 異步測試模式
```javascript
it('should handle async operations', async () => {
  render(<AsyncComponent />)
  
  // 等待元素出現
  await waitFor(() => {
    expect(screen.getByText('Loaded Data')).toBeInTheDocument()
  })
  
  // 或者使用 findBy* 查詢
  const element = await screen.findByText('Loaded Data')
  expect(element).toBeInTheDocument()
})
```

### 5. 事件測試模式
```javascript
import userEvent from '@testing-library/user-event'

it('should handle user interactions', async () => {
  const user = userEvent.setup()
  const mockFn = vi.fn()
  
  render(<Button onClick={mockFn}>Click me</Button>)
  
  await user.click(screen.getByRole('button'))
  
  expect(mockFn).toHaveBeenCalledTimes(1)
})
```

## 🎯 測試最佳實踐

### ✅ 應該做的
1. **測試用戶行為，而非實作細節**
   ```javascript
   // ✅ 好的做法
   expect(screen.getByRole('button', { name: '提交訂單' })).toBeInTheDocument()
   
   // ❌ 避免的做法
   expect(wrapper.find('.submit-button')).toHaveLength(1)
   ```

2. **使用語義化查詢**
   ```javascript
   // 優先順序: getByRole > getByLabelText > getByText > getByTestId
   screen.getByRole('textbox', { name: '客戶姓名' })
   screen.getByLabelText('客戶姓名')
   screen.getByText('提交')
   screen.getByTestId('customer-form') // 最後選擇
   ```

3. **測試邊界情況**
   ```javascript
   it('should handle empty data', () => {
     render(<OrderList orders={[]} />)
     expect(screen.getByText('暫無訂單')).toBeInTheDocument()
   })
   
   it('should handle loading state', () => {
     render(<OrderList loading={true} />)
     expect(screen.getByText('載入中...')).toBeInTheDocument()
   })
   ```

4. **使用適當的斷言**
   ```javascript
   // 檢查元素存在
   expect(element).toBeInTheDocument()
   
   // 檢查文字內容
   expect(element).toHaveTextContent('預期文字')
   
   // 檢查屬性
   expect(element).toHaveAttribute('disabled')
   
   // 檢查類別
   expect(element).toHaveClass('active')
   ```

### ❌ 應該避免的
1. **不要測試實作細節**
2. **不要依賴特定的 DOM 結構**
3. **不要忽略清理工作**
4. **不要測試第三方庫的功能**

## 🔍 Mock 策略

### 1. Mock 外部依賴
```javascript
// Mock API 服務
vi.mock('@/services/supabaseService', () => ({
  SupabaseService: {
    createOrder: vi.fn().mockResolvedValue({ success: true }),
    getOrders: vi.fn().mockResolvedValue([])
  }
}))

// Mock React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' })
}))
```

### 2. Mock 瀏覽器 API
```javascript
// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock fetch
global.fetch = vi.fn()
```

### 3. Mock 自定義 Hooks
```javascript
vi.mock('@/hooks/useOnline', () => ({
  useOnline: () => ({
    isOnline: true,
    connectionType: 'wifi'
  })
}))
```

## 📊 覆蓋率目標

### 整體目標
- **總體覆蓋率**: ≥ 70%
- **關鍵業務邏輯**: ≥ 90%
- **UI 組件**: ≥ 60%
- **Hooks**: ≥ 80%
- **Services**: ≥ 85%

### 查看覆蓋率報告
```bash
# 生成覆蓋率報告
npm run test:coverage

# 在瀏覽器中查看詳細報告
open coverage/index.html
```

## 🐛 除錯技巧

### 1. 使用 screen.debug()
```javascript
it('should debug component output', () => {
  render(<MyComponent />)
  screen.debug() // 印出當前 DOM 結構
})
```

### 2. 查看可用的查詢
```javascript
it('should show available queries', () => {
  render(<MyComponent />)
  screen.logTestingPlaygroundURL() // 生成 Testing Playground URL
})
```

### 3. 檢查異步更新
```javascript
it('should wait for async updates', async () => {
  render(<AsyncComponent />)
  
  // 檢查元素何時出現
  await waitFor(() => {
    expect(screen.getByText('Updated')).toBeInTheDocument()
  }, { timeout: 3000 })
})
```

## 🔧 CI/CD 整合

測試會在以下情況自動執行：
- **Push 到 main/develop 分支**
- **Pull Request 建立或更新**
- **Release 發布**

### GitHub Actions 配置
```yaml
- name: Run tests
  run: npm run test:run

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
```

## 📈 性能測試

### 使用性能監控工具
```javascript
import { PerformanceMonitor } from '@/utils/performance'

// 測量函數性能
const result = PerformanceMonitor.measureFunction('orderCalculation', () => {
  return calculateOrderTotal(items)
})

// 測量組件渲染性能
const OptimizedComponent = PerformanceMonitor.measureComponent(MyComponent)
```

### Bundle 大小分析
```bash
# 建置並分析 Bundle 大小
npm run build:analyze

# 檢查 Bundle 分析報告
open dist/stats.html
```

## 🎓 學習資源

- [Testing Library 官方文檔](https://testing-library.com/docs/)
- [Vitest 官方文檔](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

---

**記住**: 好的測試應該讓你有信心重構程式碼，而不是成為重構的阻礙。專注於測試用戶行為和業務邏輯，而不是實作細節。