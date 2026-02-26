import { render, screen } from '@testing-library/react'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/admin'),
  redirect: vi.fn(),
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    user: { count: vi.fn() },
    courseEnrollment: { count: vi.fn() },
    order: {
      aggregate: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

// ─── AdminSidebar ──────────────────────────────────────────

describe('AdminSidebar', () => {
  it('renders 12 navigation items', async () => {
    const { AdminSidebar } = await import('../components/AdminSidebar')
    render(<AdminSidebar />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(12)
  })

  it('has link to /admin/cursuri', async () => {
    const { AdminSidebar } = await import('../components/AdminSidebar')
    render(<AdminSidebar />)
    expect(screen.getByRole('link', { name: /Cursuri/i })).toHaveAttribute('href', '/admin/cursuri')
  })

  it('has link to /admin/utilizatori', async () => {
    const { AdminSidebar } = await import('../components/AdminSidebar')
    render(<AdminSidebar />)
    expect(screen.getByRole('link', { name: /Utilizatori/i })).toHaveAttribute('href', '/admin/utilizatori')
  })

  it('renders "Admin Panel" branding', async () => {
    const { AdminSidebar } = await import('../components/AdminSidebar')
    render(<AdminSidebar />)
    expect(screen.getByText('Admin Panel')).toBeInTheDocument()
  })
})

// ─── Admin Dashboard ───────────────────────────────────────

describe('Admin Dashboard (/admin)', () => {
  beforeEach(async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.user.count).mockResolvedValue(42)
    vi.mocked(prisma.courseEnrollment.count).mockResolvedValue(15)
    vi.mocked(prisma.order.aggregate).mockResolvedValue({
      _sum: { totalAmount: 5250.0 },
      _count: { _all: 0 },
      _avg: { totalAmount: null },
      _min: { totalAmount: null },
      _max: { totalAmount: null },
    } as any)
    vi.mocked(prisma.order.count).mockResolvedValue(3)
    vi.mocked(prisma.order.findMany).mockResolvedValue([
      {
        id: 'ord-1',
        userId: 'u1',
        revolutOrderId: null,
        revolutCheckoutUrl: null,
        status: 'COMPLETED',
        totalAmount: 99.0,
        currency: 'EUR',
        installmentNumber: null,
        parentOrderId: null,
        expiresPendingAfter: null,
        shippingAddress: null,
        createdAt: new Date('2026-02-20'),
        updatedAt: new Date(),
        user: { id: 'u1', name: 'Maria Ionescu', email: 'maria@test.com' },
      },
    ] as any)
  })

  it('renders 4 overview cards', async () => {
    const AdminPage = (await import('../page')).default
    const jsx = await AdminPage()
    render(jsx)
    expect(screen.getByText('Utilizatori')).toBeInTheDocument()
    expect(screen.getByText('Înscrieri active')).toBeInTheDocument()
    expect(screen.getByText('Venit lunar')).toBeInTheDocument()
    expect(screen.getByText('Comenzi în așteptare')).toBeInTheDocument()
  })

  it('displays correct stat values', async () => {
    const AdminPage = (await import('../page')).default
    const jsx = await AdminPage()
    render(jsx)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders "Comenzi recente" section', async () => {
    const AdminPage = (await import('../page')).default
    const jsx = await AdminPage()
    render(jsx)
    expect(screen.getByText('Comenzi recente')).toBeInTheDocument()
  })

  it('shows recent order data', async () => {
    const AdminPage = (await import('../page')).default
    const jsx = await AdminPage()
    render(jsx)
    expect(screen.getByText('Maria Ionescu')).toBeInTheDocument()
  })
})

// ─── Admin Layout (auth guard) ─────────────────────────────

describe('Admin Layout (auth guard)', () => {
  it('renders children when user is ADMIN', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      expires: '2099-01-01',
    } as any)

    const AdminLayout = (await import('../layout')).default
    const jsx = await AdminLayout({ children: <div data-testid="child">Child content</div> })
    render(jsx)
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('shows "Acces interzis" for non-admin users', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u2', name: 'User', email: 'user@test.com', role: 'USER' },
      expires: '2099-01-01',
    } as any)

    const AdminLayout = (await import('../layout')).default
    const jsx = await AdminLayout({ children: <div>Should not show</div> })
    render(jsx)
    expect(screen.getByText('Acces interzis')).toBeInTheDocument()
  })

  it('redirects to /logare when not logged in', async () => {
    const { auth } = await import('@/lib/auth')
    const { redirect } = await import('next/navigation')
    vi.mocked(auth).mockResolvedValue(null as any)

    const AdminLayout = (await import('../layout')).default
    try {
      await AdminLayout({ children: <div>Nope</div> })
    } catch {
      // redirect throws
    }
    expect(redirect).toHaveBeenCalledWith('/logare')
  })
})
