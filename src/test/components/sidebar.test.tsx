import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import Sidebar from '@/components/Sidebar'

describe('Sidebar', () => {
  const setActiveTab = vi.fn()
  const setSidebarOpen = vi.fn()

  beforeEach(() => {
    setActiveTab.mockReset()
    setSidebarOpen.mockReset()
  })

  const renderSidebar = (activeTab: 'tables' | 'dashboard' | 'menu' | 'history' | 'analytics' | 'settings' | 'layout' = 'tables', sidebarOpen = true) =>
    render(
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
    )

  const getNavList = () => screen.getAllByRole('list')[0] as HTMLElement

  it('renders menu items', () => {
    renderSidebar()
    const list = getNavList()
    expect(within(list).getByRole('button', { name: '切換到座位管理' })).toBeInTheDocument()
    expect(within(list).getByRole('button', { name: '切換到營運分析' })).toBeInTheDocument()
  })

  it('invokes setActiveTab on different tab click', () => {
    renderSidebar('tables')
    const list = getNavList()
    fireEvent.click(within(list).getByRole('button', { name: '切換到儀表板' }))
    expect(setActiveTab).toHaveBeenCalledWith('dashboard')
  })

  it('does not call setActiveTab when clicking active tab', () => {
    renderSidebar('tables')
    const list = getNavList()
    fireEvent.click(within(list).getByRole('button', { name: '切換到座位管理' }))
    expect(setActiveTab).not.toHaveBeenCalled()
  })

  it('closes sidebar on mobile after navigation', async () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true })
    renderSidebar('tables', true)
    const list = getNavList()
    fireEvent.click(within(list).getByRole('button', { name: '切換到儀表板' }))
    await waitFor(() => expect(setSidebarOpen).toHaveBeenCalled())
  })
})
