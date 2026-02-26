import { render, screen } from '@testing-library/react'
import { Input } from '../Input'

describe('Input', () => {
  it('renders label', () => {
    render(<Input label="Email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })
  it('shows error message', () => {
    render(<Input label="Email" error="Email invalid" />)
    expect(screen.getByText('Email invalid')).toBeInTheDocument()
  })
  it('shows helper text when no error', () => {
    render(<Input helperText="Introduceți emailul" />)
    expect(screen.getByText('Introduceți emailul')).toBeInTheDocument()
  })
})
