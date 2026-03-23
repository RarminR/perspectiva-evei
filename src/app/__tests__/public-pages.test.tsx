import { render, screen } from '@testing-library/react'

// Mock next/link to render as plain anchors
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock next/image to render as plain img
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }),
}))

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    blogPost: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    caseStudy: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

// ─── Sessions page ──────────────────────────────────────────

describe('Sessions page (/sedinte-1-la-1)', () => {
  it('renders "Ședințe 1:1" heading', async () => {
    const { default: SessionsPage } = await import('../sedinte-1-la-1/page')
    render(<SessionsPage />)
    expect(screen.getByRole('heading', { name: /Ședințe 1:1/i })).toBeInTheDocument()
  })

  it('renders a CTA button to book a session', async () => {
    const { default: SessionsPage } = await import('../sedinte-1-la-1/page')
    render(<SessionsPage />)
    expect(screen.getAllByRole('link', { name: /Rezervă o Ședință/i }).length).toBeGreaterThanOrEqual(1)
  })

  it('renders benefits section', async () => {
    const { default: SessionsPage } = await import('../sedinte-1-la-1/page')
    render(<SessionsPage />)
    expect(screen.getByText(/Beneficii/i)).toBeInTheDocument()
  })

  it('renders how it works section', async () => {
    const { default: SessionsPage } = await import('../sedinte-1-la-1/page')
    render(<SessionsPage />)
    expect(screen.getByRole('heading', { name: /Cum funcționează/i })).toBeInTheDocument()
  })
})

// ─── Blog listing ───────────────────────────────────────────

describe('Blog listing page (/blog)', () => {
  it('renders "Blog" heading', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.blogPost.findMany).mockResolvedValue([])

    const BlogPage = (await import('../blog/page')).default
    const jsx = await BlogPage()
    render(jsx)
    expect(screen.getByRole('heading', { name: 'Blog' })).toBeInTheDocument()
  })

  it('shows placeholder when no posts', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.blogPost.findMany).mockResolvedValue([])

    const BlogPage = (await import('../blog/page')).default
    const jsx = await BlogPage()
    render(jsx)
    expect(screen.getByText(/Articolele vor fi disponibile în curând/i)).toBeInTheDocument()
  })

  it('renders blog post cards when posts exist', async () => {
    const { prisma } = await import('@/lib/db')
    vi.mocked(prisma.blogPost.findMany).mockResolvedValue([
      {
        id: '1',
        title: 'Primul articol',
        slug: 'primul-articol',
        content: 'Conținut test',
        coverImage: null,
        published: true,
        publishedAt: new Date('2026-01-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any)

    const BlogPage = (await import('../blog/page')).default
    const jsx = await BlogPage()
    render(jsx)
    expect(screen.getByText('Primul articol')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Citește mai mult/i })).toBeInTheDocument()
  })
})

