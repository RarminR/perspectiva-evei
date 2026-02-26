import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '../Modal'

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(<Modal isOpen={false} onClose={() => {}}>Content</Modal>)
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })
  it('renders content when open', () => {
    render(<Modal isOpen={true} onClose={() => {}}>Content</Modal>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
  it('calls onClose when X button clicked', () => {
    const onClose = vi.fn()
    render(<Modal isOpen={true} onClose={onClose} title="Test">Content</Modal>)
    fireEvent.click(screen.getByLabelText('Închide'))
    expect(onClose).toHaveBeenCalledOnce()
  })
  it('renders title', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Confirmare">Content</Modal>)
    expect(screen.getByText('Confirmare')).toBeInTheDocument()
  })
})
