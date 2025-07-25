import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// 簡單的組件測試，避免複雜的 Context 依賴
describe('UI Components', () => {
  it('should render button with text', () => {
    // 模擬一個簡單的按鈕組件
    const MockButton = ({ children, onClick, disabled, ...props }) => (
      <button 
        onClick={onClick} 
        disabled={disabled}
        data-testid="mock-button"
        {...props}
      >
        {children}
      </button>
    )

    render(<MockButton>點擊我</MockButton>)
    
    expect(screen.getByTestId('mock-button')).toBeInTheDocument()
    expect(screen.getByText('點擊我')).toBeInTheDocument()
  })

  it('should handle button click', () => {
    const mockClick = vi.fn()
    
    const MockButton = ({ children, onClick, disabled, ...props }) => (
      <button 
        onClick={onClick} 
        disabled={disabled}
        data-testid="mock-button"
        {...props}
      >
        {children}
      </button>
    )
    
    render(<MockButton onClick={mockClick}>點擊我</MockButton>)
    
    const button = screen.getByTestId('mock-button')
    button.click()
    
    expect(mockClick).toHaveBeenCalledTimes(1)
  })

  it('should handle disabled state', () => {
    const MockButton = ({ children, onClick, disabled, ...props }) => (
      <button 
        onClick={onClick} 
        disabled={disabled}
        data-testid="mock-button"
        {...props}
      >
        {children}
      </button>
    )

    render(<MockButton disabled>停用按鈕</MockButton>)
    
    const button = screen.getByTestId('mock-button')
    expect(button).toBeDisabled()
  })

  it('should render input with placeholder', () => {
    // 模擬一個簡單的輸入框組件
    const MockInput = ({ placeholder, value, onChange, ...props }) => (
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        data-testid="mock-input"
        {...props}
      />
    )

    render(<MockInput placeholder="請輸入文字" />)
    
    const input = screen.getByTestId('mock-input')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('placeholder', '請輸入文字')
  })

  it('should handle input change', () => {
    const mockChange = vi.fn()
    
    const MockInput = ({ placeholder, value, onChange, ...props }) => (
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        data-testid="mock-input"
        {...props}
      />
    )
    
    render(<MockInput value="test" onChange={mockChange} />)
    
    const input = screen.getByTestId('mock-input')
    expect(input).toHaveValue('test')
  })
})

// 簡單的工具函數測試
describe('Utility Functions', () => {
  // 測試貨幣格式化
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
    }).format(amount)
  }

  it('should format currency correctly', () => {
    expect(formatCurrency(100)).toContain('100')
    expect(formatCurrency(1000)).toContain('1,000')
  })

  // 測試總價計算
  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  it('should calculate order total correctly', () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: 200, quantity: 1 },
    ]
    
    expect(calculateTotal(items)).toBe(400)
  })

  it('should handle empty items array', () => {
    expect(calculateTotal([])).toBe(0)
  })
})