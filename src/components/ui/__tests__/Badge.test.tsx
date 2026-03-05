import { render, screen } from '@testing-library/react'
import { Badge } from '../Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Nou</Badge>)
    expect(screen.getByText('Nou')).toBeInTheDocument()
  })
  it('applies pink variant by default', () => {
    render(<Badge>Test</Badge>)
    expect(screen.getByText('Test')).toHaveClass('bg-[#a007dc]/10')
  })
  it('applies purple variant', () => {
    render(<Badge variant="purple">Test</Badge>)
    expect(screen.getByText('Test')).toHaveClass('bg-[#51087e]/10')
  })
})
