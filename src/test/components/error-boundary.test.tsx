import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import ErrorBoundary from '@/components/ErrorBoundary'

const Boom: React.FC = () => {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  it('renders fallback UI on error', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByText('系統發生錯誤')).toBeInTheDocument()
    expect(screen.getByText('很抱歉，系統遇到了一個錯誤')).toBeInTheDocument()
  })
})
