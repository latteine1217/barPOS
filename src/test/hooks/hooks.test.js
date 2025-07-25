import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
})

// Mock the useError hook from ErrorContext
vi.mock('@/contexts/ErrorContext', () => ({
  useError: () => ({
    showInfo: vi.fn(),
    showWarning: vi.fn(), 
    showSuccess: vi.fn(),
    showError: vi.fn()
  })
}))

// Import hooks after mocking
import { useOnline } from '@/hooks/useOnline'

describe('useOnline Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return initial online status', () => {
    const { result } = renderHook(() => useOnline())
    
    expect(result.current.isOnline).toBe(true)
    expect(typeof result.current.connectionType).toBe('string')
  })

  it('should handle offline status', () => {
    // 模擬離線狀態
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    })
    
    const { result } = renderHook(() => useOnline())
    
    // 觸發 online/offline 事件
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    
    // 注意：實際狀態可能需要等待 effect 執行
    expect(result.current.isOnline).toBe(false)
  })
})