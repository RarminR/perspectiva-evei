import { render, screen } from '@testing-library/react'

// Mock next/link to render as plain anchors
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock next/image to render as plain img
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img alt="" {...props} />,
}))

describe('Homepage', () => {
  it('renders brand title "Perspectiva Evei"', async () => {
    const { default: Home } = await import('../page')
    render(<Home />)
    // Logo alt text or any text containing Perspectiva Evei
    const elements = screen.getAllByAltText('Perspectiva Evei')
    expect(elements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders a CTA button linking to the course', async () => {
    const { default: Home } = await import('../page')
    render(<Home />)
    // Updated CTA text matches new Webflow design
    expect(screen.getByRole('link', { name: /Vezi serviciile mele/i })).toBeInTheDocument()
  })

  it('renders testimonial section', async () => {
    const { default: Home } = await import('../page')
    render(<Home />)
    expect(screen.getByText(/Ce spun clienții mei/i)).toBeInTheDocument()
  })

  it('renders social proof badges', async () => {
    const { default: Home } = await import('../page')
    render(<Home />)
    expect(screen.getByText(/ani de experiență/i)).toBeInTheDocument()
    expect(screen.getByText(/ore de coaching/i)).toBeInTheDocument()
  })
})

describe('Contact page', () => {
  it('renders contact form with name, email, message fields', async () => {
    const { default: Contact } = await import('../contact/page')
    render(<Contact />)
    expect(screen.getByLabelText(/Nume/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mesaj/i)).toBeInTheDocument()
  })

  it('renders a submit button', async () => {
    const { default: Contact } = await import('../contact/page')
    render(<Contact />)
    expect(screen.getByRole('button', { name: /Trimite/i })).toBeInTheDocument()
  })

  it('renders company info', async () => {
    const { default: Contact } = await import('../contact/page')
    render(<Contact />)
    expect(screen.getByText(/estedespremine@gmail\.com/i)).toBeInTheDocument()
  })
})
