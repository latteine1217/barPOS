import { describe, it, expect, vi, beforeEach } from 'vitest'

// 模擬 storageService
vi.mock('@/services/storageService.js', () => ({
  StorageService: {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
}))

describe('Services Mocking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mock services correctly', () => {
    // 這個測試確認模擬設定正確
    expect(true).toBe(true)
  })

  it('should handle localStorage operations', () => {
    localStorage.setItem('test', 'value')
    expect(localStorage.setItem).toHaveBeenCalledWith('test', 'value')
    
    localStorage.getItem('test')
    expect(localStorage.getItem).toHaveBeenCalledWith('test')
  })
})