import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })
  it('applies primary variant by default', () => {
    render(<Button>Test</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-[#E91E8C]')
  })
  it('applies secondary variant', () => {
    render(<Button variant="secondary">Test</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-[#2D1B69]')
  })
  it('is disabled when loading', () => {
    render(<Button loading>Test</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
  it('calls onClick handler', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Test</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
