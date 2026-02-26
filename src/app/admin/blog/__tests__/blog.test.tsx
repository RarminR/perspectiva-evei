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
  usePathname: vi.fn(() => '/admin/blog'),
  redirect: vi.fn(),
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    blogPost: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    caseStudy: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

// Mock fetch for client components
const mockFetch = vi.fn()
global.fetch = mockFetch

// ─── Blog List Page ────────────────────────────────────────

describe('Blog List Page (/admin/blog)', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.blogPost.findMany).mockResolvedValue([
      {
        id: 'b1',
        title: 'Primul articol',
        slug: 'primul-articol',
        content: 'Conținut articol',
        coverImage: null,
        published: true,
        publishedAt: new Date('2026-01-15'),
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
      },
      {
        id: 'b2',
        title: 'Articol draft',
        slug: 'articol-draft',
        content: 'Draft',
        coverImage: null,
        published: false,
        publishedAt: null,
        createdAt: new Date('2026-01-10'),
        updatedAt: new Date('2026-01-10'),
      },
    ] as any)
  })

  it('renders table with blog post titles', async () => {
    const BlogPage = (await import('../page')).default
    const jsx = await BlogPage()
    render(jsx)

    expect(screen.getByText('Primul articol')).toBeInTheDocument()
    expect(screen.getByText('Articol draft')).toBeInTheDocument()
  })

  it('shows published status badges', async () => {
    const BlogPage = (await import('../page')).default
    const jsx = await BlogPage()
    render(jsx)

    expect(screen.getByText('Publicat')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('has "Adaugă articol" link', async () => {
    const BlogPage = (await import('../page')).default
    const jsx = await BlogPage()
    render(jsx)

    const addLink = screen.getByRole('link', { name: /adaugă articol/i })
    expect(addLink).toHaveAttribute('href', '/admin/blog/new')
  })

  it('has edit links for each post', async () => {
    const BlogPage = (await import('../page')).default
    const jsx = await BlogPage()
    render(jsx)

    const editLinks = screen.getAllByRole('link', { name: /editează/i })
    expect(editLinks).toHaveLength(2)
    expect(editLinks[0]).toHaveAttribute('href', '/admin/blog/b1')
  })
})

// ─── New Blog Post Form ────────────────────────────────────

describe('New Blog Post Page (/admin/blog/new)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'new-b' }),
    })
  })

  it('renders form with required fields', async () => {
    const { default: NewBlogPage } = await import('../new/page')
    render(<NewBlogPage />)

    expect(screen.getByLabelText(/titlu/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/slug/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/conținut/i)).toBeInTheDocument()
  })

  it('auto-generates slug from title', async () => {
    const { default: NewBlogPage } = await import('../new/page')
    render(<NewBlogPage />)

    const titleInput = screen.getByLabelText(/titlu/i)
    fireEvent.change(titleInput, { target: { value: 'Primul Articol de Blog' } })

    const slugInput = screen.getByLabelText(/slug/i) as HTMLInputElement
    expect(slugInput.value).toBe('primul-articol-de-blog')
  })

  it('submits form data via POST', async () => {
    const { default: NewBlogPage } = await import('../new/page')
    render(<NewBlogPage />)

    fireEvent.change(screen.getByLabelText(/titlu/i), { target: { value: 'Test Post' } })
    fireEvent.change(screen.getByLabelText(/conținut/i), { target: { value: 'Some content' } })

    fireEvent.click(screen.getByRole('button', { name: /salvează/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/blog', expect.objectContaining({
        method: 'POST',
      }))
    })
  })
})

// ─── Edit Blog Post Page ───────────────────────────────────

describe('Edit Blog Post Page (/admin/blog/[id])', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/api/admin/blog/b1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'b1',
            title: 'Primul articol',
            slug: 'primul-articol',
            content: 'Conținut articol',
            coverImage: null,
            published: false,
            publishedAt: null,
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
  })

  it('renders form pre-filled with post data', async () => {
    const { default: EditBlogPage } = await import('../[id]/page')
    render(<EditBlogPage params={Promise.resolve({ id: 'b1' })} />)

    await waitFor(() => {
      expect((screen.getByLabelText(/titlu/i) as HTMLInputElement).value).toBe('Primul articol')
    })
    expect((screen.getByLabelText(/conținut/i) as HTMLTextAreaElement).value).toBe('Conținut articol')
  })

  it('has publish button for draft posts', async () => {
    const { default: EditBlogPage } = await import('../[id]/page')
    render(<EditBlogPage params={Promise.resolve({ id: 'b1' })} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /publică/i })).toBeInTheDocument()
    })
  })
})

// ─── Case Studies List Page ────────────────────────────────

describe('Case Studies List Page (/admin/studii-de-caz)', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.caseStudy.findMany).mockResolvedValue([
      {
        id: 'cs1',
        title: 'Studiu de caz 1',
        slug: 'studiu-de-caz-1',
        content: 'Conținut',
        coverImage: null,
        testimonialQuote: 'Excelent!',
        clientName: 'Maria Ionescu',
        published: true,
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
      },
    ] as any)
  })

  it('renders table with case study data', async () => {
    const CaseStudiesPage = (await import('../../studii-de-caz/page')).default
    const jsx = await CaseStudiesPage()
    render(jsx)

    expect(screen.getByText('Studiu de caz 1')).toBeInTheDocument()
    expect(screen.getByText('Maria Ionescu')).toBeInTheDocument()
  })

  it('has "Adaugă studiu de caz" link', async () => {
    const CaseStudiesPage = (await import('../../studii-de-caz/page')).default
    const jsx = await CaseStudiesPage()
    render(jsx)

    const addLink = screen.getByRole('link', { name: /adaugă studiu de caz/i })
    expect(addLink).toHaveAttribute('href', '/admin/studii-de-caz/new')
  })
})

// ─── New Case Study Form ───────────────────────────────────

describe('New Case Study Page (/admin/studii-de-caz/new)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'new-cs' }),
    })
  })

  it('renders form with testimonial and client fields', async () => {
    const { default: NewCaseStudyPage } = await import('../../studii-de-caz/new/page')
    render(<NewCaseStudyPage />)

    expect(screen.getByLabelText(/titlu/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/testimonial/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nume client/i)).toBeInTheDocument()
  })

  it('submits form data via POST', async () => {
    const { default: NewCaseStudyPage } = await import('../../studii-de-caz/new/page')
    render(<NewCaseStudyPage />)

    fireEvent.change(screen.getByLabelText(/titlu/i), { target: { value: 'Test Study' } })
    fireEvent.change(screen.getByLabelText(/conținut/i), { target: { value: 'Content' } })
    fireEvent.change(screen.getByLabelText(/nume client/i), { target: { value: 'Ion Popescu' } })

    fireEvent.click(screen.getByRole('button', { name: /salvează/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/case-studies', expect.objectContaining({
        method: 'POST',
      }))
    })
  })
})

// ─── API: Blog Posts ───────────────────────────────────────

describe('API: /api/admin/blog', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      expires: '2099-01-01',
    } as any)
  })

  it('GET returns blog posts list', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.blogPost.findMany).mockResolvedValue([
      { id: 'b1', title: 'Post 1', slug: 'post-1', published: false },
    ] as any)

    const { GET } = await import('../../../api/admin/blog/route')
    const response = await GET(new Request('http://localhost/api/admin/blog'))
    const data = await response.json()

    expect(data).toHaveLength(1)
    expect(data[0].title).toBe('Post 1')
  })

  it('GET returns 401 for non-admin', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u2', role: 'USER' },
      expires: '2099-01-01',
    } as any)

    const { GET } = await import('../../../api/admin/blog/route')
    const response = await GET(new Request('http://localhost/api/admin/blog'))

    expect(response.status).toBe(401)
  })

  it('POST creates a blog post', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.blogPost.create).mockResolvedValue({
      id: 'new-b',
      title: 'New Post',
      slug: 'new-post',
    } as any)

    const { POST } = await import('../../../api/admin/blog/route')
    const response = await POST(new Request('http://localhost/api/admin/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Post', slug: 'new-post', content: 'Hello' }),
    }))
    const data = await response.json()

    expect(data.id).toBe('new-b')
    expect(prisma.blogPost.create).toHaveBeenCalled()
  })
})

// ─── API: Blog Post [id] ──────────────────────────────────

describe('API: /api/admin/blog/[id]', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      expires: '2099-01-01',
    } as any)
  })

  it('POST with action=publish publishes a post', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.blogPost.update).mockResolvedValue({
      id: 'b1',
      published: true,
      publishedAt: new Date(),
    } as any)

    const { POST } = await import('../../../api/admin/blog/[id]/route')
    const response = await POST(
      new Request('http://localhost/api/admin/blog/b1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' }),
      }),
      { params: Promise.resolve({ id: 'b1' }) }
    )
    const data = await response.json()

    expect(data.published).toBe(true)
    expect(prisma.blogPost.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'b1' },
        data: expect.objectContaining({ published: true }),
      })
    )
  })
})

// ─── API: Case Studies ─────────────────────────────────────

describe('API: /api/admin/case-studies', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      expires: '2099-01-01',
    } as any)
  })

  it('GET returns case studies list', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.caseStudy.findMany).mockResolvedValue([
      { id: 'cs1', title: 'Case Study 1', slug: 'case-study-1', clientName: 'Maria' },
    ] as any)

    const { GET } = await import('../../../api/admin/case-studies/route')
    const response = await GET(new Request('http://localhost/api/admin/case-studies'))
    const data = await response.json()

    expect(data).toHaveLength(1)
    expect(data[0].title).toBe('Case Study 1')
  })

  it('POST creates a case study', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.caseStudy.create).mockResolvedValue({
      id: 'new-cs',
      title: 'New Study',
      slug: 'new-study',
    } as any)

    const { POST } = await import('../../../api/admin/case-studies/route')
    const response = await POST(new Request('http://localhost/api/admin/case-studies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Study',
        slug: 'new-study',
        content: 'Content',
        testimonialQuote: 'Great!',
        clientName: 'Ion',
      }),
    }))
    const data = await response.json()

    expect(data.id).toBe('new-cs')
    expect(prisma.caseStudy.create).toHaveBeenCalled()
  })
})
