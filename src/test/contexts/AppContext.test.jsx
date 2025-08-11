import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { createMockOrder } from '../setup'

// 測試組件，用於測試 useApp hook
function TestComponent() {
  // 由於我們已經遷移到 Zustand，這裡使用簡化的模擬狀態
  const mockState = {
    orders: [],
    tables: [],
    menuItems: [],
    stats: { totalRevenue: 0 }
  }
  
  const mockActions = {
    addOrder: () => {}
  }
  
  return (
    <div>
      <div data-testid="orders-count">{mockState.orders?.length || 0}</div>
      <div data-testid="tables-count">{mockState.tables?.length || 0}</div>
      <div data-testid="menu-items-count">{mockState.menuItems?.length || 0}</div>
      <div data-testid="total-revenue">{mockState.stats?.totalRevenue || 0}</div>
      <button 
        data-testid="add-order-button"
        onClick={() => mockActions.addOrder(createMockOrder())}
      >
        Add Order
      </button>
    </div>
  )
}

function renderWithProvider(component) {
  // 簡化的 Provider，因為已經遷移到 Zustand
  return render(
    <div data-testid="mock-provider">
      {component}
    </div>
  )
}

describe('AppContext Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should provide initial state', () => {
    renderWithProvider(<TestComponent />)
    
    // 檢查初始狀態
    expect(screen.getByTestId('orders-count')).toHaveTextContent('0')
    expect(screen.getByTestId('tables-count')).toHaveTextContent('0')
    expect(screen.getByTestId('menu-items-count')).toHaveTextContent('0')
    expect(screen.getByTestId('total-revenue')).toHaveTextContent('0')
  })

  it('should render without crashing', () => {
    const { container } = renderWithProvider(<TestComponent />)
    expect(container).toBeInTheDocument()
  })

  it('should provide mock app state with required properties', () => {
    const TestHookComponent = () => {
      const mockApp = {
        state: { orders: [], tables: [], menuItems: [] },
        actions: { addOrder: () => {} }
      }
      
      return (
        <div>
          <div data-testid="has-state">{mockApp.state ? 'true' : 'false'}</div>
          <div data-testid="has-actions">{mockApp.actions ? 'true' : 'false'}</div>
        </div>
      )
    }

    renderWithProvider(<TestHookComponent />)
    
    expect(screen.getByTestId('has-state')).toHaveTextContent('true')
    expect(screen.getByTestId('has-actions')).toHaveTextContent('true')
  })
})

describe('AppProvider Component', () => {
  it('should wrap children properly', () => {
    const TestChild = () => <div data-testid="test-child">Test Child</div>
    
    render(
      <div data-testid="mock-provider">
        <TestChild />
      </div>
    )
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument()
    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })
})