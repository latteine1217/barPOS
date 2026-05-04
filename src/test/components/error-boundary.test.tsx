import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import GlobalErrorBoundary from '@/components/ErrorBoundary/GlobalErrorBoundary'

const Boom: React.FC = () => {
  throw new Error('boom')
}

describe('GlobalErrorBoundary', () => {
  let originalError: typeof console.error

  beforeAll(() => {
    // Suppress noisy React error logs from intentional throws
    originalError = console.error
    console.error = vi.fn()
  })

  afterAll(() => {
    console.error = originalError
  })

  it('renders fallback UI on error', () => {
    render(
      <GlobalErrorBoundary>
        <Boom />
      </GlobalErrorBoundary>
    )
    expect(screen.getByText('系統發生錯誤')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重試' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新載入頁面' })).toBeInTheDocument()
  })
})
