import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createMockOrder, createMockTable, createMockMenuItem } from './setup'

// 基本測試確保測試框架運作正常
describe('Test Framework Setup', () => {
  it('should render basic HTML elements', () => {
    render(<div data-testid="test-element">Hello World</div>)
    expect(screen.getByTestId('test-element')).toBeInTheDocument()
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('should create mock data correctly', () => {
    const mockOrder = createMockOrder()
    expect(mockOrder).toMatchObject({
      id: '1',
      tableNumber: 1,
      status: 'active',
      total: 300
    })

    const mockTable = createMockTable()
    expect(mockTable).toMatchObject({
      id: 1,
      number: 1,
      name: '吧台1',
      status: 'available'
    })

    const mockMenuItem = createMockMenuItem()
    expect(mockMenuItem).toMatchObject({
      id: '1',
      name: 'Mojito',
      price: 300,
      category: '經典調酒'
    })
  })

  it('should have localStorage mocked', () => {
    localStorage.setItem('test', 'value')
    expect(localStorage.setItem).toHaveBeenCalledWith('test', 'value')
  })
})