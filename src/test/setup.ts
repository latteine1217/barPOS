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
  const localStorageMock = {
    getItem: vi.fn(() => {
      // Return null for unknown keys to prevent JSON parse errors
      return null
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  })

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock
  })

  // Mock navigator.onLine
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
  })

  // Suppress console warnings in tests
  const originalConsoleWarn = console.warn
  console.warn = (...args: any[]) => {
    if (args[0]?.includes?.('Warning:')) {
      return
    }
    originalConsoleWarn(...args)
  }
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