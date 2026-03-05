import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })
  it('applies primary variant by default', () => {
    render(<Button>Test</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeInTheDocument()
    // Primary variant uses inline style with #51087e background
    expect(btn.style.backgroundColor).toBe('rgb(81, 8, 126)')
  })
  it('applies secondary variant', () => {
    render(<Button variant="secondary">Test</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeInTheDocument()
    // Secondary variant also uses #51087e (same as primary in Webflow design)
    expect(btn.style.backgroundColor).toBe('rgb(81, 8, 126)')
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
