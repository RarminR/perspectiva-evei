import { render, screen } from '@testing-library/react'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/admin/comenzi'),
  notFound: vi.fn(() => { throw new Error('NOT_FOUND') }),
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

const MOCK_ORDER = {
  id: 'ord-test-1',
  userId: 'u1',
  revolutOrderId: 'rev-123',
  revolutCheckoutUrl: null,
  status: 'COMPLETED',
  totalAmount: 149.0,
  currency: 'EUR',
  installmentNumber: null,
  parentOrderId: null,
  expiresPendingAfter: null,
  shippingAddress: null,
  createdAt: new Date('2026-02-20'),
  updatedAt: new Date(),
  user: { id: 'u1', name: 'Ana Popescu', email: 'ana@test.com' },
}

const MOCK_ORDER_DETAIL = {
  ...MOCK_ORDER,
  items: [
    { id: 'oi-1', orderId: 'ord-test-1', productType: 'COURSE', productId: 'c1', quantity: 1, unitPrice: 149.0 },
  ],
  invoices: [
    { id: 'inv-1', orderId: 'ord-test-1', smartbillSeries: 'PEV', smartbillNumber: '001', status: 'CREATED', createdAt: new Date() },
  ],
}

const MOCK_INVOICE = {
  id: 'inv-1',
  orderId: 'ord-test-1',
  smartbillSeries: 'PEV',
  smartbillNumber: '001',
  smartbillUrl: null,
  status: 'CREATED',
  errorText: null,
  createdAt: new Date('2026-02-20'),
  updatedAt: new Date(),
  order: {
    id: 'ord-test-1',
    totalAmount: 149.0,
    status: 'COMPLETED',
    user: { id: 'u1', name: 'Ana Popescu', email: 'ana@test.com' },
  },
}

const MOCK_INVOICE_FAILED = {
  ...MOCK_INVOICE,
  id: 'inv-2',
  status: 'FAILED',
  errorText: 'SmartBill connection timeout',
}

// ─── Orders List (/admin/comenzi) ──────────────────────────

describe('Orders List (/admin/comenzi)', () => {
  beforeEach(async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.order.findMany).mockResolvedValue([MOCK_ORDER] as any)
  })

  it('renders orders table with data', async () => {
    const OrdersPage = (await import('../../comenzi/page')).default
    const jsx = await OrdersPage({ searchParams: Promise.resolve({}) })
    render(jsx)
    expect(screen.getByText('Comenzi')).toBeInTheDocument()
    expect(screen.getByText('Ana Popescu')).toBeInTheDocument()
  })

  it('shows order status badge', async () => {
    const OrdersPage = (await import('../../comenzi/page')).default
    const jsx = await OrdersPage({ searchParams: Promise.resolve({}) })
    render(jsx)
    expect(screen.getAllByText('COMPLETED')).not.toHaveLength(0)
  })

  it('has link to order detail', async () => {
    const OrdersPage = (await import('../../comenzi/page')).default
    const jsx = await OrdersPage({ searchParams: Promise.resolve({}) })
    render(jsx)
    const link = screen.getByRole('link', { name: /Detalii/i })
    expect(link).toHaveAttribute('href', '/admin/comenzi/ord-test-1')
  })

  it('renders status filter form', async () => {
    const OrdersPage = (await import('../../comenzi/page')).default
    const jsx = await OrdersPage({ searchParams: Promise.resolve({}) })
    render(jsx)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('filters orders by status', async () => {
    const { prisma } = await import('@/lib/db')
    const OrdersPage = (await import('../../comenzi/page')).default
    await OrdersPage({ searchParams: Promise.resolve({ status: 'COMPLETED' }) })
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'COMPLETED' }),
      })
    )
  })

  it('shows empty state', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.order.findMany).mockResolvedValue([])
    const OrdersPage = (await import('../../comenzi/page')).default
    const jsx = await OrdersPage({ searchParams: Promise.resolve({}) })
    render(jsx)
    expect(screen.getByText(/Nicio comand/i)).toBeInTheDocument()
  })
})

// ─── Order Detail (/admin/comenzi/[id]) ────────────────────

describe('Order Detail (/admin/comenzi/[id])', () => {
  beforeEach(async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.order.findUnique).mockResolvedValue(MOCK_ORDER_DETAIL as any)
  })

  it('renders order detail info', async () => {
    const OrderDetailPage = (await import('../../comenzi/[id]/page')).default
    const jsx = await OrderDetailPage({ params: Promise.resolve({ id: 'ord-test-1' }) })
    render(jsx)
    expect(screen.getByText('Ana Popescu')).toBeInTheDocument()
    expect(screen.getByText('COMPLETED')).toBeInTheDocument()
  })

  it('shows order items', async () => {
    const OrderDetailPage = (await import('../../comenzi/[id]/page')).default
    const jsx = await OrderDetailPage({ params: Promise.resolve({ id: 'ord-test-1' }) })
    render(jsx)
    expect(screen.getByText('COURSE')).toBeInTheDocument()
  })

  it('has refund button for completed orders', async () => {
    const OrderDetailPage = (await import('../../comenzi/[id]/page')).default
    const jsx = await OrderDetailPage({ params: Promise.resolve({ id: 'ord-test-1' }) })
    render(jsx)
    expect(screen.getByRole('button', { name: /Rambursare/i })).toBeInTheDocument()
  })

  it('has back link to orders list', async () => {
    const OrderDetailPage = (await import('../../comenzi/[id]/page')).default
    const jsx = await OrderDetailPage({ params: Promise.resolve({ id: 'ord-test-1' }) })
    render(jsx)
    expect(screen.getByRole('link', { name: /napoi/i })).toHaveAttribute('href', '/admin/comenzi')
  })

  it('calls notFound when order missing', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null)
    const OrderDetailPage = (await import('../../comenzi/[id]/page')).default
    await expect(
      OrderDetailPage({ params: Promise.resolve({ id: 'non-existent' }) })
    ).rejects.toThrow('NOT_FOUND')
  })
})

// ─── Invoices List (/admin/facturi) ────────────────────────

describe('Invoices List (/admin/facturi)', () => {
  beforeEach(async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([MOCK_INVOICE] as any)
  })

  it('renders invoices table', async () => {
    const InvoicesPage = (await import('../../facturi/page')).default
    const jsx = await InvoicesPage({ searchParams: Promise.resolve({}) })
    render(jsx)
    expect(screen.getByText('Facturi')).toBeInTheDocument()
    expect(screen.getByText('PEV')).toBeInTheDocument()
    expect(screen.getByText('001')).toBeInTheDocument()
  })

  it('shows invoice status badge', async () => {
    const InvoicesPage = (await import('../../facturi/page')).default
    const jsx = await InvoicesPage({ searchParams: Promise.resolve({}) })
    render(jsx)
    expect(screen.getByText('CREATED')).toBeInTheDocument()
  })

  it('has link to invoice detail', async () => {
    const InvoicesPage = (await import('../../facturi/page')).default
    const jsx = await InvoicesPage({ searchParams: Promise.resolve({}) })
    render(jsx)
    const link = screen.getByRole('link', { name: /Detalii/i })
    expect(link).toHaveAttribute('href', '/admin/facturi/inv-1')
  })

  it('shows empty state', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([])
    const InvoicesPage = (await import('../../facturi/page')).default
    const jsx = await InvoicesPage({ searchParams: Promise.resolve({}) })
    render(jsx)
    expect(screen.getByText(/Nicio factur/i)).toBeInTheDocument()
  })
})

// ─── Invoice Detail (/admin/facturi/[id]) ──────────────────

describe('Invoice Detail (/admin/facturi/[id])', () => {
  beforeEach(async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue(MOCK_INVOICE as any)
  })

  it('renders invoice detail', async () => {
    const InvoiceDetailPage = (await import('../../facturi/[id]/page')).default
    const jsx = await InvoiceDetailPage({ params: Promise.resolve({ id: 'inv-1' }) })
    render(jsx)
    expect(screen.getByText('PEV')).toBeInTheDocument()
    expect(screen.getByText('001')).toBeInTheDocument()
  })

  it('has storno button', async () => {
    const InvoiceDetailPage = (await import('../../facturi/[id]/page')).default
    const jsx = await InvoiceDetailPage({ params: Promise.resolve({ id: 'inv-1' }) })
    render(jsx)
    expect(screen.getByRole('button', { name: /Stornea/i })).toBeInTheDocument()
  })

  it('shows retry button for failed invoices', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue(MOCK_INVOICE_FAILED as any)
    const InvoiceDetailPage = (await import('../../facturi/[id]/page')).default
    const jsx = await InvoiceDetailPage({ params: Promise.resolve({ id: 'inv-2' }) })
    render(jsx)
    expect(screen.getByRole('button', { name: /ncearc/i })).toBeInTheDocument()
  })

  it('shows error text for failed invoices', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue(MOCK_INVOICE_FAILED as any)
    const InvoiceDetailPage = (await import('../../facturi/[id]/page')).default
    const jsx = await InvoiceDetailPage({ params: Promise.resolve({ id: 'inv-2' }) })
    render(jsx)
    expect(screen.getByText('SmartBill connection timeout')).toBeInTheDocument()
  })

  it('has back link to invoices list', async () => {
    const InvoiceDetailPage = (await import('../../facturi/[id]/page')).default
    const jsx = await InvoiceDetailPage({ params: Promise.resolve({ id: 'inv-1' }) })
    render(jsx)
    expect(screen.getByRole('link', { name: /napoi/i })).toHaveAttribute('href', '/admin/facturi')
  })

  it('calls notFound when invoice missing', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue(null)
    const InvoiceDetailPage = (await import('../../facturi/[id]/page')).default
    await expect(
      InvoiceDetailPage({ params: Promise.resolve({ id: 'non-existent' }) })
    ).rejects.toThrow('NOT_FOUND')
  })
})

// ─── API: Orders ───────────────────────────────────────────

describe('API: /api/admin/orders', () => {
  beforeEach(async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'a1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      expires: '2099-01-01',
    } as any)
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.order.findMany).mockResolvedValue([MOCK_ORDER] as any)
  })

  it('GET returns orders list', async () => {
    const { GET } = await import('../../../api/admin/orders/route')
    const req = new Request('http://localhost/api/admin/orders')
    const res = await GET(req as any)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.orders).toHaveLength(1)
    expect(data.orders[0].id).toBe('ord-test-1')
  })

  it('GET filters by status param', async () => {
    const { prisma } = await import('@/lib/db')
    const { GET } = await import('../../../api/admin/orders/route')
    const req = new Request('http://localhost/api/admin/orders?status=COMPLETED')
    await GET(req as any)
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'COMPLETED' }),
      })
    )
  })

  it('GET returns 401 for unauthenticated', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue(null as any)
    const { GET } = await import('../../../api/admin/orders/route')
    const req = new Request('http://localhost/api/admin/orders')
    const res = await GET(req as any)
    expect(res.status).toBe(401)
  })

  it('GET returns 403 for non-admin', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u1', name: 'User', email: 'user@test.com', role: 'USER' },
      expires: '2099-01-01',
    } as any)
    const { GET } = await import('../../../api/admin/orders/route')
    const req = new Request('http://localhost/api/admin/orders')
    const res = await GET(req as any)
    expect(res.status).toBe(403)
  })
})

// ─── API: Order Detail + Refund ────────────────────────────

describe('API: /api/admin/orders/[id]', () => {
  beforeEach(async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'a1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      expires: '2099-01-01',
    } as any)
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.order.findUnique).mockResolvedValue(MOCK_ORDER_DETAIL as any)
    vi.mocked(prisma.order.update).mockResolvedValue({ ...MOCK_ORDER, status: 'CANCELLED' } as any)
  })

  it('GET returns order detail', async () => {
    const { GET } = await import('../../../api/admin/orders/[id]/route')
    const req = new Request('http://localhost/api/admin/orders/ord-test-1')
    const res = await GET(req as any, { params: Promise.resolve({ id: 'ord-test-1' }) })
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.order.id).toBe('ord-test-1')
  })

  it('GET returns 404 for missing order', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null)
    const { GET } = await import('../../../api/admin/orders/[id]/route')
    const req = new Request('http://localhost/api/admin/orders/non-existent')
    const res = await GET(req as any, { params: Promise.resolve({ id: 'non-existent' }) })
    expect(res.status).toBe(404)
  })

  it('POST refund updates order status', async () => {
    const { prisma } = await import('@/lib/db')
    const { POST } = await import('../../../api/admin/orders/[id]/route')
    const req = new Request('http://localhost/api/admin/orders/ord-test-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refund' }),
    })
    const res = await POST(req as any, { params: Promise.resolve({ id: 'ord-test-1' }) })
    expect(res.status).toBe(200)
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ord-test-1' },
        data: expect.objectContaining({ status: 'CANCELLED' }),
      })
    )
  })
})

// ─── API: Invoices ─────────────────────────────────────────

describe('API: /api/admin/invoices', () => {
  beforeEach(async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'a1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      expires: '2099-01-01',
    } as any)
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([MOCK_INVOICE] as any)
  })

  it('GET returns invoices list', async () => {
    const { GET } = await import('../../../api/admin/invoices/route')
    const req = new Request('http://localhost/api/admin/invoices')
    const res = await GET(req as any)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.invoices).toHaveLength(1)
  })

  it('GET returns 401 for unauthenticated', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue(null as any)
    const { GET } = await import('../../../api/admin/invoices/route')
    const req = new Request('http://localhost/api/admin/invoices')
    const res = await GET(req as any)
    expect(res.status).toBe(401)
  })
})

// ─── API: Invoice Detail + Actions ─────────────────────────

describe('API: /api/admin/invoices/[id]', () => {
  beforeEach(async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'a1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      expires: '2099-01-01',
    } as any)
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue(MOCK_INVOICE as any)
    vi.mocked(prisma.invoice.update).mockResolvedValue({ ...MOCK_INVOICE, status: 'STORNO' } as any)
  })

  it('GET returns invoice detail', async () => {
    const { GET } = await import('../../../api/admin/invoices/[id]/route')
    const req = new Request('http://localhost/api/admin/invoices/inv-1')
    const res = await GET(req as any, { params: Promise.resolve({ id: 'inv-1' }) })
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.invoice.id).toBe('inv-1')
  })

  it('POST storno updates invoice status', async () => {
    const { prisma } = await import('@/lib/db')
    const { POST } = await import('../../../api/admin/invoices/[id]/route')
    const req = new Request('http://localhost/api/admin/invoices/inv-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'storno' }),
    })
    const res = await POST(req as any, { params: Promise.resolve({ id: 'inv-1' }) })
    expect(res.status).toBe(200)
    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv-1' },
        data: expect.objectContaining({ status: 'STORNO' }),
      })
    )
  })

  it('POST retry updates failed invoice status to PENDING', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue(MOCK_INVOICE_FAILED as any)
    vi.mocked(prisma.invoice.update).mockResolvedValue({ ...MOCK_INVOICE_FAILED, status: 'PENDING' } as any)
    const { POST } = await import('../../../api/admin/invoices/[id]/route')
    const req = new Request('http://localhost/api/admin/invoices/inv-2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'retry' }),
    })
    const res = await POST(req as any, { params: Promise.resolve({ id: 'inv-2' }) })
    expect(res.status).toBe(200)
    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv-2' },
        data: expect.objectContaining({ status: 'PENDING' }),
      })
    )
  })
})
