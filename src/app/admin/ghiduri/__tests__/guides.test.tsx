import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
  usePathname: vi.fn(() => '/admin/ghiduri'),
  redirect: vi.fn(),
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    guide: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    guideAccess: {
      count: vi.fn(),
    },
  },
}))

// Mock fetch for client components
const mockFetch = vi.fn()
global.fetch = mockFetch

// ─── Guides List Page ──────────────────────────────────────

describe('Guides List Page (/admin/ghiduri)', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.guide.findMany).mockResolvedValue([
      {
        id: 'g1',
        title: 'Ghidul Mindfulness',
        slug: 'ghidul-mindfulness',
        description: 'Un ghid despre mindfulness',
        price: 29.99,
        coverImage: null,
        contentJson: null,
        audioKey: null,
        audioDuration: null,
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
      },
      {
        id: 'g2',
        title: 'Ghidul Meditație',
        slug: 'ghidul-meditatie',
        description: 'Un ghid despre meditație',
        price: 19.99,
        coverImage: null,
        contentJson: null,
        audioKey: null,
        audioDuration: null,
        createdAt: new Date('2026-01-10'),
        updatedAt: new Date('2026-01-10'),
      },
    ] as any)
  })

  it('renders table with guide data', async () => {
    const GuidesPage = (await import('../page')).default
    const jsx = await GuidesPage()
    render(jsx)

    expect(screen.getByText('Ghidul Mindfulness')).toBeInTheDocument()
    expect(screen.getByText('Ghidul Meditație')).toBeInTheDocument()
  })

  it('shows guide prices', async () => {
    const GuidesPage = (await import('../page')).default
    const jsx = await GuidesPage()
    render(jsx)

    expect(screen.getByText(/29[.,]99/)).toBeInTheDocument()
    expect(screen.getByText(/19[.,]99/)).toBeInTheDocument()
  })

  it('has "Adaugă ghid" link', async () => {
    const GuidesPage = (await import('../page')).default
    const jsx = await GuidesPage()
    render(jsx)

    const addLink = screen.getByRole('link', { name: /adaugă ghid/i })
    expect(addLink).toHaveAttribute('href', '/admin/ghiduri/new')
  })

  it('has edit links for each guide', async () => {
    const GuidesPage = (await import('../page')).default
    const jsx = await GuidesPage()
    render(jsx)

    const editLinks = screen.getAllByRole('link', { name: /editează/i })
    expect(editLinks).toHaveLength(2)
    expect(editLinks[0]).toHaveAttribute('href', '/admin/ghiduri/g1')
  })
})

// ─── New Guide Form ────────────────────────────────────────

describe('New Guide Page (/admin/ghiduri/new)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'new-g' }),
    })
  })

  it('renders form with required fields', async () => {
    const { default: NewGuidePage } = await import('../new/page')
    render(<NewGuidePage />)

    expect(screen.getByLabelText(/titlu/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/slug/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/preț/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/descriere$/i)).toBeInTheDocument()
  })

  it('auto-generates slug from title', async () => {
    const { default: NewGuidePage } = await import('../new/page')
    render(<NewGuidePage />)

    const titleInput = screen.getByLabelText(/titlu/i)
    fireEvent.change(titleInput, { target: { value: 'Ghidul Mindfulness' } })

    const slugInput = screen.getByLabelText(/slug/i) as HTMLInputElement
    expect(slugInput.value).toBe('ghidul-mindfulness')
  })

  it('submits form data via POST', async () => {
    const { default: NewGuidePage } = await import('../new/page')
    render(<NewGuidePage />)

    fireEvent.change(screen.getByLabelText(/titlu/i), { target: { value: 'Test Guide' } })
    fireEvent.change(screen.getByLabelText(/preț/i), { target: { value: '29.99' } })
    fireEvent.change(screen.getByLabelText(/descriere$/i), { target: { value: 'A test guide' } })

    fireEvent.click(screen.getByRole('button', { name: /salvează/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/guides', expect.objectContaining({
        method: 'POST',
      }))
    })
  })
})

// ─── Edit Guide Page ───────────────────────────────────────

describe('Edit Guide Page (/admin/ghiduri/[id])', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/api/admin/guides/g1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'g1',
            title: 'Ghidul Mindfulness',
            slug: 'ghidul-mindfulness',
            description: 'Un ghid despre mindfulness',
            shortDescription: 'Mindfulness',
            price: 29.99,
            coverImage: null,
            audioKey: null,
            contentJson: null,
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
  })

  it('renders form pre-filled with guide data', async () => {
    const { default: EditGuidePage } = await import('../[id]/page')
    render(<EditGuidePage params={Promise.resolve({ id: 'g1' })} />)

    await waitFor(() => {
      expect((screen.getByLabelText(/titlu/i) as HTMLInputElement).value).toBe('Ghidul Mindfulness')
    })
    expect((screen.getByLabelText(/preț/i) as HTMLInputElement).value).toBe('29.99')
  })
})

// ─── Products List Page ────────────────────────────────────

describe('Products List Page (/admin/produse)', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      {
        id: 'p1',
        title: 'Sacoșă Juta',
        slug: 'sacosa-juta',
        description: 'O sacoșă din juta',
        price: 15.0,
        type: 'PHYSICAL',
        stock: 50,
        images: [],
        active: true,
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
      },
    ] as any)
  })

  it('renders table with product data', async () => {
    const ProductsPage = (await import('../../produse/page')).default
    const jsx = await ProductsPage()
    render(jsx)

    expect(screen.getByText('Sacoșă Juta')).toBeInTheDocument()
  })

  it('shows product stock and price', async () => {
    const ProductsPage = (await import('../../produse/page')).default
    const jsx = await ProductsPage()
    render(jsx)

    expect(screen.getByText(/15[.,]00/)).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it('has "Adaugă produs" link', async () => {
    const ProductsPage = (await import('../../produse/page')).default
    const jsx = await ProductsPage()
    render(jsx)

    const addLink = screen.getByRole('link', { name: /adaugă produs/i })
    expect(addLink).toHaveAttribute('href', '/admin/produse/new')
  })
})

// ─── New Product Form ──────────────────────────────────────

describe('New Product Page (/admin/produse/new)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'new-p' }),
    })
  })

  it('renders form with required fields', async () => {
    const { default: NewProductPage } = await import('../../produse/new/page')
    render(<NewProductPage />)

    expect(screen.getByLabelText(/titlu/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/preț/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/stoc/i)).toBeInTheDocument()
  })

  it('submits form data via POST', async () => {
    const { default: NewProductPage } = await import('../../produse/new/page')
    render(<NewProductPage />)

    fireEvent.change(screen.getByLabelText(/titlu/i), { target: { value: 'Test Product' } })
    fireEvent.change(screen.getByLabelText(/preț/i), { target: { value: '15.00' } })
    fireEvent.change(screen.getByLabelText(/stoc/i), { target: { value: '100' } })

    fireEvent.click(screen.getByRole('button', { name: /salvează/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/products', expect.objectContaining({
        method: 'POST',
      }))
    })
  })
})

// ─── API: Guides ───────────────────────────────────────────

describe('API: /api/admin/guides', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      expires: '2099-01-01',
    } as any)
  })

  it('GET returns guides list', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.guide.findMany).mockResolvedValue([
      { id: 'g1', title: 'Guide 1', slug: 'guide-1', price: 10 },
    ] as any)

    const { GET } = await import('../../../api/admin/guides/route')
    const response = await GET(new Request('http://localhost/api/admin/guides'))
    const data = await response.json()

    expect(data).toHaveLength(1)
    expect(data[0].title).toBe('Guide 1')
  })

  it('GET returns 401 for non-admin', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u2', role: 'USER' },
      expires: '2099-01-01',
    } as any)

    const { GET } = await import('../../../api/admin/guides/route')
    const response = await GET(new Request('http://localhost/api/admin/guides'))

    expect(response.status).toBe(401)
  })

  it('POST creates a guide', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.guide.create).mockResolvedValue({
      id: 'new-g',
      title: 'New Guide',
      slug: 'new-guide',
    } as any)

    const { POST } = await import('../../../api/admin/guides/route')
    const response = await POST(new Request('http://localhost/api/admin/guides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Guide', slug: 'new-guide', price: 19.99 }),
    }))
    const data = await response.json()

    expect(data.id).toBe('new-g')
    expect(prisma.guide.create).toHaveBeenCalled()
  })
})

// ─── API: Products ─────────────────────────────────────────

describe('API: /api/admin/products', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      expires: '2099-01-01',
    } as any)
  })

  it('GET returns products list', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: 'p1', title: 'Product 1', slug: 'product-1', price: 15 },
    ] as any)

    const { GET } = await import('../../../api/admin/products/route')
    const response = await GET(new Request('http://localhost/api/admin/products'))
    const data = await response.json()

    expect(data).toHaveLength(1)
    expect(data[0].title).toBe('Product 1')
  })

  it('POST creates a product', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.product.create).mockResolvedValue({
      id: 'new-p',
      title: 'New Product',
      slug: 'new-product',
    } as any)

    const { POST } = await import('../../../api/admin/products/route')
    const response = await POST(new Request('http://localhost/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Product', slug: 'new-product', price: 15, stock: 100 }),
    }))
    const data = await response.json()

    expect(data.id).toBe('new-p')
    expect(prisma.product.create).toHaveBeenCalled()
  })
})
