import { render, screen } from '@testing-library/react'
import { Card } from '../Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Content</Card>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
  it('applies default variant', () => {
    const { container } = render(<Card>Content</Card>)
    expect(container.firstChild).toHaveClass('rounded-2xl')
  })
})
