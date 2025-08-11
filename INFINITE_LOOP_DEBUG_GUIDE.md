# 🔧 React 無限循環排查與修正指南

> **緊急使用指南** - 當遇到 "Maximum update depth exceeded" 錯誤時的系統化解決方案

---

## 🚨 **緊急診斷檢查清單** (2分鐘內定位)

```bash
# 1. 快速搜尋可疑模式
grep -r "useState\|useEffect\|useMemo" src/ | grep -v "node_modules"

# 2. 找出複合選擇器
grep -r "useStore.*=>" src/ | grep "{"

# 3. 檢查 render 階段的 setState
grep -A5 -B5 "setState\|dispatch" src/components/
```

### **錯誤信號識別**
- ✅ 瀏覽器卡死或響應極慢
- ✅ 控制台顯示 "Maximum update depth exceeded"
- ✅ React DevTools 顯示組件持續重新渲染
- ✅ CPU 使用率異常飆高

---

## 🔍 **五步系統化排查法**

### **第1步：🎯 Render 階段檢查**

**問題模式：在函數組件主體直接調用 setState**

```typescript
// ❌ 錯誤模式：在函數主體直接呼叫 setState
const Component = ({ data }) => {
  const [state, setState] = useState();
  
  if (data.length > 0) {
    setState(data); // 🚨 每次渲染都觸發
  }
  
  return <div>{state}</div>;
};

// ✅ 正確模式：移到 useEffect 或 useMemo
const Component = ({ data }) => {
  const [state, setState] = useState();
  
  useEffect(() => {
    if (data.length > 0) {
      setState(data);
    }
  }, [data]); // 只在 data 變化時觸發
  
  return <div>{state}</div>;
};
```

**檢查要點：**
- [ ] 搜尋所有 `setState`、`dispatch` 調用
- [ ] 確認沒有在組件函數主體直接調用
- [ ] 將狀態更新移至事件處理器或 useEffect

---

### **第2步：🔄 useEffect 依賴修正**

**問題模式：依賴陣列錯誤或遺漏**

```typescript
// ❌ 常見錯誤模式
useEffect(() => {
  setCount(count + 1); // 讀取了 count 但沒有放在依賴中
}); // 缺少依賴陣列

useEffect(() => {
  setData(processData(items, selectedItem)); 
}, [items]); // 遺漏 selectedItem 依賴

// ✅ 正確修正
useEffect(() => {
  setCount(prev => prev + 1); // 使用函數式更新
}, []); // 明確的空依賴

useEffect(() => {
  setData(processData(items, selectedItem));
}, [items, selectedItem]); // 完整依賴列表
```

**檢查要點：**
- [ ] 檢查所有 useEffect 的依賴陣列
- [ ] 確保包含所有讀取的外部變數
- [ ] 考慮使用函數式更新減少依賴
- [ ] 空陣列 `[]` 只用於一次性初始化

---

### **第3步：💾 useMemo 優化派生值**

**問題模式：派生狀態導致循環依賴**

```typescript
// ❌ 錯誤：派生狀態導致循環
const [filteredItems, setFilteredItems] = useState([]);
useEffect(() => {
  setFilteredItems(items.filter(item => item.category === category));
}, [items, category, filteredItems]); // filteredItems 造成循環

// ❌ 錯誤：在 useMemo 中調用 setState
const categories = useMemo(() => {
  try {
    return computeCategories(data);
  } catch (error) {
    setError('計算失敗'); // 🚨 觸發重新渲染
    return [];
  }
}, [data]);

// ✅ 正確：使用 useMemo
const filteredItems = useMemo(() => {
  return items.filter(item => item.category === category);
}, [items, category]); // 無循環依賴

// ✅ 正確：純函數，無副作用
const categories = useMemo(() => {
  try {
    return computeCategories(data);
  } catch (error) {
    console.error('計算失敗:', error); // 只記錄錯誤
    return [];
  }
}, [data]);
```

**檢查要點：**
- [ ] 將純計算結果改為 useMemo
- [ ] 移除 useMemo 中的 setState 調用
- [ ] 確保 useMemo 回調是純函數
- [ ] 錯誤處理分離到獨立的 useEffect

---

### **第4步：🔗 穩定 Callback 引用**

**問題模式：每次渲染創建新函數引用**

```typescript
// ❌ 錯誤：每次創建新函數
const Parent = () => {
  const [data, setData] = useState([]);
  
  const handleSelect = (id) => { // 每次渲染都是新函數
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, selected: true } : item
    ));
  };
  
  return <Child onSelect={handleSelect} />; // 觸發 Child 重渲染
};

// ❌ 錯誤：複合選擇器不穩定引用
const { orders, actions } = useOrderStore(); // 每次都是新物件

// ✅ 正確：使用 useCallback
const Parent = () => {
  const [data, setData] = useState([]);
  
  const handleSelect = useCallback((id) => {
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, selected: true } : item
    ));
  }, []); // 穩定引用
  
  return <Child onSelect={handleSelect} />;
};

// ✅ 正確：單一穩定選擇器
const orders = useOrderStore(state => state.orders);
const updateOrder = useOrderStore(state => state.updateOrder);
```

**檢查要點：**
- [ ] 使用 useCallback 包裝事件處理函數
- [ ] 避免複合選擇器，改用單一選擇器
- [ ] 檢查傳給子組件的 props 是否穩定
- [ ] 考慮將共用邏輯移到外部 store

---

### **第5步：🕵️ 系統化 Debug**

**調試工具與技巧**

```typescript
// 1. 渲染計數器
const useRenderTracker = (componentName) => {
  const renderCount = useRef(0);
  const prevPropsRef = useRef();
  
  renderCount.current++;
  
  useEffect(() => {
    console.log(`${componentName} 渲染次數:`, renderCount.current);
    if (renderCount.current > 10) {
      console.warn(`🚨 ${componentName} 可能存在無限循環!`);
    }
  });
  
  return { renderCount: renderCount.current };
};

// 2. 依賴追蹤器
const useDependencyTracker = (deps, name) => {
  const prevDepsRef = useRef();
  
  useEffect(() => {
    const changedDeps = deps.map((dep, index) => {
      const prev = prevDepsRef.current?.[index];
      const changed = prev !== dep;
      if (changed) {
        console.log(`${name} 依賴 ${index} 變化:`, { prev, current: dep });
      }
      return changed;
    });
    
    prevDepsRef.current = deps;
  });
};

// 3. 使用方式
const MyComponent = (props) => {
  const { renderCount } = useRenderTracker('MyComponent');
  useDependencyTracker([props.data, props.filter], 'MyComponent');
  
  // 組件邏輯...
};
```

**Debug 步驟：**
1. **停止所有 setState**：註解可疑的 setState，確認錯誤消失位置
2. **逐段還原**：重新放回每段 setState 或 effect，找出問題源頭
3. **關鍵位置打 log**：在 effect、函數前後記錄觸發次數與參數
4. **用 DevTools Profiler**：觀察渲染次數，定位高頻執行的組件
5. **重構拆解**：把複雜邏輯拆成小 custom hook，逐一測試

---

## 📊 **快速修復對照表**

| 錯誤模式 | 症狀 | 快速修復 | 檢查指令 |
|---------|------|---------|---------|
| **渲染時 setState** | 立即錯誤 | 移至 `useEffect([])` | `grep -n "setState" src/` |
| **useEffect 無依賴** | 持續渲染 | 添加 `[]` 或正確依賴 | `grep -A3 "useEffect" src/` |
| **複合選擇器** | 緩慢循環 | 拆解為單一選擇器 | `grep "useStore.*{" src/` |
| **useMemo 副作用** | 間歇錯誤 | 移除 setState，改用純函數 | `grep -A5 "useMemo" src/` |
| **不穩定 callback** | 子組件過度渲染 | 使用 `useCallback` | `grep -B3 -A3 "onClick\|onChange" src/` |

---

## 🔄 **標準修復工作流程**

### **階段1: 快速止血 (5分鐘)**
```bash
# 1. 暫時註解可疑代碼
# 找到報錯的組件文件
# 註解掉最近修改的 useState/useEffect 代碼

# 2. 確認錯誤是否消失
npm run dev

# 3. 逐步恢復，定位問題源頭
# 一次恢復一段代碼，直到錯誤重現
```

### **階段2: 根本修復 (15分鐘)**
```typescript
// 1. 應用五步修正法（依序檢查）
// 2. 重構問題代碼
// 3. 添加防護機制（渲染計數器等）
```

### **階段3: 驗證測試 (10分鐘)**
```bash
# 1. 建置測試
npm run build

# 2. 開發環境測試
npm run dev 

# 3. 功能測試（點擊各種按鈕確認無錯誤）
# 4. 性能檢查（觀察 CPU 使用率）
```

---

## 🛠️ **實戰修復模板**

### **模板1: 複合選擇器修正**
```typescript
// ❌ 修正前：不穩定的複合選擇器
const { orders, isLoading, actions } = useOrderStore();

// ✅ 修正後：單一穩定選擇器
const orders = useOrderStore(state => state.orders);
const isLoading = useOrderStore(state => state.isLoading);
const updateOrder = useOrderStore(state => state.updateOrder);
const deleteOrder = useOrderStore(state => state.deleteOrder);
```

### **模板2: 安全的狀態更新模式**
```typescript
// ✅ 推薦的狀態更新模式
const useDataManager = () => {
  // 1. 單一職責選擇器
  const data = useStore(state => state.data);
  const updateData = useStore(state => state.updateData);
  
  // 2. 記憶化計算
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      computed: expensiveComputation(item)
    }));
  }, [data]);
  
  // 3. 穩定的事件處理
  const handleUpdate = useCallback((id, updates) => {
    updateData(id, updates);
  }, [updateData]);
  
  return { processedData, handleUpdate };
};
```

### **模板3: 推薦的組件結構**
```typescript
// ✅ 推薦的組件結構
const Component = ({ prop1, prop2 }) => {
  // 1. 狀態聲明區
  const [localState, setLocalState] = useState();
  
  // 2. 選擇器區（穩定引用）
  const data = useStore(state => state.data);
  const updateData = useStore(state => state.updateData);
  
  // 3. 記憶化計算區
  const memoizedValue = useMemo(() => computation(data), [data]);
  
  // 4. 副作用區
  useEffect(() => {
    // 初始化邏輯
  }, []);
  
  // 5. 事件處理區
  const handleEvent = useCallback(() => {
    // 事件邏輯
  }, []);
  
  // 6. 渲染邏輯
  return <div>{/* JSX */}</div>;
};
```

---

## 🚀 **預防性工具與監控**

### **開發時循環檢測器**
```typescript
// 添加到可疑組件中
const CycleDetector = ({ children, name }) => {
  const renderCount = useRef(0);
  renderCount.current++;
  
  if (renderCount.current > 50) {
    throw new Error(`${name} 可能存在無限循環！渲染次數: ${renderCount.current}`);
  }
  
  if (renderCount.current > 20) {
    console.warn(`⚠️ ${name} 渲染次數過多:`, renderCount.current);
  }
  
  return children;
};

// 使用方式
const MyComponent = () => (
  <CycleDetector name="MyComponent">
    {/* 組件內容 */}
  </CycleDetector>
);
```

### **性能監控**
```typescript
const PerformanceMonitor = () => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 16) { // 超過一幀
          console.warn('長任務檢測:', entry);
        }
      }
    });
    
    observer.observe({ entryTypes: ['longtask'] });
    return () => observer.disconnect();
  }, []);
  
  return null;
};
```

---

## 📚 **成功案例參考**

### **案例1: TableLayoutEditor 修復**
**問題：** 未定義變數 `tableActions` 在 useEffect 依賴中
```typescript
// ❌ 錯誤
}, [dragState, selectedTable, tableActions, layoutConfig]);

// ✅ 修復
}, [dragState, selectedTable, updateTableLayout, layoutConfig]);
```

### **案例2: VisualOrderingInterface 修復**
**問題：** useMemo 中調用 setState
```typescript
// ❌ 錯誤
const categories = useMemo(() => {
  // ...
  setError('無法載入菜單分類'); // 觸發循環
  return ['all'];
}, [menuItems]);

// ✅ 修復
const categories = useMemo(() => {
  // ...
  console.error('Error getting categories:', err); // 純函數
  return ['all'];
}, [menuItems]);
```

---

## 📋 **應急檢查清單**

當發現無限循環錯誤時，按順序檢查：

- [ ] **第1優先級**：搜尋組件主體中的 setState 調用
- [ ] **第2優先級**：檢查 useEffect 依賴陣列完整性
- [ ] **第3優先級**：查找 useMemo/useCallback 中的副作用
- [ ] **第4優先級**：檢查複合選擇器和不穩定引用
- [ ] **第5優先級**：使用調試工具定位高頻渲染組件

## 🎯 **修復後驗證清單**

- [ ] `npm run build` 成功
- [ ] `npm run dev` 正常啟動
- [ ] 所有功能點擊測試無錯誤
- [ ] CPU 使用率恢復正常
- [ ] React DevTools 顯示正常渲染頻率
- [ ] 控制台無警告信息

---

## 🔗 **相關資源**

- [React 官方文檔 - useEffect](https://reactjs.org/docs/hooks-effect.html)
- [React DevTools Profiler](https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html)
- [專案 API 指南](./API_GUIDE.md)
- [Zustand 最佳實踐](https://github.com/pmndrs/zustand)

---

*📝 最後更新: 2025年 | 🛠️ 開發工具: opencode + GitHub Copilot*  
*⚡ 緊急使用: 遇到 "Maximum update depth exceeded" 時立即查閱此指南*