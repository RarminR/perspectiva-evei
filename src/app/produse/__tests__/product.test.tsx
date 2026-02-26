import { render, screen } from '@testing-library/react'

// Mock next/image to render as plain img
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img alt="" {...props} />,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const mockProduct = {
  id: 'prod-1',
  title: 'Sacoșă din Iută – Perspectiva Evei',
  slug: 'sacosa-iuta',
  description: 'Sacoșă elegantă din iută naturală cu imprimeu Perspectiva Evei.',
  price: 25.0,
  type: 'PHYSICAL',
  stock: 50,
  images: ['/images/sacosa-1.jpg', '/images/sacosa-2.jpg'],
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Mock prisma — default: product found
vi.mock('@/lib/db', () => ({
  prisma: {
    product: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'prod-1',
        title: 'Sacoșă din Iută – Perspectiva Evei',
        slug: 'sacosa-iuta',
        description: 'Sacoșă elegantă din iută naturală cu imprimeu Perspectiva Evei.',
        price: 25.0,
        type: 'PHYSICAL',
        stock: 50,
        images: ['/images/sacosa-1.jpg', '/images/sacosa-2.jpg'],
        active: true,
      }),
    },
    order: {
      create: vi.fn().mockResolvedValue({ id: 'order-1' }),
    },
  },
}))

// Mock auth — default: logged in
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', name: 'Test', email: 'test@test.com', role: 'USER' } }),
}))

// Mock revolut
vi.mock('@/services/revolut', () => ({
  createOrder: vi.fn().mockResolvedValue({
    id: 'rev-order-1',
    token: 'tok-123',
    checkout_url: 'https://checkout.revolut.com/pay/abc',
  }),
}))

describe('ProductPage', () => {
  it('renders product title', async () => {
    const { default: ProductPage } = await import('../[slug]/page')
    const page = await ProductPage({ params: Promise.resolve({ slug: 'sacosa-iuta' }) })
    render(page)
    expect(screen.getByText('Sacoșă din Iută – Perspectiva Evei')).toBeInTheDocument()
  })

  it('renders product price', async () => {
    const { default: ProductPage } = await import('../[slug]/page')
    const page = await ProductPage({ params: Promise.resolve({ slug: 'sacosa-iuta' }) })
    render(page)
    const priceElements = screen.getAllByText('€25.00')
    expect(priceElements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders product description', async () => {
    const { default: ProductPage } = await import('../[slug]/page')
    const page = await ProductPage({ params: Promise.resolve({ slug: 'sacosa-iuta' }) })
    render(page)
    expect(screen.getByText(/Sacoșă elegantă din iută naturală/)).toBeInTheDocument()
  })

  it('renders stock availability', async () => {
    const { default: ProductPage } = await import('../[slug]/page')
    const page = await ProductPage({ params: Promise.resolve({ slug: 'sacosa-iuta' }) })
    render(page)
    expect(screen.getByText(/În stoc/)).toBeInTheDocument()
  })

  it('renders product image', async () => {
    const { default: ProductPage } = await import('../[slug]/page')
    const page = await ProductPage({ params: Promise.resolve({ slug: 'sacosa-iuta' }) })
    render(page)
    const img = screen.getByAltText('Sacoșă din Iută – Perspectiva Evei')
    expect(img).toBeInTheDocument()
  })
})

describe('ProductPage — missing product', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('renders "Produsul nu a fost găsit" for missing product', async () => {
    vi.doMock('@/lib/db', () => ({
      prisma: {
        product: { findUnique: vi.fn().mockResolvedValue(null) },
      },
    }))
    vi.doMock('@/lib/auth', () => ({
      auth: vi.fn().mockResolvedValue(null),
    }))
    vi.doMock('next/image', () => ({
      default: (props: Record<string, unknown>) => <img alt="" {...props} />,
    }))
    const { default: ProductPage } = await import('../[slug]/page')
    const page = await ProductPage({ params: Promise.resolve({ slug: 'nonexistent' }) })
    render(page)
    expect(screen.getByText(/Produsul nu a fost găsit/)).toBeInTheDocument()
  })
})

describe('ProductCheckoutForm', () => {
  it('renders quantity selector', async () => {
    const { ProductCheckoutForm } = await import('../[slug]/components/ProductCheckoutForm')
    render(
      <ProductCheckoutForm productId="prod-1" productTitle="Sacoșă" price={25} userId="user-1" />
    )
    expect(screen.getByText('Cantitate')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders shipping address fields', async () => {
    const { ProductCheckoutForm } = await import('../[slug]/components/ProductCheckoutForm')
    render(
      <ProductCheckoutForm productId="prod-1" productTitle="Sacoșă" price={25} userId="user-1" />
    )
    expect(screen.getByText(/Județ/)).toBeInTheDocument()
    expect(screen.getByText(/Localitate/)).toBeInTheDocument()
    expect(screen.getByText(/Stradă/)).toBeInTheDocument()
    expect(screen.getByText(/Cod poștal/)).toBeInTheDocument()
    expect(screen.getByText(/Prenume/)).toBeInTheDocument()
    expect(screen.getByText(/Telefon/)).toBeInTheDocument()
  })

  it('renders "Continuă spre plată" button', async () => {
    const { ProductCheckoutForm } = await import('../[slug]/components/ProductCheckoutForm')
    render(
      <ProductCheckoutForm productId="prod-1" productTitle="Sacoșă" price={25} userId="user-1" />
    )
    expect(screen.getByRole('button', { name: /Continuă spre plată/ })).toBeInTheDocument()
  })

  it('renders total price with quantity', async () => {
    const { ProductCheckoutForm } = await import('../[slug]/components/ProductCheckoutForm')
    render(
      <ProductCheckoutForm productId="prod-1" productTitle="Sacoșă" price={25} userId="user-1" />
    )
    const priceElements = screen.getAllByText('€25.00')
    expect(priceElements.length).toBeGreaterThanOrEqual(1)
  })
})

describe('POST /api/checkout/physical', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns 401 when not authenticated', async () => {
    vi.doMock('@/lib/auth', () => ({
      auth: vi.fn().mockResolvedValue(null),
    }))
    vi.doMock('@/lib/db', () => ({
      prisma: { product: { findUnique: vi.fn() }, order: { create: vi.fn() } },
    }))
    vi.doMock('@/services/revolut', () => ({
      createOrder: vi.fn(),
    }))

    const { POST } = await import('../../api/checkout/physical/route')
    const req = new Request('http://localhost/api/checkout/physical', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'prod-1', quantity: 1, shippingAddress: {} }),
    })

    const res = await POST(req as never)
    expect(res.status).toBe(401)
  })

  it('returns 400 when required shipping fields are missing', async () => {
    vi.doMock('@/lib/auth', () => ({
      auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', role: 'USER' } }),
    }))
    vi.doMock('@/lib/db', () => ({
      prisma: { product: { findUnique: vi.fn() }, order: { create: vi.fn() } },
    }))
    vi.doMock('@/services/revolut', () => ({
      createOrder: vi.fn(),
    }))

    const { POST } = await import('../../api/checkout/physical/route')
    const req = new Request('http://localhost/api/checkout/physical', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'prod-1',
        quantity: 1,
        shippingAddress: { judet: 'București' },
      }),
    })

    const res = await POST(req as never)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Câmpuri obligatorii lipsă')
  })

  it('returns checkout URL on valid request', async () => {
    vi.doMock('@/lib/auth', () => ({
      auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', role: 'USER' } }),
    }))
    vi.doMock('@/lib/db', () => ({
      prisma: {
        product: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'prod-1',
            title: 'Sacoșă',
            price: 25.0,
            stock: 50,
            active: true,
          }),
        },
        order: {
          create: vi.fn().mockResolvedValue({ id: 'order-1' }),
        },
      },
    }))
    vi.doMock('@/services/revolut', () => ({
      createOrder: vi.fn().mockResolvedValue({
        id: 'rev-order-1',
        token: 'tok-123',
        checkout_url: 'https://checkout.revolut.com/pay/abc',
      }),
    }))

    const { POST } = await import('../../api/checkout/physical/route')
    const req = new Request('http://localhost/api/checkout/physical', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'prod-1',
        quantity: 2,
        shippingAddress: {
          firstName: 'Maria',
          lastName: 'Popescu',
          phone: '0723456789',
          judet: 'București',
          localitate: 'Sector 1',
          strada: 'Str. Exemplu 10',
          codPostal: '010101',
        },
      }),
    })

    const res = await POST(req as never)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.checkoutUrl).toBe('https://checkout.revolut.com/pay/abc')
    expect(data.orderId).toBe('order-1')
  })

  it('returns 404 for inactive product', async () => {
    vi.doMock('@/lib/auth', () => ({
      auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', role: 'USER' } }),
    }))
    vi.doMock('@/lib/db', () => ({
      prisma: {
        product: { findUnique: vi.fn().mockResolvedValue(null) },
        order: { create: vi.fn() },
      },
    }))
    vi.doMock('@/services/revolut', () => ({
      createOrder: vi.fn(),
    }))

    const { POST } = await import('../../api/checkout/physical/route')
    const req = new Request('http://localhost/api/checkout/physical', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'prod-1',
        quantity: 1,
        shippingAddress: {
          firstName: 'Maria',
          lastName: 'Popescu',
          phone: '0723456789',
          judet: 'București',
          localitate: 'Sector 1',
          strada: 'Str. Exemplu 10',
          codPostal: '010101',
        },
      }),
    })

    const res = await POST(req as never)
    expect(res.status).toBe(404)
  })
})
