import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'

// 清理每個測試後的 DOM
afterEach(() => {
  cleanup()
})

// 全域模擬設定
beforeAll(() => {
  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock localStorage with proper JSON handling
  const storageMap = new Map<string, string>()
  const localStorageMock = {
    getItem: vi.fn((key: string) => {
      return storageMap.has(key) ? storageMap.get(key)! : null
    }),
    setItem: vi.fn((key: string, value: string) => {
      storageMap.set(key, String(value))
    }),
    removeItem: vi.fn((key: string) => {
      storageMap.delete(key)
    }),
    clear: vi.fn(() => {
      storageMap.clear()
    }),
  }
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    configurable: true,
    writable: true
  })
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    configurable: true,
    writable: true
  })

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock,
    configurable: true,
    writable: true
  })
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: localStorageMock,
    configurable: true,
    writable: true
  })

  // Mock navigator.onLine
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
  })

  // Suppress console warnings in tests
  const originalConsoleWarn = console.warn
  console.warn = (...args: unknown[]) => {
    const firstArg = args[0]
    if (typeof firstArg === 'string' && firstArg.includes('Warning:')) {
      return
    }
    originalConsoleWarn(...args)
  }
})

beforeAll(async () => {
  // 重新綁定 persist storage，避免測試環境中的原生 localStorage shim 缺少 setItem
  const { createJSONStorage } = await import('zustand/middleware')
  const jsonStorage = createJSONStorage(() => window.localStorage)
  const { useOrderStore } = await import('@/stores/orderStore')
  const { useTableStore } = await import('@/stores/tableStore')
  const { useMenuStore } = await import('@/stores/menuStore')
  const { useMembersStore } = await import('@/stores/membersStore')
  const { useSettingsStore } = await import('@/stores/settingsStore')

  const bindPersistStorage = (store: unknown) => {
    const persistApi = (store as { persist?: { setOptions?: (options: { storage: unknown }) => void } }).persist
    if (persistApi?.setOptions) {
      persistApi.setOptions({ storage: jsonStorage })
    }
  }

  bindPersistStorage(useOrderStore)
  bindPersistStorage(useTableStore)
  bindPersistStorage(useMenuStore)
  bindPersistStorage(useMembersStore)
  bindPersistStorage(useSettingsStore)
})

// 測試用的工具函數
export const createMockOrder = (overrides = {}) => ({
  id: '1',
  tableNumber: 1,
  items: [
    {
      id: '1',
      name: 'Mojito',
      price: 300,
      quantity: 1,
      category: '經典調酒'
    }
  ],
  total: 300,
  status: 'active',
  createdAt: new Date().toISOString(),
  ...overrides
})

export const createMockTable = (overrides = {}) => ({
  id: 1,
  number: 1,
  name: '吧台1',
  status: 'available',
  customers: 0,
  position: { x: 100, y: 100 },
  ...overrides
})

export const createMockMenuItem = (overrides = {}) => ({
  id: '1',
  name: 'Mojito',
  price: 300,
  category: '經典調酒',
  baseSpirit: 'Rum',
  available: true,
  ...overrides
})
