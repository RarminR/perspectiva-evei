import { render, screen } from '@testing-library/react'
import { Badge } from '../Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Nou</Badge>)
    expect(screen.getByText('Nou')).toBeInTheDocument()
  })
  it('applies pink variant by default', () => {
    render(<Badge>Test</Badge>)
    expect(screen.getByText('Test')).toHaveClass('bg-[#E91E8C]/10')
  })
  it('applies purple variant', () => {
    render(<Badge variant="purple">Test</Badge>)
    expect(screen.getByText('Test')).toHaveClass('bg-[#2D1B69]/10')
  })
})
